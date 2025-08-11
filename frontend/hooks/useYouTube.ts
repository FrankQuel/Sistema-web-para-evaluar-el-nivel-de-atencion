import { useEffect, useRef, useState } from 'react'

type YTPlayer = any

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

export function useYouTube(iframeId: string) {
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let disposed = false

    const ensureAPI = () =>
      new Promise<void>((resolve) => {
        if (window.YT && window.YT.Player) return resolve()
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.body.appendChild(tag)
        window.onYouTubeIframeAPIReady = () => resolve()
      })

    ensureAPI().then(() => {
      if (disposed) return
      const iframe = document.getElementById(iframeId)
      if (!iframe) return
      playerRef.current = new window.YT.Player(iframe, {
        events: {
          onReady: () => setReady(true),
        },
      })
    })

    return () => {
      disposed = true
      try { playerRef.current?.destroy?.() } catch {}
      playerRef.current = null
      setReady(false)
    }
  }, [iframeId])

  const play = () => playerRef.current?.playVideo?.()
  const pause = () => playerRef.current?.pauseVideo?.()
  const getDuration = () => Number(playerRef.current?.getDuration?.() ?? 0)
  const getCurrentTime = () => Number(playerRef.current?.getCurrentTime?.() ?? 0)

  const addOnStateChange = (cb: (state: number) => void) => {
    if (!playerRef.current) return () => {}
    const p = playerRef.current
    const handler = (e: any) => cb(e?.data)
    // compatible con IFrame API
    // @ts-ignore
    p.addEventListener?.('onStateChange', handler)
    return () => {
      // @ts-ignore
      p.removeEventListener?.('onStateChange', handler)
    }
  }

  return { ready, play, pause, getDuration, getCurrentTime, addOnStateChange }
}
