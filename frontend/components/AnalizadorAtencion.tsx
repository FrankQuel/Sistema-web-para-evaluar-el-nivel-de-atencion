'use client'

import { useEffect, useRef, useState } from 'react'

// ===== Tipos expuestos =====
export type AnalisisOut = {
  nivel: 'ATENTO' | 'NEUTRO' | 'DISTRAIDO'
  recomendacion: string
  metrics: Record<string, any>
}

type Props = {
  running: boolean
  durationSec?: number
  onFinish: (out: AnalisisOut) => void
}

// ===== Índices de landmarks (modelo FaceLandmarker 478 pts) =====
const RIGHT_EYE_EAR = [33, 159, 158, 133, 153, 145]
const LEFT_EYE_EAR = [362, 380, 374, 263, 386, 385]
const RIGHT_EYE_BORDER = [33, 133]
const LEFT_EYE_BORDER = [362, 263]
const RIGHT_IRIS = [468, 469, 470, 471, 472]
const LEFT_IRIS = [473, 474, 475, 476, 477]

// ===== Utilidades de cálculo =====
function ear(eyeIdx: number[], lm: Map<number, [number, number]>) {
  const p = eyeIdx.map((i) => lm.get(i)!).map(([x, y]) => new Float32Array([x, y]))
  const d = (a: Float32Array, b: Float32Array) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const A = d(p[1], p[5])
  const B = d(p[2], p[4])
  const C = d(p[0], p[3])
  return (A + B) / (2 * C + 1e-6)
}

function irisCenter(ids: number[], lm: Map<number, [number, number]>) {
  const pts = ids.map((i) => lm.get(i)).filter(Boolean) as [number, number][]
  if (!pts.length) return null
  const x = pts.reduce((a, p) => a + p[0], 0) / pts.length
  const y = pts.reduce((a, p) => a + p[1], 0) / pts.length
  return [x, y] as [number, number]
}

function gazeHorizontal(lm: Map<number, [number, number]>) {
  const rc = irisCenter(RIGHT_IRIS, lm),
    lc = irisCenter(LEFT_IRIS, lm)
  if (!rc || !lc) return null
  const [rL, rR] = RIGHT_EYE_BORDER.map((i) => lm.get(i)!)
  const [lL, lR] = LEFT_EYE_BORDER.map((i) => lm.get(i)!)
  const rr = (rc[0] - rL[0]) / (rR[0] - rL[0] + 1e-6)
  const lr = (lc[0] - lL[0]) / (lR[0] - lL[0] + 1e-6)
  const h = 0.5 * (rr + lr)
  if (h <= 0.35) return 'izquierda'
  if (h >= 0.65) return 'derecha'
  return 'centro'
}

// ===== Heurística y recomendación =====
function heuristic(m: any) {
  const br = m.blink_rate ?? 0
  const pc = m.gaze_pct?.centro ?? 0
  const nf = m.noface_pct ?? 0
  if (nf > 25) return 'DISTRAIDO' as const
  if (pc >= 65 && br >= 8 && br <= 25) return 'ATENTO' as const
  if (pc < 45 || br < 6 || br > 30) return 'DISTRAIDO' as const
  return 'NEUTRO' as const
}
function recommendation(label: 'ATENTO' | 'NEUTRO' | 'DISTRAIDO') {
  return {
    ATENTO: 'Buen enfoque. Pausas cada 15–20 min.',
    NEUTRO: 'Atención variable. Resúmenes + checks.',
    DISTRAIDO: 'Actividades interactivas y segmentar.',
  }[label]
}

export default function AnalizadorAtencion({ running, durationSec = 60, onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [active, setActive] = useState(false)

  // métricas
  const startRef = useRef<number>(0)
  const framesRef = useRef(0)
  const framesFaceRef = useRef(0)
  const blinkCounterRef = useRef(0)
  const frameCloseRef = useRef(0)
  const earSumRef = useRef(0)
  const earMinRef = useRef(10)
  const earMaxRef = useRef(0)
  const gazeCountsRef = useRef<Record<string, number>>({})

  // runtime
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<any | null>(null)
  const rafRef = useRef<number | undefined>(undefined)

  // filtros de logs wasm (ahora con valor inicial para TS)
  const originalConsoleErrorRef = useRef<((...args: any[]) => void) | null>(null)
  const originalModuleRef = useRef<any>(null)

  const reset = () => {
    startRef.current = performance.now()
    framesRef.current = 0
    framesFaceRef.current = 0
    blinkCounterRef.current = 0
    frameCloseRef.current = 0
    earSumRef.current = 0
    earMinRef.current = 10
    earMaxRef.current = 0
    gazeCountsRef.current = {}
  }

  useEffect(() => {
    if (!running) {
      stopAll()
      return
    }
    startAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, durationSec])

  async function startAll() {
    try {
      setActive(true)
      reset()

      // Cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        if (videoRef.current.readyState < 2) {
          await new Promise<void>((r) => {
            const onReady = () => {
              videoRef.current?.removeEventListener('loadeddata', onReady)
              r()
            }
            videoRef.current?.addEventListener('loadeddata', onReady)
          })
        }
      }

      // Filtrar logs INFO del wasm
      const IGNORE = [
        /Created TensorFlow Lite XNNPACK delegate/i,
        /XNNPACK.*delegate/i,
      ]
      originalConsoleErrorRef.current = console.error
      console.error = (...args: any[]) => {
        const first = args[0]
        if (typeof first === 'string' && IGNORE.some((rx) => rx.test(first))) return
        originalConsoleErrorRef.current?.(...args)
      }
      originalModuleRef.current = (globalThis as any).Module
      ;(globalThis as any).Module = {
        ...(originalModuleRef.current || {}),
        printErr: (msg: any) => {
          if (typeof msg === 'string' && IGNORE.some((rx) => rx.test(msg))) return
          console.warn(msg)
        },
      }

      // Cargar FaceLandmarker
      const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-assets/face_landmarker.task',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      })

      const loop = () => {
        const v = videoRef.current
        const lmk = landmarkerRef.current
        if (!v || !lmk) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        framesRef.current += 1
        const ts = performance.now()
        const result = lmk.detectForVideo(v, ts)

        const c = canvasRef.current
        const ctx = c?.getContext('2d') || null
        if (c && ctx) {
          c.width = v.videoWidth
          c.height = v.videoHeight
          ctx.drawImage(v, 0, 0, c.width, c.height)
        }

        const face = result?.faceLandmarks?.[0]
        if (face && c && ctx) {
          framesFaceRef.current += 1
          const w = c.width
          const h = c.height
          const lm = new Map<number, [number, number]>()
          for (let i = 0; i < face.length; i++) {
            lm.set(i, [face[i].x * w, face[i].y * h])
          }

          // EAR + parpadeos
          const r = ear(RIGHT_EYE_EAR, lm)
          const l = ear(LEFT_EYE_EAR, lm)
          const e = (r + l) / 2
          earSumRef.current += e
          earMinRef.current = Math.min(earMinRef.current, e)
          earMaxRef.current = Math.max(earMaxRef.current, e)
          if (e < 0.3) frameCloseRef.current += 1
          else {
            if (frameCloseRef.current >= 4) blinkCounterRef.current += 1
            frameCloseRef.current = 0
          }

          // Mirada
          const g = gazeHorizontal(lm)
          if (g) gazeCountsRef.current[g] = (gazeCountsRef.current[g] || 0) + 1

          // Dibujar iris
          ctx.fillStyle = '#ffea00'
          for (const id of [...RIGHT_IRIS, ...LEFT_IRIS]) {
            const p = lm.get(id)
            if (!p) continue
            ctx.beginPath()
            ctx.arc(p[0], p[1], 2.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        rafRef.current = requestAnimationFrame(loop)
      }
      loop()

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => finish('timeout'), durationSec * 1000)
    } catch (e) {
      restoreLogFiltering()
      console.error(e)
      alert('No se pudo iniciar la cámara/análisis.')
      stopAll()
    }
  }

  function restoreLogFiltering() {
    if (originalConsoleErrorRef.current) {
      console.error = originalConsoleErrorRef.current
      originalConsoleErrorRef.current = null
    }
    if ('Module' in globalThis) {
      ;(globalThis as any).Module = originalModuleRef.current
      originalModuleRef.current = null
    }
  }

  function stopAll() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    try {
      landmarkerRef.current?.close?.()
    } catch {}
    landmarkerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    restoreLogFiltering()
    setActive(false)
  }

  function finish(_reason: 'timeout' | 'manual' | 'ended' = 'manual') {
    const dur = Math.max(1, (performance.now() - startRef.current) / 1000)
    const minutes = dur / 60
    const frames = Math.max(1, framesRef.current)
    const framesFace = Math.max(0, framesFaceRef.current)
    const ear_avg = framesFace ? earSumRef.current / framesFace : 0
    const blink_rate = blinkCounterRef.current / minutes
    const noface_pct = (1 - framesFace / frames) * 100
    const gaze_pct: Record<string, number> = {}
    for (const [k, v] of Object.entries(gazeCountsRef.current)) {
      gaze_pct[k] = framesFace ? (v / framesFace) * 100 : 0
    }
    const metrics = {
      session_seconds: Math.round(dur * 100) / 100,
      frames_total: frames,
      frames_face: framesFace,
      noface_pct: Math.round(noface_pct * 100) / 100,
      blink_count: blinkCounterRef.current,
      blink_rate: Math.round(blink_rate * 100) / 100,
      ear_avg: Math.round(ear_avg * 1000) / 1000,
      ear_min: Math.round((earMinRef.current > 9 ? 0 : earMinRef.current) * 1000) / 1000,
      ear_max: Math.round(earMaxRef.current * 1000) / 1000,
      yaw_avg_abs: 0,
      pitch_avg_abs: 0,
      gaze_pct,
      end_reason: _reason,
    }
    const nivel = heuristic(metrics)
    const recomendacion = recommendation(nivel)
    stopAll()
    onFinish({ nivel, recomendacion, metrics })
  }

  return (
    <div className="relative">
      <div className={`transition-all ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="rounded-lg shadow-md border bg-black w-full max-w-sm"
          />
          <canvas ref={canvasRef} className="rounded-lg shadow-md border hidden" />
        </div>
      </div>
    </div>
  )
}
