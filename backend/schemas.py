from pydantic import BaseModel, ConfigDict
from datetime import date

class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    correo_electronico: str
    contrasena: str 
    fecha_nacimiento: date
    genero: str
    tipo_arte_preferido: str
    telefono: str
    nombre_usuario: str

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    model_config = ConfigDict(from_attributes=True)
