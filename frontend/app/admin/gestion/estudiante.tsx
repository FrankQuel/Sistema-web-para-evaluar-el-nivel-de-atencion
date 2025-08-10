'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Estudiante } from '@/app/types'

type Props = {
  estudiantes: Estudiante[]
  onAdd: (
    payload: Omit<Estudiante, 'id_est' | 'id_us' | 'id_admin'> & {
      usuario_us: string
      contrasena_us: string
    }
  ) => Promise<void>
  onList: () => Promise<void>
  onUpdate: (id: number, p: Partial<Estudiante>) => Promise<void>
  onDelete: (id_est: number) => void
}

export default function EstudiantesTab({ estudiantes, onAdd, onList, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<{
    ci_est: number | null
    nombre_est: string
    apellido_est: string
    fechanac_est: string
    sexo_est: string
    correo_est: string
    telefono_est: string
    usuario_us: string
    contrasena_us: string
  }>({
    ci_est: null,
    nombre_est: '',
    apellido_est: '',
    fechanac_est: '',
    sexo_est: '',
    correo_est: '',
    telefono_est: '',
    usuario_us: '',
    contrasena_us: '',
  })

  // edición
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Estudiante>>({})

  const toIntOrNull = (v: string) => (v === '' ? null : parseInt(v, 10))

  const handleSubmit = async () => {
    if (saving) return
    try {
      setSaving(true)
      await onAdd({
        ci_est: toIntOrNull(String(form.ci_est ?? '')) as any,
        nombre_est: form.nombre_est,
        apellido_est: form.apellido_est,
        fechanac_est: form.fechanac_est,
        sexo_est: (form.sexo_est || '').toLowerCase().slice(0, 1),
        correo_est: form.correo_est,
        telefono_est: form.telefono_est,
        usuario_us: form.usuario_us,
        contrasena_us: form.contrasena_us,
      })
      setForm({
        ci_est: null, nombre_est: '', apellido_est: '', fechanac_est: '',
        sexo_est: '', correo_est: '', telefono_est: '', usuario_us: '', contrasena_us: '',
      })
      setOpen(false)
    } catch (e: any) {
      console.error('Error creando estudiante', e)
      alert(`Error al crear estudiante: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (e: Estudiante) => {
    setEditId(e.id_est)
    setEditForm({
      ci_est: e.ci_est,
      nombre_est: e.nombre_est,
      apellido_est: e.apellido_est,
      fechanac_est: e.fechanac_est,
      sexo_est: e.sexo_est,
      correo_est: e.correo_est,
      telefono_est: e.telefono_est,
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (editId == null) return
    try {
      await onUpdate(editId, editForm)
      setEditOpen(false)
    } catch (e: any) {
      alert(`Error actualizando: ${e?.message || e}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Estudiantes</h2>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onList}>Listar</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />Agregar Estudiante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar nuevo estudiante</DialogTitle>
                <DialogDescription>Completa la información del estudiante</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cédula</Label>
                  <Input
                    value={form.ci_est ?? ''}
                    onChange={(e) => setForm({ ...form, ci_est: toIntOrNull(e.target.value) })}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={form.nombre_est} onChange={(e) => setForm({ ...form, nombre_est: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Apellido</Label>
                  <Input value={form.apellido_est} onChange={(e) => setForm({ ...form, apellido_est: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de nacimiento</Label>
                  <Input type="date" value={form.fechanac_est} onChange={(e) => setForm({ ...form, fechanac_est: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sexo (m/f)</Label>
                  <Input
                    maxLength={1}
                    value={form.sexo_est}
                    onChange={(e) => setForm({ ...form, sexo_est: e.target.value.toLowerCase().slice(0,1) })}
                    placeholder="m/f"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input type="email" value={form.correo_est} onChange={(e) => setForm({ ...form, correo_est: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={form.telefono_est} onChange={(e) => setForm({ ...form, telefono_est: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <Input value={form.usuario_us} onChange={(e) => setForm({ ...form, usuario_us: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <Input type="password" value={form.contrasena_us} onChange={(e) => setForm({ ...form, contrasena_us: e.target.value })} />
                </div>
              </div>

              <Button type="button" disabled={saving} onClick={handleSubmit} className="w-full mt-4">
                {saving ? 'Guardando...' : 'Agregar Estudiante'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado de estudiantes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantes.map((e) => (
                <TableRow key={e.id_est}>
                  <TableCell>{e.id_est}</TableCell>
                  <TableCell>{e.ci_est}</TableCell>
                  <TableCell>{e.nombre_est}</TableCell>
                  <TableCell>{e.apellido_est}</TableCell>
                  <TableCell>{e.correo_est}</TableCell>
                  <TableCell>{e.telefono_est}</TableCell>
                  <TableCell>{e.usuario_us ?? '-'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(e)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(e.id_est)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar estudiante</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cédula</Label>
              <Input
                value={editForm.ci_est ?? ''}
                onChange={(e) => setEditForm({ ...editForm, ci_est: toIntOrNull(e.target.value || '') as any })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editForm.nombre_est ?? ''}
                onChange={(e) => setEditForm({ ...editForm, nombre_est: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                value={editForm.apellido_est ?? ''}
                onChange={(e) => setEditForm({ ...editForm, apellido_est: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Input
                type="date"
                value={editForm.fechanac_est ?? ''}
                onChange={(e) => setEditForm({ ...editForm, fechanac_est: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sexo (m/f)</Label>
              <Input
                maxLength={1}
                value={editForm.sexo_est ?? ''}
                onChange={(e) => setEditForm({ ...editForm, sexo_est: e.target.value.toLowerCase().slice(0,1) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input
                type="email"
                value={editForm.correo_est ?? ''}
                onChange={(e) => setEditForm({ ...editForm, correo_est: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={editForm.telefono_est ?? ''}
                onChange={(e) => setEditForm({ ...editForm, telefono_est: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={saveEdit} className="w-full mt-4">Guardar cambios</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
