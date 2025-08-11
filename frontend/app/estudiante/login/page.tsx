'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User, GraduationCap, Eye, EyeOff } from 'lucide-react'

export default function EstudianteLoginPage() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [login, setLogin] = useState({ usuario: '', contrasena: '' })
  const [open, setOpen] = useState(false)

  const [reg, setReg] = useState({
    ci: '', nombre: '', apellido: '', fechanac: '',
    sexo: '', correo: '', telefono: '', usuario: '', contrasena: ''
  })

  const handleLogin = async () => {
    if (!login.usuario || !login.contrasena) {
      alert('Completa todos los campos'); return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login/?role=estudiante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || 'Error al iniciar sesión'); return; }

      const normalized = {
        usuario: data.user?.usuario ?? login.usuario, // por si usas el endpoint o el mock
        role: data.role ?? 'admin',
        id_us: data.user?.id_us ?? null,
        profile_id: data.profile_id ?? null,
      }
      localStorage.setItem('userType', normalized.role); // 'admin'
      localStorage.setItem('userData', JSON.stringify(normalized));
      router.push('/estudiante/dashboard');
    } catch (e) {
      console.error(e);
      alert('Error de conexión con el backend');
    }
  };


  const handleRegister = async () => {
    const allOk = Object.values(reg).every(v => String(v).trim() !== '')
    if (!allOk) return alert('Completa todos los campos')
    try {
      const res = await fetch('http://127.0.0.1:8000/api/estudiantes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ci: reg.ci,
          nombre: reg.nombre,
          apellido: reg.apellido,
          fechanac: reg.fechanac,
          sexo: reg.sexo,
          correo: reg.correo,
          telefono: reg.telefono,
          usuario: reg.usuario,
          contrasena: reg.contrasena,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Error en el registro: ' + JSON.stringify(err))
        return
      }
      alert('Estudiante registrado correctamente')
      setOpen(false)
      router.push('/estudiante/login')
    } catch (e) {
      alert('Error de conexión con el backend')
      console.error(e)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
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
              <Label>Usuario</Label>
              <Input
                value={login.usuario}
                onChange={(e) => setLogin({ ...login, usuario: e.target.value })}
                placeholder="usuario"
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  value={login.contrasena}
                  onChange={(e) => setLogin({ ...login, contrasena: e.target.value })}
                  placeholder="contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShow(s => !s)}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleLogin}>
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">¿No tienes cuenta?</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Registrarse
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Cuenta de Estudiante</DialogTitle>
                  <DialogDescription>Completa tus datos para crear una nueva cuenta</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div>
                    <Label>Cédula</Label>
                    <Input value={reg.ci} onChange={e => setReg({ ...reg, ci: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nombre</Label>
                      <Input value={reg.nombre} onChange={e => setReg({ ...reg, nombre: e.target.value })} />
                    </div>
                    <div>
                      <Label>Apellido</Label>
                      <Input value={reg.apellido} onChange={e => setReg({ ...reg, apellido: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label>Fecha de nacimiento</Label>
                    <Input type="date" value={reg.fechanac} onChange={e => setReg({ ...reg, fechanac: e.target.value })} />
                  </div>

                  <div>
                    <Label>Sexo</Label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-2"
                      value={reg.sexo}
                      onChange={e => setReg({ ...reg, sexo: e.target.value })}
                    >
                      <option value="">Selecciona</option>
                      <option value="f">Femenino</option>
                      <option value="m">Masculino</option>
                    </select>
                  </div>

                  <div>
                    <Label>Correo</Label>
                    <Input type="email" value={reg.correo} onChange={e => setReg({ ...reg, correo: e.target.value })} />
                  </div>

                  <div>
                    <Label>Teléfono</Label>
                    <Input value={reg.telefono} onChange={e => setReg({ ...reg, telefono: e.target.value })} />
                  </div>

                  <div>
                    <Label>Usuario</Label>
                    <Input value={reg.usuario} onChange={e => setReg({ ...reg, usuario: e.target.value })} />
                  </div>

                  <div>
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={reg.contrasena}
                      onChange={e => setReg({ ...reg, contrasena: e.target.value })}
                    />
                  </div>

                  <Button className="w-full" onClick={handleRegister}>Crear Cuenta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
