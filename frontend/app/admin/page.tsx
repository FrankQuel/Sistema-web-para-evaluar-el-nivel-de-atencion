'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, GraduationCap, Plus, Edit, Trash2, LogOut, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState(null)

  // Estados para datos simulados
  const [docentes, setDocentes] = useState([
    { id: 1, nombre: 'Walter', apellido: 'Wilkerson', email: 'walter@gmail.com', usuario: 'wwilkerson', cursos: 1 },
  ])

  const [estudiantes, setEstudiantes] = useState([
    { id: 1, nombre: 'Franklin', apellido: 'Hallo', email: 'frank@gmail.com', usuario: 'frankh', cursos: 1 },
  ])

  const [cursos, setCursos] = useState([
    { id: 1, codigo: 'A003', nombre: 'Matemáticas Básicas', docente: 'Walter Wilkerson', estudiantes: 1 },
  ])

  // Estados para formularios
  const [newDocente, setNewDocente] = useState({
    nombre: '', apellido: '', email: '', usuario: '', contraseña: ''
  })
  const [newEstudiante, setNewEstudiante] = useState({
    nombre: '', apellido: '', email: '', usuario: '', contraseña: ''
  })
  const [newCurso, setNewCurso] = useState({
    nombre: '', descripcion: '', docenteId: ''
  })

  // Estados para diálogos
  const [showDocenteDialog, setShowDocenteDialog] = useState(false)
  const [showEstudianteDialog, setShowEstudianteDialog] = useState(false)
  const [showCursoDialog, setShowCursoDialog] = useState(false)

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')
    
    if (userType !== 'admin' || !storedUserData) {
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

  const handleAddDocente = () => {
    if (newDocente.nombre && newDocente.apellido && newDocente.email && newDocente.usuario && newDocente.contraseña) {
      const id = docentes.length + 1
      setDocentes([...docentes, { id, ...newDocente, cursos: 0 }])
      setNewDocente({ nombre: '', apellido: '', email: '', usuario: '', contraseña: '' })
      setShowDocenteDialog(false)
    }
  }

  const handleAddEstudiante = () => {
    if (newEstudiante.nombre && newEstudiante.apellido && newEstudiante.email && newEstudiante.usuario && newEstudiante.contraseña) {
      const id = estudiantes.length + 1
      setEstudiantes([...estudiantes, { id, ...newEstudiante, cursos: 0 }])
      setNewEstudiante({ nombre: '', apellido: '', email: '', usuario: '', contraseña: '' })
      setShowEstudianteDialog(false)
    }
  }

  const handleAddCurso = () => {
    if (newCurso.nombre && newCurso.descripcion && newCurso.docenteId) {
      const docente = docentes.find(d => d.id === parseInt(newCurso.docenteId))
      const id = cursos.length + 1
      setCursos([...cursos, { 
        id, 
        nombre: newCurso.nombre, 
        descripcion: newCurso.descripcion, 
        docente: `${docente?.nombre} ${docente?.apellido}`,
        estudiantes: 0
      }])
      setNewCurso({ nombre: '', descripcion: '', docenteId: '' })
      setShowCursoDialog(false)
    }
  }

  const handleDeleteDocente = (id) => {
    setDocentes(docentes.filter(d => d.id !== id))
  }

  const handleDeleteEstudiante = (id) => {
    setEstudiantes(estudiantes.filter(e => e.id !== id))
  }

  const handleDeleteCurso = (id) => {
    setCursos(cursos.filter(c => c.id !== id))
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
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Bienvenido, {userData.usuario}</p>
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
              <CardTitle className="text-sm font-medium">Total Docentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{docentes.length}</div>
              <p className="text-xs text-muted-foreground">Profesores activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estudiantes.length}</div>
              <p className="text-xs text-muted-foreground">Alumnos registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
              <p className="text-xs text-muted-foreground">Cursos disponibles</p>
            </CardContent>
          </Card>
          
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="docentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="docentes">Gestión de Docentes</TabsTrigger>
            <TabsTrigger value="estudiantes">Gestión de Estudiantes</TabsTrigger>
            <TabsTrigger value="cursos">Gestión de Cursos</TabsTrigger>
          </TabsList>

          {/* Gestión de Docentes */}
          <TabsContent value="docentes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Docentes</h2>
              <Dialog open={showDocenteDialog} onOpenChange={setShowDocenteDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar Docente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Docente</DialogTitle>
                    <DialogDescription>
                      Completa la información del nuevo docente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="docente-nombre">Nombre</Label>
                        <Input
                          id="docente-nombre"
                          value={newDocente.nombre}
                          onChange={(e) => setNewDocente({...newDocente, nombre: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docente-apellido">Apellido</Label>
                        <Input
                          id="docente-apellido"
                          value={newDocente.apellido}
                          onChange={(e) => setNewDocente({...newDocente, apellido: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docente-email">Email</Label>
                      <Input
                        id="docente-email"
                        type="email"
                        value={newDocente.email}
                        onChange={(e) => setNewDocente({...newDocente, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docente-usuario">Usuario</Label>
                      <Input
                        id="docente-usuario"
                        value={newDocente.usuario}
                        onChange={(e) => setNewDocente({...newDocente, usuario: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docente-password">Contraseña</Label>
                      <Input
                        id="docente-password"
                        type="password"
                        value={newDocente.contraseña}
                        onChange={(e) => setNewDocente({...newDocente, contraseña: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleAddDocente} className="w-full">
                      Agregar Docente
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Cursos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docentes.map((docente) => (
                    <TableRow key={docente.id}>
                      <TableCell>{docente.id}</TableCell>
                      <TableCell className="font-medium">
                        {docente.nombre} {docente.apellido}
                      </TableCell>
                      <TableCell>{docente.email}</TableCell>
                      <TableCell>{docente.usuario}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{docente.cursos} cursos</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteDocente(docente.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Gestión de Estudiantes */}
          <TabsContent value="estudiantes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Estudiantes</h2>
              <Dialog open={showEstudianteDialog} onOpenChange={setShowEstudianteDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar Estudiante
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
                    <DialogDescription>
                      Completa la información del nuevo estudiante
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estudiante-nombre">Nombre</Label>
                        <Input
                          id="estudiante-nombre"
                          value={newEstudiante.nombre}
                          onChange={(e) => setNewEstudiante({...newEstudiante, nombre: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estudiante-apellido">Apellido</Label>
                        <Input
                          id="estudiante-apellido"
                          value={newEstudiante.apellido}
                          onChange={(e) => setNewEstudiante({...newEstudiante, apellido: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estudiante-email">Email</Label>
                      <Input
                        id="estudiante-email"
                        type="email"
                        value={newEstudiante.email}
                        onChange={(e) => setNewEstudiante({...newEstudiante, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estudiante-usuario">Usuario</Label>
                      <Input
                        id="estudiante-usuario"
                        value={newEstudiante.usuario}
                        onChange={(e) => setNewEstudiante({...newEstudiante, usuario: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estudiante-password">Contraseña</Label>
                      <Input
                        id="estudiante-password"
                        type="password"
                        value={newEstudiante.contraseña}
                        onChange={(e) => setNewEstudiante({...newEstudiante, contraseña: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleAddEstudiante} className="w-full">
                      Agregar Estudiante
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Cursos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.map((estudiante) => (
                    <TableRow key={estudiante.id}>
                      <TableCell>{estudiante.id}</TableCell>
                      <TableCell className="font-medium">
                        {estudiante.nombre} {estudiante.apellido}
                      </TableCell>
                      <TableCell>{estudiante.email}</TableCell>
                      <TableCell>{estudiante.usuario}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{estudiante.cursos} cursos</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteEstudiante(estudiante.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Gestión de Cursos */}
          <TabsContent value="cursos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cursos</h2>
              <Dialog open={showCursoDialog} onOpenChange={setShowCursoDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar Curso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Curso</DialogTitle>
                    <DialogDescription>
                      Completa la información del nuevo curso
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="curso-nombre">Nombre del Curso</Label>
                      <Input
                        id="curso-nombre"
                        value={newCurso.nombre}
                        onChange={(e) => setNewCurso({...newCurso, nombre: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="curso-docente">Docente</Label>
                      <select
                        id="curso-docente"
                        className="w-full p-2 border rounded-md"
                        value={newCurso.docenteId}
                        onChange={(e) => setNewCurso({...newCurso, docenteId: e.target.value})}
                      >
                        <option value="">Seleccionar docente</option>
                        {docentes.map((docente) => (
                          <option key={docente.id} value={docente.id}>
                            {docente.nombre} {docente.apellido}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleAddCurso} className="w-full">
                      Agregar Curso
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell>{curso.id}</TableCell>
                      <TableCell className="font-medium">{curso.nombre}</TableCell>
                      <TableCell>{curso.codigo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{curso.docente}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{curso.estudiantes} estudiantes</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCurso(curso.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
