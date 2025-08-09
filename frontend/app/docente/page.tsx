'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Video, LogOut, Eye, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DocenteDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState(null)

  // Datos simulados de cursos del docente
  const [cursos] = useState([
    {
      id: 1,
      nombre: 'A003: Matemáticas Básicas',
      estudiantes: 1,
      clases: 1,
    }
  ])

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')

    if (userType !== 'docente' || !storedUserData) {
      router.push('/')
      return
    }

    setUserData(JSON.parse(storedUserData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userType')
    localStorage.removeItem('userData')
    router.push('/')
  }

  const handleVerCurso = (cursoId: number) => {
    router.push(`/docente/curso/${cursoId}`)
  }

  if (!userData) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

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
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
              <p className="text-xs text-muted-foreground">Cursos asignados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cursos.reduce((total, curso) => total + curso.estudiantes, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Estudiantes activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clases</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cursos.reduce((total, curso) => total + curso.clases, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Clases creadas</p>
            </CardContent>
          </Card>
          
        </div>

        {/* Cursos */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mis Cursos</h2>
            <Badge variant="secondary" className="text-sm">
              {cursos.length} cursos activos
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso) => (
              <Card key={curso.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {curso.nombre}
                    <Badge variant="outline">{curso.estudiantes} estudiantes</Badge>
                  </CardTitle>
                  <CardDescription>{curso.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-gray-500">Clases creadas</p>
                        <p className="font-medium">{curso.clases}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">Última clase</p>
                        <p className="font-medium">{curso.ultimaClase}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <Button
                        className="w-full flex items-center gap-2"
                        onClick={() => handleVerCurso(curso.id)}
                      >
                        <Eye className="w-4 h-4" />
                        Gestionar Curso
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
