# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload
from backend import models, database, schemas
from backend.database import get_db
from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime, timedelta
from uuid import uuid4
from backend.models import ResetPasswordToken
from backend.schemas import ResetPasswordRequest, ForgotPasswordRequest
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi.responses import JSONResponse
import os
import shutil
from backend.config import settings



app = FastAPI()

# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------ CONFIGURACIÓN DE CORREO ------------------

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,

)
# ------------------ STATIC FILES ------------------
os.makedirs("static/perfiles", exist_ok=True)
os.makedirs("static/posts", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ------------------ CREAR TABLAS ------------------
models.Base.metadata.create_all(bind=database.engine)

# ------------------ AUTENTICACIÓN SIMPLIFICADA ------------------
def get_current_user_id(
    token: str = Header(..., alias="token"),
    user_id: int = Header(None, alias="id_usuario"),
    db: Session = Depends(get_db)
) -> int:
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    if token != "fake-token":
        raise HTTPException(status_code=401, detail="Token inválido")
    if not user_id:
        raise HTTPException(status_code=400, detail="ID de usuario no proporcionado")

    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario.id_usuario

# ------------------ USUARIOS ------------------
@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def create_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    nuevo_usuario = models.Usuario(**usuario.dict())
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    nuevo_perfil = models.Perfil(id_usuario=nuevo_usuario.id_usuario)
    db.add(nuevo_perfil)
    db.commit()

    return nuevo_usuario


@app.get("/usuarios", response_model=List[schemas.UsuarioResponse])
def get_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()


@app.delete("/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
def delete_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == usuario_id).first()
    if perfil:
        db.delete(perfil)
    db.delete(usuario)
    db.commit()
    return usuario

# ------------------ LOGIN ------------------
class LoginRequest(BaseModel):
    correo_electronico: EmailStr
    contrasena: str

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.correo_electronico == data.correo_electronico
    ).first()
    if not usuario or usuario.contrasena != data.contrasena:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == usuario.id_usuario).first()
    return {
        "token": "fake-token",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo_electronico": usuario.correo_electronico,
            "fecha_nacimiento": usuario.fecha_nacimiento,
            "genero": usuario.genero,
            "tipo_arte_preferido": usuario.tipo_arte_preferido,
            "telefono": usuario.telefono,
            "nombre_usuario": usuario.nombre_usuario,
            "perfil": {
                "descripcion": perfil.descripcion if perfil else None,
                "biografia": perfil.biografia if perfil else None,
                "foto_perfil": perfil.foto_perfil if perfil else None
            }
        }
    }

# ------------------ PERFILES ------------------
@app.get("/perfiles/{id_usuario}")
def obtener_perfil(
    id_usuario: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == id_usuario).first()
    if not perfil:
        perfil = models.Perfil(id_usuario=id_usuario)
        db.add(perfil)
        db.commit()
        db.refresh(perfil)

    sigue = db.query(models.SeguirUsuario).filter(
        models.SeguirUsuario.id_seguidor == user_id,
        models.SeguirUsuario.id_seguido == id_usuario
    ).first()

    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == id_usuario).first()

    return {
        "id_perfil": perfil.id_perfil,
        "id_usuario": perfil.id_usuario,
        "descripcion": perfil.descripcion,
        "biografia": perfil.biografia,
        "foto_perfil": perfil.foto_perfil,
        "sigo": bool(sigue),
        "usuario": {
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "nombre_usuario": usuario.nombre_usuario
        }
    }

@app.put("/perfiles/{id_usuario}", response_model=schemas.PerfilResponse)
async def actualizar_perfil(
    id_usuario: int,
    descripcion: str = Form(None),
    biografia: str = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db)
):
    perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == id_usuario).first()
    if not perfil:
        perfil = models.Perfil(id_usuario=id_usuario)
        db.add(perfil)
        db.commit()
        db.refresh(perfil)

    if descripcion:
        perfil.descripcion = descripcion
    if biografia:
        perfil.biografia = biografia

    if file and file.filename:
        os.makedirs("static/perfiles", exist_ok=True)
    
        timestamp = int(datetime.now().timestamp())
        filename = f"perfil_{id_usuario}_{timestamp}.jpg"
        file_path = os.path.join("static/perfiles", filename)

        for archivo in os.listdir("static/perfiles"):
            if archivo.startswith(f"perfil_{id_usuario}_"):
                os.remove(os.path.join("static/perfiles", archivo))


        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        perfil.foto_perfil = f"http://localhost:8000/static/perfiles/{filename}"

    db.commit()
    db.refresh(perfil)
    return perfil


# ------------------ PUBLICACIONES ------------------
@app.get("/publicaciones", response_model=List[schemas.PublicacionResponse])
def obtener_publicaciones(db: Session = Depends(get_db)):
    return db.query(models.Publicacion)\
        .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))\
        .order_by(models.Publicacion.fecha_creacion.desc()).all()

@app.post("/publicaciones", response_model=schemas.PublicacionResponse)
async def crear_publicacion(
    id_usuario: int = Form(...),
    contenido: str = Form(...),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db)
):
    imagen_url = None
    if file:
        os.makedirs("static/posts", exist_ok=True)
        filename = f"{id_usuario}_{file.filename}"
        ruta = os.path.join("static/posts", filename)
        with open(ruta, "wb") as f:
            f.write(await file.read())
        imagen_url = f"http://localhost:8000/static/posts/{filename}"

    nueva_pub = models.Publicacion(id_usuario=id_usuario, contenido=contenido, imagen=imagen_url)
    db.add(nueva_pub)
    db.commit()
    db.refresh(nueva_pub)
    return nueva_pub

# ------------------ SEGUIR USUARIO ------------------
@app.post("/seguir/{id_seguido}")
def seguir_usuario(
    id_seguido: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    if id_seguido == user_id:
        raise HTTPException(status_code=400, detail="No puedes seguirte a ti mismo")

    existente = db.query(models.SeguirUsuario).filter(
        models.SeguirUsuario.id_seguidor == user_id,
        models.SeguirUsuario.id_seguido == id_seguido
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya sigues a este usuario")

    nuevo = models.SeguirUsuario(id_seguidor=user_id, id_seguido=id_seguido)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    seguidor = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()
    noti = models.Notificacion(
        id_usuario=id_seguido,
        tipo="nuevo_seguidor",
        mensaje=f"{seguidor.nombre_usuario} comenzó a seguirte",
        id_referencia=nuevo.id_seguimiento
    )
    db.add(noti)
    db.commit()
    return {"mensaje": "Ahora sigues a este usuario"}
# ------------------ DEJAR DE SEGUIR ------------------
@app.delete("/dejar-seguir/{id_seguido}")
def dejar_de_seguir(
    id_seguido: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    if id_seguido == user_id:
        raise HTTPException(status_code=400, detail="No puedes dejar de seguirte a ti mismo")

    seguir = db.query(models.SeguirUsuario).filter(
        models.SeguirUsuario.id_seguidor == user_id,
        models.SeguirUsuario.id_seguido == id_seguido
    ).first()

    if not seguir:
        raise HTTPException(status_code=404, detail="No sigues a este usuario")

    db.delete(seguir)
    db.commit()
    return {"mensaje": "Has dejado de seguir a este usuario"}

# ------------------ SEGUIDORES ------------------
@app.get("/seguidores")
def obtener_seguidores(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    seguidores = db.query(models.SeguirUsuario).filter(models.SeguirUsuario.id_seguido == user_id).all()

    resultado = []
    for seg in seguidores:
        seguidor = db.query(models.Usuario).filter(models.Usuario.id_usuario == seg.id_seguidor).first()
        perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == seg.id_seguidor).first()
        resultado.append({
            "id_seguimiento": seg.id_seguimiento,
            "fecha_seguimiento": seg.fecha_seguimiento,
            "seguidor": {
                "id_usuario": seguidor.id_usuario,
                "nombre_usuario": seguidor.nombre_usuario,
                "foto_perfil": perfil.foto_perfil if perfil else None
            }
        })
    return resultado
# ------------------ SOLICITUDES DE AMISTAD ------------------
@app.post("/amistad/{id_receptor}")
def enviar_solicitud_amistad(
    id_receptor: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    if id_receptor == user_id:
        raise HTTPException(status_code=400, detail="No puedes enviarte una solicitud a ti mismo")

    # 🔹 1. Revisar si ya son amigos (tabla Amistad)
    ya_amigos = db.query(models.Amistad).filter(
        ((models.Amistad.id_usuario1 == user_id) & (models.Amistad.id_usuario2 == id_receptor)) |
        ((models.Amistad.id_usuario1 == id_receptor) & (models.Amistad.id_usuario2 == user_id)),
        models.Amistad.estado == "aceptada"
    ).first()

    if ya_amigos:
        raise HTTPException(status_code=400, detail="Ya son amigos, no puedes enviar otra solicitud")

    # 🔹 2. Revisar si ya hay una solicitud pendiente
    existente = db.query(models.SolicitudAmistad).filter(
        ((models.SolicitudAmistad.id_emisor == user_id) & (models.SolicitudAmistad.id_receptor == id_receptor)) |
        ((models.SolicitudAmistad.id_emisor == id_receptor) & (models.SolicitudAmistad.id_receptor == user_id)),
        models.SolicitudAmistad.estado == "pendiente"
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud pendiente entre ustedes")

    # 🔹 3. Crear la solicitud
    nueva = models.SolicitudAmistad(id_emisor=user_id, id_receptor=id_receptor)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    # 🔹 4. Crear notificación
    emisor = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()
    noti = models.Notificacion(
        id_usuario=id_receptor,
        tipo="solicitud_amistad",
        mensaje=f"{emisor.nombre_usuario} te ha enviado una solicitud de amistad",
        id_referencia=nueva.id_solicitud
    )
    db.add(noti)
    db.commit()

    return {"mensaje": "Solicitud de amistad enviada", "id_solicitud": nueva.id_solicitud}


@app.get("/solicitudes-amistad")
def obtener_solicitudes_pendientes(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    solicitudes = db.query(models.SolicitudAmistad)\
        .filter(models.SolicitudAmistad.id_receptor == user_id)\
        .filter(models.SolicitudAmistad.estado == "pendiente")\
        .all()

    resultado = []
    for s in solicitudes:
        emisor = db.query(models.Usuario).filter(models.Usuario.id_usuario == s.id_emisor).first()
        perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == s.id_emisor).first()
        resultado.append({
            "id_solicitud": s.id_solicitud,
            "fecha_envio": s.fecha_envio,
            "estado": s.estado,
            "emisor": {
                "id_usuario": emisor.id_usuario,
                "nombre_usuario": emisor.nombre_usuario,
                "foto_perfil": perfil.foto_perfil if perfil else None
            }
        })
    return resultado


@app.put("/amistad/{id_solicitud}")
def responder_solicitud_amistad(
    id_solicitud: int,
    estado: str = Form(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    
    solicitud = db.query(models.SolicitudAmistad).filter(
        models.SolicitudAmistad.id_solicitud == id_solicitud
    ).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if solicitud.id_receptor != user_id:
        raise HTTPException(status_code=403, detail="No puedes responder solicitudes que no son tuyas")

  
    if solicitud.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Esta solicitud ya fue respondida")

    # Validar estado
    if estado not in ["aceptada", "rechazada"]:
        raise HTTPException(status_code=400, detail="Estado inválido")

   
    solicitud.estado = estado
    db.commit()
    db.refresh(solicitud)

    receptor = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()
    noti_msg = (
        f"{receptor.nombre_usuario} aceptó tu solicitud de amistad"
        if estado == "aceptada"
        else f"{receptor.nombre_usuario} rechazó tu solicitud de amistad"
    )
    noti = models.Notificacion(
        id_usuario=solicitud.id_emisor,
        tipo=f"amistad_{estado}",
        mensaje=noti_msg,
        id_referencia=solicitud.id_solicitud
    )
    db.add(noti)
    db.commit()

   
    if estado == "aceptada":
        existe = db.query(models.Amistad).filter(
            ((models.Amistad.id_usuario1 == solicitud.id_emisor) & (models.Amistad.id_usuario2 == solicitud.id_receptor)) |
            ((models.Amistad.id_usuario1 == solicitud.id_receptor) & (models.Amistad.id_usuario2 == solicitud.id_emisor))
        ).first()

        if not existe:
            nueva_amistad = models.Amistad(
                id_usuario1=solicitud.id_emisor,
                id_usuario2=solicitud.id_receptor,
                estado="aceptada"
            )
            db.add(nueva_amistad)
            db.commit()

        
        db.delete(solicitud)
        db.commit()

    return {"mensaje": f"Solicitud {estado} correctamente"}

# ------------------ AMIGOS ------------------
@app.get("/amigos")
def obtener_amigos(
    id_usuario: int = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Retorna la lista de amigos de un usuario.
    - Si se pasa id_usuario: retorna los amigos de ese usuario.
    - Si no se pasa: retorna los amigos del usuario autenticado.
    """

    # Si no se pasa un id_usuario en la query, usar el autenticado
    id_usuario = id_usuario or user_id

    # Buscar amistades donde el usuario sea parte (como emisor o receptor)
    amistades = (
        db.query(models.Amistad)
        .filter(
            ((models.Amistad.id_usuario1 == id_usuario) | 
             (models.Amistad.id_usuario2 == id_usuario)),
            (models.Amistad.estado == "aceptada")
        )
        .all()
    )

    if not amistades:
        return []

    amigos = []
    for amistad in amistades:
        # Determinar el id del amigo (el otro usuario en la relación)
        amigo_id = (
            amistad.id_usuario2 if amistad.id_usuario1 == id_usuario 
            else amistad.id_usuario1
        )

        # Obtener información del amigo
        amigo = db.query(models.Usuario).filter(models.Usuario.id_usuario == amigo_id).first()
        if amigo:
            amigos.append({
                "id_usuario": amigo.id_usuario,
                "nombre_usuario": amigo.nombre_usuario,
                "foto_perfil": amigo.perfil.foto_perfil if amigo.perfil else None
            })

    return amigos

# ------------------ ELIMINAR AMIGO ------------------
@app.delete("/amigos/{id_amigo}")
def eliminar_amigo(
    id_amigo: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Elimina la relación de amistad entre el usuario actual y otro usuario.
    """
    amistad = db.query(models.Amistad).filter(
        ((models.Amistad.id_usuario1 == user_id) & (models.Amistad.id_usuario2 == id_amigo)) |
        ((models.Amistad.id_usuario1 == id_amigo) & (models.Amistad.id_usuario2 == user_id)),
        models.Amistad.estado == "aceptada"
    ).first()

    if not amistad:
        raise HTTPException(status_code=404, detail="No existe relación de amistad con este usuario")

    db.delete(amistad)
    db.commit()

    return {"mensaje": f"Has eliminado a {id_amigo} de tu lista de amigos"}

# ------------------ NOTIFICACIONES ------------------
@app.get("/notificaciones", response_model=List[schemas.NotificacionResponse])
def obtener_notificaciones(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    notificaciones = (
        db.query(models.Notificacion)
        .filter(models.Notificacion.id_usuario == user_id)
        .order_by(models.Notificacion.fecha.desc())
        .all()
    )

    return [
        {
            "id_notificacion": n.id_notificacion,
            "tipo": n.tipo,
            "mensaje": n.mensaje,
            "fecha_creacion": n.fecha,
            "leida": n.leido,
            "id_referencia": getattr(n, "id_referencia", None)
        }
        for n in notificaciones
    ]
    
@app.put("/notificaciones/leidas")
def marcar_notificaciones_leidas(
    db: Session = Depends(database.get_db),
    user_id: int = Depends(get_current_user_id)
):
    notificaciones = db.query(models.Notificacion).filter(
        models.Notificacion.id_usuario == user_id,
        models.Notificacion.leido == False
    ).all()

    for n in notificaciones:
        n.leido = True

    db.commit()
    return {"mensaje": f"{len(notificaciones)} notificaciones marcadas como leídas"}

# Agregar después del endpoint de seguidores existente

# ------------------ OBTENER USUARIOS SEGUIDOS ------------------
@app.get("/siguiendo")
def obtener_siguiendo(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    siguiendo = db.query(models.SeguirUsuario).filter(models.SeguirUsuario.id_seguidor == user_id).all()

    resultado = []
    for seg in siguiendo:
        seguido = db.query(models.Usuario).filter(models.Usuario.id_usuario == seg.id_seguido).first()
        perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == seg.id_seguido).first()
        resultado.append({
            "id_seguimiento": seg.id_seguimiento,
            "fecha_seguimiento": seg.fecha_seguimiento,
            "seguido": {
                "id_usuario": seguido.id_usuario,
                "nombre_usuario": seguido.nombre_usuario,
                "foto_perfil": perfil.foto_perfil if perfil else None
            }
        })
    return resultado

# ------------------ OBTENER ESTADÍSTICAS DEL PERFIL ------------------
@app.get("/estadisticas-perfil/{id_usuario}")
def obtener_estadisticas_perfil(id_usuario: int, db: Session = Depends(get_db)):
    # Contar seguidores
    seguidores = db.query(models.SeguirUsuario).filter(
        models.SeguirUsuario.id_seguido == id_usuario
    ).count()

    # Contar usuarios que sigue
    siguiendo = db.query(models.SeguirUsuario).filter(
        models.SeguirUsuario.id_seguidor == id_usuario
    ).count()

    # Contar publicaciones
    publicaciones = db.query(models.Publicacion).filter(
        models.Publicacion.id_usuario == id_usuario
    ).count()

    return {
        "seguidores": seguidores,
        "siguiendo": siguiendo,
        "publicaciones": publicaciones
    }

# ------------------ OBTENER PUBLICACIONES DE USUARIO ESPECÍFICO ------------------
@app.get("/publicaciones-usuario/{id_usuario}")
def obtener_publicaciones_usuario(id_usuario: int, db: Session = Depends(get_db)):
    publicaciones = db.query(models.Publicacion)\
        .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))\
        .filter(models.Publicacion.id_usuario == id_usuario)\
        .order_by(models.Publicacion.fecha_creacion.desc())\
        .all()
    return publicaciones

# ------------------ REPORTAR USUARIO ------------------
@app.post("/reportar/{id_reportado}")
async def reportar_usuario(
    id_reportado: int,
    motivo: str = Form(...),
    evidencia: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Permite reportar a otro usuario con un motivo y evidencia opcional."""
    if id_reportado == user_id:
        raise HTTPException(status_code=400, detail="No puedes reportarte a ti mismo")

    # Verificar que el usuario reportado exista
    usuario_reportado = db.query(models.Usuario).filter(models.Usuario.id_usuario == id_reportado).first()
    if not usuario_reportado:
        raise HTTPException(status_code=404, detail="Usuario reportado no encontrado")

    # Guardar evidencia si se adjunta
    evidencia_url = None
    if evidencia:
        os.makedirs("static/reportes", exist_ok=True)
        filename = f"reporte_{user_id}_{id_reportado}_{int(datetime.now().timestamp())}.jpg"
        path = os.path.join("static/reportes", filename)
        with open(path, "wb") as f:
            f.write(await evidencia.read())
        evidencia_url = f"http://localhost:8000/static/reportes/{filename}"

    # Crear reporte
    nuevo_reporte = models.ReporteUsuario(
        id_reportante=user_id,
        id_reportado=id_reportado,
        motivo=motivo,
        evidencia_url=evidencia_url,
        fecha=datetime.now(),
    )

    db.add(nuevo_reporte)
    db.commit()
    db.refresh(nuevo_reporte)

    return {
        "mensaje": "Reporte enviado correctamente",
        "reporte_id": nuevo_reporte.id_reporte,
        "evidencia": evidencia_url,
    }

# ------------------ RELACIONES SEGUIR / SEGUIDORES ------------------
@app.get("/seguidores/{id_usuario}")
def obtener_seguidores(id_usuario: int, db: Session = Depends(get_db)):
    seguidores = (
        db.query(models.SeguirUsuario)
        .filter(models.SeguirUsuario.id_seguido == id_usuario)
        .all()
    )

    resultado = []
    for seg in seguidores:
        seguidor = db.query(models.Usuario).filter(models.Usuario.id_usuario == seg.id_seguidor).first()
        perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == seg.id_seguidor).first()

        resultado.append({
            "id_seguimiento": seg.id_seguimiento,
            "fecha_seguimiento": seg.fecha_seguimiento,
            "id_seguidor": seg.id_seguidor,
            "nombre_usuario": seguidor.nombre_usuario if seguidor else "Usuario eliminado",
            "foto_perfil": perfil.foto_perfil if perfil else None
        })

    return resultado


@app.get("/siguiendo/{id_usuario}")
def obtener_siguiendo(id_usuario: int, db: Session = Depends(get_db)):
    siguiendo = (
        db.query(models.SeguirUsuario)
        .filter(models.SeguirUsuario.id_seguidor == id_usuario)
        .all()
    )

    resultado = []
    for seg in siguiendo:
        seguido = db.query(models.Usuario).filter(models.Usuario.id_usuario == seg.id_seguido).first()
        perfil = db.query(models.Perfil).filter(models.Perfil.id_usuario == seg.id_seguido).first()

        resultado.append({
            "id_seguimiento": seg.id_seguimiento,
            "fecha_seguimiento": seg.fecha_seguimiento,
            "id_seguido": seg.id_seguido,
            "nombre_usuario": seguido.nombre_usuario if seguido else "Usuario eliminado",
            "foto_perfil": perfil.foto_perfil if perfil else None
        })

    return resultado


# ------------------ OLVIDASTE TU CONTRASEÑA ------------------
@app.post("/olvidaste-contrasena")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    try:
        usuario = db.query(models.Usuario).filter(models.Usuario.correo_electronico == data.correo).first()
        if not usuario:
            # Por seguridad, no reveles si el correo existe o no
            return JSONResponse(
                status_code=200,
                content={"mensaje": "Si el correo existe, se ha enviado un enlace de recuperación"}
            )

        # Eliminar tokens previos
        db.query(models.ResetPasswordToken).filter(
            models.ResetPasswordToken.id_usuario == usuario.id_usuario
        ).delete()

        # Generar token único con expiración de 1 hora
        token = str(uuid4())
        expiracion = datetime.utcnow() + timedelta(hours=1)
        
        nuevo_token = models.ResetPasswordToken(
            id_usuario=usuario.id_usuario, 
            token=token, 
            expiracion=expiracion
        )
        db.add(nuevo_token)
        db.commit()

        # URL del frontend
        frontend_url = f"http://localhost:3000/reset-password/{token}"

        # Enviar correo con manejo de errores
        mensaje = MessageSchema(
            subject="Recupera tu contraseña - Artiverse",
            recipients=[usuario.correo_electronico],
            body=f"""
            <h3>Hola {usuario.nombre_usuario},</h3>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para restablecerla (válido por 1 hora):</p>
            <a href="{frontend_url}" target="_blank" style="
                background-color: #007bff; 
                color: white; 
                padding: 10px 20px; 
                text-decoration: none; 
                border-radius: 5px;
                display: inline-block;
                margin: 10px 0;">
                Restablecer Contraseña
            </a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">{frontend_url}</p>
            <p>Si no solicitaste este cambio, ignora este correo.</p>
            <br>
            <p>Saludos,<br>El equipo de Artiverse</p>
            """,
            subtype="html"
        )

        fm = FastMail(conf)
        await fm.send_message(mensaje)
        
        return {
            "mensaje": "Si el correo existe, se ha enviado un enlace de recuperación"
        }

    except Exception as e:
        print(f"Error enviando correo: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Error al enviar el correo de recuperación. Por favor, intenta más tarde."
        )


@app.post("/restablecer-contrasena")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_entry = db.query(models.ResetPasswordToken).filter(models.ResetPasswordToken.token == data.token).first()
    if not token_entry:
        raise HTTPException(status_code=400, detail="Token inválido o inexistente")

    if token_entry.expiracion < datetime.utcnow():
        db.delete(token_entry)
        db.commit()
        raise HTTPException(status_code=400, detail="El token ha expirado")

    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == token_entry.id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar contraseña
    usuario.contrasena = data.nueva_contrasena
    db.delete(token_entry)
    db.commit()

    return {"mensaje": "Contraseña restablecida correctamente"}

# ------------------ BLOQUEAR USUARIO ------------------
@app.post("/bloquear/{id_usuario_bloqueado}")
def bloquear_usuario(
    id_usuario_bloqueado: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Bloquear a otro usuario con verificación completa"""
    if id_usuario_bloqueado == user_id:
        raise HTTPException(status_code=400, detail="No puedes bloquearte a ti mismo")

    # Verificar si el usuario a bloquear existe
    usuario_a_bloquear = db.query(models.Usuario).filter(
        models.Usuario.id_usuario == id_usuario_bloqueado
    ).first()
    
    if not usuario_a_bloquear:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar si ya está bloqueado
    bloqueo_existente = db.query(models.BloqueoUsuario).filter(
        models.BloqueoUsuario.id_bloqueador == user_id,
        models.BloqueoUsuario.id_bloqueado == id_usuario_bloqueado
    ).first()

    if bloqueo_existente:
        raise HTTPException(status_code=400, detail="Ya has bloqueado a este usuario")

    # Crear bloqueo
    nuevo_bloqueo = models.BloqueoUsuario(
        id_bloqueador=user_id,
        id_bloqueado=id_usuario_bloqueado,
        fecha_bloqueo=datetime.utcnow()
    )
    db.add(nuevo_bloqueo)
    
    # Eliminar relaciones de seguimiento si existen (en ambas direcciones)
    db.query(models.SeguirUsuario).filter(
        ((models.SeguirUsuario.id_seguidor == user_id) & 
         (models.SeguirUsuario.id_seguido == id_usuario_bloqueado)) |
        ((models.SeguirUsuario.id_seguidor == id_usuario_bloqueado) & 
         (models.SeguirUsuario.id_seguido == user_id))
    ).delete()
    
    # Eliminar solicitudes de amistad pendientes
    db.query(models.SolicitudAmistad).filter(
        ((models.SolicitudAmistad.id_emisor == user_id) & 
         (models.SolicitudAmistad.id_receptor == id_usuario_bloqueado)) |
        ((models.SolicitudAmistad.id_emisor == id_usuario_bloqueado) & 
         (models.SolicitudAmistad.id_receptor == user_id))
    ).delete()
    
    # Eliminar relación de amistad si existe
    db.query(models.Amistad).filter(
        ((models.Amistad.id_usuario1 == user_id) & 
         (models.Amistad.id_usuario2 == id_usuario_bloqueado)) |
        ((models.Amistad.id_usuario1 == id_usuario_bloqueado) & 
         (models.Amistad.id_usuario2 == user_id))
    ).delete()
    
    db.commit()

    return {"mensaje": "Usuario bloqueado correctamente"}
# ------------------ ELIMINAR PUBLICACIÓN ------------------
@app.delete("/publicaciones/{id_publicacion}")
def eliminar_publicacion(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Eliminar una publicación (solo el dueño puede eliminarla)"""
    publicacion = db.query(models.Publicacion).filter(
        models.Publicacion.id_publicacion == id_publicacion
    ).first()

    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    if publicacion.id_usuario != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta publicación")

    db.delete(publicacion)
    db.commit()

    return {"mensaje": "Publicación eliminada correctamente"}

# ------------------ NO ME INTERESA ------------------
@app.post("/no-me-interesa/{id_publicacion}")
def no_me_interesa(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Marcar una publicación como 'No me interesa'"""
    
    # Verificar que la publicación existe
    publicacion = db.query(models.Publicacion).filter(
        models.Publicacion.id_publicacion == id_publicacion
    ).first()
    
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    # Verificar si ya existe en no me interesa
    existente = db.query(models.NoMeInteresa).filter(
        models.NoMeInteresa.id_usuario == user_id,
        models.NoMeInteresa.id_publicacion == id_publicacion
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya marcaste esta publicación como 'No me interesa'")

    # Crear nuevo registro
    nuevo = models.NoMeInteresa(
        id_usuario=user_id,
        id_publicacion=id_publicacion,
        fecha=datetime.utcnow()
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {"mensaje": "Publicación marcada como 'No me interesa'", "id": nuevo.id_no_me_interesa}
# ------------------ OBTENER USUARIOS BLOQUEADOS ------------------
@app.get("/usuarios-bloqueados")
def obtener_usuarios_bloqueados(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener lista de usuarios bloqueados por el usuario actual"""
    bloqueos = db.query(models.BloqueoUsuario).filter(
        models.BloqueoUsuario.id_bloqueador == user_id
    ).all()

    resultado = []
    for bloqueo in bloqueos:
        usuario_bloqueado = db.query(models.Usuario).filter(
            models.Usuario.id_usuario == bloqueo.id_bloqueado
        ).first()
        
        if usuario_bloqueado:
            perfil = db.query(models.Perfil).filter(
                models.Perfil.id_usuario == usuario_bloqueado.id_usuario
            ).first()
            
            resultado.append({
                "id_bloqueo": bloqueo.id_bloqueo,
                "fecha_bloqueo": bloqueo.fecha_bloqueo,
                "usuario": {
                    "id_usuario": usuario_bloqueado.id_usuario,
                    "nombre_usuario": usuario_bloqueado.nombre_usuario,
                    "foto_perfil": perfil.foto_perfil if perfil else None
                }
            })

    return resultado

# ------------------ OBTENER PUBLICACIONES NO ME INTERESA ------------------
@app.get("/no-me-interesa")
def obtener_no_me_interesa(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener publicaciones marcadas como 'No me interesa'"""
    no_me_interesa = db.query(models.NoMeInteresa).filter(
        models.NoMeInteresa.id_usuario == user_id
    ).all()

    resultado = []
    for item in no_me_interesa:
        publicacion = db.query(models.Publicacion).filter(
            models.Publicacion.id_publicacion == item.id_publicacion
        ).first()
        
        if publicacion:
            usuario = db.query(models.Usuario).filter(
                models.Usuario.id_usuario == publicacion.id_usuario
            ).first()
            
            perfil = db.query(models.Perfil).filter(
                models.Perfil.id_usuario == usuario.id_usuario
            ).first() if usuario else None
            
            resultado.append({
                "id_no_me_interesa": item.id_no_me_interesa,  # Cambiado
                "fecha": item.fecha,
                "publicacion": {
                    "id_publicacion": publicacion.id_publicacion,
                    "contenido": publicacion.contenido,
                    "imagen": publicacion.imagen,
                    "fecha_creacion": publicacion.fecha_creacion,
                    "usuario": {
                        "id_usuario": usuario.id_usuario,
                        "nombre_usuario": usuario.nombre_usuario,
                        "foto_perfil": perfil.foto_perfil if perfil else None
                    } if usuario else None
                }
            })

    return resultado

# ------------------ DESBLOQUEAR USUARIO ------------------
@app.delete("/desbloquear/{id_usuario_bloqueado}")
def desbloquear_usuario(
    id_usuario_bloqueado: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Desbloquear a un usuario previamente bloqueado"""
    bloqueo = db.query(models.BloqueoUsuario).filter(
        models.BloqueoUsuario.id_bloqueador == user_id,
        models.BloqueoUsuario.id_bloqueado == id_usuario_bloqueado
    ).first()

    if not bloqueo:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en lista de bloqueados")

    db.delete(bloqueo)
    db.commit()

    return {"mensaje": "Usuario desbloqueado correctamente"}

# ------------------ QUITAR NO ME INTERESA ------------------
@app.delete("/quitar-no-me-interesa/{id_publicacion}")
def quitar_no_me_interesa(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Quitar una publicación de la lista 'No me interesa'"""
    item = db.query(models.NoMeInteresa).filter(
        models.NoMeInteresa.id_usuario == user_id,
        models.NoMeInteresa.id_publicacion == id_publicacion
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Publicación no encontrada en lista 'No me interesa'")

    db.delete(item)
    db.commit()

    return {"mensaje": "Publicación removida de 'No me interesa'"}
# ------------------ HOME ------------------
@app.get("/home")
def home():
    return {"contenido": "<div>Barra de navegación</div><div>Publicaciones</div><div>Categorías</div><div>Sugerencias</div>"}