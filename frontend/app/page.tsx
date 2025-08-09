'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Shield, BookOpen, GraduationCap, User, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  
  // Estados para formularios
  const [adminLogin, setAdminLogin] = useState({ usuario: '', contraseña: '' })
  const [docenteLogin, setDocenteLogin] = useState({ usuario: '', contraseña: '' })
  const [estudianteLogin, setEstudianteLogin] = useState({ usuario: '', contraseña: '' })
  const [estudianteRegister, setEstudianteRegister] = useState({
  ci: '',
  nombre: '',
  apellido: '',
  fechanac: '',
  sexo: '',
  correo: '',
  telefono: '',
  usuario: '',
  contraseña: ''
})

  // Funciones de login simuladas
  const handleAdminLogin = () => {
    if (adminLogin.usuario && adminLogin.contraseña) {
      localStorage.setItem('userType', 'admin')
      localStorage.setItem('userData', JSON.stringify({ usuario: adminLogin.usuario, tipo: 'admin' }))
      router.push('/admin')
    } else {
      alert('Por favor completa todos los campos')
    }
  }

  const handleDocenteLogin = () => {
    if (docenteLogin.usuario && docenteLogin.contraseña) {
      localStorage.setItem('userType', 'docente')
      localStorage.setItem('userData', JSON.stringify({ usuario: docenteLogin.usuario, tipo: 'docente' }))
      router.push('/docente')
    } else {
      alert('Por favor completa todos los campos')
    }
  }

  const handleEstudianteLogin = () => {
    if (estudianteLogin.usuario && estudianteLogin.contraseña) {
      localStorage.setItem('userType', 'estudiante')
      localStorage.setItem('userData', JSON.stringify({ usuario: estudianteLogin.usuario, tipo: 'estudiante' }))
      router.push('/estudiante')
    } else {
      alert('Por favor completa todos los campos')
    }
  }

  const handleEstudianteRegister = async () => {
  const {
    ci, nombre, apellido, fechanac,
    sexo, correo, telefono, usuario, contraseña
  } = estudianteRegister;

  if (ci && nombre && apellido && fechanac && sexo && correo && telefono && usuario && contraseña) {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/registro-estudiante/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ci,
          nombre,
          apellido,
          fechanac,
          sexo,
          correo,
          telefono,
          usuario,
          contrasena: contraseña
        })
      });

      if (res.ok) {
        alert("Estudiante registrado correctamente");
        setShowRegisterDialog(false);
        router.push('/estudiante');
      } else {
        const err = await res.json();
        alert("Error en el registro: " + JSON.stringify(err));
      }
    } catch (error) {
      alert("Error de conexión con el backend.");
      console.error(error);
    }
  } else {
    alert('Por favor completa todos los campos');
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema Web</h1>
          <p className="text-gray-600 text-lg">Evaluacion de nivel de atencion</p>
        </div>

        {/* Tabs de Login */}
        <Tabs defaultValue="estudiante" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-12">
            <TabsTrigger value="admin" className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              Administrador
            </TabsTrigger>
            <TabsTrigger value="docente" className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4" />
              Docente
            </TabsTrigger>
            <TabsTrigger value="estudiante" className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4" />
              Estudiante
            </TabsTrigger>
          </TabsList>

          {/* Login Administrador */}
          <TabsContent value="admin">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-2">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Acceso Administrador</CardTitle>
                <CardDescription>Ingresa con tus credenciales de administrador</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-usuario">Usuario</Label>
                  <Input
                    id="admin-usuario"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={adminLogin.usuario}
                    onChange={(e) => setAdminLogin({...adminLogin, usuario: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={adminLogin.contraseña}
                      onChange={(e) => setAdminLogin({...adminLogin, contraseña: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleAdminLogin}>
                  Iniciar Sesión
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login Docente */}
          <TabsContent value="docente">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Acceso Docente</CardTitle>
                <CardDescription>Ingresa con tus credenciales de docente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="docente-usuario">Usuario</Label>
                  <Input
                    id="docente-usuario"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={docenteLogin.usuario}
                    onChange={(e) => setDocenteLogin({...docenteLogin, usuario: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docente-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="docente-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={docenteLogin.contraseña}
                      onChange={(e) => setDocenteLogin({...docenteLogin, contraseña: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleDocenteLogin}>
                  Iniciar Sesión
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Login/Registro Estudiante */}
          <TabsContent value="estudiante">
            <div className="max-w-md mx-auto space-y-4">
              {/* Login Estudiante */}
              <Card>
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle>Iniciar Sesión</CardTitle>
                  <CardDescription>¿Ya tienes cuenta? Ingresa aquí</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="estudiante-usuario">Usuario</Label>
                    <Input
                      id="estudiante-usuario"
                      type="text"
                      placeholder="Ingresa tu usuario"
                      value={estudianteLogin.usuario}
                      onChange={(e) => setEstudianteLogin({...estudianteLogin, usuario: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estudiante-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="estudiante-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresa tu contraseña"
                        value={estudianteLogin.contraseña}
                        onChange={(e) => setEstudianteLogin({...estudianteLogin, contraseña: e.target.value})}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleEstudianteLogin}>
                    Iniciar Sesión
                  </Button>
                </CardContent>
              </Card>

              {/* Botón de Registro */}
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600 mb-4">¿No tienes cuenta?</p>
                  <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Registrarse
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Crear Cuenta de Estudiante</DialogTitle>
                        <DialogDescription>
                          Completa tus datos para crear una nueva cuenta
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-ci">Cédula</Label>
                          <Input
                            id="reg-ci"
                            type="text"
                            placeholder="Número de cédula"
                            value={estudianteRegister.ci}
                            onChange={(e) => setEstudianteRegister({ ...estudianteRegister, ci: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="reg-nombre">Nombre</Label>
                            <Input
                              id="reg-nombre"
                              placeholder="Tu nombre"
                              value={estudianteRegister.nombre}
                              onChange={(e) => setEstudianteRegister({ ...estudianteRegister, nombre: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-apellido">Apellido</Label>
                              <Input
                                id="reg-apellido"
                                placeholder="Tu apellido"
                                value={estudianteRegister.apellido}
                                onChange={(e) => setEstudianteRegister({ ...estudianteRegister, apellido: e.target.value })}
                              />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-fechanac">Fecha de nacimiento</Label>
                          <Input
                            id="reg-fechanac"
                            type="date"
                            value={estudianteRegister.fechanac}
                            onChange={(e) => setEstudianteRegister({ ...estudianteRegister, fechanac: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-sexo">Sexo</Label>
                          <select
                            id="reg-sexo"
                            className="w-full border border-gray-300 rounded-md p-2"
                            value={estudianteRegister.sexo}
                            onChange={(e) => setEstudianteRegister({ ...estudianteRegister, sexo: e.target.value })}
                          >
                            <option value="">Selecciona</option>
                            <option value="f">Femenino</option>
                            <option value="m">Masculino</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-correo">Correo</Label>
                          <Input
                            id="reg-correo"
                            type="email"
                            placeholder="Correo electrónico"
                            value={estudianteRegister.correo}
                            onChange={(e) => setEstudianteRegister({ ...estudianteRegister, correo: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-telefono">Teléfono</Label>
                          <Input
                            id="reg-telefono"
                            type="text"
                            placeholder="Número de teléfono"
                            value={estudianteRegister.telefono}
                            onChange={(e) => setEstudianteRegister({ ...estudianteRegister, telefono: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-usuario">Usuario</Label>
                          <Input
                            id="reg-usuario"
                            placeholder="Elige un usuario"
                            value={estudianteRegister.usuario}
                            onChange={(e) => setEstudianteRegister({ ...estudianteRegister, usuario: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-contraseña">Contraseña</Label>
                          <Input
                            id="reg-contraseña"
                            type="password"
                            placeholder="Crea una contraseña"
                            value={estudianteRegister.contraseña}
                            onChange={(e) => setEstudianteRegister({ ...estudianteRegister, contraseña: e.target.value })}
                          />
                        </div>

                        <Button className="w-full" onClick={handleEstudianteRegister}>
                          Crear Cuenta
                        </Button>
                        </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
