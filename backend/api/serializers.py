from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .models import Usuario, Estudiante, Docente, Curso, Clase, Matricula, ResultadosEvaluacion


# ===== DOCENTE =====
class DocenteRegistroSerializer(serializers.ModelSerializer):
    # nombres "genéricos" que usa el frontend
    ci = serializers.CharField(source='ci_dce', allow_blank=True, allow_null=True, required=False)
    nombre = serializers.CharField(source='nombre_dce', max_length=100, required=False)
    apellido = serializers.CharField(source='apellido_dce', max_length=100, required=False)
    fechanac = serializers.DateField(source='fechanac_dce', required=False)
    sexo = serializers.CharField(source='sexo_dce', max_length=1, required=False)
    correo = serializers.EmailField(source='correo_dce', required=False)
    telefono = serializers.CharField(source='telefono_dce', allow_blank=True, allow_null=True, required=False)
    titulo = serializers.CharField(source='titulo_dce', allow_blank=True, allow_null=True, required=False)

    # para crear (opcional en PATCH)
    usuario = serializers.CharField(write_only=True, max_length=150, required=False)
    contrasena = serializers.CharField(write_only=True, required=False)

    # para listar
    usuario_us = serializers.CharField(source='id_us.usuario_us', read_only=True)

    class Meta:
        model = Docente
        fields = (
            'id_dce', 'ci', 'nombre', 'apellido', 'fechanac', 'sexo', 'correo',
            'telefono', 'titulo', 'usuario', 'contrasena', 'usuario_us'
        )
        read_only_fields = ('id_dce', 'usuario_us')

    def validate_sexo(self, value):
        if value is None:
            return value
        v = (value or '').strip().lower()
        if v in ('m', 'masculino', 'h'):
            return 'm'
        if v in ('f', 'femenino', 'mujer'):
            return 'f'
        raise serializers.ValidationError('Sexo inválido.')

    @transaction.atomic
    def create(self, data):
        u_txt = data.pop('usuario', None)
        p_txt = data.pop('contrasena', None)
        user = None
        if u_txt:
            user = Usuario.objects.create(usuario_us=u_txt, contrasena_us=p_txt or '')
        if user:
            data['id_us'] = user
        return Docente.objects.create(**data)

    @transaction.atomic
    def update(self, instance, validated_data):
        # write_only
        u_txt = validated_data.pop('usuario', None)
        p_txt = validated_data.pop('contrasena', None)

        # validated_data ya viene con claves del MODELO por el source=
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if u_txt:
            if instance.id_us_id:
                instance.id_us.usuario_us = u_txt
                if p_txt:
                    instance.id_us.contrasena_us = p_txt
                instance.id_us.save()
            else:
                instance.id_us = Usuario.objects.create(
                    usuario_us=u_txt,
                    contrasena_us=p_txt or ''
                )

        instance.save()
        return instance


# ===== ESTUDIANTE =====
class EstudianteRegistroSerializer(serializers.ModelSerializer):
    ci = serializers.CharField(source='ci_est', max_length=20, allow_blank=True, required=False)
    nombre = serializers.CharField(source='nombre_est', max_length=100, required=False)
    apellido = serializers.CharField(source='apellido_est', max_length=100, required=False)
    fechanac = serializers.DateField(source='fechanac_est', required=False)
    sexo = serializers.CharField(source='sexo_est', max_length=1, required=False)
    correo = serializers.EmailField(source='correo_est', required=False)
    telefono = serializers.CharField(source='telefono_est', max_length=30, allow_blank=True, required=False)

    # creación / actualización de usuario (opcionales en PATCH)
    usuario = serializers.CharField(write_only=True, max_length=150, required=False)
    contrasena = serializers.CharField(write_only=True, required=False)

    # para listar
    usuario_us = serializers.CharField(source='id_us.usuario_us', read_only=True)

    class Meta:
        model = Estudiante
        fields = (
            'id_est', 'ci', 'nombre', 'apellido', 'fechanac', 'sexo', 'correo',
            'telefono', 'usuario', 'contrasena', 'usuario_us'
        )
        read_only_fields = ('id_est', 'usuario_us')

    def validate_sexo(self, value):
        if value is None:
            return value
        v = (value or "").strip().lower()
        if v in ("m", "masculino", "h"):
            return "m"
        if v in ("f", "femenino", "mujer"):
            return "f"
        raise serializers.ValidationError("Sexo inválido (use M/F).")

    def validate_correo(self, value):
        if value in (None, ""):
            return value
        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Correo inválido.")
        # (si quieres evitar colisiones, descomenta)
        # if Estudiante.objects.filter(correo_est__iexact=value).exclude(pk=self.instance.pk if self.instance else None).exists():
        #     raise serializers.ValidationError("Ya existe un estudiante con ese correo.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        usuario_txt = validated_data.pop("usuario", None)
        contrasena_txt = validated_data.pop("contrasena", None)

        user = None
        if usuario_txt:
            user = Usuario.objects.create(
                usuario_us=usuario_txt,
                contrasena_us=contrasena_txt or '',
            )
        if user:
            validated_data['id_us'] = user
        return Estudiante.objects.create(**validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        u_txt = validated_data.pop('usuario', None)
        p_txt = validated_data.pop('contrasena', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if u_txt:
            if instance.id_us_id:
                instance.id_us.usuario_us = u_txt
                if p_txt:
                    instance.id_us.contrasena_us = p_txt
                instance.id_us.save()
            else:
                instance.id_us = Usuario.objects.create(
                    usuario_us=u_txt,
                    contrasena_us=p_txt or ''
                )

        instance.save()
        return instance


# ===== CURSO =====
class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ("id_cur", "codigo_cur", "nombre_cur")

class ClaseSerializer(serializers.ModelSerializer):
    curso = serializers.CharField(source='id_cur.nombre_cur', read_only=True)
    docente = serializers.CharField(source='id_dce.nombre_dce', read_only=True)

    class Meta:
        model = Clase
        fields = ('id_cl', 'nombre_cl', 'video_cl', 'id_cur', 'id_dce', 'curso', 'docente')

class MatriculaSerializer(serializers.ModelSerializer):
    estudiante = serializers.CharField(source='id_est.nombre_est', read_only=True)
    clase = serializers.CharField(source='id_cl.nombre_cl', read_only=True)
    curso = serializers.CharField(source='id_cl.id_cur.nombre_cur', read_only=True)
    docente = serializers.CharField(source='id_cl.id_dce.nombre_dce', read_only=True)

    class Meta:
        model = Matricula
        fields = ('id_mat', 'id_est', 'id_cl', 'fecha', 'estudiante', 'clase', 'curso', 'docente')
        
class ResultadoEvalCreateSerializer(serializers.Serializer):
    id_est = serializers.IntegerField()
    id_cl  = serializers.IntegerField()
    metrics = serializers.DictField()

class ResultadoEvalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultadosEvaluacion
        fields = ('id_re','atencion_ia_re','nivelaten_re','fechaeva_re','id_est','id_cl')
        read_only_fields = ('id_re','fechaeva_re')