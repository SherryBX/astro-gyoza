import { useEffect, useRef } from 'react'
// @ts-ignore - aplayer has no type definitions
import 'aplayer/dist/APlayer.min.css'

interface Song {
  name: string
  artist: string
  url: string
  cover: string
  lrc?: string
}

interface MusicPlayerProps {
  apiUrl?: string
  playlistId?: string
  autoplay?: boolean
}

export function MusicPlayer({
  apiUrl = 'https://qq-music-api.sherry-account.workers.dev',
  playlistId,
  autoplay = false,
}: MusicPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const aplayerRef = useRef<any>(null)

  useEffect(() => {
    if (!playerRef.current) return

    const loadPlaylist = async () => {
      try {
        // @ts-ignore - dynamic import
        const APlayer = (await import('aplayer')).default
        let songs: Song[] = []

        if (playlistId) {
          const res = await fetch(`${apiUrl}/api/playlist?id=${playlistId}`)
          const data = await res.json()

          if (data.code === 0 && data.data?.songlist) {
            songs = await Promise.all(
              data.data.songlist.slice(0, 50).map(async (song: any) => {
                const urlRes = await fetch(`${apiUrl}/api/song/url?mid=${song.mid}&quality=128`)
                const urlData = await urlRes.json()

                return {
                  name: song.name,
                  artist: song.singer.map((s: any) => s.name).join(' / '),
                  url: urlData.data?.[song.mid] || '',
                  cover: song.album?.pmid
                    ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.album.pmid}.jpg`
                    : 'https://y.gtimg.cn/music/photo_new/T002R300x300M000.jpg',
                }
              })
            )
          }
        } else {
          const searchRes = await fetch(`${apiUrl}/api/search?keyword=周杰伦`)
          const searchData = await searchRes.json()

          if (searchData.code === 0 && searchData.data?.list) {
            songs = await Promise.all(
              searchData.data.list.slice(0, 10).map(async (song: any) => {
                const urlRes = await fetch(`${apiUrl}/api/song/url?mid=${song.mid}&quality=128`)
                const urlData = await urlRes.json()

                return {
                  name: song.name,
                  artist: song.singer.map((s: any) => s.name).join(' / '),
                  url: urlData.data?.[song.mid] || '',
                  cover: song.album?.pmid
                    ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.album.pmid}.jpg`
                    : 'https://y.gtimg.cn/music/photo_new/T002R300x300M000.jpg',
                }
              })
            )
          }
        }

        songs = songs.filter(s => s.url)

        if (songs.length > 0 && playerRef.current) {
          aplayerRef.current = new APlayer({
            container: playerRef.current,
            fixed: true,
            autoplay: true,
            theme: '#F55555',
            loop: 'all',
            order: 'list',
            preload: 'auto',
            volume: 0.7,
            mutex: true,
            listFolded: true,
            listMaxHeight: 300,
            audio: songs,
          })
        }
      } catch (error) {
        console.error('Failed to load music playlist:', error)
      }
    }

    loadPlaylist()

    return () => {
      if (aplayerRef.current) {
        aplayerRef.current.destroy()
        aplayerRef.current = null
      }
    }
  }, [apiUrl, playlistId, autoplay])

  return (
    <>
      <style>{`
        .aplayer-fixed .aplayer-list:not(.aplayer-list-hide) {
          display: block !important;
          max-height: 300px !important;
          overflow-y: auto !important;
        }
      `}</style>
      <div ref={playerRef} />
    </>
  )
}
