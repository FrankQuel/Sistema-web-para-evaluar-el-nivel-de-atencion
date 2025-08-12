// hooks/useYouTube.ts
import { useCallback, useEffect, useRef, useState } from 'react';

type YTPlayer = {
  getDuration?: () => number;
  playVideo?: () => void;
  pauseVideo?: () => void;
  addEventListener?: (ev: string, fn: (e: any) => void) => void;
  removeEventListener?: (ev: string, fn: (e: any) => void) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function ensureApiLoaded(): Promise<void> {
  return new Promise((resolve) => {
    // Ya cargada
    if (window.YT && window.YT.Player) return resolve();

    // ¿script ya insertado?
    const existing = document.querySelector<HTMLScriptElement>('script[src*="youtube.com/iframe_api"]');
    if (existing) {
      // Espera a que se inicialice
      const check = () => (window.YT && window.YT.Player) ? resolve() : setTimeout(check, 50);
      check();
      return;
    }

    // Inserta script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => resolve();
  });
}

export function useYouTube(iframeId: string) {
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await ensureApiLoaded();
      if (cancelled) return;

      const el = document.getElementById(iframeId) as HTMLIFrameElement | null;
      // No crees el player si el iframe no existe o aún no tiene src
      if (!el || !el.src) return;

      // Evita crear dos veces
      if (playerRef.current) return;

      try {
        // @ts-ignore
        const p: YTPlayer = new window.YT.Player(iframeId, {
          events: {
            onReady: () => { if (!cancelled) setReady(true); },
          },
        });
        playerRef.current = p;
      } catch {
        // Si falla la construcción, no rompas la app
        playerRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      const p = playerRef.current;
      // Destruye con seguridad
      try { p?.destroy?.(); } catch {}
      playerRef.current = null;
      setReady(false);
    };
  }, [iframeId]);

  const play = useCallback(() => playerRef.current?.playVideo?.(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo?.(), []);
  const getDuration = useCallback(() => playerRef.current?.getDuration?.() ?? 0, []);

  const addOnStateChange = useCallback((handler: (state: number) => void) => {
    const p = playerRef.current;
    if (!p || typeof p.addEventListener !== 'function') {
      // player no listo; devuelve un "off" vacío
      return () => {};
    }
    // YT emite 'onStateChange'
    // @ts-ignore
    p.addEventListener('onStateChange', handler);

    return () => {
      const cur = playerRef.current;
      try {
        // @ts-ignore
        cur?.removeEventListener?.('onStateChange', handler);
      } catch {}
    };
  }, []);

  return { ready, play, pause, getDuration, addOnStateChange };
}
