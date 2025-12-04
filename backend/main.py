import os
import shutil
import secrets
import string
from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json 
import uuid
from backend.chat import router as chat_router
from fastapi import Depends, FastAPI, Request, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session, joinedload
from jose import jwt

from backend import database, models, schemas
from backend.config import settings
from backend.database import get_db
from backend.schemas import ForgotPasswordRequest, ResetPasswordRequest, ConfiguracionChatUpdate

app = FastAPI()

# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ CONFIGURACIÓN JWT ------------------
SECRET_KEY = "tu-secreto-aqui"  # Cambia esto por una clave segura
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ------------------ CONFIGURACIÓN DE CORREO ------------------
conf = None
if settings.MAIL_USERNAME and settings.MAIL_PASSWORD and settings.MAIL_FROM:
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

# ------------------ DIRECTORIOS ------------------
os.makedirs("static/perfiles", exist_ok=True)
os.makedirs("static/posts", exist_ok=True)
os.makedirs("static/chat_files/images", exist_ok=True)  
os.makedirs("static/chat_files/videos", exist_ok=True)  
os.makedirs("static/chat_fondos", exist_ok=True)

# ------------------ STATIC FILES ------------------
app.mount("/static", StaticFiles(directory="static"), name="static")

# ------------------ CREAR TABLAS ------------------
models.Base.metadata.create_all(bind=database.engine)

# ------------------ AUTENTICACIÓN SIMPLIFICADA ------------------
def get_current_user_id(
    token: str = Header(None, alias="token"),
    user_id: str = Header(None, alias="id_usuario"),
    db: Session = Depends(get_db)
) -> int:
    if not token or token == "" or token == "null" or token == "undefined":
        raise HTTPException(status_code=401, detail="Token requerido o inválido")
    
    if not user_id or user_id == "" or user_id == "null" or user_id == "undefined":
        raise HTTPException(status_code=400, detail="ID de usuario no proporcionado")
    
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id_int).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return usuario.id_usuario

# ------------------ FUNCIONES AUXILIARES PARA ARCHIVOS ------------------
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "bmp", "webp"}
ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "wmv", "flv", "webm"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename: str, file_type: str) -> bool:
    """Verifica si el archivo tiene una extensión permitida"""
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    if file_type == "imagen":
        return ext in ALLOWED_IMAGE_EXTENSIONS
    elif file_type == "video":
        return ext in ALLOWED_VIDEO_EXTENSIONS
    return False

def save_chat_file(file: UploadFile, file_type: str) -> str:
    """Guarda un archivo de chat y retorna la ruta relativa"""
    if not allowed_file(file.filename, file_type):
        raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido para {file_type}")
    
    # Generar nombre único para el archivo
    file_extension = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    if file_type == "imagen":
        file_path = f"static/chat_files/images/{unique_filename}"
    else:  # video
        file_path = f"static/chat_files/videos/{unique_filename}"
    
    # Guardar el archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return f"/{file_path}"

# ------------------ USUARIOS ------------------
@app.post("/usuarios", response_model=schemas.UsuarioResponse)
def create_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    nuevo_usuario = models.Usuario(**usuario.model_dump())
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

# ------------------ LOGIN  ------------------
class LoginRequest(BaseModel):
    correo_electronico: EmailStr
    contrasena: str

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    correo = data.correo_electronico
    contrasena = data.contrasena
    
    # Buscar usuario por correo con perfil cargado
    usuario = (
        db.query(models.Usuario)
        .options(joinedload(models.Usuario.perfil))
        .filter(models.Usuario.correo_electronico == correo)
        .first()
    )

    # ---------------------------
    # LOGIN CON GOOGLE / FACEBOOK (OAuth)
    # ---------------------------
    if contrasena == "firebase_oauth":
        # Si el usuario no existe, crearlo
        if not usuario:
            # Generar nombre de usuario único
            base_username = correo.split("@")[0]
            username = base_username
            counter = 1
            
            # Verificar si el nombre de usuario ya existe
            while db.query(models.Usuario).filter_by(nombre_usuario=username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Crear nuevo usuario
            nuevo_usuario = models.Usuario(
                nombre=correo.split("@")[0],
                apellido="",
                correo_electronico=correo,
                contrasena="",  # Contraseña vacía para OAuth
                fecha_nacimiento=None,
                genero="",
                tipo_arte_preferido="",
                telefono="",
                nombre_usuario=username,
              
            )
            db.add(nuevo_usuario)
            db.commit()
            db.refresh(nuevo_usuario)
            
            # Actualizar la variable usuario
            usuario = (
                db.query(models.Usuario)
                .options(joinedload(models.Usuario.perfil))
                .filter(models.Usuario.id_usuario == nuevo_usuario.id_usuario)
                .first()
            )
    
    # ---------------------------
    # LOGIN NORMAL (email + password)
    # ---------------------------
    else:
        if not usuario:
            raise HTTPException(
                status_code=401, 
                detail="Credenciales incorrectas"
            )
        
        # Verificar contraseña (considera usar hashing en producción)
        if usuario.contrasena != contrasena:
            raise HTTPException(
                status_code=401, 
                detail="Credenciales incorrectas"
            )

    # Asegurarse de que existe un perfil (para ambos casos)
    if not usuario.perfil:
        perfil = models.Perfil(
            id_usuario=usuario.id_usuario,
            descripcion="",
            biografia="",
            foto_perfil=""
        )
        db.add(perfil)
        db.commit()
        db.refresh(usuario)

    # Crear token JWT
    token_data = {
        "id_usuario": usuario.id_usuario,
        "correo": usuario.correo_electronico,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    token = create_access_token(token_data)

    # Preparar respuesta
    response_data = {
        "token": token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # en segundos
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo_electronico": usuario.correo_electronico,
            "fecha_nacimiento": usuario.fecha_nacimiento.isoformat() if usuario.fecha_nacimiento else None,
            "genero": usuario.genero,
            "tipo_arte_preferido": usuario.tipo_arte_preferido,
            "telefono": usuario.telefono,
            "nombre_usuario": usuario.nombre_usuario,
            "perfil": {
                "id_perfil": usuario.perfil.id_perfil,
                "descripcion": usuario.perfil.descripcion,
                "biografia": usuario.perfil.biografia,
                "foto_perfil": usuario.perfil.foto_perfil
            } if usuario.perfil else None
        }
    }

    return response_data

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

@app.post("/publicaciones", response_model=schemas.PublicacionResponse)
async def crear_publicacion(
    id_usuario: int = Form(...),
    contenido: str = Form(None),  # Cambiar a None para permitir posts sin texto
    etiquetas: str = Form(None),  # Recibir etiquetas como string JSON (nuevo)
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        medios_urls = []
        tipo_medio = "texto"  # Valor por defecto
        
        # Procesar múltiples archivos
        if files and len(files) > 0:
            for file in files:
                if file.filename:
                    # Validar tipo de archivo
                    file_extension = file.filename.split('.')[-1].lower()
                    is_video = file_extension in ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
                    is_image = file_extension in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
                    
                    if not (is_video or is_image):
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Tipo de archivo no soportado: {file.filename}"
                        )
                    
                    # Determinar carpeta y tipo
                    if is_video:
                        folder = "static/videos"
                        file_tipo_medio = "video"
                    else:
                        folder = "static/posts" 
                        file_tipo_medio = "imagen"
                    
                    # Actualizar tipo_medio principal
                    if len(medios_urls) == 0:  # Primer archivo determina el tipo principal
                        tipo_medio = file_tipo_medio
                    
                    os.makedirs(folder, exist_ok=True)
                    
                    # Generar nombre único
                    unique_filename = f"{uuid.uuid4()}_{file.filename}"
                    ruta = os.path.join(folder, unique_filename)
                    
                    # Guardar archivo
                    with open(ruta, "wb") as f:
                        content = await file.read()
                        f.write(content)
                    
                    url_medio = f"http://localhost:8000/{folder}/{unique_filename}"
                    medios_urls.append(url_medio)
        
        # Parsear etiquetas si existen (nuevo)
        lista_etiquetas = []
        if etiquetas:
            try:
                lista_etiquetas = json.loads(etiquetas)
                if not isinstance(lista_etiquetas, list):
                    lista_etiquetas = [lista_etiquetas]
            except:
                lista_etiquetas = [etiquetas]
        
        # Crear publicación con etiquetas
        nueva_pub = models.Publicacion(
            id_usuario=id_usuario, 
            contenido=contenido or "",  # Permitir contenido vacío
            imagen=medios_urls[0] if medios_urls else None,  # Primer medio para compatibilidad
            tipo_medio=tipo_medio,
            etiquetas=json.dumps(lista_etiquetas) if lista_etiquetas else None  # Nuevo campo
        )
        
        db.add(nueva_pub)
        db.commit()
        db.refresh(nueva_pub)
        
        # Si hay múltiples medios, guardarlos en una tabla separada (si existe)
        if len(medios_urls) > 1:
            # Aquí puedes guardar los medios adicionales en otra tabla
            # Por ahora solo usamos el primer medio para 'imagen'
            pass
        
        # Cargar relaciones
        db.refresh(nueva_pub, ['usuario'])
        if nueva_pub.usuario:
            db.refresh(nueva_pub.usuario, ['perfil'])
        
        return nueva_pub
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creando publicación: {str(e)}")

@app.get("/publicaciones", response_model=List[schemas.PublicacionResponse])
def obtener_publicaciones(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # ... (mantener tu código existente de filtros)
    
    usuarios_bloqueados = db.query(models.BloqueoUsuario.id_bloqueado).filter(
        models.BloqueoUsuario.id_bloqueador == user_id
    ).all()
    ids_usuarios_bloqueados = [ub[0] for ub in usuarios_bloqueados]

    usuarios_que_me_bloquearon = db.query(models.BloqueoUsuario.id_bloqueador).filter(
        models.BloqueoUsuario.id_bloqueado == user_id
    ).all()
    ids_usuarios_que_me_bloquearon = [ub[0] for ub in usuarios_que_me_bloquearon]

    no_me_interesa = db.query(models.NoMeInteresa.id_publicacion).filter(
        models.NoMeInteresa.id_usuario == user_id
    ).all()
    ids_no_me_interesa = [nmi[0] for nmi in no_me_interesa]

    publicaciones = (
        db.query(models.Publicacion)
        .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))
        .filter(
            ~models.Publicacion.id_usuario.in_(ids_usuarios_bloqueados),
            ~models.Publicacion.id_usuario.in_(ids_usuarios_que_me_bloquearon),
            ~models.Publicacion.id_publicacion.in_(ids_no_me_interesa)
        )
        .order_by(models.Publicacion.fecha_creacion.desc())
        .all()
    )

    return publicaciones

@app.get("/publicaciones/categoria/{categoria_nombre}", response_model=List[schemas.PublicacionResponse])
def obtener_publicaciones_por_categoria(
    categoria_nombre: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene publicaciones filtradas por categoría (etiqueta).
    """
    try:
        # Normalizar nombre de categoría
        categoria_normalizada = categoria_nombre.lower().strip()
        
        # Obtener filtros de bloqueo y "no me interesa"
        usuarios_bloqueados = db.query(models.BloqueoUsuario.id_bloqueado).filter(
            models.BloqueoUsuario.id_bloqueador == user_id
        ).all()
        ids_usuarios_bloqueados = [ub[0] for ub in usuarios_bloqueados]

        usuarios_que_me_bloquearon = db.query(models.BloqueoUsuario.id_bloqueador).filter(
            models.BloqueoUsuario.id_bloqueado == user_id
        ).all()
        ids_usuarios_que_me_bloquearon = [ub[0] for ub in usuarios_que_me_bloquearon]

        no_me_interesa = db.query(models.NoMeInteresa.id_publicacion).filter(
            models.NoMeInteresa.id_usuario == user_id
        ).all()
        ids_no_me_interesa = [nmi[0] for nmi in no_me_interesa]

        # Obtener todas las publicaciones con filtros aplicados
        todas_publicaciones = (
            db.query(models.Publicacion)
            .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))
            .filter(
                ~models.Publicacion.id_usuario.in_(ids_usuarios_bloqueados),
                ~models.Publicacion.id_usuario.in_(ids_usuarios_que_me_bloquearon),
                ~models.Publicacion.id_publicacion.in_(ids_no_me_interesa)
            )
            .order_by(models.Publicacion.fecha_creacion.desc())
            .all()
        )
        
        # Filtrar por etiqueta
        publicaciones_filtradas = []
        for pub in todas_publicaciones:
            if pub.etiquetas:
                try:
                    # Parsear etiquetas JSON
                    etiquetas_lista = json.loads(pub.etiquetas) if isinstance(pub.etiquetas, str) else pub.etiquetas
                    
                    # Verificar si alguna etiqueta coincide con la categoría buscada
                    if etiquetas_lista:
                        # Normalizar etiquetas para comparación
                        etiquetas_normalizadas = [str(tag).lower().strip() for tag in etiquetas_lista]
                        
                        # Buscar coincidencia exacta o parcial
                        if (categoria_normalizada in etiquetas_normalizadas or
                            any(categoria_normalizada in tag for tag in etiquetas_normalizadas)):
                            publicaciones_filtradas.append(pub)
                except Exception as e:
                    print(f"Error al parsear etiquetas para publicación {pub.id_publicacion}: {e}")
                    # Si hay error al parsear, verificar si el string contiene la categoría
                    if (pub.etiquetas and 
                        isinstance(pub.etiquetas, str) and 
                        categoria_normalizada in pub.etiquetas.lower()):
                        publicaciones_filtradas.append(pub)
        
        print(f"📊 Encontradas {len(publicaciones_filtradas)} publicaciones para categoría '{categoria_nombre}'")
        
        if not publicaciones_filtradas:
            # Si no hay publicaciones, devolver lista vacía
            return []
        
        return publicaciones_filtradas
        
    except Exception as e:
        print(f"❌ Error obteniendo publicaciones por categoría: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )
    
@app.get("/publicaciones/categorias/{categorias}")
def obtener_publicaciones_por_categorias(
    categorias: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene publicaciones filtradas por múltiples categorías separadas por coma.
    Ej: /publicaciones/categorias/danza,música
    """
    try:
        # Dividir categorías por coma
        categorias_lista = [cat.strip().lower() for cat in categorias.split(",") if cat.strip()]
        
        if not categorias_lista:
            raise HTTPException(
                status_code=400, 
                detail="Debe proporcionar al menos una categoría"
            )
        
        # Obtener filtros de bloqueo y "no me interesa"
        usuarios_bloqueados = db.query(models.BloqueoUsuario.id_bloqueado).filter(
            models.BloqueoUsuario.id_bloqueador == user_id
        ).all()
        ids_usuarios_bloqueados = [ub[0] for ub in usuarios_bloqueados]

        usuarios_que_me_bloquearon = db.query(models.BloqueoUsuario.id_bloqueador).filter(
            models.BloqueoUsuario.id_bloqueado == user_id
        ).all()
        ids_usuarios_que_me_bloquearon = [ub[0] for ub in usuarios_que_me_bloquearon]

        no_me_interesa = db.query(models.NoMeInteresa.id_publicacion).filter(
            models.NoMeInteresa.id_usuario == user_id
        ).all()
        ids_no_me_interesa = [nmi[0] for nmi in no_me_interesa]

        # Obtener todas las publicaciones con filtros aplicados
        todas_publicaciones = (
            db.query(models.Publicacion)
            .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))
            .filter(
                ~models.Publicacion.id_usuario.in_(ids_usuarios_bloqueados),
                ~models.Publicacion.id_usuario.in_(ids_usuarios_que_me_bloquearon),
                ~models.Publicacion.id_publicacion.in_(ids_no_me_interesa)
            )
            .order_by(models.Publicacion.fecha_creacion.desc())
            .all()
        )
        
        # Filtrar por múltiples categorías
        publicaciones_filtradas = []
        for pub in todas_publicaciones:
            if pub.etiquetas:
                try:
                    etiquetas_lista = json.loads(pub.etiquetas) if isinstance(pub.etiquetas, str) else pub.etiquetas
                    
                    if etiquetas_lista:
                        etiquetas_normalizadas = [str(tag).lower().strip() for tag in etiquetas_lista]
                        
                        # Verificar si alguna etiqueta coincide con alguna categoría buscada
                        for categoria in categorias_lista:
                            if (categoria in etiquetas_normalizadas or
                                any(categoria in tag for tag in etiquetas_normalizadas)):
                                publicaciones_filtradas.append(pub)
                                break  # Si coincide con alguna categoría, agregar y pasar a siguiente publicación
                except:
                    if pub.etiquetas and isinstance(pub.etiquetas, str):
                        etiquetas_str = pub.etiquetas.lower()
                        for categoria in categorias_lista:
                            if categoria in etiquetas_str:
                                publicaciones_filtradas.append(pub)
                                break
        
        print(f"📊 Encontradas {len(publicaciones_filtradas)} publicaciones para categorías: {categorias_lista}")
        
        return publicaciones_filtradas
        
    except Exception as e:
        print(f"Error obteniendo publicaciones por múltiples categorías: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )
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
            "id_referencia": n.id_referencia if n.id_referencia is not None else None
        }
        for n in notificaciones
    ]
    
@app.put("/notificaciones/leidas")
def marcar_notificaciones_leidas(
    db: Session = Depends(get_db),
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

    # Me gusta QUE DA el usuario (en publicaciones)
    me_gusta_da = db.query(models.MeGusta).filter(
        models.MeGusta.id_usuario == id_usuario
    ).count()

    # Me gusta QUE RECIBE el usuario (en sus publicaciones) - optimizado con join
    me_gusta_recibe = db.query(models.MeGusta).join(
        models.Publicacion, models.MeGusta.id_publicacion == models.Publicacion.id_publicacion
    ).filter(
        models.Publicacion.id_usuario == id_usuario
    ).count()

    # Me gusta QUE DA en comentarios
    me_gusta_comentarios_da = db.query(models.MeGustaComentario).filter(
        models.MeGustaComentario.id_usuario == id_usuario
    ).count()

    # Me gusta QUE RECIBE en sus comentarios - optimizado con join
    me_gusta_comentarios_recibe = db.query(models.MeGustaComentario).join(
        models.Comentario, models.MeGustaComentario.id_comentario == models.Comentario.id_comentario
    ).filter(
        models.Comentario.id_usuario == id_usuario
    ).count()

    return {
        "seguidores": seguidores,
        "siguiendo": siguiendo,
        "publicaciones": publicaciones,
        "me_gusta_da": me_gusta_da,
        "me_gusta_recibe": me_gusta_recibe,
        "me_gusta_comentarios_da": me_gusta_comentarios_da,
        "me_gusta_comentarios_recibe": me_gusta_comentarios_recibe,
        "total_me_gusta_da": me_gusta_da + me_gusta_comentarios_da,
        "total_me_gusta_recibe": me_gusta_recibe + me_gusta_comentarios_recibe
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

        if conf:
            fm = FastMail(conf)
            await fm.send_message(mensaje)
        else:
            print("⚠️ Configuración de correo no disponible. No se puede enviar el email.")
        
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


# ------------------ ME GUSTA PUBLICACIÓN ------------------
@app.post("/me-gusta/{id_publicacion}")
def dar_me_gusta(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Dar me gusta a una publicación"""
    # Verificar que la publicación existe
    publicacion = db.query(models.Publicacion).filter(
        models.Publicacion.id_publicacion == id_publicacion
    ).first()
    
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    # Verificar si ya dio me gusta
    existente = db.query(models.MeGusta).filter(
        models.MeGusta.id_usuario == user_id,
        models.MeGusta.id_publicacion == id_publicacion
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya diste me gusta a esta publicación")

    # Crear nuevo me gusta
    nuevo_me_gusta = models.MeGusta(
        id_usuario=user_id,
        id_publicacion=id_publicacion
    )
    db.add(nuevo_me_gusta)
    db.commit()
    db.refresh(nuevo_me_gusta)

    # Crear notificación si no es el propio usuario
    if publicacion.id_usuario != user_id:
        usuario_actual = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()
        noti = models.Notificacion(
            id_usuario=publicacion.id_usuario,
            tipo="me_gusta",
            mensaje=f"A {usuario_actual.nombre_usuario} le gusta tu publicación",
            id_referencia=id_publicacion
        )
        db.add(noti)
        db.commit()

    return {"mensaje": "Me gusta agregado", "id_megusta": nuevo_me_gusta.id_megusta}

@app.delete("/me-gusta/{id_publicacion}")
def quitar_me_gusta(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Quitar me gusta de una publicación"""
    me_gusta = db.query(models.MeGusta).filter(
        models.MeGusta.id_usuario == user_id,
        models.MeGusta.id_publicacion == id_publicacion
    ).first()

    if not me_gusta:
        raise HTTPException(status_code=404, detail="No has dado me gusta a esta publicación")

    db.delete(me_gusta)
    db.commit()

    return {"mensaje": "Me gusta eliminado"}

# ------------------ GUARDAR PUBLICACIÓN ------------------
@app.post("/guardar/{id_publicacion}")
def guardar_publicacion(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Guardar una publicación"""
    # Verificar que la publicación existe
    publicacion = db.query(models.Publicacion).filter(
        models.Publicacion.id_publicacion == id_publicacion
    ).first()
    
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    # Verificar si ya está guardada
    existente = db.query(models.Guardado).filter(
        models.Guardado.id_usuario == user_id,
        models.Guardado.id_publicacion == id_publicacion
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya tienes guardada esta publicación")

    # Crear nuevo guardado
    nuevo_guardado = models.Guardado(
        id_usuario=user_id,
        id_publicacion=id_publicacion
    )
    db.add(nuevo_guardado)
    db.commit()
    db.refresh(nuevo_guardado)

    return {"mensaje": "Publicación guardada", "id_guardado": nuevo_guardado.id_guardado}

@app.delete("/guardar/{id_publicacion}")
def quitar_guardado(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Quitar publicación de guardados"""
    guardado = db.query(models.Guardado).filter(
        models.Guardado.id_usuario == user_id,
        models.Guardado.id_publicacion == id_publicacion
    ).first()

    if not guardado:
        raise HTTPException(status_code=404, detail="No tienes guardada esta publicación")

    db.delete(guardado)
    db.commit()

    return {"mensaje": "Publicación eliminada de guardados"}

# ------------------ COMENTARIOS ------------------
@app.post("/comentarios", response_model=schemas.ComentarioResponse)
def crear_comentario(
    comentario: schemas.ComentarioBase,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Crear un comentario (puede ser respuesta a otro comentario)"""
    # Verificar que la publicación existe
    publicacion = db.query(models.Publicacion).filter(
        models.Publicacion.id_publicacion == comentario.id_publicacion
    ).first()
    
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    # Si es respuesta, verificar que el comentario padre existe
    if comentario.id_comentario_padre:
        comentario_padre = db.query(models.Comentario).filter(
            models.Comentario.id_comentario == comentario.id_comentario_padre
        ).first()
        if not comentario_padre:
            raise HTTPException(status_code=404, detail="Comentario padre no encontrado")

    nuevo_comentario = models.Comentario(
        id_usuario=user_id,
        id_publicacion=comentario.id_publicacion,
        id_comentario_padre=comentario.id_comentario_padre,
        contenido=comentario.contenido
    )
    db.add(nuevo_comentario)
    db.commit()
    db.refresh(nuevo_comentario)

    # Crear notificación si no es el propio usuario
    if publicacion.id_usuario != user_id:
        usuario_actual = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()
        tipo_noti = "comentario_respuesta" if comentario.id_comentario_padre else "comentario"
        mensaje = f"{usuario_actual.nombre_usuario} {'respondió a tu comentario' if comentario.id_comentario_padre else 'comentó tu publicación'}"
        
        noti = models.Notificacion(
            id_usuario=publicacion.id_usuario,
            tipo=tipo_noti,
            mensaje=mensaje,
            id_referencia=nuevo_comentario.id_comentario
        )
        db.add(noti)
        db.commit()

    # Cargar relaciones para la respuesta
    db.refresh(nuevo_comentario)
    return nuevo_comentario

@app.get("/comentarios/publicacion/{id_publicacion}", response_model=schemas.ComentarioConRespuestasResponse)
def obtener_comentarios_publicacion(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener todos los comentarios de una publicación (con respuestas anidadas)"""
    # Verificar que la publicación existe
    publicacion = db.query(models.Publicacion).filter(
        models.Publicacion.id_publicacion == id_publicacion
    ).first()
    
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    # Obtener comentarios principales (sin padre)
    comentarios_principales = db.query(models.Comentario)\
        .options(joinedload(models.Comentario.usuario).joinedload(models.Usuario.perfil))\
        .filter(
            models.Comentario.id_publicacion == id_publicacion,
            models.Comentario.id_comentario_padre.is_(None)
        )\
        .order_by(models.Comentario.fecha.asc())\
        .all()

    def cargar_respuestas(comentario, usuario_actual_id):
        # Cargar respuestas recursivamente
        respuestas = db.query(models.Comentario)\
            .options(joinedload(models.Comentario.usuario).joinedload(models.Usuario.perfil))\
            .filter(models.Comentario.id_comentario_padre == comentario.id_comentario)\
            .order_by(models.Comentario.fecha.asc())\
            .all()
        
        resultado_respuestas = []
        for respuesta in respuestas:
            # Verificar si el usuario actual dio me gusta a este comentario
            me_gusta_dado = db.query(models.MeGustaComentario).filter(
                models.MeGustaComentario.id_usuario == usuario_actual_id,
                models.MeGustaComentario.id_comentario == respuesta.id_comentario
            ).first() is not None

            # Contar total de me gusta
            total_me_gusta = db.query(models.MeGustaComentario).filter(
                models.MeGustaComentario.id_comentario == respuesta.id_comentario
            ).count()

            resultado_respuestas.append(schemas.ComentarioResponse(
                id_comentario=respuesta.id_comentario,
                id_usuario=respuesta.id_usuario,
                id_publicacion=respuesta.id_publicacion,
                id_comentario_padre=respuesta.id_comentario_padre,
                contenido=respuesta.contenido,
                fecha=respuesta.fecha,
                usuario=schemas.UsuarioPerfil(
                    id_usuario=respuesta.usuario.id_usuario,
                    nombre=respuesta.usuario.nombre,
                    nombre_usuario=respuesta.usuario.nombre_usuario,
                    perfil=schemas.PerfilResponse(
                        id_perfil=respuesta.usuario.perfil.id_perfil,
                        id_usuario=respuesta.usuario.perfil.id_usuario,
                        descripcion=respuesta.usuario.perfil.descripcion,
                        biografia=respuesta.usuario.perfil.biografia,
                        foto_perfil=respuesta.usuario.perfil.foto_perfil
                    ) if respuesta.usuario.perfil else None
                ),
                respuestas=cargar_respuestas(respuesta, usuario_actual_id),
                total_me_gusta=total_me_gusta,
                me_gusta_dado=me_gusta_dado
            ))
        
        return resultado_respuestas

    # Construir respuesta con comentarios anidados
    comentarios_con_respuestas = []
    for comentario in comentarios_principales:
        # Verificar si el usuario actual dio me gusta a este comentario
        me_gusta_dado = db.query(models.MeGustaComentario).filter(
            models.MeGustaComentario.id_usuario == user_id,
            models.MeGustaComentario.id_comentario == comentario.id_comentario
        ).first() is not None

        # Contar total de me gusta
        total_me_gusta = db.query(models.MeGustaComentario).filter(
            models.MeGustaComentario.id_comentario == comentario.id_comentario
        ).count()

        comentarios_con_respuestas.append(schemas.ComentarioResponse(
            id_comentario=comentario.id_comentario,
            id_usuario=comentario.id_usuario,
            id_publicacion=comentario.id_publicacion,
            id_comentario_padre=comentario.id_comentario_padre,
            contenido=comentario.contenido,
            fecha=comentario.fecha,
            usuario=schemas.UsuarioPerfil(
                id_usuario=comentario.usuario.id_usuario,
                nombre=comentario.usuario.nombre,
                nombre_usuario=comentario.usuario.nombre_usuario,
                perfil=schemas.PerfilResponse(
                    id_perfil=comentario.usuario.perfil.id_perfil,
                    id_usuario=comentario.usuario.perfil.id_usuario,
                    descripcion=comentario.usuario.perfil.descripcion,
                    biografia=comentario.usuario.perfil.biografia,
                    foto_perfil=comentario.usuario.perfil.foto_perfil
                ) if comentario.usuario.perfil else None
            ),
            respuestas=cargar_respuestas(comentario, user_id),
            total_me_gusta=total_me_gusta,
            me_gusta_dado=me_gusta_dado
        ))

    total_comentarios = db.query(models.Comentario).filter(
        models.Comentario.id_publicacion == id_publicacion
    ).count()

    return schemas.ComentarioConRespuestasResponse(
        comentarios=comentarios_con_respuestas,
        total=total_comentarios
    )

@app.get("/comentarios/{id_comentario}/publicacion")
def obtener_publicacion_de_comentario(
    id_comentario: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener el id_publicacion de un comentario"""
    comentario = db.query(models.Comentario).filter(
        models.Comentario.id_comentario == id_comentario
    ).first()
    
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    
    return {"id_publicacion": comentario.id_publicacion}

@app.delete("/comentarios/{id_comentario}")
def eliminar_comentario(
    id_comentario: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Eliminar un comentario (y sus respuestas)"""
    comentario = db.query(models.Comentario).filter(
        models.Comentario.id_comentario == id_comentario
    ).first()

    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    if comentario.id_usuario != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este comentario")

    # Eliminar comentario y sus respuestas (en cascada por la relación)
    db.delete(comentario)
    db.commit()

    return {"mensaje": "Comentario eliminado correctamente"}

# ------------------ ME GUSTA COMENTARIO ------------------
@app.post("/me-gusta-comentario/{id_comentario}")
def dar_me_gusta_comentario(
    id_comentario: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Dar me gusta a un comentario"""
    comentario = db.query(models.Comentario).filter(
        models.Comentario.id_comentario == id_comentario
    ).first()
    
    if not comentario:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")

    existente = db.query(models.MeGustaComentario).filter(
        models.MeGustaComentario.id_usuario == user_id,
        models.MeGustaComentario.id_comentario == id_comentario
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya diste me gusta a este comentario")

    nuevo_me_gusta = models.MeGustaComentario(
        id_usuario=user_id,
        id_comentario=id_comentario
    )
    db.add(nuevo_me_gusta)
    db.commit()

    return {"mensaje": "Me gusta agregado al comentario"}

@app.delete("/me-gusta-comentario/{id_comentario}")
def quitar_me_gusta_comentario(
    id_comentario: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Quitar me gusta de un comentario"""
    me_gusta = db.query(models.MeGustaComentario).filter(
        models.MeGustaComentario.id_usuario == user_id,
        models.MeGustaComentario.id_comentario == id_comentario
    ).first()

    if not me_gusta:
        raise HTTPException(status_code=404, detail="No has dado me gusta a este comentario")

    db.delete(me_gusta)
    db.commit()

    return {"mensaje": "Me gusta eliminado del comentario"}

 # ------------------ ESTADÍSTICAS PUBLICACIÓN ------------------
@app.get("/publicaciones/{id_publicacion}/estadisticas", response_model=schemas.EstadisticasPublicacionResponse)
def obtener_estadisticas_publicacion(
    id_publicacion: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener estadísticas de una publicación (me gusta, comentarios, guardados)"""
    publicacion = db.query(models.Publicacion).filter(
        models.Publicacion.id_publicacion == id_publicacion
    ).first()
    
    if not publicacion:
        raise HTTPException(status_code=404, detail="Publicación no encontrada")

    total_me_gusta = db.query(models.MeGusta).filter(
        models.MeGusta.id_publicacion == id_publicacion
    ).count()

    total_comentarios = db.query(models.Comentario).filter(
        models.Comentario.id_publicacion == id_publicacion
    ).count()

    total_guardados = db.query(models.Guardado).filter(
        models.Guardado.id_publicacion == id_publicacion
    ).count()

    me_gusta_dado = db.query(models.MeGusta).filter(
        models.MeGusta.id_usuario == user_id,
        models.MeGusta.id_publicacion == id_publicacion
    ).first() is not None

    guardado = db.query(models.Guardado).filter(
        models.Guardado.id_usuario == user_id,
        models.Guardado.id_publicacion == id_publicacion
    ).first() is not None

    return {
        "total_me_gusta": total_me_gusta,
        "total_comentarios": total_comentarios,
        "total_guardados": total_guardados,
        "me_gusta_dado": me_gusta_dado,
        "guardado": guardado
    }


# ------------------ PUBLICACIONES GUARDADAS ------------------
@app.get("/guardados", response_model=List[schemas.PublicacionResponse])
def obtener_publicaciones_guardadas(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener publicaciones guardadas por el usuario"""
    guardados = db.query(models.Guardado)\
        .options(
            joinedload(models.Guardado.publicacion)
            .joinedload(models.Publicacion.usuario)
            .joinedload(models.Usuario.perfil)
        )\
        .filter(models.Guardado.id_usuario == user_id)\
        .order_by(models.Guardado.fecha.desc())\
        .all()

    # Extraer solo las publicaciones con la información completa del usuario y perfil
    publicaciones = [guardado.publicacion for guardado in guardados]
    
    return publicaciones

# ------------------ ME GUSTA QUE HA DADO EL USUARIO ------------------
@app.get("/usuarios/{id_usuario}/megusta-dados")
def obtener_megusta_dados(
    id_usuario: int,
    db: Session = Depends(get_db)
):
    """Obtener todas las publicaciones a las que el usuario ha dado me gusta"""
    me_gustas = db.query(models.MeGusta)\
        .options(
            joinedload(models.MeGusta.publicacion)
            .joinedload(models.Publicacion.usuario)
            .joinedload(models.Usuario.perfil)
        )\
        .filter(models.MeGusta.id_usuario == id_usuario)\
        .order_by(models.MeGusta.fecha.desc())\
        .all()

    resultado = []
    for mg in me_gustas:
        resultado.append({
            "id_megusta": mg.id_megusta,
            "fecha": mg.fecha,
            "publicacion": {
                "id_publicacion": mg.publicacion.id_publicacion,
                "id_usuario": mg.publicacion.id_usuario,
                "contenido": mg.publicacion.contenido,
                "imagen": mg.publicacion.imagen,
                "fecha_creacion": mg.publicacion.fecha_creacion,
                "usuario": {
                    "id_usuario": mg.publicacion.usuario.id_usuario,
                    "nombre_usuario": mg.publicacion.usuario.nombre_usuario,
                    "nombre": mg.publicacion.usuario.nombre,
                    "perfil": {
                        "id_perfil": mg.publicacion.usuario.perfil.id_perfil if mg.publicacion.usuario.perfil else None,
                        "id_usuario": mg.publicacion.usuario.perfil.id_usuario if mg.publicacion.usuario.perfil else None,
                        "descripcion": mg.publicacion.usuario.perfil.descripcion if mg.publicacion.usuario.perfil else None,
                        "biografia": mg.publicacion.usuario.perfil.biografia if mg.publicacion.usuario.perfil else None,
                        "foto_perfil": mg.publicacion.usuario.perfil.foto_perfil if mg.publicacion.usuario.perfil else None
                    } if mg.publicacion.usuario.perfil else None
                }
            }
        })
    
    return resultado

# ------------------ OBTENER ESTADÍSTICAS DE ME GUSTAS ------------------
@app.get("/estadisticas-me-gustas/{id_usuario}")
def obtener_estadisticas_me_gustas(id_usuario: int, db: Session = Depends(get_db)):
    # Me gustas RECIBIDOS (en las publicaciones del usuario)
    me_gustas_recibidos = db.query(models.MeGusta)\
        .join(models.Publicacion, models.MeGusta.id_publicacion == models.Publicacion.id_publicacion)\
        .filter(models.Publicacion.id_usuario == id_usuario)\
        .count()

    # Me gustas DADOS (que el usuario ha dado a otras publicaciones)
    me_gustas_dados = db.query(models.MeGusta)\
        .filter(models.MeGusta.id_usuario == id_usuario)\
        .count()

    return {
        "me_gustas_recibidos": me_gustas_recibidos,
        "me_gustas_dados": me_gustas_dados
    }



# ------------------ COMPARTIR PUBLICACIÓN ------------------
@app.post("/compartir/{id_publicacion}")
def compartir_publicacion(
    id_publicacion: int,
    mensaje: str = Form(None),
    tipo: str = Form("perfil"),
    amigos_ids: str = Form(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    try:
        print(f"🔍 INICIANDO COMPARTIR - Usuario: {user_id}, Publicación: {id_publicacion}, Tipo: {tipo}")
        
        # Verificar si la publicación existe
        publicacion = db.query(models.Publicacion).filter(
            models.Publicacion.id_publicacion == id_publicacion
        ).first()
        
        if not publicacion:
            print(f"❌ Publicación {id_publicacion} no encontrada")
            raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
        print(f"✅ Publicación encontrada: {publicacion.id_publicacion} por usuario {publicacion.id_usuario}")
        
        # Crear el compartido principal
        nuevo_compartido = models.Compartido(
            id_usuario=user_id,
            id_publicacion=id_publicacion,
            tipo=tipo,
            mensaje=mensaje or "",
            expiracion=None
        )
        
        db.add(nuevo_compartido)
        db.commit()
        db.refresh(nuevo_compartido)
        
        print(f"✅ Compartido creado: ID {nuevo_compartido.id_compartido}")
        
        # Obtener usuario actual
        usuario_actual = db.query(models.Usuario).filter(models.Usuario.id_usuario == user_id).first()
        
        # 🔥 CREAR NOTIFICACIONES MEJORADAS
        notificaciones_creadas = 0
        
        # 1. Notificación para el dueño de la publicación (si no es el mismo usuario)
        if publicacion.id_usuario != user_id:
            notificacion_propietario = models.Notificacion(
                id_usuario=publicacion.id_usuario,
                tipo="compartido",
                mensaje=f"@{usuario_actual.nombre_usuario} compartió tu publicación",
                leido=False,
                id_referencia=nuevo_compartido.id_compartido
            )
            db.add(notificacion_propietario)
            notificaciones_creadas += 1
            print(f"📤 Notificación creada para propietario: usuario {publicacion.id_usuario}")
        
        # 2. Si es compartir con amigos específicos, crear notificaciones para cada amigo
        if tipo == "amigos" and amigos_ids:
            amigos_ids_list = [int(id_str) for id_str in amigos_ids.split(",") if id_str.strip()]
            print(f"👥 Compartiendo con amigos: {amigos_ids_list}")
            
            for amigo_id in amigos_ids_list:
                # Verificar que realmente son amigos
                amistad = db.query(models.Amistad).filter(
                    ((models.Amistad.id_usuario1 == user_id) & (models.Amistad.id_usuario2 == amigo_id)) |
                    ((models.Amistad.id_usuario1 == amigo_id) & (models.Amistad.id_usuario2 == user_id)),
                    models.Amistad.estado == "aceptada"
                ).first()
                
                if amistad:
                    notificacion_amigo = models.Notificacion(
                        id_usuario=amigo_id,
                        tipo="compartido_amigo", 
                        mensaje=f"@{usuario_actual.nombre_usuario} te compartió una publicación",
                        leido=False,
                        id_referencia=nuevo_compartido.id_compartido
                    )
                    db.add(notificacion_amigo)
                    notificaciones_creadas += 1
                    print(f"📤 Notificación creada para amigo: usuario {amigo_id}")
                else:
                    print(f"⚠️  Usuario {amigo_id} no es amigo o amistad no aceptada")
        
        db.commit()
        print(f"✅ Total notificaciones creadas: {notificaciones_creadas}")
        
        return {
            "mensaje": "Publicación compartida exitosamente", 
            "id_compartido": nuevo_compartido.id_compartido,
            "tipo": tipo,
            "notificaciones_creadas": notificaciones_creadas,
            "expiracion": None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR en compartir publicación: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al compartir publicación: {str(e)}")

# ------------------ OBTENER COMPARTIDOS ------------------
@app.get("/compartidos")
def obtener_compartidos_general(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Endpoint general para compatibilidad - redirige a mis compartidos"""
    return obtener_mis_compartidos(db, user_id)

@app.get("/compartidos/mis-compartidos")
def obtener_mis_compartidos(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener las publicaciones que el usuario actual ha compartido"""
    compartidos = (
        db.query(models.Compartido)
        .options(
            joinedload(models.Compartido.publicacion)
            .joinedload(models.Publicacion.usuario)
            .joinedload(models.Usuario.perfil),
            joinedload(models.Compartido.usuario)
        )
        .filter(models.Compartido.id_usuario == user_id)
        .order_by(models.Compartido.fecha.desc())
        .all()
    )
    
    resultado = []
    for compartido in compartidos:
        # 🔥 OBTENER MEDIOS DE LA PUBLICACIÓN
        medios_array = []
        if compartido.publicacion.imagen:
            # Si hay imagen, agregarla como medio
            medios_array.append(compartido.publicacion.imagen)
        
        # Aquí podrías agregar lógica para obtener múltiples medios si los tienes
        # Por ejemplo, si tienes una tabla de medios separada
        
        resultado.append({
            "id_compartido": compartido.id_compartido,
            "fecha_compartido": compartido.fecha.isoformat(),
            "mensaje": compartido.mensaje,
            "tipo": compartido.tipo,
            "expiracion": None,
            "usuario_compartio": {
                "id_usuario": compartido.usuario.id_usuario,
                "nombre_usuario": compartido.usuario.nombre_usuario,
                "foto_perfil": compartido.usuario.perfil.foto_perfil if compartido.usuario.perfil else None
            },
            "publicacion": {
                "id_publicacion": compartido.publicacion.id_publicacion,
                "contenido": compartido.publicacion.contenido,
                "imagen": compartido.publicacion.imagen,  # Para compatibilidad
                "medios": medios_array,  # 🔥 NUEVO: Array de medios
                "fecha_creacion": compartido.publicacion.fecha_creacion.isoformat(),
                "usuario": {
                    "id_usuario": compartido.publicacion.usuario.id_usuario,
                    "nombre_usuario": compartido.publicacion.usuario.nombre_usuario,
                    "foto_perfil": compartido.publicacion.usuario.perfil.foto_perfil if compartido.publicacion.usuario.perfil else None
                }
            }
        })
    
    return resultado
@app.get("/compartidos/amigos")
def obtener_compartidos_amigos(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener publicaciones compartidas por amigos del usuario"""
    # Obtener IDs de amigos
    amistades = db.query(models.Amistad).filter(
        ((models.Amistad.id_usuario1 == user_id) | (models.Amistad.id_usuario2 == user_id)),
        models.Amistad.estado == "aceptada"
    ).all()
    
    amigos_ids = []
    for amistad in amistades:
        if amistad.id_usuario1 == user_id:
            amigos_ids.append(amistad.id_usuario2)
        else:
            amigos_ids.append(amistad.id_usuario1)
    
    if not amigos_ids:
        return []
    
    # Obtener compartidos de amigos
    compartidos = (
        db.query(models.Compartido)
        .options(
            joinedload(models.Compartido.publicacion)
            .joinedload(models.Publicacion.usuario)
            .joinedload(models.Usuario.perfil),
            joinedload(models.Compartido.usuario)
        )
        .filter(
            models.Compartido.id_usuario.in_(amigos_ids),
            models.Compartido.tipo.in_(["perfil", "amigos"])
        )
        .order_by(models.Compartido.fecha.desc())
        .all()
    )
    
    resultado = []
    for compartido in compartidos:
        resultado.append({
            "id_compartido": compartido.id_compartido,
            "fecha_compartido": compartido.fecha.isoformat(),
            "mensaje": compartido.mensaje,
            "tipo": compartido.tipo,
            "expiracion": None,
            "usuario_compartio": {
                "id_usuario": compartido.usuario.id_usuario,
                "nombre_usuario": compartido.usuario.nombre_usuario,
                "foto_perfil": compartido.usuario.perfil.foto_perfil if compartido.usuario.perfil else None
            },
            "publicacion": {
                "id_publicacion": compartido.publicacion.id_publicacion,
                "contenido": compartido.publicacion.contenido,
                "imagen_url": compartido.publicacion.imagen,
                "fecha_creacion": compartido.publicacion.fecha_creacion.isoformat(),
                "usuario": {
                    "id_usuario": compartido.publicacion.usuario.id_usuario,
                    "nombre_usuario": compartido.publicacion.usuario.nombre_usuario,
                    "foto_perfil": compartido.publicacion.usuario.perfil.foto_perfil if compartido.publicacion.usuario.perfil else None
                }
            }
        })
    
    return resultado

@app.get("/compartidos/detalle/{id_compartido}")
def obtener_compartido_por_id(
    id_compartido: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Obtener un compartido específico por ID"""
    try:
        print(f"🔍 Solicitando compartido {id_compartido} para usuario {user_id}")
        
        compartido = (
            db.query(models.Compartido)
            .options(
                joinedload(models.Compartido.publicacion)
                .joinedload(models.Publicacion.usuario)
                .joinedload(models.Usuario.perfil),
                joinedload(models.Compartido.usuario)
            )
            .filter(models.Compartido.id_compartido == id_compartido)
            .first()
        )
        
        if not compartido:
            print(f"❌ Compartido {id_compartido} no encontrado")
            raise HTTPException(status_code=404, detail="Compartido no encontrado")
        
        print(f"✅ Compartido encontrado: ID {compartido.id_compartido}, Usuario: {compartido.id_usuario}, Tipo: {compartido.tipo}")
        
        # Verificar permisos de visibilidad
        if compartido.tipo == "privado" and compartido.id_usuario != user_id:
            print(f"❌ Usuario {user_id} no tiene acceso a compartido privado {id_compartido}")
            raise HTTPException(status_code=403, detail="No tienes acceso a este compartido")
        
        resultado = {
            "id_compartido": compartido.id_compartido,
            "fecha_compartido": compartido.fecha.isoformat(),
            "mensaje": compartido.mensaje,
            "tipo": compartido.tipo,
            "usuario_compartio": {
                "id_usuario": compartido.usuario.id_usuario,
                "nombre_usuario": compartido.usuario.nombre_usuario,
                "foto_perfil": compartido.usuario.perfil.foto_perfil if compartido.usuario.perfil else None
            },
            "publicacion": {
                "id_publicacion": compartido.publicacion.id_publicacion,
                "contenido": compartido.publicacion.contenido,
                "imagen_url": compartido.publicacion.imagen,
                "fecha_creacion": compartido.publicacion.fecha_creacion.isoformat(),
                "usuario": {
                    "id_usuario": compartido.publicacion.usuario.id_usuario,
                    "nombre_usuario": compartido.publicacion.usuario.nombre_usuario,
                    "foto_perfil": compartido.publicacion.usuario.perfil.foto_perfil if compartido.publicacion.usuario.perfil else None
                }
            }
        }
        
        print(f"✅ Compartido preparado para enviar")
        return resultado
        
    except Exception as e:
        print(f"❌ ERROR en obtener_compartido_por_id: {str(e)}")
        raise

@app.delete("/compartidos/{id_compartido}")
def eliminar_compartido(
    id_compartido: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Eliminar un compartido (solo el dueño puede eliminarlo)"""
    try:
        compartido = db.query(models.Compartido).filter(
            models.Compartido.id_compartido == id_compartido,
            models.Compartido.id_usuario == user_id
        ).first()
        
        if not compartido:
            raise HTTPException(status_code=404, detail="Compartido no encontrado")
        
        db.delete(compartido)
        db.commit()
        
        return {"mensaje": "Compartido eliminado exitosamente"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar compartido: {str(e)}")

# ------------------ BÚSQUEDA ------------------
@app.get("/buscar")
def buscar(
    query: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Buscar usuarios por nombre, nombre de usuario o correo electrónico
    """
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="La búsqueda debe tener al menos 2 caracteres")
    
    search_term = f"%{query.strip()}%"
    
    # Buscar usuarios que coincidan con el término de búsqueda
    usuarios = (
        db.query(models.Usuario)
        .options(joinedload(models.Usuario.perfil))
        .filter(
            (models.Usuario.nombre.ilike(search_term)) |
            (models.Usuario.nombre_usuario.ilike(search_term)) |
            (models.Usuario.correo_electronico.ilike(search_term))
        )
        .all()
    )
    
    resultado = []
    for usuario in usuarios:
        # Verificar si el usuario actual sigue a este usuario
        sigue = db.query(models.SeguirUsuario).filter(
            models.SeguirUsuario.id_seguidor == user_id,
            models.SeguirUsuario.id_seguido == usuario.id_usuario
        ).first()
        
        resultado.append({
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "nombre_usuario": usuario.nombre_usuario,
            "correo_electronico": usuario.correo_electronico,
            "perfil": {
                "id_perfil": usuario.perfil.id_perfil if usuario.perfil else None,
                "foto_perfil": usuario.perfil.foto_perfil if usuario.perfil else None,
                "descripcion": usuario.perfil.descripcion if usuario.perfil else None,
                "biografia": usuario.perfil.biografia if usuario.perfil else None
            } if usuario.perfil else None,
            "sigo": bool(sigue)
        })
    
    return resultado


# ------------------ ENDPOINTS DE CHAT ------------------
class MensajeCreate(BaseModel):
    contenido: str
    tipo: str = "texto"

class ConfiguracionChat(BaseModel):
    fondo_chat: str
    color_burbuja: str

# Obtener chats del usuario
@app.get("/chats")
def obtener_chats(
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Buscar chats donde el usuario sea participante
        chats = db.query(models.Chat).filter(
            (models.Chat.id_usuario1 == id_usuario) | 
            (models.Chat.id_usuario2 == id_usuario)
        ).all()
        
        resultado = []
        for chat in chats:
            # Determinar quién es el otro usuario
            otro_usuario = chat.usuario1 if chat.id_usuario2 == id_usuario else chat.usuario2
            
            # Obtener último mensaje
            ultimo_mensaje = db.query(models.Mensaje).filter(
                models.Mensaje.id_chat == chat.id_chat
            ).order_by(models.Mensaje.fecha_envio.desc()).first()
            
            # Obtener configuración del chat para este usuario
            es_usuario1 = chat.id_usuario1 == id_usuario
            color_chat = chat.color_burbuja_usuario1 if es_usuario1 else chat.color_burbuja_usuario2
            
            resultado.append({
                "id": chat.id_chat,
                "username": otro_usuario.nombre_usuario,
                "nombre_completo": f"{otro_usuario.nombre} {otro_usuario.apellido}",
                "foto_perfil": otro_usuario.perfil.foto_perfil if otro_usuario.perfil else None,
                "lastMessage": ultimo_mensaje.contenido if ultimo_mensaje else "Iniciar conversación",
                "color": color_chat,
                "ultima_actividad": chat.ultima_actividad,
                "no_leidos": db.query(models.Mensaje).filter(
                    models.Mensaje.id_chat == chat.id_chat,
                    models.Mensaje.id_emisor != id_usuario,
                    models.Mensaje.leido == False
                ).count()
            })
        
        # Ordenar por última actividad
        resultado.sort(key=lambda x: x["ultima_actividad"], reverse=True)
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener chats: {str(e)}")

# Obtener mensajes de un chat
@app.get("/chats/{id_chat}/mensajes")
def obtener_mensajes_chat(
    id_chat: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Marcar mensajes como leídos
        db.query(models.Mensaje).filter(
            models.Mensaje.id_chat == id_chat,
            models.Mensaje.id_emisor != id_usuario,
            models.Mensaje.leido == False
        ).update({"leido": True})
        db.commit()
        
        # Subquery para obtener IDs de mensajes eliminados por este usuario
        mensajes_eliminados_subquery = db.query(models.MensajeEliminado.id_mensaje).filter(
            models.MensajeEliminado.id_usuario == id_usuario
        ).subquery()
        
        # Obtener mensajes que NO han sido eliminados por este usuario
        mensajes = db.query(models.Mensaje).filter(
            models.Mensaje.id_chat == id_chat,
            ~models.Mensaje.id_mensaje.in_(mensajes_eliminados_subquery)
        ).order_by(models.Mensaje.fecha_envio.asc()).all()
        
        return [{
            "id": msg.id_mensaje,
            "sender": "yo" if msg.id_emisor == id_usuario else "otro",
            "sender_id": msg.id_emisor,
            "sender_username": msg.emisor.nombre_usuario,
            "text": msg.contenido,
            "tipo": msg.tipo,
            "archivo_url": msg.archivo_url,
            "fecha": msg.fecha_envio,
            "leido": msg.leido
        } for msg in mensajes]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener mensajes: {str(e)}")
    
# Enviar mensaje de texto
@app.post("/chats/{id_chat}/mensajes")
def enviar_mensaje(
    id_chat: int,
    mensaje: MensajeCreate,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Crear mensaje
        nuevo_mensaje = models.Mensaje(
            id_chat=id_chat,
            id_emisor=id_usuario,
            contenido=mensaje.contenido,
            tipo=mensaje.tipo
        )
        
        db.add(nuevo_mensaje)
        
        # Actualizar última actividad del chat
        chat.ultima_actividad = datetime.utcnow()
        
        db.commit()
        db.refresh(nuevo_mensaje)
        
        # Crear notificación para el otro usuario
        otro_usuario_id = chat.id_usuario1 if chat.id_usuario2 == id_usuario else chat.id_usuario2
        notificacion = models.Notificacion(
            id_usuario=otro_usuario_id,
            tipo="nuevo_mensaje",
            mensaje=f"Tienes un nuevo mensaje de {nuevo_mensaje.emisor.nombre_usuario}",
            id_referencia=id_chat
        )
        db.add(notificacion)
        db.commit()
        
        return {
            "id": nuevo_mensaje.id_mensaje,
            "sender": "yo",
            "text": nuevo_mensaje.contenido,
            "tipo": nuevo_mensaje.tipo,
            "fecha": nuevo_mensaje.fecha_envio
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al enviar mensaje: {str(e)}")


# Versión simplificada sin verificación de amistad (para testing):

@app.post("/chats/{id_chat}/mensajes/archivo")
async def enviar_mensaje_archivo(
    id_chat: int,
    archivo: UploadFile = File(...),
    tipo: str = Form(...),
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # TEMPORAL: Omitir verificación de amistad para testing
        # TODO: Restaurar verificación de amistad después de solucionar el error
        
        # Validar tipo de archivo
        if tipo not in ["imagen", "video"]:
            raise HTTPException(status_code=400, detail="Tipo de archivo no válido")
        
        # Validar tamaño del archivo
        contenido = await archivo.read()
        if len(contenido) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="El archivo es demasiado grande. Máximo 50MB")
        
        await archivo.seek(0)
        
        # Guardar archivo
        archivo_url = save_chat_file(archivo, tipo)
        
        # Crear mensaje
        contenido_texto = f"📎 {archivo.filename}"
        nuevo_mensaje = models.Mensaje(
            id_chat=id_chat,
            id_emisor=id_usuario,
            contenido=contenido_texto,
            tipo=tipo,
            archivo_url=archivo_url
        )
        
        db.add(nuevo_mensaje)
        chat.ultima_actividad = datetime.utcnow()
        db.commit()
        db.refresh(nuevo_mensaje)
        
        return {
            "id": nuevo_mensaje.id_mensaje,
            "sender": "yo",
            "text": nuevo_mensaje.contenido,
            "tipo": nuevo_mensaje.tipo,
            "archivo_url": nuevo_mensaje.archivo_url,
            "fecha": nuevo_mensaje.fecha_envio.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al enviar archivo: {str(e)}")

# Crear o obtener chat con usuario
@app.post("/chats/con-usuario/{id_usuario_destino}")
def crear_o_obtener_chat(
    id_usuario_destino: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Buscar chat existente
        chat_existente = db.query(models.Chat).filter(
            ((models.Chat.id_usuario1 == id_usuario) & (models.Chat.id_usuario2 == id_usuario_destino)) |
            ((models.Chat.id_usuario1 == id_usuario_destino) & (models.Chat.id_usuario2 == id_usuario))
        ).first()
        
        if chat_existente:
            return {"id_chat": chat_existente.id_chat, "existed": True}
        
        # Crear nuevo chat
        nuevo_chat = models.Chat(
            id_usuario1=id_usuario,
            id_usuario2=id_usuario_destino
        )
        
        db.add(nuevo_chat)
        db.commit()
        db.refresh(nuevo_chat)
        
        return {"id_chat": nuevo_chat.id_chat, "existed": False}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear chat: {str(e)}")


# Eliminar mensaje (para mí) - VERSIÓN SIMPLE
@app.delete("/chats/{id_chat}/mensajes/{id_mensaje}")
def eliminar_mensaje(
    id_chat: int,
    id_mensaje: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")

        # Verificar que el mensaje existe en este chat
        mensaje = db.query(models.Mensaje).filter(
            models.Mensaje.id_mensaje == id_mensaje,
            models.Mensaje.id_chat == id_chat
        ).first()
        
        if not mensaje:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        
        # Verificar si ya existe un registro de eliminación
        eliminacion_existente = db.query(models.MensajeEliminado).filter(
            models.MensajeEliminado.id_mensaje == id_mensaje,
            models.MensajeEliminado.id_usuario == id_usuario
        ).first()
        
        if eliminacion_existente:
            # Ya estaba eliminado, retornar éxito
            return {"message": "Mensaje ya estaba eliminado"}
        
        # Crear registro de mensaje eliminado
        mensaje_eliminado = models.MensajeEliminado(
            id_mensaje=id_mensaje,
            id_usuario=id_usuario
        )
        
        db.add(mensaje_eliminado)
        db.commit()
        
        return {"message": "Mensaje eliminado correctamente para ti"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar mensaje: {str(e)}")


# ------------------ ELIMINAR CHAT COMPLETO  ------------------
@app.delete("/chats/{id_chat}")
def eliminar_chat(
    id_chat: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # PRIMERO: Eliminar configuraciones del chat
        db.query(models.ConfiguracionChat).filter(
            models.ConfiguracionChat.id_chat == id_chat
        ).delete()
        
        # SEGUNDO: Eliminar registros de mensajes eliminados relacionados con los mensajes de este chat
        # Subquery para obtener IDs de mensajes del chat
        mensajes_chat_subquery = db.query(models.Mensaje.id_mensaje).filter(
            models.Mensaje.id_chat == id_chat
        ).subquery()
        
        # Eliminar registros de MensajeEliminado relacionados
        db.query(models.MensajeEliminado).filter(
            models.MensajeEliminado.id_mensaje.in_(mensajes_chat_subquery)
        ).delete()
        
        # TERCERO: Eliminar todos los mensajes del chat
        db.query(models.Mensaje).filter(
            models.Mensaje.id_chat == id_chat
        ).delete()
        
        # FINALMENTE: Eliminar el chat
        db.delete(chat)
        db.commit()
        
        return {"message": "Chat eliminado correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar chat: {str(e)}")

# Eliminar mensaje para todos (solo mensajes propios)
@app.delete("/mensajes/{id_mensaje}/para-todos")
def eliminar_mensaje_para_todos(
    id_mensaje: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario es el propietario del mensaje
        mensaje = db.query(models.Mensaje).filter(
            models.Mensaje.id_mensaje == id_mensaje,
            models.Mensaje.id_emisor == id_usuario
        ).first()
        
        if not mensaje:
            raise HTTPException(status_code=404, detail="Solo puedes eliminar tus propios mensajes para todos")
        
        # Eliminar físicamente el mensaje y también los registros de eliminación
        db.query(models.MensajeEliminado).filter(
            models.MensajeEliminado.id_mensaje == id_mensaje
        ).delete()
        
        db.delete(mensaje)
        db.commit()
        
        return {"message": "Mensaje eliminado para todos correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar mensaje: {str(e)}")
    # backend/main.py - AGREGAR ENDPOINT DE DIAGNÓSTICO

# Endpoint para diagnóstico - verificar mensajes eliminados
@app.get("/diagnostico/mensajes-eliminados/{id_chat}")
def diagnostico_mensajes_eliminados(
    id_chat: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Mensajes eliminados por el usuario
        mensajes_eliminados = db.query(models.MensajeEliminado).filter(
            models.MensajeEliminado.id_usuario == id_usuario,
            models.MensajeEliminado.mensaje.has(id_chat=id_chat)
        ).all()
        
        # Todos los mensajes del chat
        todos_mensajes = db.query(models.Mensaje).filter(
            models.Mensaje.id_chat == id_chat
        ).all()
        
        # Mensajes visibles para el usuario
        mensajes_eliminados_subquery = db.query(models.MensajeEliminado.id_mensaje).filter(
            models.MensajeEliminado.id_usuario == id_usuario
        ).subquery()
        
        mensajes_visibles = db.query(models.Mensaje).filter(
            models.Mensaje.id_chat == id_chat,
            ~models.Mensaje.id_mensaje.in_(mensajes_eliminados_subquery)
        ).all()
        
        return {
            "mensajes_eliminados": [{"id": me.id_mensaje} for me in mensajes_eliminados],
            "todos_los_mensajes": [{"id": m.id_mensaje, "contenido": m.contenido} for m in todos_mensajes],
            "mensajes_visibles": [{"id": m.id_mensaje, "contenido": m.contenido} for m in mensajes_visibles],
            "count_eliminados": len(mensajes_eliminados),
            "count_todos": len(todos_mensajes),
            "count_visibles": len(mensajes_visibles)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en diagnóstico: {str(e)}")
    
# backend/main.py - ENDPOINTS PARA CONFIGURACIÓN DE CHAT

@app.put("/chats/{id_chat}/configuracion")
def actualizar_configuracion_chat(
    id_chat: int,
    configuracion: ConfiguracionChatUpdate,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Buscar configuración existente
        config_existente = db.query(models.ConfiguracionChat).filter(
            models.ConfiguracionChat.id_chat == id_chat,
            models.ConfiguracionChat.id_usuario == id_usuario
        ).first()
        
        if config_existente:
            # Actualizar configuración existente
            config_existente.fondo_chat = configuracion.fondo_chat
            config_existente.color_burbuja = configuracion.color_burbuja
            config_existente.fecha_actualizacion = datetime.utcnow()
        else:
            # Crear nueva configuración
            nueva_config = models.ConfiguracionChat(
                id_chat=id_chat,
                id_usuario=id_usuario,
                fondo_chat=configuracion.fondo_chat,
                color_burbuja=configuracion.color_burbuja
            )
            db.add(nueva_config)
        
        db.commit()
        
        return {"message": "Configuración actualizada correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar configuración: {str(e)}")

@app.get("/chats/{id_chat}/configuracion")
def obtener_configuracion_chat(
    id_chat: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Buscar configuración
        config = db.query(models.ConfiguracionChat).filter(
            models.ConfiguracionChat.id_chat == id_chat,
            models.ConfiguracionChat.id_usuario == id_usuario
        ).first()
        
        if config:
            return {
                "fondo_chat": config.fondo_chat,
                "color_burbuja": config.color_burbuja,
                "fondo_personalizado": config.fondo_personalizado
            }
        else:
            # Retornar configuración por defecto
            return {
                "fondo_chat": "default",
                "color_burbuja": "#6C63FF",
                "fondo_personalizado": None
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener configuración: {str(e)}")
    
@app.post("/chats/{id_chat}/fondo-personalizado")
async def subir_fondo_personalizado(
    id_chat: int,
    fondo: UploadFile = File(...),
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Verificar que el usuario pertenece al chat
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Validar que sea una imagen
        if not fondo.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Solo se permiten imágenes")
        
        # Validar tamaño (máximo 10MB)
        contenido = await fondo.read()
        if len(contenido) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="La imagen es demasiado grande. Máximo 10MB")
        
        # Reiniciar la posición del archivo
        await fondo.seek(0)
        
        # Generar nombre único
        file_extension = fondo.filename.split('.')[-1]
        unique_filename = f"fondo_chat_{id_chat}_{id_usuario}_{uuid.uuid4()}.{file_extension}"
        file_path = f"static/chat_fondos/{unique_filename}"
        
        # Guardar archivo
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(fondo.file, buffer)
        
        fondo_url = f"/{file_path}"
        
        # Buscar configuración existente
        config_existente = db.query(models.ConfiguracionChat).filter(
            models.ConfiguracionChat.id_chat == id_chat,
            models.ConfiguracionChat.id_usuario == id_usuario
        ).first()
        
        if config_existente:
            # Eliminar fondo anterior si existe
            if config_existente.fondo_personalizado:
                fondo_anterior = config_existente.fondo_personalizado.replace('/', '', 1)
                if os.path.exists(fondo_anterior):
                    os.remove(fondo_anterior)
            
            # Actualizar configuración
            config_existente.fondo_chat = "personalizado"
            config_existente.fondo_personalizado = fondo_url
            config_existente.fecha_actualizacion = datetime.utcnow()
        else:
            # Crear nueva configuración
            nueva_config = models.ConfiguracionChat(
                id_chat=id_chat,
                id_usuario=id_usuario,
                fondo_chat="personalizado",
                fondo_personalizado=fondo_url
            )
            db.add(nueva_config)
        
        db.commit()
        
        return {
            "message": "Fondo personalizado guardado correctamente",
            "fondo_url": fondo_url,
            "fondo_chat": "personalizado"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al subir fondo: {str(e)}")

# Eliminar fondo personalizado
@app.delete("/chats/{id_chat}/fondo-personalizado")
def eliminar_fondo_personalizado(
    id_chat: int,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        # Buscar configuración
        config = db.query(models.ConfiguracionChat).filter(
            models.ConfiguracionChat.id_chat == id_chat,
            models.ConfiguracionChat.id_usuario == id_usuario
        ).first()
        
        if not config or not config.fondo_personalizado:
            raise HTTPException(status_code=404, detail="No hay fondo personalizado para eliminar")
        
        # Eliminar archivo físico
        fondo_path = config.fondo_personalizado.replace('/', '', 1)
        if os.path.exists(fondo_path):
            os.remove(fondo_path)
        
        # Actualizar configuración
        config.fondo_personalizado = None
        config.fondo_chat = "default"
        config.fecha_actualizacion = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Fondo personalizado eliminado correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar fondo: {str(e)}")

# ------------------ CATEGORÍAS------------------
# backend/main.py - después de las importaciones y antes de los endpoints

def inicializar_categorias(db: Session):
    """Inserta categorías por defecto si la tabla está vacía."""
    CATEGORIAS_INICIALES = [
        {"nombre": "Danza", "descripcion": "Precisión, elegancia y expresión corporal."},
        {"nombre": "Música", "descripcion": "Melodía, ritmo, armonía y composición."},
        {"nombre": "Cine", "descripcion": "Arte visual y narrativo en movimiento."},
        {"nombre": "Literatura", "descripcion": "El mundo de la palabra escrita y la narrativa."},
        {"nombre": "Artes Visuales", "descripcion": "Pintura, escultura, fotografía e ilustración."},
        {"nombre": "Arquitectura", "descripcion": "Diseño de espacios y estructuras funcionales."},
    ]
    
    count = db.query(models.Categoria).count()
    if count == 0:
        print(">>> Inicializando categorías de arte...")
        for cat_data in CATEGORIAS_INICIALES:
            categoria = models.Categoria(**cat_data)
            db.add(categoria)
        db.commit()
        print(">>> Categorías iniciales creadas.")

@app.get("/categorias", response_model=List[schemas.CategoriaResponse])
def obtener_categorias(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Retorna la lista de todas las categorías de arte disponibles.
    """
    try:
        # Inicializar categorías si no existen
        count = db.query(models.Categoria).count()
        if count == 0:
            inicializar_categorias(db)
        
        categorias = db.query(models.Categoria).order_by(models.Categoria.nombre).all()
        
        if not categorias:
            raise HTTPException(
                status_code=404, 
                detail="No se encontraron categorías de arte."
            )
            
        return categorias
        
    except Exception as e:
        print(f"Error obteniendo categorías: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )
@app.get("/categorias/populares")
def obtener_categorias_populares(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene las categorías más populares basadas en las etiquetas de las publicaciones.
    """
    try:
        # Obtener todas las publicaciones
        publicaciones = db.query(models.Publicacion).all()
        
        categorias_count = {}
        
        for pub in publicaciones:
            if pub.etiquetas:
                try:
                    etiquetas = json.loads(pub.etiquetas) if isinstance(pub.etiquetas, str) else pub.etiquetas
                    
                    if etiquetas and isinstance(etiquetas, list):
                        for etiqueta in etiquetas:
                            etiqueta_limpia = str(etiqueta).strip().title()
                            if etiqueta_limpia:
                                categorias_count[etiqueta_limpia] = categorias_count.get(etiqueta_limpia, 0) + 1
                except:
                    pass
        
        # Ordenar por popularidad
        categorias_ordenadas = sorted(categorias_count.items(), key=lambda x: x[1], reverse=True)
        
        # Limitar a las 10 más populares
        categorias_populares = [
            {"nombre": cat, "cantidad": count} 
            for cat, count in categorias_ordenadas[:10]
        ]
        
        return categorias_populares
        
    except Exception as e:
        print(f"Error obteniendo categorías populares: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )
# Agrega en tu main.py, después de los otros endpoints pero antes de if __name__ == "__main__"

# ================== ENDPOINTS PÚBLICOS SIN AUTENTICACIÓN ==================

@app.get("/public/categorias")
def obtener_categorias_publicas(db: Session = Depends(get_db)):
    """Obtener todas las categorías disponibles (PÚBLICO)"""
    categorias = db.query(models.Categoria).order_by(models.Categoria.nombre).all()
    return categorias

@app.get("/public/categoria/{categoria_nombre}")
def obtener_publicaciones_categoria_publica(
    categoria_nombre: str,
    db: Session = Depends(get_db)
):
    """
    Obtener publicaciones por categoría SIN autenticación
    Solo muestra publicaciones públicas
    """
    try:
        # Normalizar nombre de categoría
        categoria_normalizada = categoria_nombre.lower().strip()
        
        # Obtener TODAS las publicaciones
        todas_publicaciones = (
            db.query(models.Publicacion)
            .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))
            .order_by(models.Publicacion.fecha_creacion.desc())
            .limit(100)  # Limitar para no sobrecargar
            .all()
        )
        
        # Filtrar por etiqueta/categoría
        publicaciones_filtradas = []
        for pub in todas_publicaciones:
            if pub.etiquetas:
                try:
                    # Parsear etiquetas JSON
                    etiquetas_lista = json.loads(pub.etiquetas) if isinstance(pub.etiquetas, str) else pub.etiquetas
                    
                    if etiquetas_lista:
                        # Normalizar etiquetas para comparación
                        etiquetas_normalizadas = [str(tag).lower().strip() for tag in etiquetas_lista]
                        
                        # Buscar coincidencia
                        if (categoria_normalizada in etiquetas_normalizadas or
                            any(categoria_normalizada in tag for tag in etiquetas_normalizadas)):
                            publicaciones_filtradas.append(pub)
                except Exception as e:
                    # Si hay error al parsear, verificar si el string contiene la categoría
                    if (pub.etiquetas and 
                        isinstance(pub.etiquetas, str) and 
                        categoria_normalizada in pub.etiquetas.lower()):
                        publicaciones_filtradas.append(pub)
        
        print(f"📊 Encontradas {len(publicaciones_filtradas)} publicaciones públicas para categoría '{categoria_nombre}'")
        
        return {
            "categoria": categoria_nombre,
            "publicaciones": publicaciones_filtradas,
            "total": len(publicaciones_filtradas)
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo publicaciones por categoría (público): {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@app.get("/public/buscar")
def buscar_publico(
    query: str,
    db: Session = Depends(get_db)
):
    """
    Búsqueda pública SIN autenticación
    Solo busca usuarios y publicaciones públicas
    """
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="La búsqueda debe tener al menos 2 caracteres")
    
    search_term = f"%{query.strip()}%"
    
    # Buscar usuarios (limitado para no exponer información sensible)
    usuarios = (
        db.query(models.Usuario)
        .options(joinedload(models.Usuario.perfil))
        .filter(
            (models.Usuario.nombre.ilike(search_term)) |
            (models.Usuario.nombre_usuario.ilike(search_term))
        )
        .limit(15)
        .all()
    )
    
    # Buscar publicaciones por contenido o etiquetas
    publicaciones = (
        db.query(models.Publicacion)
        .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))
        .filter(
            models.Publicacion.contenido.ilike(search_term)
        )
        .limit(20)
        .all()
    )
    
    # También buscar por etiquetas
    publicaciones_etiquetas = (
        db.query(models.Publicacion)
        .options(joinedload(models.Publicacion.usuario).joinedload(models.Usuario.perfil))
        .filter(
            models.Publicacion.etiquetas.ilike(search_term)
        )
        .limit(20)
        .all()
    )
    
    # Combinar y eliminar duplicados
    todas_publicaciones = publicaciones + publicaciones_etiquetas
    publicaciones_unicas = []
    ids_vistos = set()
    
    for pub in todas_publicaciones:
        if pub.id_publicacion not in ids_vistos:
            ids_vistos.add(pub.id_publicacion)
            publicaciones_unicas.append(pub)
    
    # Formatear respuesta
    resultado_usuarios = []
    for usuario in usuarios:
        resultado_usuarios.append({
            "id_usuario": usuario.id_usuario,
            "nombre_usuario": usuario.nombre_usuario,
            "nombre": usuario.nombre,
            "foto_perfil": usuario.perfil.foto_perfil if usuario.perfil else None
        })
    
    return {
        "usuarios": resultado_usuarios,
        "publicaciones": publicaciones_unicas[:30],  # Limitar a 30
        "query": query,
        "total_usuarios": len(resultado_usuarios),
        "total_publicaciones": len(publicaciones_unicas)
    }

@app.get("/public/usuarios/{id_usuario}/basico")
def obtener_usuario_basico(id_usuario: int, db: Session = Depends(get_db)):
    """Obtener información básica de un usuario (PÚBLICO)"""
    usuario = (
        db.query(models.Usuario)
        .options(joinedload(models.Usuario.perfil))
        .filter(models.Usuario.id_usuario == id_usuario)
        .first()
    )
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "id_usuario": usuario.id_usuario,
        "nombre_usuario": usuario.nombre_usuario,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "perfil": {
            "foto_perfil": usuario.perfil.foto_perfil if usuario.perfil else None,
            "descripcion": usuario.perfil.descripcion if usuario.perfil else None
        } if usuario.perfil else None
    }
# ------------------ HOME ------------------
@app.get("/home")
def home():
    return {"contenido": "<div>Barra de navegación</div><div>Publicaciones</div><div>Categorías</div><div>Sugerencias</div>"}