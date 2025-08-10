from rest_framework import generics, status
from rest_framework.generics import ListCreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Docente, Estudiante, Curso, Clase, Matricula, Usuario, Administrador
from .serializers import (
    DocenteRegistroSerializer, EstudianteRegistroSerializer,
    CursoSerializer, ClaseSerializer, MatriculaSerializer
)

# ----------------- LOGIN POR ROL -----------------
class LoginView(APIView):
    """
    POST /api/login/?role=estudiante|docente|admin
    body: { "usuario": "...", "contrasena": "..." }
    """
    def post(self, request):
        usuario = (request.data.get('usuario') or '').strip()
        contrasena = (request.data.get('contrasena') or '').strip()
        expected = (request.query_params.get('role') or '').strip().lower()

        if not usuario or not contrasena:
            return Response({'detail': 'Faltan credenciales.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            u = Usuario.objects.get(usuario_us=usuario, contrasena_us=contrasena)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario o contraseña incorrectos.'}, status=status.HTTP_401_UNAUTHORIZED)

        roles = []

        e = Estudiante.objects.filter(id_us=u).values('id_est', 'nombre_est', 'apellido_est').first()
        if e:
            roles.append({'role': 'estudiante', 'id': e['id_est']})

        d = Docente.objects.filter(id_us=u).values('id_dce', 'nombre_dce', 'apellido_dce').first()
        if d:
            roles.append({'role': 'docente', 'id': d['id_dce']})

        a = Administrador.objects.filter(id_us=u).values('id_admin', 'nombre_admin', 'apellido_admin').first()
        if a:
            roles.append({'role': 'admin', 'id': a['id_admin']})

        if not roles:
            return Response({'detail': 'El usuario no está vinculado a ningún rol.'}, status=status.HTTP_403_FORBIDDEN)

        if expected and expected not in [r['role'] for r in roles]:
            return Response({'detail': 'No pertenece al rol solicitado.', 'roles': [r['role'] for r in roles]},
                            status=status.HTTP_403_FORBIDDEN)

        chosen = next((r for r in roles if r['role'] == expected), roles[0])

        return Response({
            'ok': True,
            'role': chosen['role'],
            'user': {'id_us': u.id_us, 'usuario': u.usuario_us},
            'profile_id': chosen['id']
        }, status=status.HTTP_200_OK)
# -------------------------------------------------


# DOCENTES
class DocenteListCreateView(generics.ListCreateAPIView):
    queryset = Docente.objects.select_related('id_us').all()
    serializer_class = DocenteRegistroSerializer

class DocenteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Docente.objects.select_related('id_us').all()
    serializer_class = DocenteRegistroSerializer

# ESTUDIANTES
class EstudianteListCreateView(generics.ListCreateAPIView):
    queryset = Estudiante.objects.select_related('id_us').all()
    serializer_class = EstudianteRegistroSerializer

class EstudianteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Estudiante.objects.select_related('id_us').all()
    serializer_class = EstudianteRegistroSerializer

# CURSOS
class CursoListCreateView(generics.ListCreateAPIView):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer

class CursoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer

# CLASES
class ClaseListCreateView(ListCreateAPIView):
    serializer_class = ClaseSerializer

    def get_queryset(self):
        qs = Clase.objects.select_related('id_cur', 'id_dce').all()
        id_cur = self.request.query_params.get('id_cur')
        id_dce = self.request.query_params.get('id_dce')
        if id_cur:
            qs = qs.filter(id_cur=id_cur)
        if id_dce:
            qs = qs.filter(id_dce=id_dce)
        return qs

class ClaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Clase.objects.select_related('id_cur', 'id_dce')
    serializer_class = ClaseSerializer

# MATRICULAS
class MatriculaListCreateView(generics.ListCreateAPIView):
    queryset = Matricula.objects.select_related('id_est', 'id_cl', 'id_cl__id_cur', 'id_cl__id_dce')
    serializer_class = MatriculaSerializer

class MatriculaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Matricula.objects.select_related('id_est', 'id_cl', 'id_cl__id_cur', 'id_cl__id_dce')
    serializer_class = MatriculaSerializer
