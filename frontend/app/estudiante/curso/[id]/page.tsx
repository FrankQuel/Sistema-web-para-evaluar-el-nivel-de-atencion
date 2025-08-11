'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Clock, ExternalLink, Video, BookOpen } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { listMatriculas, listClases } from '@/app/lib/api'
import { iniciarAnalisis } from '@/lib/analisisAtencion'

type Clase = {
  id_cl: number
  nombre_cl: string
  video_cl: string | null
  id_cur: number
  curso: string
  id_dce: number
  duracion?: string
}

/* ======== Helpers para embeber YouTube ======== */
function toYouTubeEmbed(raw: string | null | undefined): string | null {
  if (!raw) return null
  let url: URL
  try { url = new URL(raw) } catch { return null }

  const host = url.hostname.replace(/^www\./, '')
  const isYT =
    host === 'youtube.com' ||
    host === 'youtu.be' ||
    host === 'm.youtube.com' ||
    host === 'youtube-nocookie.com'

  if (!isYT) return null

  const v = url.searchParams.get('v') || null
  const list = url.searchParams.get('list') || null
  const start = url.searchParams.get('start') || url.searchParams.get('t') || null

  // shorts
  if (url.pathname.startsWith('/shorts/')) {
    const id = url.pathname.split('/')[2]
    if (id) return `https://www.youtube.com/embed/${id}${start ? `?start=${encodeURIComponent(start)}` : ''}`
  }

  // youtu.be/<id>
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    if (id) return `https://www.youtube.com/embed/${id}${start ? `?start=${encodeURIComponent(start)}` : ''}`
  }

  // playlist pura
  if (!v && list) {
    const qs = new URLSearchParams()
    qs.set('list', list)
    if (start) qs.set('start', start)
    return `https://www.youtube.com/embed/videoseries?${qs.toString()}`
  }

  // watch?v=<id> o /embed/<id>
  const id = v || (url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : null)
  if (id) {
    const qs = new URLSearchParams()
    if (list) qs.set('list', list)
    if (start) qs.set('start', start)
    const tail = qs.toString()
    return `https://www.youtube.com/embed/${id}${tail ? `?${tail}` : ''}`
  }

  return null
}

function EmbeddedVideo({ url }: { url: string }) {
  const embed = toYouTubeEmbed(url)
  if (!embed) return null
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        src={embed}
        title="Video de la clase"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
/* ============================================== */

export default function CursoEstudiante() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [userData, setUserData] = useState<any>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [claseActual, setClaseActual] = useState<Clase | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('userType')
    const raw = localStorage.getItem('userData')
    if (t !== 'estudiante' || !raw) { router.push('/'); return }
    const parsed = JSON.parse(raw)
    setUserData(parsed)

    ;(async () => {
      // 1) matrículas del estudiante
      const mats = await listMatriculas()
      const matsEst = mats.filter((m: any) => m.id_est === parsed.profile_id)

      // 2) clases del curso {id} a partir de esas matrículas
      const cls = await listClases()
      const idsClasesEst = new Set(matsEst.map((m: any) => m.id_cl))
      const clasesDelCurso = cls.filter(
        (c: any) => idsClasesEst.has(c.id_cl) && c.id_cur === Number(params.id)
      )

      setClases(clasesDelCurso)
      setClaseActual(clasesDelCurso[0] ?? null)
    })()
  }, [params.id, router])

  const cursoNombre = useMemo(() => clases[0]?.curso || 'Curso', [clases])

  const handleIniciarAnalisis = () => {
    if (videoRef.current) iniciarAnalisis(videoRef.current)
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Clases */}
          <div className="lg:col-span-1">
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
                      onClick={() => setClaseActual(clase)}
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

          {/* Reproductor / enlace */}
          <div className="lg:col-span-2">
            {claseActual ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      {claseActual.nombre_cl}
                    </div>
                    <Badge variant="secondary">Video</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Si es YouTube, embeber. Si no hay URL, placeholder */}
                    {claseActual.video_cl ? (
                      <>
                        <EmbeddedVideo url={claseActual.video_cl} />
                        <div className="flex items-center justify-between">
                          <a
                            href={claseActual.video_cl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ver en plataforma original
                          </a>

                          {/* Botón que usa el <video> oculto para tu analítica */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleIniciarAnalisis}
                            className="flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar análisis
                          </Button>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            width={640}
                            height={480}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Play className="w-16 h-16 mx-auto mb-4 opacity-70" />
                          <p className="text-lg font-medium">Reproductor de Video</p>
                          <p className="text-sm opacity-70">No hay URL de video asignada</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-gray-500">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Selecciona una clase para comenzar</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
