# backend/api/urls.py
from django.urls import path
from .views import (
    DocenteListCreateView, DocenteDetailView,
    EstudianteListCreateView, EstudianteDetailView,
    CursoListCreateView, CursoDetailView,
    ClaseListCreateView, ClaseDetailView,
    MatriculaListCreateView, MatriculaDetailView,
    LoginView, EvaluarAtencionView,
)

urlpatterns = [
    # Docentes
    path("docentes/", DocenteListCreateView.as_view(), name="docentes-create"),
    path("docentes/<int:pk>/", DocenteDetailView.as_view(), name="docente-detail"),

    # Estudiantes
    path("estudiantes/", EstudianteListCreateView.as_view(), name="estudiantes-create"),
    path("estudiantes/<int:pk>/", EstudianteDetailView.as_view(), name="estudiante-detail"),

    # Cursos
    path("cursos/", CursoListCreateView.as_view(), name="cursos-create"),
    path("cursos/<int:pk>/", CursoDetailView.as_view(), name="curso-detail"),

    # Clases
    path("clases/", ClaseListCreateView.as_view(), name="clases-list-create"),
    path("clases/<int:pk>/", ClaseDetailView.as_view(), name="clases-detail"),

    # Matrículas
    path("matriculas/", MatriculaListCreateView.as_view(), name="matriculas-list-create"),
    path("matriculas/<int:pk>/", MatriculaDetailView.as_view(), name="matriculas-detail"),

    # Login
    path("login/", LoginView.as_view(), name="login"),

    # IA resultados
    path("resultados/", EvaluarAtencionView.as_view(), name="evaluar-atencion"),
    # (sin ruta de PDF)
]
