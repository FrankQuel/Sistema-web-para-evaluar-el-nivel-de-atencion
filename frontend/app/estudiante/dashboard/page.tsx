'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Play, Clock, LogOut, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { listMatriculas, listClases } from '@/app/lib/api'

type Clase = {
  id_cl: number
  nombre_cl: string
  video_cl: string | null
  id_cur: number
  curso: string
  id_dce: number
}

export default function EstudianteDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [matriculas, setMatriculas] = useState<any[]>([])
  const [clases, setClases] = useState<Clase[]>([])

  useEffect(() => {
    const t = localStorage.getItem('userType')
    const raw = localStorage.getItem('userData')
    if (t !== 'estudiante' || !raw) { router.push('/'); return }

    const parsed = JSON.parse(raw)
    setUserData(parsed)

    ;(async () => {
      // 1) traemos TODAS las matrículas y filtramos por el estudiante logueado (profile_id = id_est)
      const mats = await listMatriculas()
      const matsEst = mats.filter((m: any) => m.id_est === parsed.profile_id)
      setMatriculas(matsEst)

      // 2) traemos todas las clases y nos quedamos con las de esas matrículas
      const cls = await listClases()
      const idClasesEst = new Set(matsEst.map((m: any) => m.id_cl))
      setClases(cls.filter((c: any) => idClasesEst.has(c.id_cl)))
    })()
  }, [router])

  // Agrupar por curso para tarjetas
  const cursos = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; totalClases: number }>()
    clases.forEach(c => {
      const cur = map.get(c.id_cur) || { id: c.id_cur, nombre: c.curso, totalClases: 0 }
      cur.totalClases += 1
      map.set(c.id_cur, cur)
    })
    return [...map.values()]
  }, [clases])

  if (!userData) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Panel de Estudiante</h1>
              <p className="text-gray-600">Bienvenido, {userData.usuario}</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2"
                onClick={() => { localStorage.removeItem('userType'); localStorage.removeItem('userData') }}>
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{cursos.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clases</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{clases.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Progreso (demo)</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length ? 100 : 0}%</div>
              <Progress value={cursos.length ? 100 : 0} className="w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Cursos */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mis Cursos</h2>
            <Badge variant="secondary" className="text-sm">{cursos.length} cursos inscritos</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map(curso => (
              <Card key={curso.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {curso.nombre}
                    <Badge variant="outline">{curso.totalClases} clases</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/estudiante/curso/${curso.id}`} className="block">
                    <Button className="w-full flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Ingresar Curso
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {cursos.length === 0 && (
              <div className="text-sm text-muted-foreground">Aún no estás matriculado en clases.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
