import { useEffect, useState, useRef } from 'react'

// Animation definitions from OpenPet
const ANIMATIONS = {
  idle: {
    row: 0,
    frameCount: 6,
    frameDurationsMs: [560, 220, 220, 280, 280, 640],
  },
  'running-right': {
    row: 1,
    frameCount: 8,
    frameDurationsMs: [120, 120, 120, 120, 120, 120, 120, 220],
  },
  'running-left': {
    row: 2,
    frameCount: 8,
    frameDurationsMs: [120, 120, 120, 120, 120, 120, 120, 220],
  },
  waving: {
    row: 3,
    frameCount: 4,
    frameDurationsMs: [140, 140, 140, 280],
  },
  jumping: {
    row: 4,
    frameCount: 5,
    frameDurationsMs: [140, 140, 140, 140, 280],
  },
  failed: {
    row: 5,
    frameCount: 8,
    frameDurationsMs: [140, 140, 140, 140, 140, 140, 140, 240],
  },
  waiting: {
    row: 6,
    frameCount: 6,
    frameDurationsMs: [150, 150, 150, 150, 150, 260],
  },
  running: {
    row: 7,
    frameCount: 6,
    frameDurationsMs: [120, 120, 120, 120, 120, 220],
  },
  review: {
    row: 8,
    frameCount: 6,
    frameDurationsMs: [150, 150, 150, 150, 150, 280],
  },
} as const

// 可点击触发的动作动画
const ACTION_ANIMATIONS: AnimationId[] = ['waving', 'jumping', 'waiting', 'running', 'review']

// 动作权重（出现频率）
const ACTION_WEIGHTS: Record<AnimationId, number> = {
  idle: 0,
  'running-right': 0,
  'running-left': 0,
  waving: 25,
  jumping: 15,
  failed: 10,
  waiting: 20,
  running: 15,
  review: 15,
}

// 动作持续时间范围（毫秒）
const ACTION_DURATIONS: Record<AnimationId, [number, number]> = {
  idle: [0, 0],
  'running-right': [0, 0],
  'running-left': [0, 0],
  jumping: [3000, 5000],
  waving: [4000, 6000],
  running: [5000, 8000],
  waiting: [8000, 12000],
  review: [10000, 15000],
  failed: [3000, 4000],
}

// 动作链：某些动作后自然跟随的动作
const ACTION_CHAINS: Partial<Record<AnimationId, AnimationId[]>> = {
  jumping: ['failed', 'waving'], // 跳跃后可能失败或庆祝
  running: ['waiting', 'review'], // 跑步后休息或检查
  review: ['waving', 'jumping'], // 检查完成后庆祝
  failed: ['waiting', 'review'], // 失败后思考
  waving: ['jumping', 'running'], // 挥手后可能兴奋
}

type AnimationId = keyof typeof ANIMATIONS

interface DesktopPetProps {
  petId?: string
  scale?: number
  animationId?: AnimationId
  speedMultiplier?: number
}

const ATLAS_WIDTH = 1536
const ATLAS_HEIGHT = 1872

// 不同宠物的帧尺寸配置
const PET_FRAME_SIZES: Record<string, { width: number; height: number }> = {
  haibara: { width: 192, height: 208 },
  habaralab: { width: 186, height: 204 },
}

function getAnimationDurationMs(animation: (typeof ANIMATIONS)[AnimationId]): number {
  return animation.frameDurationsMs.reduce((sum, value) => sum + value, 0)
}

function getFrameAtTime(animation: (typeof ANIMATIONS)[AnimationId], elapsedMs: number): number {
  const totalDuration = getAnimationDurationMs(animation)
  if (totalDuration <= 0) return 0

  const cursor = ((elapsedMs % totalDuration) + totalDuration) % totalDuration
  let consumed = 0
  for (let index = 0; index < animation.frameDurationsMs.length; index += 1) {
    consumed += animation.frameDurationsMs[index] ?? 0
    if (cursor < consumed) return index
  }
  return Math.max(0, animation.frameCount - 1)
}

// 加权随机选择动作
function pickWeightedAction(
  recentActions: AnimationId[],
  lastAction?: AnimationId,
  timeSinceInteraction?: number,
): AnimationId {
  // 如果上一个动作有链式后续，30% 概率选择链中的动作
  if (lastAction && ACTION_CHAINS[lastAction] && Math.random() < 0.3) {
    const chainActions = ACTION_CHAINS[lastAction]!
    const validChainActions = chainActions.filter((a) => ACTION_ANIMATIONS.includes(a))
    if (validChainActions.length > 0) {
      return validChainActions[Math.floor(Math.random() * validChainActions.length)]!
    }
  }

  const candidates = ACTION_ANIMATIONS.map((action) => {
    let weight = ACTION_WEIGHTS[action] || 0

    // 如果动作在最近历史中，权重减半
    if (recentActions.includes(action)) {
      weight = weight / 2
    }

    // 用户活动感知：根据交互频率调整权重
    if (timeSinceInteraction !== undefined) {
      const twoMinutes = 120000
      if (timeSinceInteraction > twoMinutes) {
        // 长时间无交互 → 更多思考/工作类动作
        if (action === 'waiting' || action === 'review') {
          weight = weight * 1.5
        }
        if (action === 'jumping' || action === 'waving') {
          weight = weight * 0.7
        }
      } else {
        // 频繁交互 → 更多活跃/友好动作
        if (action === 'waving' || action === 'jumping') {
          weight = weight * 1.3
        }
        if (action === 'waiting' || action === 'review') {
          weight = weight * 0.8
        }
      }
    }

    return { action, weight }
  }).filter((c) => c.weight > 0)

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
  let random = Math.random() * totalWeight

  for (const candidate of candidates) {
    random -= candidate.weight
    if (random <= 0) {
      return candidate.action
    }
  }

  return candidates[0]?.action || 'waving'
}

// 获取动作的持续时间
function getActionDuration(action: AnimationId): number {
  const [min, max] = ACTION_DURATIONS[action] || [5000, 10000]
  return min + Math.random() * (max - min)
}

export function DesktopPet({
  petId = 'habaralab',
  scale = 0.6,
  animationId = 'idle',
  speedMultiplier = 1,
}: DesktopPetProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [elapsedMs, setElapsedMs] = useState(0)
  const [currentAnimation, setCurrentAnimation] = useState<AnimationId>('idle')
  const [isHovered, setIsHovered] = useState(false)
  const [isPlayingAction, setIsPlayingAction] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [currentPetId, setCurrentPetId] = useState(petId)
  const [currentScale, setCurrentScale] = useState(scale)
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const actionTimerRef = useRef<number | null>(null)
  const recentActionsRef = useRef<AnimationId[]>([])
  const lastInteractionTimeRef = useRef(Date.now())

  // 播放动作动画（在指定时间段内循环播放）
  const playAction = (animationId: AnimationId, durationMs: number) => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current)
    }

    setIsPlayingAction(true)
    setCurrentAnimation(animationId)

    // 在指定时间段后恢复idle
    actionTimerRef.current = window.setTimeout(() => {
      setIsPlayingAction(false)
      setCurrentAnimation('idle')
      actionTimerRef.current = null
    }, durationMs)
  }

  // 根据拖拽方向和悬浮状态决定动画
  useEffect(() => {
    if (isDragging) {
      // 拖拽时打断动作动画，根据移动方向播放奔走动画
      if (isPlayingAction && actionTimerRef.current) {
        clearTimeout(actionTimerRef.current)
        actionTimerRef.current = null
        setIsPlayingAction(false)
      }

      const deltaX = position.x - lastPositionRef.current.x
      if (Math.abs(deltaX) > 2) {
        setCurrentAnimation(deltaX > 0 ? 'running-right' : 'running-left')
      }
    } else if (isPlayingAction) {
      // 动作动画播放中，不被悬浮打断
      return
    } else if (isHovered) {
      // 悬浮时播放挥手动画
      setCurrentAnimation('waving')
    } else {
      // 默认 idle 动画
      setCurrentAnimation('idle')
    }
    lastPositionRef.current = position
  }, [isDragging, isHovered, position, isPlayingAction])

  const animation = ANIMATIONS[currentAnimation]
  const frame = getFrameAtTime(animation, elapsedMs)
  const frameSize = PET_FRAME_SIZES[currentPetId] || { width: 192, height: 208 }
  const displayWidth = frameSize.width * currentScale
  const displayHeight = frameSize.height * currentScale

  // 从 localStorage 加载设置
  useEffect(() => {
    const savedPetId = localStorage.getItem('desktopPet_petId')
    const savedScale = localStorage.getItem('desktopPet_scale')
    const savedPosition = localStorage.getItem('desktopPet_position')

    if (savedPetId) setCurrentPetId(savedPetId)
    if (savedScale) setCurrentScale(parseFloat(savedScale))
    if (savedPosition) {
      const pos = JSON.parse(savedPosition)
      setPosition(pos)
    } else {
      setPosition({
        x: window.innerWidth - displayWidth - 20,
        y: window.innerHeight - displayHeight - 20,
      })
    }
  }, [])

  // 保存位置到 localStorage
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('desktopPet_position', JSON.stringify(position))
    }
  }, [position])

  useEffect(() => {
    let frameId = 0
    const start = performance.now()
    const tick = (now: number) => {
      setElapsedMs((now - start) / speedMultiplier)
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [currentAnimation, speedMultiplier])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return // 右键不触发拖拽
    e.preventDefault()
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
    // 更新交互时间
    lastInteractionTimeRef.current = Date.now()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
    lastInteractionTimeRef.current = Date.now()
  }

  const handleChangePet = (newPetId: string) => {
    setCurrentPetId(newPetId)
    localStorage.setItem('desktopPet_petId', newPetId)
    setContextMenu(null)
  }

  const handleChangeScale = (newScale: number) => {
    setCurrentScale(newScale)
    localStorage.setItem('desktopPet_scale', newScale.toString())
    setContextMenu(null)
  }

  const handleResetPosition = () => {
    const newPosition = {
      x: window.innerWidth - displayWidth - 20,
      y: window.innerHeight - displayHeight - 20,
    }
    setPosition(newPosition)
    localStorage.setItem('desktopPet_position', JSON.stringify(newPosition))
    setContextMenu(null)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // 点击外部关闭右键菜单
  useEffect(() => {
    if (contextMenu) {
      const handleClickOutside = () => setContextMenu(null)
      window.addEventListener('click', handleClickOutside)
      return () => window.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // 定时随机播放动作动画
  useEffect(() => {
    const minIdleInterval = 10000 // 最小空闲间隔 10 秒
    const maxIdleInterval = 30000 // 最大空闲间隔 30 秒

    let timerId: number | null = null

    const scheduleNextAction = () => {
      const randomDelay = minIdleInterval + Math.random() * (maxIdleInterval - minIdleInterval)
      timerId = window.setTimeout(() => {
        if (!isDragging && !isHovered && !isPlayingAction) {
          // 计算距离上次交互的时间
          const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current
          // 获取上一个动作（用于链式反应）
          const lastAction = recentActionsRef.current[0]

          // 使用加权随机选择动作（考虑链式反应和用户活动）
          const selectedAction = pickWeightedAction(
            recentActionsRef.current,
            lastAction,
            timeSinceInteraction,
          )
          // 获取该动作的个性化持续时间
          const duration = getActionDuration(selectedAction)

          // 记录到历史（保留最近3个）
          recentActionsRef.current = [selectedAction, ...recentActionsRef.current].slice(0, 3)

          playAction(selectedAction, duration)
        }
        scheduleNextAction()
      }, randomDelay)
    }

    scheduleNextAction()
    return () => {
      if (timerId) clearTimeout(timerId)
    }
  }, [isDragging, isHovered, isPlayingAction])

  const backgroundOffsetX = -frame * frameSize.width * currentScale
  const backgroundOffsetY = -animation.row * frameSize.height * currentScale

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 9999,
          userSelect: 'none',
          pointerEvents: 'auto',
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => {
          setIsHovered(true)
          lastInteractionTimeRef.current = Date.now()
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            backgroundImage: `url("/pets/${currentPetId}/spritesheet.webp")`,
            backgroundSize: `${ATLAS_WIDTH * currentScale}px ${ATLAS_HEIGHT * currentScale}px`,
            backgroundPosition: `${backgroundOffsetX}px ${backgroundOffsetY}px`,
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          }}
        />
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            zIndex: 10000,
            minWidth: '180px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 皮肤选择 */}
          <div style={{ padding: '8px 12px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
            皮肤
          </div>
          <button
            onClick={() => handleChangePet('haibara')}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: currentPetId === 'haibara' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Haibara {currentPetId === 'haibara' && '✓'}
          </button>
          <button
            onClick={() => handleChangePet('habaralab')}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: currentPetId === 'habaralab' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Habaralab {currentPetId === 'habaralab' && '✓'}
          </button>

          <div
            style={{
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              margin: '8px 0',
            }}
          />

          {/* 缩放选择 */}
          <div style={{ padding: '8px 12px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
            大小
          </div>
          {[0.4, 0.6, 0.8, 1.0].map((scaleOption) => (
            <button
              key={scaleOption}
              onClick={() => handleChangeScale(scaleOption)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor:
                  Math.abs(currentScale - scaleOption) < 0.01 ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {scaleOption === 0.4 && '小'}
              {scaleOption === 0.6 && '中'}
              {scaleOption === 0.8 && '大'}
              {scaleOption === 1.0 && '特大'}
              {Math.abs(currentScale - scaleOption) < 0.01 && ' ✓'}
            </button>
          ))}

          <div
            style={{
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              margin: '8px 0',
            }}
          />

          {/* 重置位置 */}
          <button
            onClick={handleResetPosition}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            重置位置
          </button>
        </div>
      )}
    </>
  )
}
