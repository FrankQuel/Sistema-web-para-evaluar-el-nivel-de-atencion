from rest_framework import generics, status, views
from rest_framework.generics import ListCreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Docente, Estudiante, Curso, Clase, Matricula, Usuario, Administrador, ResultadosEvaluacion
from .serializers import (
    DocenteRegistroSerializer, EstudianteRegistroSerializer,
    CursoSerializer, ClaseSerializer, MatriculaSerializer,
    ResultadoEvalCreateSerializer, ResultadoEvalSerializer
)

from ia.attention_model_rf import RandomForestAttentionModel, heuristic_label
import os

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


# ----------------- DOCENTES -----------------
class DocenteListCreateView(generics.ListCreateAPIView):
    queryset = Docente.objects.select_related('id_us').all()
    serializer_class = DocenteRegistroSerializer

class DocenteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Docente.objects.select_related('id_us').all()
    serializer_class = DocenteRegistroSerializer


# ----------------- ESTUDIANTES -----------------
class EstudianteListCreateView(generics.ListCreateAPIView):
    queryset = Estudiante.objects.select_related('id_us').all()
    serializer_class = EstudianteRegistroSerializer

class EstudianteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Estudiante.objects.select_related('id_us').all()
    serializer_class = EstudianteRegistroSerializer


# ----------------- CURSOS -----------------
class CursoListCreateView(generics.ListCreateAPIView):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer

class CursoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer


# ----------------- CLASES -----------------
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


# ----------------- MATRICULAS -----------------
class MatriculaListCreateView(generics.ListCreateAPIView):
    queryset = Matricula.objects.select_related('id_est', 'id_cl', 'id_cl__id_cur', 'id_cl__id_dce')
    serializer_class = MatriculaSerializer

class MatriculaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Matricula.objects.select_related('id_est', 'id_cl', 'id_cl__id_cur', 'id_cl__id_dce')
    serializer_class = MatriculaSerializer


# ----------------- IA / Evaluar -----------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'MODELS', 'modelo_rf_v1.joblib')
_rf = None
try:
    _rf = RandomForestAttentionModel.load(MODEL_PATH)
    _MODEL_TAG = "RF_v1"
except Exception:
    _MODEL_TAG = "Heuristica_v1"

# ----------------- IA / Evaluar -----------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'MODELS', 'modelo_rf_v1.joblib')
_rf = None
try:
    _rf = RandomForestAttentionModel.load(MODEL_PATH)
    _MODEL_TAG = "RF_v1"
except Exception:
    _MODEL_TAG = "Heuristica_v1"

class EvaluarAtencionView(views.APIView):
    """
    POST  /api/resultados/           -> crear resultado (igual que antes)
    GET   /api/resultados/?id_est=&id_cl=&id_cur=&latest=1&limit=20  -> listar/filtrar resultados
    """
    # === NUEVO: GET para consultar resultados desde BD ===
    def get(self, request):
        qs = ResultadosEvaluacion.objects.select_related(
            'id_est', 'id_cl', 'id_cl__id_cur'
        ).all().order_by('-fechaeva_re')

        id_est = request.query_params.get('id_est')
        id_cl  = request.query_params.get('id_cl')
        id_cur = request.query_params.get('id_cur')
        latest = request.query_params.get('latest')  # '1' para solo el último
        limit  = request.query_params.get('limit')

        if id_est:
            qs = qs.filter(id_est_id=id_est)
        if id_cl:
            qs = qs.filter(id_cl_id=id_cl)
        if id_cur:
            qs = qs.filter(id_cl__id_cur_id=id_cur)

        if latest == '1':
            qs = qs[:1]
        elif limit:
            try:
                n = max(1, min(100, int(limit)))
                qs = qs[:n]
            except ValueError:
                qs = qs[:20]

        data = []
        for r in qs:
            data.append({
                'id_re': r.id_re,
                'nivelaten_re': r.nivelaten_re,
                'atencion_ia_re': r.atencion_ia_re,
                'fechaeva_re': r.fechaeva_re.isoformat(),
                'id_est': r.id_est_id,
                'id_cl': r.id_cl_id,
                'clase': getattr(r.id_cl, 'nombre_cl', None),
                'curso': getattr(getattr(r.id_cl, 'id_cur', None), 'nombre_cur', None),
                'estudiante': f"{getattr(r.id_est, 'nombre_est', '')} {getattr(r.id_est, 'apellido_est', '')}".strip()
            })
        return Response(data, status=status.HTTP_200_OK)

    # === POST igual que tenías ===
    def post(self, request):
        s = ResultadoEvalCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        id_est = s.validated_data['id_est']
        id_cl  = s.validated_data['id_cl']
        metrics = s.validated_data['metrics']

        if _rf:
            nivel = _rf.predict_label_from_metrics(metrics)
        else:
            nivel = heuristic_label(metrics)

        recomend = {
            "ATENTO":   "Buen enfoque. Pausas cada 15–20 min.",
            "NEUTRO":   "Atención variable. Resúmenes + checks.",
            "DISTRAIDO":"Actividades interactivas y segmentar."
        }.get(nivel, "—")

        obj = ResultadosEvaluacion.objects.create(
            atencion_ia_re=recomend[:60],   # por si el campo es 60
            nivelaten_re=nivel[:20],
            id_est_id=id_est,
            id_cl_id=id_cl
        )
        return Response({
            "modelo": _MODEL_TAG,
            "nivel": nivel,
            "recomendacion": recomend,
            "resultado_id": obj.id_re,
            "resultado": ResultadoEvalSerializer(obj).data
        }, status=status.HTTP_201_CREATED)