'use client'

import type { Docente } from '@/app/types'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2 } from 'lucide-react'

type Props = {
  docentes: Docente[]
  onAdd: (
    payload: Omit<Docente, 'id_dce' | 'id_us' | 'id_admin'> & { usuario_us: string; contrasena_us: string }
  ) => Promise<void>
  onList: () => Promise<void>
  onUpdate: (id: number, p: Partial<Docente>) => Promise<void>
  onDelete: (id_dce: number) => Promise<void>
}

type CreateDocentePayload =
  Omit<Docente, 'id_dce' | 'id_us' | 'id_admin'> & {
    usuario_us: string
    contrasena_us: string
  }

export default function DocentesTab({ docentes, onAdd, onList, onUpdate, onDelete }: Props) {
  const [openCreate, setOpenCreate] = useState(false)
  const [saving, setSaving] = useState(false)

  // Crear
  const [form, setForm] = useState<{
    ci_dce: number | null
    nombre_dce: string
    apellido_dce: string
    fechanac_dce: string
    sexo_dce: string
    correo_dce: string
    telefono_dce: string
    titulo_dce: string
    usuario_us: string
    contrasena_us: string
  }>({
    ci_dce: null,
    nombre_dce: '',
    apellido_dce: '',
    fechanac_dce: '',
    sexo_dce: '',
    correo_dce: '',
    telefono_dce: '',
    titulo_dce: '',
    usuario_us: '',
    contrasena_us: '',
  })

  // Editar
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<Docente | null>(null)

  const toIntOrNull = (v: string) => (v === '' ? null : parseInt(v, 10))

  const handleCreate = async () => {
    if (saving) return
    try {
      setSaving(true)
      const payload: CreateDocentePayload = {
        ci_dce: toIntOrNull(String(form.ci_dce ?? '')) as any,
        nombre_dce: form.nombre_dce,
        apellido_dce: form.apellido_dce,
        fechanac_dce: form.fechanac_dce,
        sexo_dce: (form.sexo_dce || '').toLowerCase().slice(0, 1),
        correo_dce: form.correo_dce,
        telefono_dce: form.telefono_dce,
        titulo_dce: form.titulo_dce,
        usuario_us: form.usuario_us,
        contrasena_us: form.contrasena_us,
      }
      await onAdd(payload)
      // reset
      setForm({
        ci_dce: null, nombre_dce: '', apellido_dce: '', fechanac_dce: '',
        sexo_dce: '', correo_dce: '', telefono_dce: '', titulo_dce: '',
        usuario_us: '', contrasena_us: '',
      })
      setOpenCreate(false)
    } catch (e: any) {
      console.error('Error creando docente', e)
      alert(`Error al crear docente: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (d: Docente) => {
    setEditing(d)
    setOpenEdit(true)
  }

  const handleUpdate = async () => {
    if (!editing) return
    try {
      setSaving(true)
      await onUpdate(editing.id_dce, editing)
      setOpenEdit(false)
    } catch (e: any) {
      console.error('Error actualizando docente', e)
      alert(`Error al actualizar: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este docente?')) return
    try {
      await onDelete(id)
    } catch (e: any) {
      console.error('Error eliminando docente', e)
      alert(`Error al eliminar: ${e?.message || e}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Docentes</h2>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onList}>Listar</Button>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button type="button" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />Agregar Docente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar nuevo docente</DialogTitle>
                <DialogDescription>Completa la información del docente</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cédula</Label>
                  <Input
                    value={form.ci_dce ?? ''}
                    onChange={(e) => setForm({ ...form, ci_dce: toIntOrNull(e.target.value) })}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={form.nombre_dce} onChange={(e) => setForm({ ...form, nombre_dce: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Apellido</Label>
                  <Input value={form.apellido_dce} onChange={(e) => setForm({ ...form, apellido_dce: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de nacimiento</Label>
                  <Input type="date" value={form.fechanac_dce} onChange={(e) => setForm({ ...form, fechanac_dce: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sexo (m/f)</Label>
                  <Input
                    maxLength={1}
                    value={form.sexo_dce}
                    onChange={(e) => setForm({ ...form, sexo_dce: e.target.value.toLowerCase().slice(0, 1) })}
                    placeholder="m/f"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input type="email" value={form.correo_dce} onChange={(e) => setForm({ ...form, correo_dce: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={form.telefono_dce} onChange={(e) => setForm({ ...form, telefono_dce: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Título profesional</Label>
                  <Input value={form.titulo_dce} onChange={(e) => setForm({ ...form, titulo_dce: e.target.value })} />
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

              <Button type="button" disabled={saving} onClick={handleCreate} className="w-full mt-4">
                {saving ? 'Guardando...' : 'Agregar Docente'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado de docentes</CardTitle></CardHeader>
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
                <TableHead>Título</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docentes.map((d) => (
                <TableRow key={d.id_dce}>
                  <TableCell>{d.id_dce}</TableCell>
                  <TableCell>{d.ci_dce}</TableCell>
                  <TableCell>{d.nombre_dce}</TableCell>
                  <TableCell>{d.apellido_dce}</TableCell>
                  <TableCell>{d.correo_dce}</TableCell>
                  <TableCell>{d.telefono_dce}</TableCell>
                  <TableCell>{d.titulo_dce}</TableCell>
                  <TableCell>{(d as any).usuario_us ?? '-'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(d)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(d.id_dce)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar docente</DialogTitle>
            <DialogDescription>Actualiza la información del docente</DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cédula</Label>
                <Input
                  value={editing.ci_dce ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, ci_dce: e.target.value === '' ? null : parseInt(e.target.value, 10) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editing.nombre_dce} onChange={(e) => setEditing({ ...editing, nombre_dce: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={editing.apellido_dce} onChange={(e) => setEditing({ ...editing, apellido_dce: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha nac.</Label>
                <Input type="date" value={editing.fechanac_dce} onChange={(e) => setEditing({ ...editing, fechanac_dce: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sexo (m/f)</Label>
                <Input
                  maxLength={1}
                  value={editing.sexo_dce}
                  onChange={(e) => setEditing({ ...editing, sexo_dce: e.target.value.toLowerCase().slice(0, 1) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input type="email" value={editing.correo_dce} onChange={(e) => setEditing({ ...editing, correo_dce: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={editing.telefono_dce ?? ''} onChange={(e) => setEditing({ ...editing, telefono_dce: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Título</Label>
                <Input value={editing.titulo_dce ?? ''} onChange={(e) => setEditing({ ...editing, titulo_dce: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Usuario</Label>
                <Input value={(editing as any).usuario_us ?? ''} disabled />
              </div>
            </div>
          )}

          <Button type="button" disabled={saving} onClick={handleUpdate} className="w-full mt-4">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
