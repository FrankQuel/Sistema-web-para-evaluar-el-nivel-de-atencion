'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Plus, Video, Users, Eye, ExternalLink, Calendar, Clock } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

export default function CursoDetalle() {
  const router = useRouter()
  const params = useParams()
  const [userData, setUserData] = useState(null)
  const [showClaseDialog, setShowClaseDialog] = useState(false)

  // Datos simulados del curso
  const [curso] = useState({
    id: parseInt(params.id),
    nombre: 'A003: Matemáticas Básicas',
  })

  // Estados para clases
  const [clases, setClases] = useState([
    { 
      id: 1, 
      nombre: 'Introducción a los números', 
      descripcion: 'Conceptos básicos de números y operaciones',
      videoUrl: 'https://youtube.com/watch?v=ejemplo1',
      fechaCreacion: '2024-01-15',
      duracion: '15 min'
    }
  ])

  // Estados para estudiantes
  const [estudiantes] = useState([
    { 
      id: 1, 
      nombre: 'Franklin Hallo', 
      email: 'frank@gmail.com',
      ultimaActividad: '2024-01-25',
      totalClases: 1
    }
  ])

  // Estado para nueva clase
  const [newClase, setNewClase] = useState({
    nombre: '',
    descripcion: '',
    videoUrl: '',
    duracion: ''
  })

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')
    
    if (userType !== 'docente' || !storedUserData) {
      router.push('/')
      return
    }
    
    setUserData(JSON.parse(storedUserData))
  }, [router])

  const handleAddClase = () => {
    if (newClase.nombre && newClase.descripcion && newClase.videoUrl) {
      const id = clases.length + 1
      const fechaCreacion = new Date().toISOString().split('T')[0]
      setClases([...clases, { 
        id, 
        ...newClase, 
        fechaCreacion 
      }])
      setNewClase({ nombre: '', descripcion: '', videoUrl: '', duracion: '' })
      setShowClaseDialog(false)
    }
  }

  const handleBack = () => {
    router.push('/docente')
  }

  if (!userData) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{curso.nombre}</h1>
                <p className="text-gray-600">{curso.descripcion}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {curso.estudiantes} 
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clases</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clases.length}</div>
              <p className="text-xs text-muted-foreground">Clases creadas</p>
            </CardContent>
          </Card>
          
          
          
        </div>

        {/* Tabs */}
        <Tabs defaultValue="clases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clases">Gestión de Clases</TabsTrigger>
            <TabsTrigger value="estudiantes">Lista de Estudiantes</TabsTrigger>
          </TabsList>

          {/* Gestión de Clases */}
          <TabsContent value="clases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Clases del Curso</h2>
              <Dialog open={showClaseDialog} onOpenChange={setShowClaseDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar Clase
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Clase</DialogTitle>
                    <DialogDescription>
                      Completa la información de la nueva clase
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clase-nombre">Nombre de la Clase</Label>
                      <Input
                        id="clase-nombre"
                        value={newClase.nombre}
                        onChange={(e) => setNewClase({...newClase, nombre: e.target.value})}
                        placeholder="Ej: Introducción a las fracciones"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clase-descripcion">Descripción</Label>
                      <Textarea
                        id="clase-descripcion"
                        value={newClase.descripcion}
                        onChange={(e) => setNewClase({...newClase, descripcion: e.target.value})}
                        placeholder="Breve descripción del contenido"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clase-video">URL del Video</Label>
                      <Input
                        id="clase-video"
                        value={newClase.videoUrl}
                        onChange={(e) => setNewClase({...newClase, videoUrl: e.target.value})}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clase-duracion">Duración</Label>
                      <Input
                        id="clase-duracion"
                        value={newClase.duracion}
                        onChange={(e) => setNewClase({...newClase, duracion: e.target.value})}
                        placeholder="Ej: 15 min"
                      />
                    </div>
                    <Button onClick={handleAddClase} className="w-full">
                      Agregar Clase
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {clases.map((clase) => (
                <Card key={clase.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {clase.nombre}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Clase {clase.id}</Badge>
                        {clase.duracion && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {clase.duracion}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>{clase.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-gray-500" />
                        <a 
                          href={clase.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          Ver video
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Creada el: {clase.fechaCreacion}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Lista de Estudiantes */}
          <TabsContent value="estudiantes" className="space-y-4">
            <h2 className="text-xl font-semibold">Estudiantes Inscritos</h2>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Clases Completadas</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.map((estudiante) => (
                    <TableRow key={estudiante.id}>
                      <TableCell className="font-medium">{estudiante.nombre}</TableCell>
                      <TableCell>{estudiante.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={estudiante.progreso} className="w-16" />
                          <span className="text-sm font-medium">{estudiante.progreso}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {estudiante.clasesCompletadas}/{estudiante.totalClases}
                        </Badge>
                      </TableCell>
                      <TableCell>{estudiante.ultimaActividad}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={estudiante.progreso >= 70 ? "default" : estudiante.progreso >= 40 ? "secondary" : ""}
                        >
                          {estudiante.progreso >= 70 ? "Excelente" : estudiante.progreso >= 40 ? "En progreso" : ""}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
