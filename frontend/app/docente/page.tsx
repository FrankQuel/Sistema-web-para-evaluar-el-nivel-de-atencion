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
  curso: string     // viene del serializer
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

    // carga clases del docente y todas las matrículas
    ;(async () => {
      const cls = await listClases({ id_dce: parsed.profile_id })
      setClases(cls)
      const mats = await listMatriculas()
      setMatriculas(mats)
    })()
  }, [router])

  // agrupar por curso
  const cursos = useMemo(() => {
    const byCurso = new Map<number, { id: number; nombre: string; clases: number; estudiantes: number }>()
    const estPorCurso = new Map<number, Set<number>>() // id_cur -> set de id_est (únicos)
    clases.forEach(c => {
      const cur = byCurso.get(c.id_cur) || { id: c.id_cur, nombre: c.curso, clases: 0, estudiantes: 0 }
      cur.clases += 1
      byCurso.set(c.id_cur, cur)
    })
    // contar estudiantes únicos por curso a partir de matrículas en sus clases
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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">Panel del Docente</h1>
              <p className="text-gray-600">Bienvenido, Prof. {userData.usuario}</p>
            </div>
            <Link href="/">
              <button
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50"
                onClick={() => { localStorage.clear() }}
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card><CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Mis Cursos</CardTitle><BookOpen className="h-4 w-4" />
          </CardHeader><CardContent><div className="text-2xl font-bold">{cursos.length}</div></CardContent></Card>

          <Card><CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Estudiantes</CardTitle><Users className="h-4 w-4" />
          </CardHeader><CardContent><div className="text-2xl font-bold">{totalEstudiantes}</div></CardContent></Card>

          <Card><CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Clases</CardTitle><Video className="h-4 w-4" />
          </CardHeader><CardContent><div className="text-2xl font-bold">{clases.length}</div></CardContent></Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Mis Cursos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map(c => (
              <Card key={c.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {c.nombre}
                    <Badge variant="secondary">{c.estudiantes} estudiantes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>Clases creadas</span><span className="font-medium">{c.clases}</span>
                  </div>
                  <Link href={`/docente/curso/${c.id}`} className="block">
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50">
                      <Eye className="w-4 h-4" /> Gestionar Curso
                    </button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
