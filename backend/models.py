from sqlalchemy import Column, Integer, String, Date
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    correo_electronico = Column(String(100), unique=True, nullable=False)
    contrasena = Column(String(100), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    genero = Column(String(50), nullable=False)
    tipo_arte_preferido = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=False)
    nombre_usuario = Column(String(100), unique=True, nullable=False)
