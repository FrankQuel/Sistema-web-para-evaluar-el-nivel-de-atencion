'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Play, Clock, LogOut, Eye } from 'lucide-react'
import Link from 'next/link'

export default function EstudianteDashboard() {
  const [cursos] = useState([
    { 
      id: 1, 
      nombre: 'Matemáticas Básicas', 
      descripcion: 'Curso de matemáticas nivel básico',
      docente: 'Prof. Juan Pérez',
      progreso: 75,
      totalClases: 8,
      clasesVistas: 6,
      ultimaActividad: '2024-01-25'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Panel de Estudiante</h1>
              <p className="text-gray-600">Bienvenido, Ana López</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Completadas</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cursos.reduce((total, curso) => total + curso.clasesVistas, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clases</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cursos.reduce((total, curso) => total + curso.totalClases, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(cursos.reduce((sum, curso) => sum + curso.progreso, 0) / cursos.length)}%
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
                    <Badge 
                      variant={curso.progreso >= 70 ? "default" : curso.progreso >= 40 ? "secondary" : "outline"}
                    >
                      {curso.progreso}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>{curso.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progreso del curso</span>
                        <span>{curso.clasesVistas}/{curso.totalClases} clases</span>
                      </div>
                      <Progress value={curso.progreso} className="w-full" />
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Docente:</span>
                        <span className="font-medium">{curso.docente}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Última actividad:</span>
                        <span>{curso.ultimaActividad}</span>
                      </div>
                    </div>
                    
                    <Link href={`/estudiante/curso/${curso.id}`} className="block">
                      <Button className="w-full flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        {curso.progreso === 100 ? 'Revisar Curso' : 'Continuar Curso'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Completaste "Operaciones básicas"</span>
                  </div>
                  <span className="text-sm text-gray-500">Hace 2 días</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Iniciaste "La Revolución Industrial"</span>
                  </div>
                  <span className="text-sm text-gray-500">Hace 5 días</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Completaste el curso "Ciencias Naturales"</span>
                  </div>
                  <span className="text-sm text-gray-500">Hace 1 semana</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
