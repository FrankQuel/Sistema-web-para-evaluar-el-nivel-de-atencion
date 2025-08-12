'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Video, ArrowLeft, ExternalLink, Eye } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

import { listClases, updateClase, listMatriculas } from '@/app/lib/api'

/* ===== Resultados API (si quieres, muévelo a app/lib/api.ts) ===== */
async function fetchResultados(params: {
  id_est: number
  id_cur: number
}) {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000'
  const q = new URLSearchParams()
  q.set('id_est', String(params.id_est))
  q.set('id_cur', String(params.id_cur))
  // sin latest ni limit: queremos todos
  const res = await fetch(`${base}/api/resultados/?${q.toString()}`, { cache: 'no-store' as any })
  if (!res.ok) throw new Error('Error al obtener resultados')
  return res.json() as Promise<Array<ResultadoRow>>
}
/* ================================================================= */

type Clase = {
  id_cl: number
  nombre_cl: string
  video_cl: string | null
  id_cur: number
  curso: string
  id_dce: number
}

type ResultadoRow = {
  id_re: number
  nivelaten_re: string
  atencion_ia_re: string
  fechaeva_re: string
  id_est: number
  id_cl: number
  clase?: string
  curso?: string
  estudiante?: string
}

export default function CursoDetalle() {
  const router = useRouter()
  const params = useParams() as { id: string }

  const [userData, setUserData] = useState<any>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [editing, setEditing] = useState<Record<number, { nombre: string; video: string }>>({})
  const [matriculas, setMatriculas] = useState<any[]>([])

  // Estado de resultados
  const [openList, setOpenList] = useState(false)         // modal de lista
  const [openDetail, setOpenDetail] = useState(false)     // modal de detalle
  const [loadingList, setLoadingList] = useState(false)
  const [resultados, setResultados] = useState<ResultadoRow[]>([])
  const [alumnoSel, setAlumnoSel] = useState<{ id: number; nombre: string } | null>(null)
  const [detalleSel, setDetalleSel] = useState<ResultadoRow | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('userType')
    const raw = localStorage.getItem('userData')
    if (t !== 'docente' || !raw) { router.push('/'); return }
    const parsed = JSON.parse(raw)
    setUserData(parsed)

    ;(async () => {
      const cls = await listClases({ id_cur: Number(params.id), id_dce: parsed.profile_id })
      setClases(cls)
      setEditing(
        Object.fromEntries(cls.map((c: Clase) => [c.id_cl, { nombre: c.nombre_cl, video: c.video_cl || '' }]))
      )
      const mats = await listMatriculas()
      setMatriculas(mats)
    })()
  }, [params.id, router])

  const cursoNombre = clases[0]?.curso || 'Curso'

  // estudiantes únicos de las clases de este curso
  const estudiantes = useMemo(() => {
    const idsClase = new Set(clases.map(c => c.id_cl))
    const porId = new Map<number, { id: number; nombre: string }>()
    matriculas
      .filter(m => idsClase.has(m.id_cl))
      .forEach(m => {
        porId.set(m.id_est, { id: m.id_est, nombre: m.estudiante })
      })
    return [...porId.values()]
  }, [clases, matriculas])

  const handleSave = async (id_cl: number) => {
    const e = editing[id_cl]
    await updateClase(id_cl, { nombre_cl: e.nombre, video_cl: e.video })
    // refrescar
    const cls = await listClases({ id_cur: Number(params.id), id_dce: userData.profile_id })
    setClases(cls)
  }

  // Abrir modal de lista de resultados para un estudiante
  const abrirResultados = async (est: { id: number; nombre: string }) => {
    setAlumnoSel(est)
    setResultados([])
    setOpenList(true)
    setLoadingList(true)
    try {
      const data = await fetchResultados({ id_est: est.id, id_cur: Number(params.id) })
      setResultados(data) // ya viene ordenado desc por la vista
    } catch (e) {
      console.error(e)
      setResultados([])
    } finally {
      setLoadingList(false)
    }
  }

  // Abrir modal de detalle a partir de una fila
  const verDetalle = (row: ResultadoRow) => {
    setDetalleSel(row)
    setOpenDetail(true)
  }

  if (!userData) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/docente')} className="rounded-md border px-3 py-2 hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{cursoNombre}</h1>
                <p className="text-gray-600">Profesor: {userData.usuario}</p>
              </div>
            </div>
            <Badge variant="secondary">{clases.length} clases</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="clases">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clases">Gestión de Clases</TabsTrigger>
            <TabsTrigger value="estudiantes">Estudiantes del curso</TabsTrigger>
          </TabsList>

          {/* CLASES */}
          <TabsContent value="clases" className="space-y-4">
            {clases.length === 0
              ? <div className="text-sm text-muted-foreground">No tienes clases asignadas en este curso.</div>
              : clases.map(c => (
                <Card key={c.id_cl}>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Video className="h-4 w-4" /> Clase #{c.id_cl}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre de la clase</Label>
                        <Input
                          value={editing[c.id_cl]?.nombre ?? ''}
                          onChange={e => setEditing(s => ({ ...s, [c.id_cl]: { ...s[c.id_cl], nombre: e.target.value } }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL del video (video_cl)</Label>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={editing[c.id_cl]?.video ?? ''}
                          onChange={e => setEditing(s => ({ ...s, [c.id_cl]: { ...s[c.id_cl], video: e.target.value } }))}
                        />
                      </div>
                    </div>
                    {c.video_cl && (
                      <a className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                         href={c.video_cl} target="_blank" rel="noopener noreferrer">
                        Ver video <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <div className="pt-2">
                      <Button onClick={() => handleSave(c.id_cl)}>Guardar cambios</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          {/* ESTUDIANTES */}
          <TabsContent value="estudiantes">
            <Card>
              <CardHeader><CardTitle className="text-base">Estudiantes inscritos</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-56">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiantes.map(e => (
                      <TableRow key={e.id}>
                        <TableCell>{e.id}</TableCell>
                        <TableCell>{e.nombre}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => abrirResultados(e)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Resultados
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {estudiantes.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-sm text-gray-500">
                        No hay estudiantes matriculados aún.
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== Modal: Lista de resultados del estudiante ===== */}
      <Dialog open={openList} onOpenChange={setOpenList}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Resultados de {alumnoSel?.nombre ?? 'estudiante'}
            </DialogTitle>
          </DialogHeader>

          {loadingList ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : resultados.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Sin resultados almacenados para este curso.</div>
          ) : (
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead className="w-28">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.map(r => (
                    <TableRow key={r.id_re}>
                      <TableCell>{r.id_re}</TableCell>
                      <TableCell>{new Date(r.fechaeva_re).toLocaleString()}</TableCell>
                      <TableCell>{r.clase ?? r.id_cl}</TableCell>
                      <TableCell>
                        <Badge>{r.nivelaten_re}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => verDetalle(r)}>Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">
                Ordenado por fecha (más recientes primero).
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenList(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Modal: Detalle del resultado seleccionado ===== */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle del resultado</DialogTitle>
          </DialogHeader>

          {detalleSel ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{detalleSel.clase ?? `Clase #${detalleSel.id_cl}`}</h3>
                  <Badge variant="secondary">{detalleSel.curso ?? 'Curso'}</Badge>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estudiante</p>
                    <p className="font-medium">{detalleSel.estudiante ?? alumnoSel?.nombre ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">{new Date(detalleSel.fechaeva_re).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nivel de atención</p>
                    <p className="text-xl font-bold">{detalleSel.nivelaten_re}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Recomendación</p>
                  <p className="mt-1 leading-relaxed">{detalleSel.atencion_ia_re}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Selecciona un resultado de la lista.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetail(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
