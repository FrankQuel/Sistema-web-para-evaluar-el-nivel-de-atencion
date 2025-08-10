'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Video, LogOut, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { listClases, listMatriculas } from '@/app/lib/api'

type Clase = {
  id_cl: number
  nombre_cl: string
  video_cl: string | null
  id_cur: number
  curso: string
  id_dce: number
}

export default function DocenteDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [matriculas, setMatriculas] = useState<any[]>([])

  useEffect(() => {
    const t = localStorage.getItem('userType')
    const raw = localStorage.getItem('userData')
    if (t !== 'docente' || !raw) { router.push('/'); return }

    const parsed = JSON.parse(raw)
    setUserData(parsed)

    ;(async () => {
      // clases asignadas al docente (id_dce = profile_id)
      const cls = await listClases({ id_dce: parsed.profile_id })
      setClases(cls)
      // todas las matrículas (filtramos en cliente para no tocar backend)
      const mats = await listMatriculas()
      setMatriculas(mats)
    })()
  }, [router])

  // agrupar por curso para tarjetas
  const cursos = useMemo(() => {
    const byCurso = new Map<number, { id: number; nombre: string; clases: number; estudiantes: number }>()
    const estPorCurso = new Map<number, Set<number>>() // id_cur -> set id_est únicos

    clases.forEach(c => {
      const cur = byCurso.get(c.id_cur) || { id: c.id_cur, nombre: c.curso, clases: 0, estudiantes: 0 }
      cur.clases += 1
      byCurso.set(c.id_cur, cur)
    })

    clases.forEach(c => {
      const set = estPorCurso.get(c.id_cur) || new Set<number>()
      matriculas.filter(m => m.id_cl === c.id_cl).forEach(m => set.add(m.id_est))
      estPorCurso.set(c.id_cur, set)
    })

    ;[...byCurso.values()].forEach(cur => {
      cur.estudiantes = estPorCurso.get(cur.id)?.size || 0
    })
    return [...byCurso.values()]
  }, [clases, matriculas])

  const totalEstudiantes = useMemo(
    () => new Set(matriculas.filter(m => clases.find(c => c.id_cl === m.id_cl)).map(m => m.id_est)).size,
    [matriculas, clases]
  )

  if (!userData) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel del Docente</h1>
              <p className="text-gray-600">Bienvenido, Prof. {userData.usuario}</p>
            </div>
            <Link href="/">
              <button
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
                onClick={() => { localStorage.removeItem('userType'); localStorage.removeItem('userData') }}
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{cursos.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalEstudiantes}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clases</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{clases.length}</div></CardContent>
          </Card>
        </div>

        {/* Cursos */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Mis Cursos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso) => (
              <Card key={curso.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {curso.nombre}
                    <Badge variant="secondary">{curso.estudiantes} estudiantes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Clases creadas:</span>
                      <span className="font-medium">{curso.clases}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/docente/curso/${curso.id}`} className="flex-1">
                        <button className="w-full inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50">
                          <Eye className="w-4 h-4" /> Ver Curso
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {cursos.length === 0 && (
              <div className="text-sm text-muted-foreground">No tienes cursos asignados.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
