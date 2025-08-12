// app/lib/api.ts

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000'
const API = `${BASE}/api`

/* ===== Utilidades ===== */
async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = undefined;
  if (text) {
    try { data = JSON.parse(text); }
    catch {
      // No era JSON (probable HTML). Lanza error con el texto plano.
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
      // si fuera 200 con HTML (raro), igual devolvemos el texto
      return text as any as T;
    }
  }
  if (!res.ok) {
    throw new Error(typeof data === 'string' ? data : JSON.stringify(data || { status: res.status }));
  }
  return data as T;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  return safeJson<T>(res)
}

/* ==================== DOCENTES ==================== */
export async function listDocentes() {
  return jsonFetch<any[]>(`${BASE}/api/docentes/`, { cache: 'no-store' as any })
}

export async function createDocente(payload: {
  ci: number | null
  nombre: string
  apellido: string
  fechanac: string
  sexo: string
  correo: string
  telefono: string | null
  titulo: string | null
  usuario: string
  contrasena: string
}) {
  return jsonFetch<any>(`${BASE}/api/docentes/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateDocente(
  id: number,
  patch: Partial<{
    ci: number | null
    nombre: string
    apellido: string
    fechanac: string
    sexo: string
    correo: string
    telefono: string | null
    titulo: string | null
    usuario: string
    contrasena: string
  }>
) {
  return jsonFetch<any>(`${BASE}/api/docentes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteDocente(id: number) {
  const res = await fetch(`${BASE}/api/docentes/${id}/`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
  return true
}

/* ==================== ESTUDIANTES ==================== */

export const listEstudiantes = () =>
  jsonFetch<any[]>(`${BASE}/api/estudiantes/`, { cache: 'no-store' as any })

export const createEstudiante = (p: {
  ci: number | null
  nombre: string
  apellido: string
  fechanac: string
  sexo: string
  correo: string
  telefono: string | null
  usuario: string
  contrasena: string
}) =>
  jsonFetch<any>(`${BASE}/api/estudiantes/`, {
    method: 'POST',
    body: JSON.stringify(p),
  })

export const updateEstudiante = (
  id: number,
  p: Partial<{
    ci: number | null
    nombre: string
    apellido: string
    fechanac: string
    sexo: string
    correo: string
    telefono: string | null
  }>
) =>
  jsonFetch<any>(`${BASE}/api/estudiantes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(p),
  })

export const deleteEstudiante = (id: number) =>
  jsonFetch<any>(`${BASE}/api/estudiantes/${id}/`, { method: 'DELETE' })

/* ==================== CURSOS ==================== */

export const listCursos = () =>
  jsonFetch<any[]>(`${BASE}/api/cursos/`, { cache: 'no-store' as any })

export const createCurso = (p: { codigo_cur: string; nombre_cur: string }) =>
  jsonFetch<any>(`${BASE}/api/cursos/`, { method: 'POST', body: JSON.stringify(p) })

export const updateCurso = (
  id: number,
  p: Partial<{ codigo_cur: string; nombre_cur: string }>
) =>
  jsonFetch<any>(`${BASE}/api/cursos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(p),
  })

export const deleteCurso = (id: number) =>
  jsonFetch<any>(`${BASE}/api/cursos/${id}/`, { method: 'DELETE' })

/* ==================== CLASES ==================== */

export async function listClases(params?: { id_cur?: number; id_dce?: number }) {
  const q = new URLSearchParams()
  if (params?.id_cur) q.append('id_cur', String(params.id_cur))
  if (params?.id_dce) q.append('id_dce', String(params.id_dce))
  const res = await fetch(`${API}/clases/${q.toString() ? `?${q.toString()}` : ''}`)
  if (!res.ok) throw new Error('Error listClases')
  return res.json()
}

export function createClase(body: { nombre_cl: string; id_cur: number; id_dce: number }) {
  const url = `${BASE}/api/clases/`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async r => (r.ok ? r.json() : Promise.reject(await r.text())))
}

export async function updateClase(id: number, payload: { nombre_cl?: string; video_cl?: string }) {
  const res = await fetch(`${API}/clases/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Error updateClase')
  return res.json()
}

/* ==================== MATRÍCULAS ==================== */

export const createMatricula = (p: { id_est: number; id_cl: number }) =>
  fetch(`${BASE}/api/matriculas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  }).then(async r => {
    const t = await r.text()
    const j = t ? JSON.parse(t) : undefined
    if (!r.ok) throw new Error(typeof j === 'string' ? j : JSON.stringify(j))
    return j
  })

export async function listMatriculas() {
  const res = await fetch(`${API}/matriculas/`)
  if (!res.ok) throw new Error('Error listMatriculas')
  return res.json()
}

/* ==================== RESULTADOS (IA en backend) ==================== */
/**
 * Enviamos SOLO lo que la vista espera: id_est, id_cl, metrics.
 * El backend calcula nivel + recomendación y guarda:
 *   - nivelaten_re
 *   - atencion_ia_re
 * Devuelve { modelo, nivel, recomendacion, resultado: {...} }
 */
export async function createResultadoEvaluacion(input: {
  id_est: number
  id_cl: number
  metrics: any
}) {
  const res = await fetch(`${API}/resultados/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return safeJson<any>(res)
}

export function getResultadoId(r: any): number | null {
  if (!r) return null
  if (typeof r.resultado_id === 'number') return r.resultado_id
  const obj = r.resultado ?? {}
  return obj.id ?? obj.id_re ?? obj.pk ?? null
}