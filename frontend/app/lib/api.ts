// app/lib/api.ts

// Base del backend (ej: http://127.0.0.1:8000)
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';
const API = 'http://127.0.0.1:8000/api';

/* ===== Utilidades ===== */
async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new Error(
      typeof data === 'string' ? data : JSON.stringify(data || { status: res.status })
    );
  }
  return data as T;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  return safeJson<T>(res);
}

/* ==================== DOCENTES ==================== */

// GET /api/docentes/
export async function listDocentes() {
  return jsonFetch<any[]>(`${BASE}/api/docentes/`, { cache: 'no-store' as any });
}

// POST /api/docentes/
export async function createDocente(payload: {
  ci: number | null;
  nombre: string;
  apellido: string;
  fechanac: string;
  sexo: string; // 'm' | 'f'
  correo: string;
  telefono: string | null;
  titulo: string | null;
  usuario: string;
  contrasena: string;
}) {
  return jsonFetch<any>(`${BASE}/api/docentes/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// PATCH /api/docentes/:id/
export async function updateDocente(
  id: number,
  patch: Partial<{
    ci: number | null;
    nombre: string;
    apellido: string;
    fechanac: string;
    sexo: string;
    correo: string;
    telefono: string | null;
    titulo: string | null;
    usuario: string;
    contrasena: string;
  }>
) {
  return jsonFetch<any>(`${BASE}/api/docentes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// DELETE /api/docentes/:id/
export async function deleteDocente(id: number) {
  const res = await fetch(`${BASE}/api/docentes/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

/* ==================== ESTUDIANTES ==================== */

// GET /api/estudiantes/
export const listEstudiantes = () =>
  jsonFetch<any[]>(`${BASE}/api/estudiantes/`, { cache: 'no-store' as any });

// POST /api/estudiantes/
export const createEstudiante = (p: {
  ci: number | null;
  nombre: string;
  apellido: string;
  fechanac: string;
  sexo: string;
  correo: string;
  telefono: string | null;
  usuario: string;
  contrasena: string;
}) =>
  jsonFetch<any>(`${BASE}/api/estudiantes/`, {
    method: 'POST',
    body: JSON.stringify(p),
  });

// PATCH /api/estudiantes/:id/
export const updateEstudiante = (
  id: number,
  p: Partial<{
    ci: number | null;
    nombre: string;
    apellido: string;
    fechanac: string;
    sexo: string;
    correo: string;
    telefono: string | null;
  }>
) =>
  jsonFetch<any>(`${BASE}/api/estudiantes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(p),
  });

// DELETE /api/estudiantes/:id/
export const deleteEstudiante = (id: number) =>
  jsonFetch<any>(`${BASE}/api/estudiantes/${id}/`, { method: 'DELETE' });

/* ==================== CURSOS ==================== */

// GET /api/cursos/
export const listCursos = () =>
  jsonFetch<any[]>(`${BASE}/api/cursos/`, { cache: 'no-store' as any });

// POST /api/cursos/
export const createCurso = (p: { codigo_cur: string; nombre_cur: string }) =>
  jsonFetch<any>(`${BASE}/api/cursos/`, { method: 'POST', body: JSON.stringify(p) });

// PATCH /api/cursos/:id/
export const updateCurso = (
  id: number,
  p: Partial<{ codigo_cur: string; nombre_cur: string }>
) =>
  jsonFetch<any>(`${BASE}/api/cursos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(p),
  });

// DELETE /api/cursos/:id/
export const deleteCurso = (id: number) =>
  jsonFetch<any>(`${BASE}/api/cursos/${id}/`, { method: 'DELETE' });

async function json<T>(r: Response){ const t=await r.text(); const d=t?JSON.parse(t):undefined; if(!r.ok) throw new Error(JSON.stringify(d||{status:r.status})); return d as T }

// ===== CLASES =====
// listar clases con filtros
export async function listClases(params?: { id_cur?: number; id_dce?: number }) {
  const q = new URLSearchParams();
  if (params?.id_cur) q.append('id_cur', String(params.id_cur));
  if (params?.id_dce) q.append('id_dce', String(params.id_dce));
  const res = await fetch(`${API}/clases/${q.toString() ? `?${q.toString()}` : ''}`);
  if (!res.ok) throw new Error('Error listClases');
  return res.json();
}

export function createClase(body: { nombre_cl: string; id_cur: number; id_dce: number }) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000'}/api/clases/`
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(async r => (r.ok ? r.json() : Promise.reject(await r.text())))
}

// actualizar clase (nombre / video)
export async function updateClase(id: number, payload: { nombre_cl?: string; video_cl?: string }) {
  const res = await fetch(`${API}/clases/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error updateClase');
  return res.json();
}

// ===== MATRÍCULAS (estudiante -> clase) =====
export const createMatricula = (p: {
  id_est: number;
  id_cl: number;
}) =>
  fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000'}/api/matriculas/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(p),
  }).then(async r => {
    const t = await r.text(); const j = t ? JSON.parse(t) : undefined;
    if (!r.ok) throw new Error(typeof j === 'string' ? j : JSON.stringify(j));
    return j;
  });

  export async function listMatriculas() {
  const res = await fetch(`${API}/matriculas/`);
  if (!res.ok) throw new Error('Error listMatriculas');
  return res.json();
}