# backend/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List
from pydantic_settings import BaseSettings 
from fastapi_mail import ConnectionConfig
from backend.config import settings

# ------------------ PERFIL ------------------
class PerfilBase(BaseModel):
    descripcion: Optional[str] = None
    biografia: Optional[str] = None
    foto_perfil: Optional[str] = None

class PerfilResponse(PerfilBase):
    id_perfil: int
    id_usuario: int

    class Config:
        orm_mode = True

# ------------------ USUARIO ------------------
class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    correo_electronico: EmailStr
    fecha_nacimiento: date
    genero: str
    tipo_arte_preferido: str
    telefono: str
    nombre_usuario: str

class UsuarioCreate(UsuarioBase):
    contrasena: str

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    perfil: Optional[PerfilResponse] = None  # Perfil incluido

    class Config:
        orm_mode = True

# ------------------ PUBLICACIÓN ------------------
class UsuarioPerfil(BaseModel):
    id_usuario: int
    nombre: str
    nombre_usuario: str
    perfil: Optional[PerfilResponse] = None

    class Config:
        orm_mode = True

class PublicacionBase(BaseModel):
    contenido: str
    imagen: Optional[str] = None

class PublicacionCreate(PublicacionBase):
    id_usuario: int

class PublicacionResponse(PublicacionBase):
    id_publicacion: int
    id_usuario: int
    fecha_creacion: datetime
    usuario: UsuarioPerfil

class NotificacionResponse(BaseModel):
    id_notificacion: int
    tipo: str
    mensaje: str
    fecha_creacion: datetime
    leida: bool

    class Config:
        orm_mode = True

# Agregar al final de backend/schemas.py

# ------------------ SEGUIDORES / SIGUIENDO ------------------
class SeguidorResponse(BaseModel):
    id_seguimiento: int
    fecha_seguimiento: datetime
    seguidor: UsuarioPerfil

class SeguidoResponse(BaseModel):
    id_seguimiento: int
    fecha_seguimiento: datetime
    seguido: UsuarioPerfil

    class Config:
        orm_mode = True

# ------------------ ESTADÍSTICAS PERFIL ------------------
class EstadisticasPerfilResponse(BaseModel):
    seguidores: int
    siguiendo: int
    publicaciones: int

    class Config:
        orm_mode = True



 # ------------------ RECUPERACIÓN DE CONTRASEÑA ------------------
class ResetPasswordRequest(BaseModel):
    token: str
    nueva_contrasena: str

class ForgotPasswordRequest(BaseModel):
    correo: EmailStr

class ForgotPasswordRequest(BaseModel):
    correo: EmailStr


conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,
)



# ------------------ ME GUSTA ------------------
class MeGustaBase(BaseModel):
    id_publicacion: int

class MeGustaResponse(BaseModel):
    id_megusta: int
    id_usuario: int
    id_publicacion: int
    fecha: datetime

    class Config:
        orm_mode = True

# ------------------ GUARDADO ------------------
class GuardadoBase(BaseModel):
    id_publicacion: int

class GuardadoResponse(BaseModel):
    id_guardado: int
    id_usuario: int
    id_publicacion: int
    fecha: datetime

    class Config:
        orm_mode = True

# ------------------ COMENTARIO ------------------
class ComentarioBase(BaseModel):
    contenido: str
    id_publicacion: int
    id_comentario_padre: Optional[int] = None

class ComentarioResponse(BaseModel):
    id_comentario: int
    id_usuario: int
    id_publicacion: int
    id_comentario_padre: Optional[int]
    contenido: str
    fecha: datetime
    usuario: UsuarioPerfil
    respuestas: List['ComentarioResponse'] = []
    total_me_gusta: int = 0
    me_gusta_dado: bool = False

    class Config:
        orm_mode = True

# Para evitar problemas de referencia circular
ComentarioResponse.update_forward_refs()

class ComentarioConRespuestasResponse(BaseModel):
    comentarios: List[ComentarioResponse]
    total: int

    class Config:
        orm_mode = True

# ------------------ ME GUSTA COMENTARIO ------------------
class MeGustaComentarioBase(BaseModel):
    id_comentario: int

class MeGustaComentarioResponse(BaseModel):
    id_megusta_comentario: int
    id_usuario: int
    id_comentario: int
    fecha: datetime

    class Config:
        orm_mode = True

# ------------------ ESTADÍSTICAS PUBLICACIÓN ------------------
class EstadisticasPublicacionResponse(BaseModel):
    total_me_gusta: int
    total_comentarios: int
    total_guardados: int
    me_gusta_dado: bool
    guardado: bool

    class Config:
        orm_mode = True