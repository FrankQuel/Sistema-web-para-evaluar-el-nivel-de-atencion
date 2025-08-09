from django.urls import path
from .views import RegistroEstudianteAPIView

urlpatterns = [
    path('registro-estudiante/', RegistroEstudianteAPIView.as_view(), name='registro-estudiante'),
]
