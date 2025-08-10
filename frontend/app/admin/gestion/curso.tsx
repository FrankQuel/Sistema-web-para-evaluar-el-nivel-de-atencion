'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Curso } from '@/app/types'

type Props = {
  cursos: Curso[]
  onAdd: (payload: Omit<Curso, 'id_cur'>) => Promise<void>
  onList: () => Promise<void>
  onUpdate: (id: number, p: Partial<Curso>) => Promise<void>
  onDelete: (id_cur: number) => void
}

export default function CursosTab({ cursos, onAdd, onList, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Omit<Curso, 'id_cur'>>({
    codigo_cur: '',
    nombre_cur: '',
  })

  // edición
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Curso>>({})

  const handleSubmit = async () => {
    if (saving) return
    try {
      setSaving(true)
      await onAdd({
        codigo_cur: form.codigo_cur.slice(0, 15),
        nombre_cur: form.nombre_cur.slice(0, 30),
      })
      setForm({ codigo_cur: '', nombre_cur: '' })
      setOpen(false)
    } catch (e: any) {
      console.error('Error creando curso', e)
      alert(`Error al crear curso: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (c: Curso) => {
    setEditId(c.id_cur)
    setEditForm({
      codigo_cur: c.codigo_cur,
      nombre_cur: c.nombre_cur,
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (editId == null) return
    try {
      await onUpdate(editId, {
        codigo_cur: editForm.codigo_cur,
        nombre_cur: editForm.nombre_cur,
      })
      setEditOpen(false)
    } catch (e: any) {
      alert(`Error actualizando: ${e?.message || e}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cursos</h2>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onList}>Listar</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />Agregar Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar nuevo curso</DialogTitle>
                <DialogDescription>Completa la información del curso</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Código (máx 15)</Label>
                  <Input value={form.codigo_cur} onChange={(e) => setForm({ ...form, codigo_cur: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nombre del curso (máx 30)</Label>
                  <Input value={form.nombre_cur} onChange={(e) => setForm({ ...form, nombre_cur: e.target.value })} />
                </div>
                <Button type="button" disabled={saving} onClick={handleSubmit} className="w-full">
                  {saving ? 'Guardando...' : 'Agregar Curso'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado de cursos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre del curso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cursos.map((c) => (
                <TableRow key={c.id_cur}>
                  <TableCell>{c.id_cur}</TableCell>
                  <TableCell><Badge variant="secondary">{c.codigo_cur}</Badge></TableCell>
                  <TableCell>{c.nombre_cur}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(c.id_cur)}><Trash2 className="w-4 h-4" /></Button>
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
            <DialogTitle>Editar curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={editForm.codigo_cur ?? ''}
                onChange={(e) => setEditForm({ ...editForm, codigo_cur: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={editForm.nombre_cur ?? ''}
                onChange={(e) => setEditForm({ ...editForm, nombre_cur: e.target.value })}
              />
            </div>
            <Button onClick={saveEdit} className="w-full mt-2">Guardar cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
