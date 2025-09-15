// src/services/api.js
import axios from "axios";

// Configuración base de axios
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Obtener todos los usuarios
export async function getUsuarios() {
  try {
    const res = await api.get("/usuarios");
    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error.message);
    throw error;
  }
}

// Agregar usuario
export async function addUsuario(usuario) {
  try {
    const res = await api.post("/usuarios", usuario);
    return res.data;
  } catch (error) {
    console.error("❌ Error al agregar usuario:", error.message);
    throw error;
  }
}

// Eliminar usuario
export async function deleteUsuario(id) {
  try {
    const res = await api.delete(`/usuarios/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error.message);
    throw error;
  }
}

// Registrar usuario
export async function registerUsuario(usuario) {
  try {
    const res = await api.post("/usuarios", usuario);
    return res.data;
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error.message);
    throw error;
  }
}

