from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend import models, schemas

router = APIRouter()

# ------------------ ENDPOINTS DE CHAT ------------------

class MensajeCreate(schemas.BaseModel):
    contenido: str
    tipo: str = "texto"

class ConfiguracionChat(schemas.BaseModel):
    fondo_chat: str
    color_burbuja: str

# Obtener chats del usuario
@router.get("/chats")
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
            if chat.id_usuario1 == id_usuario:
                otro_usuario = chat.usuario2
                color_chat = chat.color_burbuja_usuario1
            else:
                otro_usuario = chat.usuario1
                color_chat = chat.color_burbuja_usuario2
            
            # Obtener último mensaje
            ultimo_mensaje = db.query(models.Mensaje).filter(
                models.Mensaje.id_chat == chat.id_chat
            ).order_by(models.Mensaje.fecha_envio.desc()).first()
            
            # Obtener foto de perfil del otro usuario
            foto_perfil = None
            if otro_usuario.perfil:
                foto_perfil = otro_usuario.perfil.foto_perfil
            
            resultado.append({
                "id": chat.id_chat,
                "username": otro_usuario.nombre_usuario,
                "nombre_completo": f"{otro_usuario.nombre} {otro_usuario.apellido}",
                "foto_perfil": foto_perfil,
                "lastMessage": ultimo_mensaje.contenido if ultimo_mensaje else "Iniciar conversación",
                "color": color_chat,
                "ultima_actividad": chat.ultima_actividad.isoformat() if chat.ultima_actividad else datetime.utcnow().isoformat(),
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
@router.get("/chats/{id_chat}/mensajes")
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
        
        # Obtener mensajes
        mensajes = db.query(models.Mensaje).filter(
            models.Mensaje.id_chat == id_chat
        ).order_by(models.Mensaje.fecha_envio.asc()).all()
        
        resultado = []
        for msg in mensajes:
            resultado.append({
                "id": msg.id_mensaje,
                "sender": "yo" if msg.id_emisor == id_usuario else "otro",
                "sender_id": msg.id_emisor,
                "sender_username": msg.emisor.nombre_usuario,
                "text": msg.contenido,
                "tipo": msg.tipo,
                "archivo_url": msg.archivo_url,
                "fecha": msg.fecha_envio.isoformat() if msg.fecha_envio else datetime.utcnow().isoformat(),
                "leido": msg.leido
            })
        
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener mensajes: {str(e)}")

# Enviar mensaje
@router.post("/chats/{id_chat}/mensajes")
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
        
        # Verificar si pueden enviar archivos (deben ser amigos)
        if mensaje.tipo in ["imagen", "video"]:
            # Verificar si son amigos
            son_amigos = db.query(models.Amistad).filter(
                ((models.Amistad.id_usuario1 == id_usuario) & (models.Amistad.id_usuario2 == chat.id_usuario1 if chat.id_usuario1 != id_usuario else chat.id_usuario2)) |
                ((models.Amistad.id_usuario1 == chat.id_usuario1 if chat.id_usuario1 != id_usuario else chat.id_usuario2) & (models.Amistad.id_usuario2 == id_usuario))
            ).first()
            
            if not son_amigos:
                raise HTTPException(status_code=403, detail="Solo los amigos pueden enviar archivos")
        
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
            "fecha": nuevo_mensaje.fecha_envio.isoformat() if nuevo_mensaje.fecha_envio else datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al enviar mensaje: {str(e)}")

# Crear o obtener chat con usuario
@router.post("/chats/con-usuario/{id_usuario_destino}")
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

# Configurar chat
@router.put("/chats/{id_chat}/configuracion")
def configurar_chat(
    id_chat: int,
    config: ConfiguracionChat,
    id_usuario: int = Header(..., alias="id_usuario"),
    db: Session = Depends(get_db)
):
    try:
        chat = db.query(models.Chat).filter(
            models.Chat.id_chat == id_chat,
            (models.Chat.id_usuario1 == id_usuario) | (models.Chat.id_usuario2 == id_usuario)
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
        
        # Actualizar configuración según el usuario
        if chat.id_usuario1 == id_usuario:
            chat.fondo_chat_usuario1 = config.fondo_chat
            chat.color_burbuja_usuario1 = config.color_burbuja
        else:
            chat.fondo_chat_usuario2 = config.fondo_chat
            chat.color_burbuja_usuario2 = config.color_burbuja
        
        db.commit()
        
        return {"message": "Configuración actualizada correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al configurar chat: {str(e)}")