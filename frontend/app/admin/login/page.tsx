'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ usuario: '', contrasena: '' })

  const handleLogin = () => {
    if (!form.usuario || !form.contrasena) return alert('Completa todos los campos')
    localStorage.setItem('userType', 'admin')
    localStorage.setItem('userData', JSON.stringify({ usuario: form.usuario, tipo: 'admin' }))
    router.push('/admin/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-2">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle>Acceso Administrador</CardTitle>
          <CardDescription>Ingresa con tus credenciales de administrador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Input
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              placeholder="usuario"
            />
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
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
          <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleLogin}>
            Iniciar sesión
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
