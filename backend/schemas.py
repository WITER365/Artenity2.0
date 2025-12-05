# backend/schemas.py
from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime
from typing import Optional, List, Dict, Union
from decimal import Decimal
import json
 
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
    perfil: Optional[PerfilResponse] = None

    class Config:
        from_attributes = True

# ------------------ USUARIO PERFIL ------------------
class UsuarioPerfil(BaseModel):
    id_usuario: int
    nombre: str
    nombre_usuario: str
    perfil: Optional[PerfilResponse] = None

    class Config:
        from_attributes = True

# ------------------ PUBLICACIÓN ------------------
class PublicacionBase(BaseModel):
    contenido: str
    medios: Optional[List[str]] = None
    tipo_medio: Optional[str] = "imagen"
    etiquetas: Optional[List[str]] = None  # Agregar campo etiquetas

class PublicacionCreate(PublicacionBase):
    id_usuario: int

class PublicacionResponse(PublicacionBase):
    id_publicacion: int
    id_usuario: int
    fecha_creacion: datetime
    usuario: UsuarioPerfil
    imagen: Optional[str] = None

    @validator('imagen', pre=True, always=True)
    def set_imagen(cls, v, values):
        if 'medios' in values and values['medios'] and len(values['medios']) > 0:
            return values['medios'][0]
        return None

    @validator('medios', pre=True)
    def parse_medios(cls, v):
        if isinstance(v, str):
            try:
                if v.startswith('[') and v.endswith(']'):
                    return json.loads(v)
                else:
                    return [v] if v else []
            except:
                return [v] if v else []
        return v

    @validator('etiquetas', pre=True)
    def parse_etiquetas(cls, v):
        if isinstance(v, str):
            try:
                if v.startswith('[') and v.endswith(']'):
                    return json.loads(v)
                else:
                    return [v] if v else []
            except:
                return [v] if v else []
        return v

    class Config:
        from_attributes = True
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
    expiracion: Optional[datetime] = None
    tipo: str

    class Config:
        from_attributes = True

# ------------------ NOTIFICACIONES ------------------
class NotificacionResponse(BaseModel):
    id_notificacion: int
    tipo: str
    mensaje: str
    fecha_creacion: datetime
    leida: bool

    class Config:
        from_attributes = True

# ------------------ CONFIGURACIÓN CHAT ------------------

class ConfiguracionChatBase(BaseModel):
    fondo_chat: str = "default"
    color_burbuja: str = "#6C63FF"

class ConfiguracionChatUpdate(ConfiguracionChatBase):
    pass

class ConfiguracionChatResponse(ConfiguracionChatBase):
    fondo_personalizado: Optional[str] = None
    
    class Config:
        from_attributes = True

# ------------------ CATEGORÍA ------------------
class CategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaResponse(CategoriaBase):
    id_categoria: int

    class Config:
        from_attributes = True
# Agrega estos esquemas al final del archivo

# ------------------ ACTUALIZAR USUARIO ------------------
class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo_electronico: Optional[EmailStr] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    tipo_arte_preferido: Optional[str] = None
    telefono: Optional[str] = None
    nombre_usuario: Optional[str] = None

# ------------------ CAMBIAR CONTRASEÑA ------------------
class CambiarContrasenaRequest(BaseModel):
    password_actual: str
    nueva_contrasena: str
    confirmar_contrasena: str

# ------------------ ELIMINAR CUENTA ------------------
class EliminarCuentaRequest(BaseModel):
    confirmacion: str

# ------------------ REPORTE PROBLEMA ------------------
class ReporteProblemaBase(BaseModel):
    tipo_problema: str
    descripcion: str
    email_contacto: EmailStr

class ReporteProblemaCreate(ReporteProblemaBase):
    pass

class ReporteProblemaResponse(ReporteProblemaBase):
    id_reporte: int
    id_usuario: int
    fecha_reporte: datetime
    estado: str

    class Config:
        from_attributes = True

# AGREGAR AL FINAL DEL ARCHIVO backend/schemas.py

# ------------------ GALERÍA DE ARTE ------------------
class CarpetaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    color: Optional[str] = "#6C63FF"
    icono: Optional[str] = "folder"
    es_publica: Optional[bool] = False

class CarpetaCreate(CarpetaBase):
    pass

class CarpetaResponse(CarpetaBase):
    id_carpeta: int
    id_usuario: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    total_archivos: int = 0
    tamano_total: Union[int, float, Decimal] = 0  # Cambia esto a Union

    class Config:
        from_attributes = True


class ArchivoBase(BaseModel):
    nombre_original: str
    descripcion: Optional[str] = None
    etiquetas: Optional[List[str]] = None
    es_publico: Optional[bool] = False

class ArchivoCreate(ArchivoBase):
    id_carpeta: int
    tipo: str
    extension: str
    tamano: int

class ArchivoResponse(ArchivoBase):
    id_archivo: int
    id_carpeta: int
    id_usuario: int
    nombre_archivo: str
    tipo: str
    extension: str
    tamano: int
    ruta: str
    miniatura: Optional[str] = None
    duracion: Optional[int] = None
    resolucion: Optional[str] = None
    fecha_subida: datetime
    fecha_actualizacion: datetime
    carpeta_nombre: Optional[str] = None

    @validator('etiquetas', pre=True)
    def parse_etiquetas(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return [v] if v else []
        return v

    class Config:
        from_attributes = True


class PublicarDesdeGaleria(BaseModel):
    id_archivo: int
    contenido: Optional[str] = None
    etiquetas: Optional[List[str]] = None


class EstadisticasGaleria(BaseModel):
    total_carpetas: int
    total_archivos: int
    tamano_total: Union[int, float, Decimal]  # Añade Union aquí también
    tamano_total_mb: float
    tipos_archivos: Dict[str, int]

    class Config:
        from_attributes = True