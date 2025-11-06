// frontend/services/api.ts
import axios from "axios";
import { Usuario } from "../context/AuthContext";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ======== UTIL ========
function getToken(): string {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token de sesión");
  return token;
}

function getUsuarioId(): number {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) throw new Error("No hay usuario autenticado");
  const parsed = JSON.parse(usuario);
  return parsed.id_usuario;
}

function getAuthHeaders() {
  return {
    token: getToken(),
    id_usuario: getUsuarioId().toString(),
  };
}

// ======== USUARIOS ========
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

// ======== LOGIN / SESIÓN ========
export async function loginUsuario(correo_electronico: string, contrasena: string) {
  const res = await api.post("/login", { correo_electronico, contrasena });
  const { token, usuario } = res.data;
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
  return { token, usuario };
}

export function logoutUsuario() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

// ======== PERFILES ========
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
      "Content-Type": "multipart/form-data" 
    },
  });
  return res.data;
}

// ======== PUBLICACIONES ========
export async function crearPublicacion(data: FormData) {
  const res = await api.post("/publicaciones", data, {
    headers: { 
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data" 
    },
  });
  return res.data;
}

export async function getPublicaciones() {
  const res = await api.get("/publicaciones", {
    headers: getAuthHeaders(),
  });
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

// ======== RELACIONES SOCIALES ========
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
  const res = await api.get("/seguidores", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerSeguidoresUsuario(id_usuario: number) {
  const res = await api.get(`/seguidores/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerSiguiendo() {
  const res = await api.get("/siguiendo", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerSiguiendoUsuario(id_usuario: number) {
  const res = await api.get(`/siguiendo/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== AMISTADES ========
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
  const res = await api.get("/solicitudes-amistad", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerAmigos(id_usuario?: number) {
  const url = id_usuario ? `/amigos?id_usuario=${id_usuario}` : "/amigos";
  const res = await api.get(url, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function eliminarAmigo(id_amigo: number) {
  const res = await api.delete(`/amigos/${id_amigo}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== NOTIFICACIONES ========
export async function getNotificaciones() {
  const res = await api.get("/notificaciones", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function marcarNotificacionesLeidas() {
  const res = await api.put(
    "/notificaciones/leidas",
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

// ======== REPORTAR USUARIO ========
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

// ======== CATEGORÍAS ========
export async function obtenerCategorias() {
  const res = await api.get("/categorias");
  return res.data;
}

// ======== ESTADÍSTICAS ========
export async function obtenerEstadisticasPerfil(id_usuario: number) {
  const res = await api.get(`/estadisticas-perfil/${id_usuario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== RECUPERACIÓN DE CONTRASEÑA ========
export async function solicitarRecuperacion(correo: string) {
  const res = await api.post("/olvidaste-contrasena", { correo });
  return res.data;
}

export async function restablecerContrasena(token: string, nueva_contrasena: string) {
  const res = await api.post("/restablecer-contrasena", { token, nueva_contrasena });
  return res.data;
}

// ======== BLOQUEAR / DESBLOQUEAR USUARIO ========
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
  const res = await api.get("/usuarios-bloqueados", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== NO ME INTERESA ========
export async function noMeInteresa(id_publicacion: number) {
  const res = await api.post(`/no-me-interesa/${id_publicacion}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerNoMeInteresa() {
  const res = await api.get("/no-me-interesa", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function quitarNoMeInteresa(id_publicacion: number) {
  const res = await api.delete(`/quitar-no-me-interesa/${id_publicacion}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== NUEVAS FUNCIONALIDADES: REACCIONES, COMENTARIOS Y GUARDADOS ========

// Me gusta publicaciones
export async function darMeGusta(idPublicacion: number) {
  const res = await api.post(`/me-gusta/${idPublicacion}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function quitarMeGusta(idPublicacion: number) {
  const res = await api.delete(`/me-gusta/${idPublicacion}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// Guardar publicaciones
export async function guardarPublicacion(idPublicacion: number) {
  const res = await api.post(`/guardar/${idPublicacion}`, null, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function quitarGuardado(idPublicacion: number) {
  const res = await api.delete(`/guardar/${idPublicacion}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// Comentarios
export interface ComentarioData {
  contenido: string;
  id_publicacion: number;
  id_comentario_padre?: number | null;
}

export async function crearComentario(comentarioData: ComentarioData) {
  const res = await api.post("/comentarios", comentarioData, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function obtenerComentarios(idPublicacion: number) {
  const res = await api.get(`/comentarios/publicacion/${idPublicacion}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function eliminarComentario(idComentario: number) {
  const res = await api.delete(`/comentarios/${idComentario}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// Me gusta comentarios
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

// Estadísticas de publicación
export async function obtenerEstadisticasPublicacion(idPublicacion: number) {
  const res = await api.get(`/publicaciones/${idPublicacion}/estadisticas`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// Publicaciones guardadas
export async function obtenerPublicacionesGuardadas() {
  const res = await api.get("/guardados", {
    headers: getAuthHeaders(),
  });
  return res.data;
}

// ======== ALIASES PARA COMPATIBILIDAD ========
export const getSolicitudesAmistad = obtenerSolicitudesPendientes;
export const getAmigos = obtenerAmigos;
export const getCategorias = obtenerCategorias;