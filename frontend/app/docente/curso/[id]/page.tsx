'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Video, ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { listClases, updateClase, listMatriculas } from '@/app/lib/api'

type Clase = {
  id_cl: number
  nombre_cl: string
  video_cl: string | null
  id_cur: number
  curso: string
  id_dce: number
}

export default function CursoDetalle() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [userData, setUserData] = useState<any>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [editing, setEditing] = useState<Record<number, { nombre: string; video: string }>>({})
  const [matriculas, setMatriculas] = useState<any[]>([])

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
        // el serializer ya trae "estudiante" (nombre)
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>{e.id}</TableCell>
                      <TableCell>{e.nombre}</TableCell>
                    </TableRow>
                  ))}
                  {estudiantes.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-sm text-gray-500">
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
    </div>
  )
}
