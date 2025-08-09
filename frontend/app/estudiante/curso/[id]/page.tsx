'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, CheckCircle, Clock, ExternalLink, Video, BookOpen } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { iniciarAnalisis } from '@/lib/analisisAtencion'

export default function CursoEstudiante() {
  const router = useRouter()
  const params = useParams()
  const [userData, setUserData] = useState(null)
  const videoRef = useRef(null)

  const handleIniciarAnalisis = () => {
    if (videoRef.current) {
      iniciarAnalisis(videoRef.current)
    } else {
      console.error('❌ El elemento <video> no está disponible.')
    }
  }

  // Curso simulado
  const [curso] = useState({
    id: parseInt(params.id),
    nombre: 'A003: Matemáticas Básicas',
    docente: 'Docente: Walter Wilkerson'
  })

  // Solo 3 clases
  const [clases, setClases] = useState([
    {
      id: 1,
      nombre: 'Introducción a los números',
      descripcion: 'Conceptos básicos de números y operaciones',
      videoUrl: 'https://youtube.com/watch?v=ejemplo1',
      completada: true,
      duracion: '15 min'
    }
    
  ])

  const [claseActual, setClaseActual] = useState(null)

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')

    if (userType !== 'estudiante' || !storedUserData) {
      router.push('/')
      return
    }

    setUserData(JSON.parse(storedUserData))
  }, [router])

  const handleVerClase = (clase) => {
    setClaseActual(clase)
  }

  const handleMarcarCompletada = (claseId) => {
    setClases(clases.map(clase =>
      clase.id === claseId ? { ...clase, completada: true } : clase
    ))
  }

  const handleBack = () => {
    router.push('/estudiante')
  }

  if (!userData) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{curso.nombre}</h1>
                <p className="text-gray-600">{curso.docente}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Clases */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Contenido del Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clases.map((clase, index) => (
                    <div
                      key={clase.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        claseActual?.id === clase.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleVerClase(clase)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {clase.completada ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-sm">{clase.nombre}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {clase.duracion}
                            </p>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reproductor de Video */}
          <div className="lg:col-span-2">
            {claseActual ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      {claseActual.nombre}
                    </div>
                    <Badge variant={claseActual.completada ? "default" : "secondary"}>
                      {claseActual.completada ? "Completada" : "Pendiente"}
                    </Badge>
                  </CardTitle>
                  
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="text-center text-white">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-70" />
                        <p className="text-lg font-medium">Reproductor de Video</p>
                        <p className="text-sm opacity-70">Duración: {claseActual.duracion}</p>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <Button
                          size="lg"
                          className="rounded-full w-16 h-16 p-0"
                          onClick={handleIniciarAnalisis}
                        >
                          <Play className="w-8 h-8" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <a
                        href={claseActual.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver en plataforma original
                      </a>

                      {!claseActual.completada && (
                        <Button
                          onClick={() => handleMarcarCompletada(claseActual.id)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como completada
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-gray-500">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Selecciona una clase para comenzar</p>
                    <p className="text-sm">Haz clic en cualquier clase de la lista para verla</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Información del Curso */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Información del Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Docente</h4>
                  <p className="text-gray-600">{curso.docente}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width={640}
        height={480}
        style={{ display: 'none' }}
      />
    </div>
  )
}
