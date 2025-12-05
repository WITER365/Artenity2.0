# backend/models.py
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Boolean, Text, UniqueConstraint, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from .database import Base
import json


# ------------------ USUARIO ------------------
class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    correo_electronico = Column(String, unique=True, index=True, nullable=False)
    contrasena = Column(String, nullable=False)
    fecha_nacimiento = Column(Date)
    genero = Column(String)
    tipo_arte_preferido = Column(String)
    telefono = Column(String)
    nombre_usuario = Column(String, unique=True)
    
    # Relaciones
    perfil = relationship("Perfil", back_populates="usuario", uselist=False)
    publicaciones = relationship("Publicacion", back_populates="usuario", cascade="all, delete-orphan")
    siguiendo = relationship("SeguirUsuario", foreign_keys="SeguirUsuario.id_seguidor", back_populates="seguidor")
    seguidores = relationship("SeguirUsuario", foreign_keys="SeguirUsuario.id_seguido", back_populates="seguido")
    reportes_enviados = relationship("ReporteUsuario", foreign_keys="ReporteUsuario.id_reportante", back_populates="reportante")
    reportes_recibidos = relationship("ReporteUsuario", foreign_keys="ReporteUsuario.id_reportado", back_populates="reportado")
    amistades_enviadas = relationship("SolicitudAmistad", foreign_keys="SolicitudAmistad.id_emisor", back_populates="emisor")
    amistades_recibidas = relationship("SolicitudAmistad", foreign_keys="SolicitudAmistad.id_receptor", back_populates="receptor")
    amistades_como_usuario1 = relationship("Amistad", foreign_keys="Amistad.id_usuario1", back_populates="usuario1", cascade="all, delete-orphan")
    amistades_como_usuario2 = relationship("Amistad", foreign_keys="Amistad.id_usuario2", back_populates="usuario2", cascade="all, delete-orphan")
    notificaciones = relationship("Notificacion", back_populates="usuario", cascade="all, delete-orphan")
    bloqueos_realizados = relationship("BloqueoUsuario", foreign_keys="BloqueoUsuario.id_bloqueador", back_populates="bloqueador")
    bloqueos_recibidos = relationship("BloqueoUsuario", foreign_keys="BloqueoUsuario.id_bloqueado", back_populates="bloqueado")
    no_me_interesa = relationship("NoMeInteresa", back_populates="usuario", cascade="all, delete-orphan")
    me_gusta = relationship("MeGusta", back_populates="usuario", cascade="all, delete-orphan")
    guardados = relationship("Guardado", back_populates="usuario", cascade="all, delete-orphan")
    comentarios = relationship("Comentario", back_populates="usuario", cascade="all, delete-orphan")
    me_gusta_comentarios = relationship("MeGustaComentario", back_populates="usuario", cascade="all, delete-orphan")
    compartidos = relationship("Compartido", back_populates="usuario", cascade="all, delete-orphan")
    reset_tokens = relationship("ResetPasswordToken", back_populates="usuario", cascade="all, delete-orphan")

# ------------------ PERFIL ------------------
class Perfil(Base):
    __tablename__ = "perfiles"

    id_perfil = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), unique=True)
    descripcion = Column(String(255))
    foto_perfil = Column(String(255))
    biografia = Column(String(500))

    usuario = relationship("Usuario", back_populates="perfil")

class Amistad(Base):
    __tablename__ = "amistades"

    id_amistad = Column(Integer, primary_key=True, index=True)
    id_usuario1 = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_usuario2 = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    estado = Column(String(50), default="aceptada")

    usuario1 = relationship("Usuario", foreign_keys=[id_usuario1], back_populates="amistades_como_usuario1")
    usuario2 = relationship("Usuario", foreign_keys=[id_usuario2], back_populates="amistades_como_usuario2")

# ------------------ PUBLICACIÓN ------------------
class Publicacion(Base):
    __tablename__ = "publicaciones"

    id_publicacion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    contenido = Column(Text, nullable=False)
    
    # Campo para etiquetas/categorías (JSON array de strings)
    etiquetas = Column(Text, nullable=True)  # Ej: ["danza", "música"]
    
    # Usar el campo existente 'imagen' pero almacenar JSON para múltiples archivos
    imagen = Column(Text, nullable=True)
    tipo_medio = Column(String(20), default="imagen")
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="publicaciones")
    no_me_interesa = relationship("NoMeInteresa", back_populates="publicacion", cascade="all, delete-orphan")
    me_gusta = relationship("MeGusta", back_populates="publicacion", cascade="all, delete-orphan")
    guardados = relationship("Guardado", back_populates="publicacion", cascade="all, delete-orphan")
    comentarios = relationship("Comentario", back_populates="publicacion", cascade="all, delete-orphan")
    compartidos = relationship("Compartido", back_populates="publicacion", cascade="all, delete-orphan")

    @property
    def medios(self):
        if self.imagen:
            try:
                if self.imagen.startswith('[') and self.imagen.endswith(']'):
                    return json.loads(self.imagen)
                else:
                    return [self.imagen]
            except:
                return [self.imagen] if self.imagen else []
        return []

    @property
    def lista_etiquetas(self):
        if self.etiquetas:
            try:
                if self.etiquetas.startswith('[') and self.etiquetas.endswith(']'):
                    return json.loads(self.etiquetas)
                else:
                    return [self.etiquetas] if self.etiquetas else []
            except:
                return [self.etiquetas] if self.etiquetas else []
        return []
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
    estado = Column(String(50), default="pendiente")
    fecha_envio = Column(DateTime, default=datetime.utcnow)

    emisor = relationship("Usuario", foreign_keys=[id_emisor], back_populates="amistades_enviadas")
    receptor = relationship("Usuario", foreign_keys=[id_receptor], back_populates="amistades_recibidas")

# ------------------ NOTIFICACIONES ------------------
class Notificacion(Base):
    __tablename__ = "notificaciones"

    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    tipo = Column(String(100), nullable=False)
    mensaje = Column(Text, nullable=False)
    leido = Column(Boolean, default=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    id_referencia = Column(Integer, nullable=True)

    usuario = relationship("Usuario", back_populates="notificaciones")

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

    id_no_me_interesa = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_publicacion = Column(Integer, ForeignKey("publicaciones.id_publicacion", ondelete="CASCADE"))
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="no_me_interesa")
    publicacion = relationship("Publicacion", back_populates="no_me_interesa")

# ------------------ ME GUSTA PUBLICACIÓN ------------------
class MeGusta(Base):
    __tablename__ = "me_gusta"

    id_megusta = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_publicacion = Column(Integer, ForeignKey("publicaciones.id_publicacion", ondelete="CASCADE"))
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="me_gusta")
    publicacion = relationship("Publicacion", back_populates="me_gusta")

# ------------------ GUARDAR PUBLICACIÓN ------------------
class Guardado(Base):
    __tablename__ = "guardados"

    id_guardado = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_publicacion = Column(Integer, ForeignKey("publicaciones.id_publicacion", ondelete="CASCADE"))
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="guardados")
    publicacion = relationship("Publicacion", back_populates="guardados")

# ------------------ COMENTARIO ------------------
class Comentario(Base):
    __tablename__ = "comentarios"

    id_comentario = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_publicacion = Column(Integer, ForeignKey("publicaciones.id_publicacion", ondelete="CASCADE"))
    id_comentario_padre = Column(Integer, ForeignKey("comentarios.id_comentario"), nullable=True)
    contenido = Column(String(500), nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="comentarios")
    publicacion = relationship("Publicacion", back_populates="comentarios")
    comentario_padre = relationship("Comentario", remote_side=[id_comentario], backref="respuestas")
    me_gusta_comentarios = relationship("MeGustaComentario", back_populates="comentario", cascade="all, delete-orphan")

# ------------------ ME GUSTA COMENTARIO ------------------
class MeGustaComentario(Base):
    __tablename__ = "me_gusta_comentarios"

    id_megusta_comentario = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_comentario = Column(Integer, ForeignKey("comentarios.id_comentario", ondelete="CASCADE"))
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="me_gusta_comentarios")
    comentario = relationship("Comentario", back_populates="me_gusta_comentarios")

# ------------------ TOKEN DE RECUPERACIÓN ------------------
class ResetPasswordToken(Base):
    __tablename__ = "reset_password_tokens"

    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    token = Column(String, unique=True, index=True)
    expiracion = Column(DateTime)

    usuario = relationship("Usuario", back_populates="reset_tokens")

# ------------------ COMPARTIR PUBLICACIÓN ------------------
class Compartido(Base):
    __tablename__ = "compartidos"
    
    id_compartido = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    id_publicacion = Column(Integer, ForeignKey("publicaciones.id_publicacion", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(50), nullable=False)
    mensaje = Column(Text, nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow)
    expiracion = Column(DateTime, nullable=True, default=None)
    
    usuario = relationship("Usuario", back_populates="compartidos")
    publicacion = relationship("Publicacion", back_populates="compartidos")


    # ------------------ CHAT Y MENSAJES ------------------
class Chat(Base):
    __tablename__ = "chats"
    
    id_chat = Column(Integer, primary_key=True, index=True)
    id_usuario1 = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    id_usuario2 = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    ultima_actividad = Column(DateTime, default=datetime.utcnow)
    
    # Configuración personalizada del chat
    fondo_chat_usuario1 = Column(String(50), default="default")
    color_burbuja_usuario1 = Column(String(20), default="#6C63FF")
    fondo_chat_usuario2 = Column(String(50), default="default")
    color_burbuja_usuario2 = Column(String(20), default="#6C63FF")
    
    usuario1 = relationship("Usuario", foreign_keys=[id_usuario1])
    usuario2 = relationship("Usuario", foreign_keys=[id_usuario2])
    mensajes = relationship("Mensaje", back_populates="chat", cascade="all, delete-orphan", passive_deletes=True)
    configuraciones = relationship("ConfiguracionChat", back_populates="chat", cascade="all, delete-orphan", passive_deletes=True)

class Mensaje(Base):
    __tablename__ = "mensajes"
    
    id_mensaje = Column(Integer, primary_key=True, index=True)
    id_chat = Column(Integer, ForeignKey("chats.id_chat", ondelete="CASCADE"))
    id_emisor = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    contenido = Column(Text, nullable=False)
    tipo = Column(String(20), default="texto")  # texto, imagen, video
    archivo_url = Column(String(500), nullable=True)
    fecha_envio = Column(DateTime, default=datetime.utcnow)
    leido = Column(Boolean, default=False)
    
    chat = relationship("Chat", back_populates="mensajes")
    emisor = relationship("Usuario")

    # backend/models.py - AGREGAR ESTE MODELO

class MensajeEliminado(Base):
    __tablename__ = "mensajes_eliminados"
    
    id = Column(Integer, primary_key=True, index=True)
    id_mensaje = Column(Integer, ForeignKey("mensajes.id_mensaje"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    fecha_eliminacion = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    mensaje = relationship("Mensaje")
    usuario = relationship("Usuario")


    # backend/models.py - MODELO ConfiguracionChat


class ConfiguracionChat(Base):
    __tablename__ = "configuraciones_chat"
    
    id = Column(Integer, primary_key=True, index=True)
    id_chat = Column(Integer, ForeignKey("chats.id_chat", ondelete="CASCADE"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    fondo_chat = Column(String(50), default="default")
    color_burbuja = Column(String(7), default="#6C63FF")  # Formato HEX
    fondo_personalizado = Column(String(500), nullable=True)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    chat = relationship("Chat", back_populates="configuraciones")
    usuario = relationship("Usuario")
    
    # Índice único para evitar configuraciones duplicadas (uno por usuario por chat)
    __table_args__ = (
        UniqueConstraint("id_chat", "id_usuario", name="uq_chat_usuario"),
    )

    # ------------------ CATEGORÍA ------------------
class Categoria(Base): 
    __tablename__ = "categorias"

    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    descripcion = Column(String(255), nullable=True)

# Agrega este modelo al final del archivo

# ------------------ REPORTE DE PROBLEMAS ------------------
class ReporteProblema(Base):
    __tablename__ = "reportes_problemas"

    id_reporte = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    tipo_problema = Column(String(100), nullable=False)  # tecnico, contenido, usuario, funcionalidad, otro
    descripcion = Column(Text, nullable=False)
    email_contacto = Column(String(255), nullable=False)
    fecha_reporte = Column(DateTime, default=datetime.utcnow)
    estado = Column(String(50), default="pendiente")  # pendiente, en_proceso, resuelto
    
    # Relaciones
    usuario = relationship("Usuario")
# AGREGAR AL FINAL DEL ARCHIVO backend/models.py

# ------------------ GALERÍA DE ARTE ------------------
class GaleriaCarpeta(Base):
    __tablename__ = "galeria_carpetas"
    
    id_carpeta = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(500), nullable=True)
    color = Column(String(20), default="#6C63FF")
    icono = Column(String(50), default="folder")
    es_publica = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    usuario = relationship("Usuario")
    archivos = relationship("GaleriaArchivo", back_populates="carpeta", cascade="all, delete-orphan")
    
    # Índice único para nombre por usuario
    __table_args__ = (
        UniqueConstraint("id_usuario", "nombre", name="uq_usuario_nombre_carpeta"),
    )


class GaleriaArchivo(Base):
    __tablename__ = "galeria_archivos"
    
    id_archivo = Column(Integer, primary_key=True, index=True)
    id_carpeta = Column(Integer, ForeignKey("galeria_carpetas.id_carpeta", ondelete="CASCADE"))
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    nombre_original = Column(String(255), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    tipo = Column(String(50), nullable=False)  # imagen, video, audio, documento, boceto
    extension = Column(String(20), nullable=False)
    tamano = Column(BigInteger, nullable=False)  # Cambiar a BigInteger # en bytes
    ruta = Column(String(500), nullable=False)
    miniatura = Column(String(500), nullable=True)  # Para videos/imágenes
    duracion = Column(Integer, nullable=True)  # Para audio/video (segundos)
    resolucion = Column(String(20), nullable=True)  # Para imágenes/videos
    descripcion = Column(String(500), nullable=True)
    etiquetas = Column(Text, nullable=True)  # JSON array
    es_publico = Column(Boolean, default=False)
    fecha_subida = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    carpeta = relationship("GaleriaCarpeta", back_populates="archivos")
    usuario = relationship("Usuario")


class GaleriaPublicacion(Base):
    __tablename__ = "galeria_publicaciones"
    
    id_galeria_publicacion = Column(Integer, primary_key=True, index=True)
    id_archivo = Column(Integer, ForeignKey("galeria_archivos.id_archivo", ondelete="CASCADE"))
    id_publicacion = Column(Integer, ForeignKey("publicaciones.id_publicacion", ondelete="CASCADE"))
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"))
    fecha_publicacion = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    archivo = relationship("GaleriaArchivo")
    publicacion = relationship("Publicacion")
    usuario = relationship("Usuario")