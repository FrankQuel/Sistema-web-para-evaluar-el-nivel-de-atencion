export type Docente = {
  id_dce: number
  ci_dce: number | null
  nombre_dce: string
  apellido_dce: string
  fechanac_dce: string
  sexo_dce: string
  correo_dce: string
  telefono_dce: string
  titulo_dce: string
  id_us: number | null
  id_admin: number | null
  usuario_us?: string
}

export type Estudiante = {
  id_est: number
  ci_est: number | null
  nombre_est: string
  apellido_est: string
  fechanac_est: string
  sexo_est: string
  correo_est: string
  telefono_est: string
  id_us: number | null
  id_admin: number | null
  usuario_us?: string   // opcional, solo para mostrar en la tabla si lo envías
}

export type Curso = {
  id_cur: number
  codigo_cur: string
  nombre_cur: string
}
