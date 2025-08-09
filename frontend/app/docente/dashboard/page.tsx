'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Video, LogOut, Eye } from 'lucide-react'
import Link from 'next/link'

export default function DocenteDashboard() {
  const [cursos] = useState([
    { 
      id: 1, 
      nombre: 'Matemáticas Básicas', 
      descripcion: 'Curso de matemáticas nivel básico',
      estudiantes: 25,
      clases: 8
    },
    { 
      id: 2, 
      nombre: 'Álgebra Intermedia', 
      descripcion: 'Curso de álgebra nivel intermedio',
      estudiantes: 18,
      clases: 12
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel del Docente</h1>
              <p className="text-gray-600">Bienvenido, Prof. Juan Pérez</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
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
            </CardContent>
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
                  <CardDescription>{curso.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Clases creadas:</span>
                      <span className="font-medium">{curso.clases}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/docente/curso/${curso.id}`} className="flex-1">
                        <Button className="w-full flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Ver Curso
                        </Button>
                      </Link>
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
