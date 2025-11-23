# backend/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List

# ------------------ PERFIL ------------------
class PerfilBase(BaseModel):
    descripcion: Optional[str] = None
    biografia: Optional[str] = None
    foto_perfil: Optional[str] = None

class PerfilResponse(PerfilBase):
    id_perfil: int
    id_usuario: int

    class Config:
        from_attributes = True

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
        from_attributes = True

# ------------------ PUBLICACIÓN ------------------
class UsuarioPerfil(BaseModel):
    id_usuario: int
    nombre: str
    nombre_usuario: str
    perfil: Optional[PerfilResponse] = None

    class Config:
        from_attributes = True

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
        from_attributes = True

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
        from_attributes = True

# ------------------ ESTADÍSTICAS PERFIL ------------------
class EstadisticasPerfilResponse(BaseModel):
    seguidores: int
    siguiendo: int
    publicaciones: int

    class Config:
        from_attributes = True



 # ------------------ RECUPERACIÓN DE CONTRASEÑA ------------------
class ResetPasswordRequest(BaseModel):
    token: str
    nueva_contrasena: str

class ForgotPasswordRequest(BaseModel):
    correo: EmailStr



# ------------------ ME GUSTA ------------------
class MeGustaBase(BaseModel):
    id_publicacion: int

class MeGustaResponse(BaseModel):
    id_megusta: int
    id_usuario: int
    id_publicacion: int
    fecha: datetime

    class Config:
        from_attributes = True

# ------------------ GUARDADO ------------------
class GuardadoBase(BaseModel):
    id_publicacion: int

class GuardadoResponse(BaseModel):
    id_guardado: int
    id_usuario: int
    id_publicacion: int
    fecha: datetime

    class Config:
        from_attributes = True

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
        from_attributes = True

# Para evitar problemas de referencia circular
ComentarioResponse.update_forward_refs()

class ComentarioConRespuestasResponse(BaseModel):
    comentarios: List[ComentarioResponse]
    total: int

    class Config:
        from_attributes = True

# ------------------ ME GUSTA COMENTARIO ------------------
class MeGustaComentarioBase(BaseModel):
    id_comentario: int

class MeGustaComentarioResponse(BaseModel):
    id_megusta_comentario: int
    id_usuario: int
    id_comentario: int
    fecha: datetime

    class Config:
        from_attributes = True

# ------------------ ESTADÍSTICAS PUBLICACIÓN ------------------
class EstadisticasPublicacionResponse(BaseModel):
    total_me_gusta: int
    total_comentarios: int
    total_guardados: int
    me_gusta_dado: bool
    guardado: bool

    class Config:
        from_attributes = True

# ------------------ ESTADÍSTICAS ME GUSTAS ------------------
class EstadisticasMeGustasResponse(BaseModel):
    me_gustas_recibidos: int
    me_gustas_dados: int

    class Config:
        from_attributes = True

# ------------------ COMPARTIDOS ------------------

class CompartidoBase(BaseModel):
    id_publicacion: int
    mensaje: Optional[str] = None


class CompartidoResponse(BaseModel):
    id_compartido: int
    id_usuario: int
    id_publicacion: int
    mensaje: Optional[str]
    fecha: datetime
    expiracion: datetime  # 🔥 NUEVO
    tipo: str

    class Config:
        from_attributes = True


# backend/schemas.py - AGREGAR ESTOS ESQUEMAS

class CompartidoBase(BaseModel):
    id_usuario: int
    id_publicacion: int
    tipo: str
    mensaje: Optional[str] = None
    expiracion: Optional[datetime] = None

class CompartidoResponse(BaseModel):
    id_compartido: int
    fecha_compartido: str
    mensaje: Optional[str]
    tipo: str
    expiracion: Optional[str]
    usuario_compartio: dict
    publicacion: dict

    class Config:
        from_attributes = True