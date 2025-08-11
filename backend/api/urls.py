from django.urls import path
from .views import (
    DocenteListCreateView, DocenteDetailView,
    EstudianteListCreateView, CursoListCreateView,
    ClaseListCreateView, ClaseDetailView,
    MatriculaListCreateView, MatriculaDetailView,
    LoginView,
)
from .views import EvaluarAtencionView


urlpatterns = [
    # existentes...
    path("docentes/", DocenteListCreateView.as_view(), name="docentes-create"),
    path("docentes/<int:pk>/", DocenteDetailView.as_view(), name="docente-detail"),
    path("estudiantes/", EstudianteListCreateView.as_view(), name="estudiantes-create"),
    path("cursos/", CursoListCreateView.as_view(), name="cursos-create"),

    # nuevos (asignaciones)
    path("clases/", ClaseListCreateView.as_view(), name="clases-list-create"),
    path("clases/<int:pk>/", ClaseDetailView.as_view(), name="clases-detail"),

    path("matriculas/", MatriculaListCreateView.as_view(), name="matriculas-list-create"),
    path("matriculas/<int:pk>/", MatriculaDetailView.as_view(), name="matriculas-detail"),

    # --- LOGIN ---
    path("login/", LoginView.as_view(), name="login"),
    
    path("resultados/", EvaluarAtencionView.as_view(), name="evaluar-atencion"),
]
