'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  listCursos, listDocentes, listEstudiantes, listClases,
  createClase, createMatricula,
} from '@/app/lib/api'

type Option = { id: number; label: string }

export default function AsignacionesTab() {
  // catálogos
  const [cursos, setCursos] = useState<Option[]>([])
  const [docentes, setDocentes] = useState<Option[]>([])
  const [estudiantes, setEstudiantes] = useState<Option[]>([])
  const [loadingOpts, setLoadingOpts] = useState(false)

  // filtros y clases
  const [cursoSel, setCursoSel] = useState<string>('')
  const [docenteSel, setDocenteSel] = useState<string>('')
  const [clases, setClases] = useState<Option[]>([])

  // crear clase
  const [nombreClase, setNombreClase] = useState('')
  const [savingClase, setSavingClase] = useState(false)
  const crearClaseDisabled = useMemo(
    () => savingClase || !nombreClase.trim() || !cursoSel || !docenteSel,
    [savingClase, nombreClase, cursoSel, docenteSel]
  )

  // matrícula
  const [estSel, setEstSel] = useState<string>('')
  const [claseSel, setClaseSel] = useState<string>('')
  const [savingMat, setSavingMat] = useState(false)
  const matricularDisabled = useMemo(
    () => savingMat || !estSel || !claseSel,
    [savingMat, estSel, claseSel]
  )

  // cargar catálogos
  useEffect(() => {
    (async () => {
      setLoadingOpts(true)
      try {
        const [cursosBD, docentesBD, estudiantesBD] = await Promise.all([
          listCursos(),
          listDocentes(),
          listEstudiantes(),
        ])
        setCursos((cursosBD as any[]).map(c => ({ id: c.id_cur, label: c.nombre_cur })))
        setDocentes((docentesBD as any[]).map(d => ({ id: d.id_dce, label: `${d.nombre} ${d.apellido}` })))
        setEstudiantes((estudiantesBD as any[]).map(e => ({ id: e.id_est, label: `${e.nombre} ${e.apellido}` })))
      } finally {
        setLoadingOpts(false)
      }
    })()
  }, [])

  // cargar clases (si hay filtros -> filtra; si no, trae TODAS)
  useEffect(() => {
    (async () => {
      try {
        let data: any[]
        if (!cursoSel && !docenteSel) {
          // SIN filtros: todas las clases (para que el Select de matrícula tenga datos)
          data = await listClases()
        } else {
          // CON filtros: las clases que coinciden con curso/docente
          data = await listClases({
            id_cur: cursoSel ? Number(cursoSel) : undefined,
            id_dce: docenteSel ? Number(docenteSel) : undefined,
          })
        }
        setClases(data.map(c => ({ id: c.id_cl, label: c.nombre_cl })))
      } catch {
        setClases([])
      }
    })()
  }, [cursoSel, docenteSel])

  const handleCrearClase = async () => {
    if (crearClaseDisabled) return
    try {
      setSavingClase(true)
      await createClase({
        nombre_cl: nombreClase.trim(),
        id_cur: Number(cursoSel),
        id_dce: Number(docenteSel),
      })
      // refrescar según filtros actuales (o todas si no hay filtros)
      const data = await listClases({
        id_cur: cursoSel ? Number(cursoSel) : undefined,
        id_dce: docenteSel ? Number(docenteSel) : undefined,
      } as any)
      setClases((data as any[]).map(c => ({ id: c.id_cl, label: c.nombre_cl })))
      setNombreClase('')
    } finally {
      setSavingClase(false)
    }
  }

  const handleMatricular = async () => {
    if (matricularDisabled) return
    try {
      setSavingMat(true)
      await createMatricula({ id_est: Number(estSel), id_cl: Number(claseSel) })
      // opcional: limpiar selects
      // setEstSel(''); setClaseSel('');
    } finally {
      setSavingMat(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Crear Clase */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Asignar Docente a Curso (crear clase)</CardTitle>
          <Button onClick={handleCrearClase} disabled={crearClaseDisabled}>
            {savingClase ? 'Creando...' : 'Crear Clase'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la clase</Label>
            <Input
              placeholder="Ej. Álgebra I - Grupo A"
              value={nombreClase}
              onChange={(e) => setNombreClase(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={cursoSel} onValueChange={setCursoSel} disabled={loadingOpts}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {cursos.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Docente</Label>
              <Select value={docenteSel} onValueChange={setDocenteSel} disabled={loadingOpts}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {docentes.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(cursoSel || docenteSel) && (
            <div className="pt-2">
              <Label className="block mb-2">Clases existentes (según filtros)</Label>
              {clases.length === 0
                ? <div className="text-sm text-muted-foreground">No hay clases para el filtro seleccionado.</div>
                : <ul className="list-disc pl-5 space-y-1">{clases.map(c => <li key={c.id}>{c.label}</li>)}</ul>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matricular */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Asignar Estudiante a Clase (matrícula)</CardTitle>
          <Button onClick={handleMatricular} disabled={matricularDisabled}>
            {savingMat ? 'Matriculando...' : 'Matricular'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estudiante</Label>
              <Select value={estSel} onValueChange={setEstSel} disabled={loadingOpts}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {estudiantes.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Clase</Label>
              <Select value={claseSel} onValueChange={setClaseSel} disabled={clases.length === 0}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {clases.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
