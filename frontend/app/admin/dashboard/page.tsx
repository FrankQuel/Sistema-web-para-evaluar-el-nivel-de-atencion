'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, LogOut } from 'lucide-react'
import Link from 'next/link'

import DocentesTab from '@/app/admin/gestion/docente'
import EstudiantesTab from '@/app/admin/gestion/estudiante'
import CursosTab from '@/app/admin/gestion/curso'
import AsignacionesTab from '@/app/admin/gestion/asignaciones'

import type { Docente, Estudiante, Curso } from '@/app/types'
import {
  // DOCENTES
  listDocentes, createDocente, updateDocente, deleteDocente,
  // ESTUDIANTES
  listEstudiantes, createEstudiante, updateEstudiante, deleteEstudiante,
  // CURSOS
  listCursos, createCurso, updateCurso, deleteCurso,
  // ASIGNACIONES (clases/matrículas)
  listClases, createClase, createMatricula,
} from '@/app/lib/api'

// Tipos de payload para los Tabs
type DocenteCreate = Omit<Docente, 'id_dce' | 'id_us' | 'id_admin'> & {
  usuario_us: string
  contrasena_us: string
}
type EstudianteCreate = Omit<Estudiante, 'id_est' | 'id_us' | 'id_admin'> & {
  usuario_us: string
  contrasena_us: string
}
type CursoCreate = Omit<Curso, 'id_cur'>

export default function AdminPage() {
  const [username, setUsername] = useState<string | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('userData')
      if (raw) {
        const parsed = JSON.parse(raw)
        const u =
          parsed?.usuario ??
          parsed?.user?.usuario ?? // por si algún lugar guardó { user: { usuario } }
          null

        setUsername(u || '—')
      } else setUsername('admin')
    } catch {
      setUsername('admin')
    }
  }, [])

  // Estado principal
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [clases, setClases] = useState<{ id_cl: number; nombre_cl: string }[]>([])

  // ================= DOCENTES =================
  const listDocentesHandler = async () => {
    const data = await listDocentes()
    setDocentes(
      data.map((d: any) => ({
        id_dce: d.id_dce,
        ci_dce: d.ci ?? null,
        nombre_dce: d.nombre,
        apellido_dce: d.apellido,
        fechanac_dce: d.fechanac,
        sexo_dce: d.sexo,
        correo_dce: d.correo,
        telefono_dce: d.telefono ?? '',
        titulo_dce: d.titulo ?? '',
        id_us: d.id_us ?? null,
        id_admin: 1,
        usuario_us: d.usuario_us,
      }))
    )
  }

  const addDocente = async (p: DocenteCreate) => {
    const created = await createDocente({
      ci: p.ci_dce ?? null,
      nombre: p.nombre_dce,
      apellido: p.apellido_dce,
      fechanac: p.fechanac_dce,
      sexo: (p.sexo_dce || '').toLowerCase().slice(0, 1),
      correo: p.correo_dce,
      telefono: p.telefono_dce || null,
      titulo: p.titulo_dce || null,
      usuario: p.usuario_us,
      contrasena: p.contrasena_us,
    })
    setDocentes(prev => [
      ...prev,
      {
        id_dce: created.id_dce,
        ci_dce: created.ci ?? null,
        nombre_dce: created.nombre,
        apellido_dce: created.apellido,
        fechanac_dce: created.fechanac,
        sexo_dce: created.sexo,
        correo_dce: created.correo,
        telefono_dce: created.telefono ?? '',
        titulo_dce: created.titulo ?? '',
        id_us: created.id_us ?? null,
        id_admin: 1,
        usuario_us: created.usuario_us ?? p.usuario_us,
      } as Docente,
    ])
  }

  const updateDocenteHandler = async (id: number, p: Partial<Docente>) => {
    const updated = await updateDocente(id, {
      ci: p.ci_dce ?? null,
      nombre: p.nombre_dce,
      apellido: p.apellido_dce,
      fechanac: p.fechanac_dce,
      sexo: (p.sexo_dce || '').toLowerCase().slice(0, 1),
      correo: p.correo_dce,
      telefono: p.telefono_dce ?? null,
      titulo: p.titulo_dce ?? null,
    })
    setDocentes(prev => prev.map(d =>
      d.id_dce === id
        ? {
            ...d,
            ci_dce: updated.ci ?? null,
            nombre_dce: updated.nombre,
            apellido_dce: updated.apellido,
            fechanac_dce: updated.fechanac,
            sexo_dce: updated.sexo,
            correo_dce: updated.correo,
            telefono_dce: updated.telefono ?? '',
            titulo_dce: updated.titulo ?? '',
            usuario_us: updated.usuario_us ?? d.usuario_us,
          }
        : d
    ))
  }

  const deleteDocenteHandler = async (id: number) => {
    await deleteDocente(id)
    setDocentes(prev => prev.filter(d => d.id_dce !== id))
  }

  // ================= ESTUDIANTES =================
  const listEstudiantesHandler = async () => {
    const data = await listEstudiantes()
    setEstudiantes(
      data.map((e: any) => ({
        id_est: e.id_est,
        ci_est: e.ci ?? null,
        nombre_est: e.nombre,
        apellido_est: e.apellido,
        fechanac_est: e.fechanac,
        sexo_est: e.sexo,
        correo_est: e.correo,
        telefono_est: e.telefono ?? '',
        id_us: e.id_us ?? null,
        id_admin: 1,
        usuario_us: e.usuario_us ?? undefined,
      }))
    )
  }

  const addEstudiante = async (p: EstudianteCreate) => {
    await createEstudiante({
      ci: p.ci_est ?? null,
      nombre: p.nombre_est,
      apellido: p.apellido_est,
      fechanac: p.fechanac_est,
      sexo: (p.sexo_est || '').toLowerCase().slice(0, 1),
      correo: p.correo_est,
      telefono: p.telefono_est || null,
      usuario: p.usuario_us,
      contrasena: p.contrasena_us,
    })
  }

  const updateEstudianteHandler = async (id: number, p: Partial<Estudiante>) => {
    await updateEstudiante(id, {
      ci: p.ci_est ?? null,
      nombre: p.nombre_est,
      apellido: p.apellido_est,
      fechanac: p.fechanac_est,
      sexo: (p.sexo_est || '').toLowerCase().slice(0, 1),
      correo: p.correo_est,
      telefono: p.telefono_est ?? null,
    })
  }

  const deleteEstudianteHandler = async (id: number) => {
    await deleteEstudiante(id)
    setEstudiantes(prev => prev.filter(e => e.id_est !== id))
  }

  // ================= CURSOS =================
  const listCursosHandler = async () => {
    const data = await listCursos()
    setCursos(data as Curso[])
  }

  const addCurso = async (p: CursoCreate) => {
    await createCurso({ codigo_cur: p.codigo_cur, nombre_cur: p.nombre_cur })
  }

  const updateCursoHandler = async (id: number, p: Partial<Curso>) => {
    await updateCurso(id, { codigo_cur: p.codigo_cur, nombre_cur: p.nombre_cur })
  }

  const deleteCursoHandler = async (id: number) => {
    await deleteCurso(id)
    setCursos(prev => prev.filter(c => c.id_cur !== id))
  }

  // ================= CLASES / MATRÍCULAS =================
  const listClasesHandler = async () => {
    const data = await listClases()
    setClases(data.map((c: any) => ({ id_cl: c.id_cl, nombre_cl: c.nombre_cl })))
  }

  const crearClaseHandler = async (input: { nombre: string; id_cur: number; id_dce: number }) => {
    await createClase({ nombre_cl: input.nombre, id_cur: input.id_cur, id_dce: input.id_dce })
    await listClasesHandler()
  }

  const matricularHandler = async (input: { id_est: number; id_cl: number }) => {
    await createMatricula({ id_est: input.id_est, id_cl: input.id_cl })
    // puedes refrescar una lista de matrículas si la tuvieras
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header superior */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
              <p className="text-sm text-gray-600">
                Usuario: <span className="font-medium">{username ?? '...'}</span>
              </p>
            </div>
            <Link href="/">
              <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-50">
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Docentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{docentes.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{estudiantes.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{cursos.length}</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="docentes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="docentes">Docentes</TabsTrigger>
            <TabsTrigger value="estudiantes">Estudiantes</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="asignaciones">Asignaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="docentes">
            <DocentesTab
              docentes={docentes}
              onAdd={addDocente}
              onList={listDocentesHandler}
              onUpdate={updateDocenteHandler}
              onDelete={deleteDocenteHandler}
            />
          </TabsContent>

          <TabsContent value="estudiantes">
            <EstudiantesTab
              estudiantes={estudiantes}
              onAdd={addEstudiante}
              onList={listEstudiantesHandler}
              onUpdate={updateEstudianteHandler}
              onDelete={deleteEstudianteHandler}
            />
          </TabsContent>

          <TabsContent value="cursos">
            <CursosTab
              cursos={cursos}
              onAdd={addCurso}
              onList={listCursosHandler}
              onUpdate={updateCursoHandler}
              onDelete={deleteCursoHandler}
            />
          </TabsContent>

          <TabsContent value="asignaciones">
            <AsignacionesTab

            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
