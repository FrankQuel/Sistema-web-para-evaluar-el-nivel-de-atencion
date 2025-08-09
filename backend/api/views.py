from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario, Estudiante
from .serializers import UsuarioSerializer, EstudianteSerializer

class RegistroEstudianteAPIView(APIView):
    def post(self, request):
        # Guardar primero el usuario
        usuario_data = {
            "usuario_us": request.data.get("usuario"),
            "contrasena_us": request.data.get("contrasena")
        }
        usuario_serializer = UsuarioSerializer(data=usuario_data)
        if usuario_serializer.is_valid():
            usuario = usuario_serializer.save()
        else:
            return Response(usuario_serializer.errors, status=400)

        # Guardar el estudiante
        estudiante_data = {
            "ci_est": request.data.get("ci"),
            "nombre_est": request.data.get("nombre"),
            "apellido_est": request.data.get("apellido"),
            "fechanac_est": request.data.get("fechanac"),
            "sexo_est": request.data.get("sexo"),
            "correo_est": request.data.get("correo"),
            "telefono_est": request.data.get("telefono"),
            "id_us": usuario.id_us,
            "id_admin": 1
        }
        estudiante_serializer = EstudianteSerializer(data=estudiante_data)
        if estudiante_serializer.is_valid():
            estudiante_serializer.save()
            return Response({"message": "Estudiante registrado con éxito"}, status=201)
        else:
            usuario.delete()  # Deshacer si estudiante falla
            return Response(estudiante_serializer.errors, status=400)
