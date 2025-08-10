from django.db import models

# ==== Usuarios ====
class Usuario(models.Model):
    id_us = models.BigAutoField(primary_key=True)
    usuario_us = models.CharField(max_length=150, unique=True)
    contrasena_us = models.CharField(max_length=128)

    class Meta:
        managed = False
        db_table = 'usuario'

    def __str__(self):
        return self.usuario_us


# ==== Estudiante ====
class Estudiante(models.Model):
    id_est = models.BigAutoField(primary_key=True)
    ci_est = models.BigIntegerField(null=True, blank=True)
    nombre_est = models.CharField(max_length=100)
    apellido_est = models.CharField(max_length=100)
    fechanac_est = models.DateField(null=True, blank=True)
    sexo_est = models.CharField(max_length=1, null=True, blank=True)
    correo_est = models.EmailField(max_length=254)
    telefono_est = models.CharField(max_length=20, blank=True)
    id_us = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_us', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'estudiante'

    def __str__(self):
        return f"{self.nombre_est} {self.apellido_est}"


# ==== Docente ====
class Docente(models.Model):
    id_dce = models.BigAutoField(primary_key=True)
    ci_dce = models.BigIntegerField(null=True, blank=True)
    nombre_dce = models.CharField(max_length=100)
    apellido_dce = models.CharField(max_length=100)
    fechanac_dce = models.DateField(null=True, blank=True)
    sexo_dce = models.CharField(max_length=1, null=True, blank=True)
    correo_dce = models.EmailField(max_length=254)
    telefono_dce = models.CharField(max_length=20, blank=True)
    titulo_dce = models.CharField(max_length=150, blank=True)
    id_us = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_us', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'docente'

    def __str__(self):
        return f"{self.nombre_dce} {self.apellido_dce}"


# ==== Administrador (para login por rol) ====
class Administrador(models.Model):
    id_admin = models.BigAutoField(primary_key=True)
    nombre_admin = models.CharField(max_length=30, blank=True, null=True)
    apellido_admin = models.CharField(max_length=30, blank=True, null=True)
    id_us = models.OneToOneField('Usuario', models.DO_NOTHING, db_column='id_us', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'administrador'

    def __str__(self):
        return f"{self.nombre_admin or ''} {self.apellido_admin or ''}".strip()


# ==== Curso ====
class Curso(models.Model):
    id_cur = models.BigAutoField(primary_key=True)
    codigo_cur = models.CharField(max_length=15, unique=True)
    nombre_cur = models.CharField(max_length=30)

    class Meta:
        managed = False
        db_table = 'curso'

    def __str__(self):
        return self.nombre_cur


class Clase(models.Model):
    id_cl = models.BigAutoField(primary_key=True)
    nombre_cl = models.CharField(max_length=30)
    video_cl = models.CharField(max_length=255, blank=True)
    id_cur = models.ForeignKey('Curso', models.DO_NOTHING, db_column='id_cur')
    id_dce = models.ForeignKey('Docente', models.DO_NOTHING, db_column='id_dce')

    class Meta:
        managed = False
        db_table = 'clase'


class Matricula(models.Model):
    id_mat = models.BigAutoField(primary_key=True)
    id_est = models.ForeignKey('Estudiante', models.DO_NOTHING, db_column='id_est')
    id_cl = models.ForeignKey('Clase', models.DO_NOTHING, db_column='id_cl')
    fecha = models.DateField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'matricula'
        unique_together = (('id_est', 'id_cl'),)
