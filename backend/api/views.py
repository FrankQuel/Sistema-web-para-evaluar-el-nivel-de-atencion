from rest_framework import generics
from rest_framework.generics import ListCreateAPIView
from .models import Docente, Estudiante, Curso, Clase, Matricula
from .serializers import DocenteRegistroSerializer, EstudianteRegistroSerializer, CursoSerializer, ClaseSerializer, MatriculaSerializer

# DOCENTES (ya estaban bien)
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

class ClaseListCreateView(ListCreateAPIView):
    serializer_class = ClaseSerializer

    def get_queryset(self):
        qs = Clase.objects.select_related('id_cur','id_dce').all()
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

class MatriculaListCreateView(generics.ListCreateAPIView):
    queryset = Matricula.objects.select_related('id_est', 'id_cl', 'id_cl__id_cur', 'id_cl__id_dce')
    serializer_class = MatriculaSerializer

class MatriculaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Matricula.objects.select_related('id_est', 'id_cl', 'id_cl__id_cur', 'id_cl__id_dce')
    serializer_class = MatriculaSerializer