// frontend/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
  getPerfil,
  obtenerUsuariosBloqueados,
  obtenerNoMeInteresa,
  solicitarRecuperacion,
} from "../services/api";

// -------------------- Tipos --------------------
export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  correo_electronico: string;
  foto_perfil?: string | null;
  perfil?: {
    foto_perfil?: string | null;
    descripcion?: string;
    biografia?: string;
  };
}

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  token: string | null;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  actualizarFotoPerfil: (nuevaFoto: string) => void;
  forzarActualizacionPerfil: () => void;
  recargarPerfilCompleto: () => Promise<void>; // 👈 NUEVA FUNCIÓN
  usuariosBloqueados: number[];
  publicacionesNoMeInteresa: number[];
  cargarBloqueados: () => Promise<void>;
  cargarNoMeInteresa: () => Promise<void>;
  agregarUsuarioBloqueado: (idUsuario: number) => void;
  removerUsuarioBloqueado: (idUsuario: number) => void;
  agregarNoMeInteresa: (idPublicacion: number) => void;
  removerNoMeInteresa: (idPublicacion: number) => void;
}

// -------------------- Contexto --------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [actualizacion, setActualizacion] = useState(0);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState<number[]>([]);
  const [publicacionesNoMeInteresa, setPublicacionesNoMeInteresa] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------- Función para obtener URL con timestamp --------------------
  const getImageUrlWithTimestamp = (imageUrl: string | undefined | null): string | null => {
    if (!imageUrl || imageUrl.trim() === "") return null;
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}t=${new Date().getTime()}`;
  };

  // -------------------- Cargar listas --------------------
  const cargarBloqueados = async () => {
    if (!token || !usuario) return;
    try {
      const bloqueados = await obtenerUsuariosBloqueados();
      const idsBloqueados = bloqueados.map((b: any) => b.usuario.id_usuario);
      setUsuariosBloqueados(idsBloqueados);
    } catch (error) {
      console.error("Error cargando usuarios bloqueados:", error);
    }
  };

  const cargarNoMeInteresa = async () => {
    if (!token || !usuario) return;
    try {
      const noMeInteresa = await obtenerNoMeInteresa();
      const idsNoMeInteresa = noMeInteresa.map((item: any) => item.publicacion.id_publicacion);
      setPublicacionesNoMeInteresa(idsNoMeInteresa);
    } catch (error) {
      console.error("Error cargando no me interesa:", error);
    }
  };

  // -------------------- Gestión de listas --------------------
  const agregarUsuarioBloqueado = (idUsuario: number) => {
    setUsuariosBloqueados((prev) => [...prev, idUsuario]);
  };

  const removerUsuarioBloqueado = (idUsuario: number) => {
    setUsuariosBloqueados((prev) => prev.filter((id) => id !== idUsuario));
  };

  const agregarNoMeInteresa = (idPublicacion: number) => {
    setPublicacionesNoMeInteresa((prev) => [...prev, idPublicacion]);
  };

  const removerNoMeInteresa = (idPublicacion: number) => {
    setPublicacionesNoMeInteresa((prev) => prev.filter((id) => id !== idPublicacion));
  };

  // -------------------- Función para actualizar usuario --------------------
  const actualizarUsuario = (nuevosDatos: Partial<Usuario>) => {
    if (usuario) {
      const usuarioActualizado = { ...usuario, ...nuevosDatos };
      setUsuario(usuarioActualizado);
      localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      return usuarioActualizado;
    }
    return usuario;
  };

  // -------------------- Recargar perfil completo --------------------
  const recargarPerfilCompleto = async (): Promise<void> => {
    if (usuario?.id_usuario && token) {
      try {
        const perfilData = await getPerfil(usuario.id_usuario);
        
        // Procesar la foto de perfil con timestamp
        const fotoConTimestamp = getImageUrlWithTimestamp(perfilData.foto_perfil);
        
        const usuarioActualizado = {
          ...usuario,
          foto_perfil: fotoConTimestamp,
          perfil: {
            ...usuario.perfil,
            ...perfilData,
            foto_perfil: fotoConTimestamp
          }
        };
        
        setUsuario(usuarioActualizado);
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        
        console.log("✅ Perfil recargado completamente:", usuarioActualizado);
        
      } catch (error) {
        console.error("❌ Error recargando perfil:", error);
        throw error;
      }
    }
  };

  // -------------------- Cargar datos guardados --------------------
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsuario = localStorage.getItem("usuario");

    if (storedToken) setToken(storedToken);

    if (storedUsuario) {
      const parsedUser = JSON.parse(storedUsuario);
      
      // Procesar foto de perfil con timestamp al cargar
      if (parsedUser?.foto_perfil) {
        parsedUser.foto_perfil = getImageUrlWithTimestamp(parsedUser.foto_perfil);
      }
      if (parsedUser?.perfil?.foto_perfil) {
        parsedUser.perfil.foto_perfil = getImageUrlWithTimestamp(parsedUser.perfil.foto_perfil);
      }
      
      setUsuario(parsedUser);

      if (parsedUser?.id_usuario && storedToken) {
        getPerfil(parsedUser.id_usuario)
          .then((perfilData) => {
            // Procesar la nueva foto con timestamp
            const nuevaFoto = getImageUrlWithTimestamp(perfilData.foto_perfil || parsedUser.foto_perfil);
            
            const usuarioActualizado = { 
              ...parsedUser, 
              foto_perfil: nuevaFoto,
              perfil: {
                ...parsedUser.perfil,
                ...perfilData,
                foto_perfil: nuevaFoto
              }
            };
            
            setUsuario(usuarioActualizado);
            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
            
            cargarBloqueados();
            cargarNoMeInteresa();
          })
          .catch((err) => console.error("Error al cargar perfil:", err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [actualizacion]);

  // -------------------- Login --------------------
  const login = (newToken: string, newUsuario: Usuario) => {
    setToken(newToken);
    
    // Procesar foto de perfil con timestamp
    const usuarioConTimestamp = {
      ...newUsuario,
      foto_perfil: getImageUrlWithTimestamp(newUsuario.foto_perfil),
      perfil: {
        ...newUsuario.perfil,
        foto_perfil: getImageUrlWithTimestamp(newUsuario.perfil?.foto_perfil)
      }
    };
    
    setUsuario(usuarioConTimestamp);
    localStorage.setItem("token", newToken);
    localStorage.setItem("usuario", JSON.stringify(usuarioConTimestamp));

    // Recargar perfil completo después del login
    getPerfil(newUsuario.id_usuario)
      .then((perfilData) => {
        const nuevaFoto = getImageUrlWithTimestamp(perfilData.foto_perfil || newUsuario.foto_perfil);
        const usuarioActualizado = { 
          ...usuarioConTimestamp, 
          foto_perfil: nuevaFoto,
          perfil: {
            ...usuarioConTimestamp.perfil,
            ...perfilData,
            foto_perfil: nuevaFoto
          }
        };
        
        setUsuario(usuarioActualizado);
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        
        cargarBloqueados();
        cargarNoMeInteresa();
      })
      .catch((err) => console.error("Error al actualizar perfil tras login:", err));
  };

  // -------------------- Logout --------------------
  const logout = () => {
    setToken(null);
    setUsuario(null);
    setUsuariosBloqueados([]);
    setPublicacionesNoMeInteresa([]);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  };

  // -------------------- Actualizar foto de perfil --------------------
  const actualizarFotoPerfil = (nuevaFoto: string) => {
    if (usuario) {
      const fotoConTimestamp = getImageUrlWithTimestamp(nuevaFoto);
      
      const usuarioActualizado = { 
        ...usuario, 
        foto_perfil: fotoConTimestamp,
        perfil: {
          ...usuario.perfil,
          foto_perfil: fotoConTimestamp
        }
      };
      
      setUsuario(usuarioActualizado);
      localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      
      console.log("✅ Foto de perfil actualizada en AuthContext:", fotoConTimestamp);
      
      // Disparar evento global para notificar a todos los componentes
      window.dispatchEvent(new CustomEvent('fotoPerfilActualizada', {
        detail: { 
          nuevaFoto: fotoConTimestamp,
          idUsuario: usuario.id_usuario 
        }
      }));
      
      // También forzar actualización del estado
      setActualizacion(prev => prev + 1);
    }
  };

  // -------------------- Forzar actualización del perfil --------------------
  const forzarActualizacionPerfil = () => {
    if (usuario?.id_usuario && token) {
      getPerfil(usuario.id_usuario)
        .then((perfilData) => {
          const nuevaFoto = getImageUrlWithTimestamp(perfilData.foto_perfil || usuario.foto_perfil);
          
          const usuarioActualizado = { 
            ...usuario, 
            foto_perfil: nuevaFoto,
            perfil: {
              ...usuario.perfil,
              ...perfilData,
              foto_perfil: nuevaFoto
            }
          };
          
          setUsuario(usuarioActualizado);
          localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
          setActualizacion((prev) => prev + 1);
          
          console.log("✅ Perfil forzadamente actualizado:", usuarioActualizado);
        })
        .catch((err) => console.error("Error al forzar actualización:", err));
    }
  };

  // -------------------- Mientras carga --------------------
  if (loading) {
    return <div className="text-center p-4">Cargando sesión...</div>;
  }

  // -------------------- Provider --------------------
  return (
    <AuthContext.Provider
      value={{
        usuario,
        setUsuario,
        token,
        login,
        logout,
        actualizarFotoPerfil,
        forzarActualizacionPerfil,
        recargarPerfilCompleto, // 👈 EXPORTADA
        usuariosBloqueados,
        publicacionesNoMeInteresa,
        cargarBloqueados,
        cargarNoMeInteresa,
        agregarUsuarioBloqueado,
        removerUsuarioBloqueado,
        agregarNoMeInteresa,
        removerNoMeInteresa,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// -------------------- Hook personalizado --------------------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};

// -------------------- Componente OlvidasteContrasena --------------------
export default function OlvidasteContrasena() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await solicitarRecuperacion(correo);
      setMensaje(res.mensaje);
    } catch (err: any) {
      setMensaje(err.detail || "Error al enviar correo");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        placeholder="Tu correo"
        required
      />
      <button type="submit">Enviar enlace</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
}
