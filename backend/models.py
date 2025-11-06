# backend/models.py
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


# ------------------ USUARIO ------------------
class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    apellido = Column(String)
    correo_electronico = Column(String, unique=True, index=True)
    contrasena = Column(String)
    fecha_nacimiento = Column(Date)
    genero = Column(String)
    tipo_arte_preferido = Column(String)
    telefono = Column(String)
    nombre_usuario = Column(String)

    # Relaciones
    perfil = relationship("Perfil", back_populates="usuario", uselist=False)
    publicaciones = relationship("Publicacion", back_populates="usuario", cascade="all, delete-orphan")
    siguiendo = relationship("SeguirUsuario", foreign_keys="SeguirUsuario.id_seguidor", back_populates="seguidor")
    seguidores = relationship("SeguirUsuario", foreign_keys="SeguirUsuario.id_seguido", back_populates="seguido")
    reportes_enviados = relationship("ReporteUsuario", foreign_keys="ReporteUsuario.id_reportante", back_populates="reportante")
    reportes_recibidos = relationship("ReporteUsuario", foreign_keys="ReporteUsuario.id_reportado", back_populates="reportado")
    amistades_enviadas = relationship("SolicitudAmistad", foreign_keys="SolicitudAmistad.id_emisor", back_populates="emisor")
    amistades_recibidas = relationship("SolicitudAmistad", foreign_keys="SolicitudAmistad.id_receptor", back_populates="receptor")
    notificaciones = relationship("Notificacion", back_populates="usuario", cascade="all, delete-orphan")
    bloqueos_realizados = relationship("BloqueoUsuario", foreign_keys="BloqueoUsuario.id_bloqueador", back_populates="bloqueador")
    bloqueos_recibidos = relationship("BloqueoUsuario", foreign_keys="BloqueoUsuario.id_bloqueado", back_populates="bloqueado")
    no_me_interesa = relationship("NoMeInteresa", back_populates="usuario", cascade="all, delete-orphan")


# ------------------ PERFIL ------------------
class Perfil(Base):
    __tablename__ = "perfiles"

    id_perfil = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), unique=True)
    descripcion = Column(String(255))
    foto_perfil = Column(String(255))
    biografia = Column(String(500))

    usuario = relationship("Usuario", back_populates="perfil")


# ------------------ PUBLICACIÓN ------------------
class Publicacion(Base):
    __tablename__ = "publicaciones"

    id_publicacion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    contenido = Column(String, nullable=False)
    imagen = Column(String, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="publicaciones")
    no_me_interesa = relationship("NoMeInteresa", back_populates="publicacion", cascade="all, delete-orphan")


# ------------------ SEGUIR USUARIO ------------------
class SeguirUsuario(Base):
    __tablename__ = "seguir_usuario"

    id_seguimiento = Column(Integer, primary_key=True, index=True)
    id_seguidor = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_seguido = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    fecha_seguimiento = Column(DateTime, default=datetime.utcnow)

    seguidor = relationship("Usuario", foreign_keys=[id_seguidor], back_populates="siguiendo")
    seguido = relationship("Usuario", foreign_keys=[id_seguido], back_populates="seguidores")


# ------------------ REPORTAR USUARIO ------------------
class ReporteUsuario(Base):
    __tablename__ = "reportes_usuarios"

    id_reporte = Column(Integer, primary_key=True, index=True)
    id_reportante = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_reportado = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    motivo = Column(String, nullable=False)
    evidencia_url = Column(String, nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow)

    reportante = relationship("Usuario", foreign_keys=[id_reportante], back_populates="reportes_enviados")
    reportado = relationship("Usuario", foreign_keys=[id_reportado], back_populates="reportes_recibidos")


# ------------------ SOLICITUD DE AMISTAD ------------------
class SolicitudAmistad(Base):
    __tablename__ = "solicitud_de_amistad"

    id_solicitud = Column(Integer, primary_key=True, index=True)
    id_emisor = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_receptor = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    estado = Column(String(50), default="pendiente")  # pendiente / aceptada / rechazada
    fecha_envio = Column(DateTime, default=datetime.utcnow)

    emisor = relationship("Usuario", foreign_keys=[id_emisor], back_populates="amistades_enviadas")
    receptor = relationship("Usuario", foreign_keys=[id_receptor], back_populates="amistades_recibidas")


# ------------------ NOTIFICACIONES ------------------
class Notificacion(Base):
    __tablename__ = "notificaciones"

    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    mensaje = Column(String(255))
    leido = Column(Boolean, default=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    tipo = Column(String(100))
    id_referencia = Column(Integer, nullable=True)

    usuario = relationship("Usuario", back_populates="notificaciones")


# ------------------ AMISTADES ------------------
class Amistad(Base):
    __tablename__ = "amistades"

    id_amistad = Column(Integer, primary_key=True, index=True)
    id_usuario1 = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_usuario2 = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    estado = Column(String)  # pendiente / aceptada / rechazada


# ------------------ TOKEN DE RECUPERACIÓN ------------------
class ResetPasswordToken(Base):
    __tablename__ = "reset_password_tokens"

    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    token = Column(String, unique=True, index=True)
    expiracion = Column(DateTime)

    usuario = relationship("Usuario")


# ------------------ BLOQUEO DE USUARIO ------------------
class BloqueoUsuario(Base):
    __tablename__ = "bloqueos_usuarios"

    id_bloqueo = Column(Integer, primary_key=True, index=True)
    id_bloqueador = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_bloqueado = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    fecha_bloqueo = Column(DateTime, default=datetime.utcnow)

    bloqueador = relationship("Usuario", foreign_keys=[id_bloqueador], back_populates="bloqueos_realizados")
    bloqueado = relationship("Usuario", foreign_keys=[id_bloqueado], back_populates="bloqueos_recibidos")


# ------------------ NO ME INTERESA ------------------
class NoMeInteresa(Base):
    __tablename__ = "no_me_interesa"

    id_no_me_interesa = Column(Integer, primary_key=True, index=True)  # Cambiado de 'id'
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_publicacion = Column(Integer, ForeignKey("publicaciones.id_publicacion", ondelete="CASCADE"))
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="no_me_interesa")
    publicacion = relationship("Publicacion", back_populates="no_me_interesa")