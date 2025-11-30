// frontend/services/api.ts
import axios from "axios";
import { Usuario } from "../context/AuthContext";

// ================== CONFIGURACIÓN ==================
const API_URL = "http://localhost:8000";

const api = axios.create({
    baseURL: API_URL,
    headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
});

// Interceptor para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Error 401: No autorizado. Redirigiendo al login...");
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


// ======== UTILIDADES ========
function getToken(): string {
  const token = localStorage.getItem("token");
  // Si no hay token, no lances error, devuelve string vacío
  return token || "";
}

function getUsuarioId(): number | null {
  try {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) return null;
    const parsed = JSON.parse(usuario);
    return parsed.id_usuario || null;
  } catch (error) {
    console.error("Error obteniendo ID de usuario:", error);
    return null;
  }
}

function getAuthHeaders() {
  const token = getToken();
  const usuarioId = getUsuarioId();
  
  if (!token) {
    console.warn("Token no disponible. Usuario probablemente no autenticado.");
    // No redirigir aquí, dejar que el interceptor maneje el 401
  }
  
  return {
    "token": token || "",
    "id_usuario": usuarioId ? usuarioId.toString() : "",
  };
}

// ================== USUARIOS ==================
export async function getUsuarios(): Promise<Usuario[]> {
  const res = await api.get("/usuarios", { headers: getAuthHeaders() });
  return res.data;
}

export async function addUsuario(usuario: any): Promise<Usuario> {
  const res = await api.post("/usuarios", usuario);
  return res.data;
}

export async function deleteUsuario(id: number): Promise<Usuario> {
  const res = await api.delete(`/usuarios/${id}`);
  return res.data;
}

export async function registerUsuario(usuario: any): Promise<Usuario> {
  return addUsuario(usuario);
}

// ================== LOGIN / SESIÓN ==================

export async function loginUsuario(correo_electronico: string, contrasena: string) {
  try {
    const res = await api.post("/login", { correo_electronico, contrasena });
    
    if (res.data && res.data.token && res.data.usuario) {
      const { token, usuario } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      return { token, usuario };
    } else {
      throw new Error("Respuesta del servidor inválida");
    }
  } catch (error: any) {
    if (error.response) {
      // El servidor respondió con un código de error
      throw new Error(error.response.data.detail || "Error en el inicio de sesión");
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      throw new Error("No se pudo conectar con el servidor");
    } else {
      // Algo pasó al configurar la solicitud
      throw new Error("Error al configurar la solicitud");
    }
  }
}

// ================== PERFILES ==================
export async function getPerfil(id_usuario: number) {
  const res = await api.get(`/perfiles/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function actualizarPerfil(id_usuario: number, data: FormData) {
  const res = await api.put(`/perfiles/${id_usuario}`, data, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

// ================== PUBLICACIONES ==================
export async function crearPublicacion(data: FormData) {
  const res = await api.post("/publicaciones", data, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function getPublicaciones() {
  const res = await api.get("/publicaciones", { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarPublicacion(id_publicacion: number) {
  const res = await api.delete(`/publicaciones/${id_publicacion}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerPublicacionesUsuario(id_usuario: number) {
  const res = await api.get(`/publicaciones-usuario/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ================== RELACIONES SOCIALES ==================
export async function seguirUsuario(id_seguido: number) {
  const res = await api.post(`/seguir/${id_seguido}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function dejarDeSeguirUsuario(id_seguido: number) {
  const res = await api.delete(`/dejar-seguir/${id_seguido}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerSeguidores() {
  const res = await api.get("/seguidores", { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerSeguidoresUsuario(id_usuario: number) {
  const res = await api.get(`/seguidores/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerSiguiendo() {
  const res = await api.get("/siguiendo", { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerSiguiendoUsuario(id_usuario: number) {
  const res = await api.get(`/siguiendo/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// Verificar si un usuario sigue a otro
export async function verificarSiSigueUsuario(idUsuarioSeguido: number): Promise<boolean> {
  const res = await api.get(`/verificar-seguimiento/${idUsuarioSeguido}`, {
    headers: getAuthHeaders(),
  });
  return res.data.sigue;
}

// ================== AMISTADES ==================
export async function enviarSolicitudAmistad(id_receptor: number) {
  const res = await api.post(`/amistad/${id_receptor}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function responderSolicitudAmistad(id_solicitud: number, estado: string) {
  const formData = new FormData();
  formData.append("estado", estado);

  const res = await api.put(`/amistad/${id_solicitud}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function obtenerSolicitudesPendientes() {
  const res = await api.get("/solicitudes-amistad", { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerAmigos(id_usuario?: number) {
  const url = id_usuario ? `/amigos?id_usuario=${id_usuario}` : "/amigos";
  const res = await api.get(url, { headers: getAuthHeaders() });
  return res.data;
}

export async function eliminarAmigo(id_amigo: number) {
  const res = await api.delete(`/amigos/${id_amigo}`, { headers: getAuthHeaders() });
  return res.data;
}

// ================== NOTIFICACIONES ==================
export async function getNotificaciones() {
  const res = await api.get("/notificaciones", { headers: getAuthHeaders() });
  return res.data;
}

export async function marcarNotificacionesLeidas() {
  const res = await api.put("/notificaciones/leidas", {}, { headers: getAuthHeaders() });
  return res.data;
}

// ================== REPORTES ==================
export async function reportarUsuario(id_reportado: number, motivo: string, evidencia?: File) {
  const formData = new FormData();
  formData.append("motivo", motivo);
  if (evidencia) formData.append("evidencia", evidencia);

  const res = await api.post(`/reportar/${id_reportado}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

// ================== CATEGORÍAS ==================
export async function obtenerCategorias() {
  const res = await api.get("/categorias");
  return res.data;
}

// ================== ESTADÍSTICAS ==================
export async function obtenerEstadisticasPerfil(id_usuario: number) {
  const res = await api.get(`/estadisticas-perfil/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export const obtenerEstadisticasMeGustas = async (idusuario: number) => {
  const res = await api.get(`/estadisticas-me-gustas/${idusuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ================== RECUPERACIÓN DE CONTRASEÑA ==================
export async function solicitarRecuperacion(correo: string) {
  const res = await api.post("/olvidaste-contrasena", { correo });
  return res.data;
}

export async function restablecerContrasena(token: string, nueva_contrasena: string) {
  const res = await api.post("/restablecer-contrasena", { token, nueva_contrasena });
  return res.data;
}

// ================== BLOQUEAR / DESBLOQUEAR ==================
export async function bloquearUsuario(id_usuario_bloqueado: number) {
  const res = await api.post(`/bloquear/${id_usuario_bloqueado}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function desbloquearUsuario(id_usuario_bloqueado: number) {
  const res = await api.delete(`/desbloquear/${id_usuario_bloqueado}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerUsuariosBloqueados() {
  const res = await api.get("/usuarios-bloqueados", { headers: getAuthHeaders() });
  return res.data;
}

// ================== NO ME INTERESA ==================
export async function noMeInteresa(id_publicacion: number) {
  const res = await api.post(`/no-me-interesa/${id_publicacion}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerNoMeInteresa() {
  const res = await api.get("/no-me-interesa", { headers: getAuthHeaders() });
  return res.data;
}

export async function quitarNoMeInteresa(id_publicacion: number) {
  const res = await api.delete(`/quitar-no-me-interesa/${id_publicacion}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ================== REACCIONES, COMENTARIOS Y GUARDADOS ==================
export async function darMeGusta(idPublicacion: number) {
  const res = await api.post(`/me-gusta/${idPublicacion}`, null, { headers: getAuthHeaders() });
  return res.data;
}

export async function quitarMeGusta(idPublicacion: number) {
  const res = await api.delete(`/me-gusta/${idPublicacion}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function guardarPublicacion(idPublicacion: number) {
  const res = await api.post(`/guardar/${idPublicacion}`, null, { headers: getAuthHeaders() });
  return res.data;
}

export async function quitarGuardado(idPublicacion: number) {
  const res = await api.delete(`/guardar/${idPublicacion}`, { headers: getAuthHeaders() });
  return res.data;
}

// ======== COMENTARIOS ========
export interface ComentarioData {
  contenido: string;
  id_publicacion: number;
  id_comentario_padre?: number | null;
}

export async function crearComentario(comentarioData: ComentarioData) {
  const res = await api.post("/comentarios", comentarioData, { headers: getAuthHeaders() });
  return res.data;
}

export async function obtenerComentarios(idPublicacion: number) {
  const res = await api.get(`/comentarios/publicacion/${idPublicacion}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerPublicacionDeComentario(idComentario: number) {
  const res = await api.get(`/comentarios/${idComentario}/publicacion`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function eliminarComentario(idComentario: number) {
  const res = await api.delete(`/comentarios/${idComentario}`, { headers: getAuthHeaders() });
  return res.data;
}

// ======== ME GUSTA COMENTARIOS ========
export async function darMeGustaComentario(idComentario: number) {
  const res = await api.post(`/me-gusta-comentario/${idComentario}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function quitarMeGustaComentario(idComentario: number) {
  const res = await api.delete(`/me-gusta-comentario/${idComentario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== ESTADÍSTICAS PUBLICACIONES ========
export async function obtenerEstadisticasPublicacion(idPublicacion: number) {
  const res = await api.get(`/publicaciones/${idPublicacion}/estadisticas`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== GUARDADOS ========
export async function obtenerPublicacionesGuardadas() {
  const res = await api.get("/guardados", { headers: getAuthHeaders() });
  return res.data;
}

// ======== ALIASES COMPATIBILIDAD ========
export const getSolicitudesAmistad = obtenerSolicitudesPendientes;
export const getAmigos = obtenerAmigos;
export const getCategorias = obtenerCategorias;

// src/services/api.ts - AGREGAR ESTAS FUNCIONES

// ================== COMPARTIR PUBLICACIONES ==================

// Compartir publicación
export interface CompartirData {
  mensaje?: string;
  tipo: string;
  amigos_ids?: number[];
}

export const compartirPublicacion = async (
  idPublicacion: number, 
  mensaje: string = "", 
  tipo: string = "perfil", 
  amigos_ids: number[] = []
): Promise<any> => {
  const formData = new FormData();
  formData.append("mensaje", mensaje);
  formData.append("tipo", tipo);
  
  if (tipo === "amigos" && amigos_ids.length > 0) {
    formData.append("amigos_ids", amigos_ids.join(","));
  }

  const res = await api.post(`/compartir/${idPublicacion}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Obtener publicaciones compartidas
export const obtenerPublicacionesCompartidas = async (): Promise<any[]> => {
  const res = await api.get("/compartidos", { headers: getAuthHeaders() });
  return res.data;
};

// Obtener compartidos de amigos
export const obtenerCompartidosAmigos = async (): Promise<any[]> => {
  const res = await api.get("/compartidos/amigos", { headers: getAuthHeaders() });
  return res.data;
};

// Obtener mis compartidos
export const obtenerMisCompartidos = async (): Promise<any[]> => {
  const res = await api.get("/compartidos/mis-compartidos", { headers: getAuthHeaders() });
  return res.data;
};

// Obtener compartido por ID
export const obtenerCompartidoPorId = async (idCompartido: number): Promise<any> => {
  const res = await api.get(`/compartidos/detalle/${idCompartido}`, { headers: getAuthHeaders() });
  return res.data;
};


// ================== BÚSQUEDA ==================
export async function buscarUsuarios(query: string): Promise<any[]> {
  if (!query || query.length < 2) {
    throw new Error("La búsqueda debe tener al menos 2 caracteres");
  }
  
  const res = await api.get(`/buscar?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}


// Eliminar compartido
export const eliminarCompartido = async (idCompartido: number): Promise<void> => {
  await api.delete(`/compartidos/${idCompartido}`, { headers: getAuthHeaders() });
};


// ================== CHAT Y MENSAJES ==================

export interface Chat {
  id: number;
  username: string;
  nombre_completo: string;
  foto_perfil: string | null;
  lastMessage: string;
  color: string;
  ultima_actividad: string;
  no_leidos: number;
}

export interface Message {
  id: number;
  sender: "yo" | "otro";
  sender_id: number;
  sender_username: string;
  text: string;
  tipo: string;
  archivo_url?: string;
  fecha: string;
  leido: boolean;
}

export interface ConfiguracionChat {
  fondo_chat: string;
  color_burbuja: string;
}

// Obtener chats del usuario
export async function obtenerChats(): Promise<Chat[]> {
  const res = await api.get("/chats", { headers: getAuthHeaders() });
  return res.data;
}

// Obtener mensajes de un chat
export async function obtenerMensajesChat(idChat: number): Promise<Message[]> {
  const res = await api.get(`/chats/${idChat}/mensajes`, { headers: getAuthHeaders() });
  return res.data;
}

// Enviar mensaje con archivo
export const enviarMensajeArchivo = async (
  idChat: number, 
  archivo: File, 
  tipo: string
): Promise<any> => {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("tipo", tipo);

  const res = await api.post(`/chats/${idChat}/mensajes/archivo`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Enviar mensaje (texto o con archivo)
export const enviarMensaje = async (
  idChat: number, 
  contenido: string, 
  tipo: string = "texto",
  archivo?: File
): Promise<any> => {
  if (archivo) {
    // Si hay archivo, usar el endpoint de archivos
    return await enviarMensajeArchivo(idChat, archivo, tipo);
  } else {
    // Si es texto normal, usar el endpoint original
    const res = await api.post(`/chats/${idChat}/mensajes`, 
      { contenido, tipo }, 
      { headers: getAuthHeaders() }
    );
    return res.data;
  }
};

export const enviarMensajeMejorado = async (
  idChat: number, 
  contenido: string, 
  tipo: string = "texto",
  archivo?: File
): Promise<any> => {
  if (archivo) {
    // Si hay archivo, usar el endpoint de archivos
    return await enviarMensajeArchivo(idChat, archivo, tipo);
  } else {
    // Si es texto normal, usar el endpoint original
    return await enviarMensaje(idChat, contenido, tipo);
  }
};

// Crear o obtener chat con usuario
export async function crearObtenerChat(idUsuarioDestino: number): Promise<{id_chat: number, existed: boolean}> {
  const res = await api.post(`/chats/con-usuario/${idUsuarioDestino}`, {}, { headers: getAuthHeaders() });
  return res.data;
}

// Configurar chat
export async function configurarChat(idChat: number, configuracion: ConfiguracionChat): Promise<any> {
  const res = await api.put(`/chats/${idChat}/configuracion`, configuracion, { headers: getAuthHeaders() });
  return res.data;
}
// frontend/services/api.ts - AGREGAR ESTAS FUNCIONES

// ================== ELIMINAR CHATS Y MENSAJES ==================

// Eliminar mensaje
export const eliminarMensaje = async (idChat: number, idMensaje: number): Promise<void> => {
  const response = await api.delete(`/chats/${idChat}/mensajes/${idMensaje}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Eliminar chat completo
export const eliminarChat = async (idChat: number): Promise<void> => {
  await api.delete(`/chats/${idChat}`, {
    headers: getAuthHeaders(),
  });
};

// Eliminar mensaje para todos
export const eliminarMensajeParaTodos = async (idMensaje: number): Promise<void> => {
  const response = await api.delete(`/mensajes/${idMensaje}/para-todos`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};