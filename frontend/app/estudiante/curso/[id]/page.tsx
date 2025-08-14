'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Play, Clock, ExternalLink, BookOpen } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { listMatriculas, listClases, createResultadoEvaluacion } from '@/app/lib/api'
import { useYouTube } from '@/hooks/useYouTube'
import AnalizadorAtencion, { type AnalisisOut } from '@/components/AnalizadorAtencion'

type Clase = {
  id_cl: number
  nombre_cl: string
  video_cl: string | null
  id_cur: number
  curso: string
  id_dce: number
  duracion?: string
}

function toYouTubeEmbed(raw: string | null | undefined): string | null {
  if (!raw) return null
  let url: URL
  try { url = new URL(raw) } catch { return null }

  const host = url.hostname.replace(/^www\./, '')
  const isYT = ['youtube.com','youtu.be','m.youtube.com','youtube-nocookie.com'].includes(host)
  if (!isYT) return null

  const v = url.searchParams.get('v') || null
  const list = url.searchParams.get('list') || null
  const start = url.searchParams.get('start') || url.searchParams.get('t') || null

  const addAPI = (base: string) => {
    const qs = new URLSearchParams()
    if (list)  qs.set('list', list)
    if (start) qs.set('start', start)
    qs.set('enablejsapi', '1')
    qs.set('origin', typeof window !== 'undefined' ? window.location.origin : '')
    const tail = qs.toString()
    return tail ? `${base}?${tail}` : base
  }

  if (url.pathname.startsWith('/shorts/')) {
    const id = url.pathname.split('/')[2]
    return id ? addAPI(`https://www.youtube.com/embed/${id}`) : null
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    return id ? addAPI(`https://www.youtube.com/embed/${id}`) : null
  }
  if (!v && list) {
    const qs = new URLSearchParams()
    qs.set('list', list)
    if (start) qs.set('start', start)
    qs.set('enablejsapi', '1')
    qs.set('origin', typeof window !== 'undefined' ? window.location.origin : '')
    return `https://www.youtube.com/embed/videoseries?${qs.toString()}`
  }
  const id = v || (url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : null)
  return id ? addAPI(`https://www.youtube.com/embed/${id}`) : null
}

type ResultadoResp = {
  nivel: string
  recomendacion: string
  resultado_id?: number
  resultado: any
}

/** Panel del reproductor + controles. El hook de YouTube vive aquí dentro del modal. */
function PlayerPanel({
  embedUrl,
  videoUrl,
  modalOpen,
  onDurationReady,
  running,
  setRunning,
  guardando,
}: {
  embedUrl: string
  videoUrl: string
  modalOpen: boolean
  onDurationReady: (sec: number) => void
  running: boolean
  setRunning: (v: boolean) => void
  guardando: boolean
}) {
  // id único para el iframe (evita colisiones)
  const iframeId = useMemo(() => `yt-iframe-${Math.random().toString(36).slice(2, 9)}`, [])
  const firstPlay = useRef(false)

  const { ready, play, pause, getDuration, addOnStateChange } = useYouTube(iframeId)

  // Listener del estado del player (PLAYING/PAUSED/ENDED)
  useEffect(() => {
    if (!ready) return
    const off = addOnStateChange((state) => {
      if (state === 1) {                 // PLAYING
        if (!firstPlay.current) {
          firstPlay.current = true
          let d = getDuration()
          if (!d || d < 1) {
            setTimeout(() => {
              const d2 = getDuration()
              onDurationReady(Math.floor(d2 && d2 > 1 ? d2 : 60))
            }, 200)
          } else {
            onDurationReady(Math.floor(d))
          }
        }
        setRunning(true)
      } else if (state === 2) {          // PAUSED
        setRunning(false)
      } else if (state === 0) {          // ENDED
        setRunning(false)
        firstPlay.current = false
      }
    })
    return off
  }, [ready, addOnStateChange, getDuration, onDurationReady, setRunning])

  // Pausar video al cerrar el modal
  useEffect(() => {
    if (!modalOpen) {
      pause?.()
      setRunning(false)
      firstPlay.current = false
    }
  }, [modalOpen, pause, setRunning])

  // >>> Recuperar botón "Iniciar análisis"
  const iniciarAnalisis = () => {
    // 1) Poner running=true para activar la cámara al instante
    setRunning(true)

    // 2) Reproducir el video aprovechando el user gesture del click
    play?.()

    // 3) Calcular duración sin bloquear gesto
    let d = getDuration()
    if (!d || d < 1) {
      setTimeout(() => {
        const d2 = getDuration()
        onDurationReady(Math.floor(d2 && d2 > 1 ? d2 : 60))
      }, 200)
    } else {
      onDurationReady(Math.floor(d))
    }
  }

  const detenerAnalisis = () => {
    setRunning(false)
    pause?.()
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          id={iframeId}
          width="100%"
          height="100%"
          src={embedUrl}
          title="Video de la clase"
          frameBorder={0}
          allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      <div className="flex items-center justify-between">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          Ver en plataforma original
        </a>

        <div className="flex gap-2">
          {running ? (
            <Button variant="outline" onClick={detenerAnalisis}>
              Detener análisis
            </Button>
          ) : (
            <Button onClick={iniciarAnalisis} disabled={guardando}>
              <Play className="w-4 h-4 mr-2" />
              Iniciar análisis
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CursoEstudiante() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [userData, setUserData] = useState<any>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [claseActual, setClaseActual] = useState<Clase | null>(null)

  const [running, setRunning] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [durationSec, setDurationSec] = useState<number>(60)

  const [resultado, setResultado] = useState<ResultadoResp | null>(null)
  const [openRes, setOpenRes] = useState(false)
  const [openClase, setOpenClase] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('userType')
    const raw = localStorage.getItem('userData')
    if (t !== 'estudiante' || !raw) { router.push('/'); return }
    const parsed = JSON.parse(raw)
    setUserData(parsed)

    ;(async () => {
      const mats = await listMatriculas()
      const matsEst = mats.filter((m: any) => m.id_est === parsed.profile_id)
      const cls = await listClases()
      const idsClasesEst = new Set(matsEst.map((m: any) => m.id_cl))
      const clasesDelCurso = cls.filter((c: any) => idsClasesEst.has(c.id_cl) && c.id_cur === Number(params.id))
      setClases(clasesDelCurso)
      setClaseActual(clasesDelCurso[0] ?? null)
    })()
  }, [params.id, router])

  const cursoNombre = useMemo(() => clases[0]?.curso || 'Curso', [clases])
  const embedUrl = useMemo(() => toYouTubeEmbed(claseActual?.video_cl || null), [claseActual])

  const handleFinish = async (out: AnalisisOut) => {
    if (!userData || !claseActual) return
    setGuardando(true)
    try {
      const resp: ResultadoResp = await createResultadoEvaluacion({
        id_est: Number(userData.profile_id),
        id_cl: Number(claseActual.id_cl),
        metrics: out.metrics,
      })
      setResultado(resp)
      setOpenRes(true)
    } catch (e) {
      console.error(e)
      alert('No se pudo guardar el resultado. Revisa el backend/CORS.')
    } finally {
      setGuardando(false)
      setRunning(false)
    }
  }

  if (!userData) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/estudiante/dashboard')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{cursoNombre}</h1>
                <p className="text-gray-600">Estudiante: {userData.usuario}</p>
              </div>
            </div>
            <Badge variant="secondary">{clases.length} clases</Badge>
          </div>
        </div>
      </div>

      {/* SOLO las clases, centradas */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Contenido del Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clases.map((clase, index) => (
                <div
                  key={clase.id_cl}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    claseActual?.id_cl === clase.id_cl
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setClaseActual(clase)
                    setRunning(false)
                    setOpenClase(true)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{clase.nombre_cl}</h4>
                        {clase.duracion && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {clase.duracion}
                          </p>
                        )}
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
              {clases.length === 0 && (
                <div className="text-sm text-muted-foreground">No tienes clases en este curso.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== MODAL: Video + Cámara/Análisis ===== */}
      <Dialog
        open={openClase}
        onOpenChange={(v) => {
          setOpenClase(v)
          if (!v) setRunning(false)
        }}
      >
        <DialogContent className="w-[96vw] sm:max-w-[96vw] md:max-w-[1150px] lg:max-w-[1280px] xl:max-w-[1440px] p-6">
          <DialogHeader>
            <DialogTitle>{claseActual?.nombre_cl ?? 'Clase'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Izquierda: Video + controles (hook dentro) */}
            {embedUrl ? (
              <PlayerPanel
                embedUrl={embedUrl}
                videoUrl={claseActual!.video_cl!}
                modalOpen={openClase}
                running={running}
                setRunning={setRunning}
                guardando={guardando}
                onDurationReady={(sec) => setDurationSec(sec)}
              />
            ) : (
              <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center text-white">
                No hay un video de YouTube válido para embeber.
              </div>
            )}

            {/* Derecha: Cámara / Analizador */}
            <div className="rounded-xl border p-3 bg-white min-h-[420px] md:min-h-[520px]">
              <h3 className="font-medium mb-2">Cámara y análisis</h3>
              <AnalizadorAtencion running={running} durationSec={durationSec} onFinish={handleFinish} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenClase(false); setRunning(false) }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Modal de Resultados ---- */}
      <Dialog open={openRes} onOpenChange={setOpenRes}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Resultados de su evaluación</DialogTitle>
          </DialogHeader>

        <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{claseActual?.nombre_cl ?? 'Clase'}</h3>
                <Badge variant="secondary">Atención</Badge>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nivel de atención</p>
                  <p className="text-xl font-bold">{resultado?.nivel ?? '-'}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Recomendación</p>
                <p className="mt-1 leading-relaxed">{resultado?.recomendacion ?? '-'}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end">
            <Button variant="outline" onClick={() => setOpenRes(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
