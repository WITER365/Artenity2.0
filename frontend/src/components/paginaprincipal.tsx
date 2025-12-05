// src/components/paginaprincipal.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Home,
  Grid,
  MessageSquare,
  Settings,
  Image,
  MoreVertical,
  Heart,
  MessageCircle,
  Bookmark,
  Reply,
  Share2, 
  X,
  Users,
  FileImage,
  X as CloseIcon,
  Search,
  User,
  Tag
} from "lucide-react";
import "../styles/paginaprincipal.css";
import logoImg from "../assets/img/logo.png";
import defaultProfile from "../assets/img/fotoperfildefault.jpg";
import {
  getPublicaciones, 
  crearPublicacion, 
  eliminarPublicacion, 
  bloquearUsuario, 
  noMeInteresa,
  darMeGusta,
  quitarMeGusta,
  guardarPublicacion,
  quitarGuardado,
  crearComentario,
  obtenerComentarios,
  obtenerEstadisticasPublicacion,
  darMeGustaComentario,
  quitarMeGustaComentario,
  compartirPublicacion,
  obtenerAmigos,
  buscarUsuarios,
  seguirUsuario,
  obtenerSugerenciasUsuarios
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import NotificacionesPanel from "../components/NotificacionesPanel";

// Interfaces TypeScript
interface SugerenciaUsuario {
  id_usuario: number;
  nombre_usuario: string;
  nombre: string;
  foto_perfil: string | null;
  puntuacion: number;
  tipo: "popular" | "recomendado_amigos";
  recomendado_por?: string;
  estadisticas: {
    likes_totales: number;
    seguidores: number;
    publicaciones: number;
  };
}

interface Publicacion {
  id_publicacion: number;
  id_usuario: number;
  contenido: string;
  medios?: string[];
  tipo_medio?: string;
  fecha_creacion: string;
  usuario: {
    id_usuario: number;
    nombre_usuario: string;
    nombre: string;
    perfil?: {
      foto_perfil?: string;
    };
  };
  imagen?: string;
  etiquetas?: string[] | string;
}

interface EstadisticasPublicacion {
  total_me_gusta: number;
  total_comentarios: number;
  total_guardados: number;
  me_gusta_dado: boolean;
  guardado: boolean;
}

interface ComentarioData {
  contenido: string;
  id_publicacion: number;
  id_comentario_padre?: number | null;
}

interface Comentario {
  id_comentario: number;
  id_usuario: number;
  id_publicacion: number;
  id_comentario_padre: number | null;
  contenido: string;
  fecha: string;
  usuario: {
    id_usuario: number;
    nombre: string;
    nombre_usuario: string;
    perfil?: {
      foto_perfil?: string;
    };
  };
  respuestas: Comentario[];
  total_me_gusta: number;
  me_gusta_dado: boolean;
}

interface ComentariosResponse {
  comentarios: Comentario[];
  total: number;
}

interface Amigo {
  id_usuario: number;
  nombre_usuario: string;
  foto_perfil?: string;
}

interface UsuarioBusqueda {
  id_usuario: number;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  correo_electronico: string;
  perfil?: {
    id_perfil: number;
    foto_perfil?: string;
    descripcion?: string;
    biografia?: string;
  };
  sigo: boolean;
}

const ComentarioComponent = ({ 
  comentario, 
  nivel = 0, 
  idPublicacion,
  onMeGusta,
  onResponder,
  nuevoComentario,
  onNuevoComentarioChange,
  onPublicarComentario,
  respondiendoA,
  onCancelarRespuesta
}: { 
  comentario: Comentario;
  nivel?: number;
  idPublicacion: number;
  onMeGusta: (idComentario: number, idPublicacion: number) => void;
  onResponder: (idPublicacion: number, idComentario: number) => void;
  nuevoComentario: {[key: number]: {contenido: string}};
  onNuevoComentarioChange: (idPublicacion: number, contenido: string) => void;
  onPublicarComentario: (idPublicacion: number, idComentarioPadre: number | null) => void;
  respondiendoA: {[key: number]: number | null};
  onCancelarRespuesta: (idPublicacion: number) => void;
}) => {
  const [mostrarRespuestas, setMostrarRespuestas] = useState(nivel < 2);
  const [respondiendo, setRespondiendo] = useState(false);
  const [mostrarInputRespuesta, setMostrarInputRespuesta] = useState(false);

  const toggleRespuesta = useCallback(() => {
    const nuevoEstado = !respondiendo;
    setRespondiendo(nuevoEstado);
    setMostrarInputRespuesta(nuevoEstado);
    
    if (nuevoEstado) {
      onResponder(idPublicacion, comentario.id_comentario);
    } else {
      onCancelarRespuesta(idPublicacion);
    }
  }, [respondiendo, idPublicacion, comentario.id_comentario, onResponder, onCancelarRespuesta]);

  const manejarPublicarRespuesta = () => {
    if (nuevoComentario[idPublicacion]?.contenido.trim()) {
      onPublicarComentario(idPublicacion, comentario.id_comentario);
      setMostrarInputRespuesta(false);
      setRespondiendo(false);
    }
  };

  const manejarCancelarRespuesta = () => {
    setMostrarInputRespuesta(false);
    setRespondiendo(false);
    onCancelarRespuesta(idPublicacion);
  };

  return (
    <div className={`comentario ${nivel > 0 ? 'comentario-respuesta' : ''}`} style={{ marginLeft: `${nivel * 20}px` }}>
      <div className="comentario-contenido">
        <Link to={`/usuario/${comentario.usuario.id_usuario}`}>
          <img
            src={comentario.usuario?.perfil?.foto_perfil?.trim() ? comentario.usuario.perfil.foto_perfil : defaultProfile}
            alt="foto de perfil"
            className="foto-perfil-comentario"
          />
        </Link>
        
        <div className="comentario-info">
          <div className="comentario-header">
            <span className="comentario-usuario">{comentario.usuario.nombre_usuario}</span>
            <span className="comentario-fecha">
              {new Date(comentario.fecha).toLocaleString()}
            </span>
          </div>
          
          <p className="comentario-texto">{comentario.contenido}</p>
          
          <div className="comentario-acciones">
            <button 
              className={`accion-comentario ${comentario.me_gusta_dado ? 'liked' : ''}`}
              onClick={() => onMeGusta(comentario.id_comentario, idPublicacion)}
            >
              <Heart size={14} />
              <span>{comentario.total_me_gusta || 0}</span>
            </button>
            
            <button 
              className="accion-comentario"
              onClick={toggleRespuesta}
            >
              <Reply size={14} />
              <span>Responder</span>
            </button>

            {comentario.respuestas.length > 0 && (
              <button 
                className="accion-comentario"
                onClick={() => setMostrarRespuestas(!mostrarRespuestas)}
              >
                <MessageCircle size={14} />
                <span>
                  {mostrarRespuestas ? 'Ocultar' : 'Ver'} {comentario.respuestas.length} 
                  {comentario.respuestas.length === 1 ? ' respuesta' : ' respuestas'}
                </span>
              </button>
            )}
          </div>

          {mostrarInputRespuesta && respondiendoA[idPublicacion] === comentario.id_comentario && (
            <div className="respuesta-directa">
              <div className="respuesta-input-container">
                <input
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  value={nuevoComentario[idPublicacion]?.contenido || ""}
                  onChange={(e) => onNuevoComentarioChange(idPublicacion, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      manejarPublicarRespuesta();
                    }
                  }}
                  className="respuesta-input"
                  autoFocus
                />
                <div className="acciones-respuesta">
                  <button 
                    onClick={manejarPublicarRespuesta}
                    className="btn-enviar"
                    disabled={!nuevoComentario[idPublicacion]?.contenido.trim()}
                  >
                    Responder
                  </button>
                  <button 
                    onClick={manejarCancelarRespuesta}
                    className="btn-cancelar"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {mostrarRespuestas && comentario.respuestas.length > 0 && (
        <div className="respuestas">
          {comentario.respuestas.map(respuesta => (
            <ComentarioComponent 
              key={respuesta.id_comentario} 
              comentario={respuesta} 
              nivel={nivel + 1}
              idPublicacion={idPublicacion}
              onMeGusta={onMeGusta}
              onResponder={onResponder}
              nuevoComentario={nuevoComentario}
              onNuevoComentarioChange={onNuevoComentarioChange}
              onPublicarComentario={onPublicarComentario}
              respondiendoA={respondiendoA}
              onCancelarRespuesta={onCancelarRespuesta}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function PaginaPrincipal() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  
  // Estados principales
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [contenido, setContenido] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  
  // Estados para etiquetas
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [inputEtiqueta, setInputEtiqueta] = useState("");
  
  // Estados para sugerencias
  const [sugerencias, setSugerencias] = useState<SugerenciaUsuario[]>([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  
  // Lista de categorías disponibles
  const categoriasDisponibles = [
    "Danza", "Música", "Cine", "Literatura", 
    "Pintura", "Teatro", "Fotografía", "Escultura",
    "Arquitectura", "Artes Visuales"
  ];
  
  // ESTADOS PARA LA BÚSQUEDA
  const [busqueda, setBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<UsuarioBusqueda[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [buscando, setBuscando] = useState(false);
  
  // Estados de interacción
  const [comentariosAbiertos, setComentariosAbiertos] = useState<{[key: number]: boolean}>({});
  const [nuevoComentario, setNuevoComentario] = useState<{[key: number]: {contenido: string}}>({});
  const [respondiendoA, setRespondiendoA] = useState<{[key: number]: number | null}>({});
  const [comentarios, setComentarios] = useState<{[key: number]: ComentariosResponse}>({});
  const [estadisticas, setEstadisticas] = useState<{[key: number]: EstadisticasPublicacion}>({});
  
  // Estados de UI
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [compartirAbierto, setCompartirAbierto] = useState<number | null>(null);
  const [mensajeCompartir, setMensajeCompartir] = useState("");
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState<number[]>([]);
  const [mostrarSeleccionAmigos, setMostrarSeleccionAmigos] = useState(false);

  // ✅ Efectos
  useEffect(() => {
    document.body.classList.add("pagina-principal");
    return () => {
      document.body.classList.remove("pagina-principal");
    };
  }, []);

  useEffect(() => {
    cargarPublicaciones();
  }, []);

  useEffect(() => {
    if (mostrarSeleccionAmigos) {
      cargarAmigos();
    }
  }, [mostrarSeleccionAmigos]);

  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarSugerenciasUsuarios();
    }
  }, [usuario]);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuAbierto(null);
      setCompartirAbierto(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // FUNCIÓN PARA CARGAR SUGERENCIAS DE USUARIOS
  const cargarSugerenciasUsuarios = async () => {
    try {
      setCargandoSugerencias(true);
      const data = await obtenerSugerenciasUsuarios();
      setSugerencias(data.sugerencias || []);
    } catch (error) {
      console.error("Error cargando sugerencias:", error);
      setSugerencias([]);
    } finally {
      setCargandoSugerencias(false);
    }
  };

  // FUNCIÓN PARA SEGUIR A UN USUARIO SUGERIDO
  const manejarSeguirSugerido = async (idUsuario: number) => {
    try {
      await seguirUsuario(idUsuario);
      
      // Actualizar lista de sugerencias (eliminar al usuario seguido)
      setSugerencias(prev => prev.filter(s => s.id_usuario !== idUsuario));
      
      // Mostrar notificación
      const notificacionEvent = new CustomEvent('nuevaNotificacion', {
        detail: { mensaje: 'Usuario seguido exitosamente', tipo: 'exito' }
      });
      window.dispatchEvent(notificacionEvent);
      
    } catch (error: any) {
      console.error("Error siguiendo usuario:", error);
      
      const notificacionEvent = new CustomEvent('nuevaNotificacion', {
        detail: { 
          mensaje: error.response?.data?.detail || 'Error al seguir usuario', 
          tipo: 'error' 
        }
      });
      window.dispatchEvent(notificacionEvent);
    }
  };

  // FUNCIÓN PARA AGREGAR ETIQUETA
  const agregarEtiqueta = (etiqueta: string) => {
    const etiquetaFormateada = etiqueta.trim();
    if (etiquetaFormateada && !etiquetas.includes(etiquetaFormateada) && etiquetas.length < 5) {
      setEtiquetas([...etiquetas, etiquetaFormateada]);
      setInputEtiqueta("");
    }
  };

  // FUNCIÓN PARA ELIMINAR ETIQUETA
  const eliminarEtiqueta = (index: number) => {
    setEtiquetas(etiquetas.filter((_, i) => i !== index));
  };

  // FUNCIÓN PARA BUSCAR USUARIOS
  const buscarUsuariosHandler = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResultadosBusqueda([]);
      setMostrarResultados(false);
      return;
    }

    setBuscando(true);
    try {
      const resultados = await buscarUsuarios(query);
      setResultadosBusqueda(resultados);
      setMostrarResultados(true);
    } catch (error) {
      console.error("Error buscando usuarios:", error);
      setResultadosBusqueda([]);
    } finally {
      setBuscando(false);
    }
  }, []);

  // EFFECT PARA BÚSQUEDA EN TIEMPO REAL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busqueda.trim()) {
        buscarUsuariosHandler(busqueda.trim());
      } else {
        setResultadosBusqueda([]);
        setMostrarResultados(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, buscarUsuariosHandler]);

  // FUNCIÓN PARA MANEJAR CLIC EN RESULTADO DE BÚSQUEDA
  const manejarClicUsuario = (idUsuario: number) => {
    navigate(`/usuario/${idUsuario}`);
    setBusqueda("");
    setMostrarResultados(false);
    setResultadosBusqueda([]);
  };

  // FUNCIÓN PARA CERRAR RESULTADOS AL HACER CLIC FUERA
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Funciones de carga de datos
  const cargarAmigos = async () => {
    try {
      const amigosData = await obtenerAmigos();
      setAmigos(amigosData);
    } catch (error) {
      console.error("Error cargando amigos:", error);
    }
  };

  const cargarEstadisticas = async (idPublicacion: number) => {
    try {
      const stats = await obtenerEstadisticasPublicacion(idPublicacion);
      setEstadisticas(prev => ({
        ...prev,
        [idPublicacion]: stats
      }));
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const cargarComentarios = async (idPublicacion: number) => {
    try {
      const comentariosData = await obtenerComentarios(idPublicacion);
      setComentarios(prev => ({
        ...prev,
        [idPublicacion]: comentariosData
      }));
    } catch (error) {
      console.error("Error cargando comentarios:", error);
    }
  };

  // Función mejorada para cargar publicaciones
  const cargarPublicaciones = async () => {
    try {
      const posts = await getPublicaciones();
      console.log("📥 Publicaciones recibidas:", posts);

      const postsProcesados = posts.map((p: any) => {
        // Procesar foto de perfil
        let fotoPerfil = defaultProfile;
        if (p.usuario?.perfil?.foto_perfil?.trim()) {
          fotoPerfil = `${p.usuario.perfil.foto_perfil}?t=${new Date().getTime()}`;
        }

        // PROCESAMIENTO CORREGIDO DE MEDIOS
        let mediosArray: string[] = [];
        
        if (p.medios && Array.isArray(p.medios)) {
          mediosArray = p.medios;
        } else if (p.imagen) {
          try {
            if (typeof p.imagen === 'string') {
              const parsed = JSON.parse(p.imagen);
              if (Array.isArray(parsed)) {
                mediosArray = parsed;
              } else if (parsed.urls && Array.isArray(parsed.urls)) {
                mediosArray = parsed.urls;
              } else if (typeof parsed === 'string' && parsed.includes('http')) {
                mediosArray = [parsed];
              }
            } else if (typeof p.imagen === 'string' && p.imagen.includes('http')) {
              mediosArray = [p.imagen];
            }
          } catch (error) {
            if (typeof p.imagen === 'string' && p.imagen.includes('http')) {
              mediosArray = [p.imagen];
            }
          }
        }

        // Normalizar URLs
        mediosArray = mediosArray
          .map(url => {
            if (!url) return null;
            if (url.startsWith('http')) return url;
            return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
          })
          .filter((url): url is string => url !== null && url.trim() !== '');

      return {
        ...p,
        medios: mediosArray,
        etiquetas: p.etiquetas ? 
          (() => {
            try {
              if (typeof p.etiquetas === 'string') {
                if (p.etiquetas.trim().startsWith('[') && p.etiquetas.trim().endsWith(']')) {
                  return JSON.parse(p.etiquetas);
                }
                return [p.etiquetas];
              }
              return Array.isArray(p.etiquetas) ? p.etiquetas : [];
            } catch (error) {
              console.error("Error parsing etiquetas:", error);
              return [];
            }
          })() 
          : [],
        usuario: {
          ...p.usuario,
          perfil: {
            ...p.usuario?.perfil,
            foto_perfil: fotoPerfil,
          },
        },
      };
      });

      setPublicaciones(postsProcesados);

      // Cargar estadísticas para cada publicación
      postsProcesados.forEach((post: Publicacion) => {
        cargarEstadisticas(post.id_publicacion);
      });
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    }
  };

  // Funciones de manejo de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      if (files.length + selectedFiles.length > 15) {
        alert("Máximo 15 archivos permitidos");
        return;
      }

      const validFiles = selectedFiles.filter(file => {
        const fileType = file.type.split('/')[0];
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isValidImage = fileType === 'image' && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '');
        const isValidVideo = fileType === 'video' && ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '');
        
        if (!isValidImage && !isValidVideo) {
          alert(`Tipo de archivo no soportado: ${file.name}`);
          return false;
        }
        
        if (file.size > 20 * 1024 * 1024) {
          alert(`Archivo demasiado grande: ${file.name} (máximo 20MB)`);
          return false;
        }
        
        return true;
      });
      
      setFiles(prev => [...prev, ...validFiles]);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Función corregida para crear publicación CON ETIQUETAS
  const handlePost = async () => {
    if (!contenido.trim() && files.length === 0) {
      alert("Debes escribir algo o agregar una imagen/video");
      return;
    }

    if (files.length > 10) {
      alert("Máximo 10 archivos permitidos");
      return;
    }

    const data = new FormData();
    data.append("id_usuario", usuario!.id_usuario.toString());
    data.append("contenido", contenido);
    
    // Agregar etiquetas como JSON
    if (etiquetas.length > 0) {
      data.append("etiquetas", JSON.stringify(etiquetas));
    }
    
    files.forEach((file) => {
      data.append("files", file);
    });

    try {
      await crearPublicacion(data);
      
      // Limpiar formulario
      setContenido("");
      setFiles([]);
      setEtiquetas([]);
      setInputEtiqueta("");
      
      await cargarPublicaciones();
      
      // Notificación de éxito
      const notificacionEvent = new CustomEvent('nuevaNotificacion', {
        detail: { mensaje: 'Publicación creada exitosamente', tipo: 'exito' }
      });
      window.dispatchEvent(notificacionEvent);
      
    } catch (error: any) {
      console.error("❌ Error creando publicación:", error);
      let mensajeError = "Error al crear la publicación";
      
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      alert(mensajeError);
    }
  };

  // Funciones de interacción con publicaciones
  const handleMeGusta = async (idPublicacion: number) => {
    try {
      const stats = estadisticas[idPublicacion];
      if (stats?.me_gusta_dado) {
        await quitarMeGusta(idPublicacion);
      } else {
        await darMeGusta(idPublicacion);
      }
      await cargarEstadisticas(idPublicacion);
    } catch (error) {
      console.error("Error con me gusta:", error);
    }
  };

  const handleMeGustaComentario = async (idComentario: number, idPublicacion: number) => {
    try {
      const comentarioActual = encontrarComentario(comentarios[idPublicacion]?.comentarios, idComentario);
      if (comentarioActual?.me_gusta_dado) {
        await quitarMeGustaComentario(idComentario);
      } else {
        await darMeGustaComentario(idComentario);
      }
      await cargarComentarios(idPublicacion);
    } catch (error) {
      console.error("Error con me gusta en comentario:", error);
    }
  };

  const handleGuardar = async (idPublicacion: number) => {
    try {
      const stats = estadisticas[idPublicacion];
      if (stats?.guardado) {
        await quitarGuardado(idPublicacion);
      } else {
        await guardarPublicacion(idPublicacion);
      }
      await cargarEstadisticas(idPublicacion);
    } catch (error) {
      console.error("Error con guardar:", error);
    }
  };

  // Funciones de comentarios
  const toggleComentarios = async (idPublicacion: number) => {
    const nuevoEstado = !comentariosAbiertos[idPublicacion];
    setComentariosAbiertos(prev => ({
      ...prev,
      [idPublicacion]: nuevoEstado
    }));

    if (nuevoEstado && !comentarios[idPublicacion]) {
      await cargarComentarios(idPublicacion);
    }
  };

  const publicarComentario = async (idPublicacion: number, idComentarioPadre: number | null = null) => {
    const contenido = nuevoComentario[idPublicacion]?.contenido;
    if (!contenido?.trim()) return;

    try {
      const comentarioData: ComentarioData = {
        contenido,
        id_publicacion: idPublicacion,
        id_comentario_padre: idComentarioPadre
      };
      
      await crearComentario(comentarioData);
      
      setNuevoComentario(prev => ({
        ...prev,
        [idPublicacion]: { contenido: "" }
      }));

      setRespondiendoA(prev => ({
        ...prev,
        [idPublicacion]: null
      }));
      
      await cargarComentarios(idPublicacion);
      await cargarEstadisticas(idPublicacion);
    } catch (error) {
      console.error("Error publicando comentario:", error);
    }
  };

  const manejarRespuesta = (idPublicacion: number, idComentario: number) => {
    setRespondiendoA(prev => ({
      ...prev,
      [idPublicacion]: idComentario
    }));
    setNuevoComentario(prev => ({
      ...prev,
      [idPublicacion]: { contenido: "" }
    }));
  };

  const cancelarRespuesta = (idPublicacion: number) => {
    setRespondiendoA(prev => ({
      ...prev,
      [idPublicacion]: null
    }));
    setNuevoComentario(prev => ({
      ...prev,
      [idPublicacion]: { contenido: "" }
    }));
  };

  const encontrarComentario = (comentariosLista: Comentario[], idComentario: number): Comentario | null => {
    for (const comentario of comentariosLista) {
      if (comentario.id_comentario === idComentario) {
        return comentario;
      }
      if (comentario.respuestas.length > 0) {
        const encontrado = encontrarComentario(comentario.respuestas, idComentario);
        if (encontrado) return encontrado;
      }
    }
    return null;
  };

  // Funciones de compartir
  const handleCompartir = async (idPublicacion: number, tipo: string = "perfil") => {
    try {
      let amigosIdsParam: number[] = [];
      
      if (tipo === "amigos" && amigosSeleccionados.length > 0) {
        amigosIdsParam = amigosSeleccionados;
      }

      await compartirPublicacion(idPublicacion, mensajeCompartir, tipo, amigosIdsParam);
      
      // Notificación de éxito
      const notificacionEvent = new CustomEvent('nuevaNotificacion', {
        detail: { 
          mensaje: tipo === 'amigos' 
            ? `Publicación compartida con ${amigosSeleccionados.length} amigos` 
            : 'Publicación compartida exitosamente', 
          tipo: 'exito' 
        }
      });
      window.dispatchEvent(notificacionEvent);
      
      // Limpiar estados
      setCompartirAbierto(null);
      setMensajeCompartir("");
      setAmigosSeleccionados([]);
      setMostrarSeleccionAmigos(false);
      
    } catch (error: any) {
      console.error("❌ Error compartiendo publicación:", error);
      let mensajeError = 'Error al compartir publicación';
      
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      }
      
      const notificacionEvent = new CustomEvent('nuevaNotificacion', {
        detail: { mensaje: mensajeError, tipo: 'error' }
      });
      window.dispatchEvent(notificacionEvent);
    }
  };

  const compartirEnRedSocial = (redSocial: string, publicacion: Publicacion) => {
    const texto = `Mira esta publicación de ${publicacion.usuario.nombre_usuario} en Artenity: ${publicacion.contenido.substring(0, 100)}...`;
    const url = `${window.location.origin}/publicacion/${publicacion.id_publicacion}`;
    
    let shareUrl = "";
    
    switch (redSocial) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(texto + " " + url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(texto)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setCompartirAbierto(null);
  };

  const toggleAmigoSeleccionado = (idAmigo: number) => {
    setAmigosSeleccionados(prev => 
      prev.includes(idAmigo)
        ? prev.filter(id => id !== idAmigo)
        : [...prev, idAmigo]
    );
  };

  const toggleTodosAmigos = () => {
    if (amigosSeleccionados.length === amigos.length) {
      setAmigosSeleccionados([]);
    } else {
      setAmigosSeleccionados(amigos.map(amigo => amigo.id_usuario));
    }
  };

  // Funciones del menú
  const toggleMenu = (postId: number) => {
    setMenuAbierto(menuAbierto === postId ? null : postId);
  };

  const handleEliminarPublicacion = async (postId: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) return;

    try {
      await eliminarPublicacion(postId);
      setPublicaciones(publicaciones.filter((p) => p.id_publicacion !== postId));
      setMenuAbierto(null);
    } catch (error) {
      console.error("Error eliminando publicación:", error);
      alert("Error al eliminar la publicación");
    }
  };

  const handleBloquearUsuario = async (userId: number, userName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres bloquear a ${userName}?`)) return;

    try {
      await bloquearUsuario(userId);
      setPublicaciones(publicaciones.filter((p) => p.usuario.id_usuario !== userId));
      setMenuAbierto(null);
    } catch (error) {
      console.error("Error bloqueando usuario:", error);
      alert("Error al bloquear el usuario");
    }
  };

  const handleNoMeInteresa = async (postId: number) => {
    try {
      await noMeInteresa(postId);
      setPublicaciones(publicaciones.filter((p) => p.id_publicacion !== postId));
      setMenuAbierto(null);
    } catch (error) {
      console.error("Error marcando como no me interesa:", error);
      alert("Error al marcar la publicación");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  };

  // Función helper para determinar tipo de medio
  const esVideo = (medio: string): boolean => {
    return (
      medio.toLowerCase().includes('.mp4') || 
      medio.toLowerCase().includes('.avi') || 
      medio.toLowerCase().includes('.mov') ||
      medio.toLowerCase().includes('.webm') ||
      medio.toLowerCase().includes('.wmv') ||
      medio.toLowerCase().includes('.mkv')
    );
  };

  return (
    <div className="main-container">
      
      {/* Barra superior */}
      <div className="topbar">
        {/* BÚSQUEDA DE USUARIOS */}
        <div className="search-container"
          style={{
            position: 'relative',
            width: '300px',
            top: '30PX',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{ position: 'relative' }}>
            
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }} 
            />

            <input 
              type="text" 
              placeholder="Buscar usuarios..." 
              className="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={() => busqueda.length >= 2 && setMostrarResultados(true)}
              style={{ paddingLeft: '40px', width: '240px' }}
            />

          </div>

          {/* Resultados de búsqueda */}
          {mostrarResultados && (
            <div className="search-results" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto',
              marginTop: '4px'
            }}>
              {buscando ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                  Buscando usuarios...
                </div>
              ) : resultadosBusqueda.length > 0 ? (
                resultadosBusqueda.map((usuarioResultado) => (
                  <div
                    key={usuarioResultado.id_usuario}
                    className="search-result-item"
                    onClick={() => manejarClicUsuario(usuarioResultado.id_usuario)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <img
                      src={usuarioResultado.perfil?.foto_perfil || defaultProfile}
                      alt={usuarioResultado.nombre_usuario}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#333',
                        fontSize: '14px'
                      }}>
                        {usuarioResultado.nombre_usuario}
                      </div>
                      <div style={{ 
                        color: '#666',
                        fontSize: '12px'
                      }}>
                        {usuarioResultado.nombre} {usuarioResultado.apellido}
                      </div>
                      {usuarioResultado.sigo && (
                        <div style={{
                          color: '#007bff',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          Siguiendo
                        </div>
                      )}
                    </div>
                    <User size={16} color="#666" />
                  </div>
                ))
              ) : busqueda.length >= 2 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                  No se encontraron usuarios
                </div>
              ) : null}
            </div>
          )}
        </div>

        <NotificacionesPanel usuario={usuario} />
        <button className="img-btn" onClick={() => navigate("/perfil")}>
          <img
            src={usuario?.perfil?.foto_perfil ? `${usuario.perfil.foto_perfil}?t=${new Date().getTime()}` : defaultProfile}
            alt="perfil"
            className="perfiles perfiles-topbar"
          />
        </button>
        <button className="icon-btn" onClick={handleLogout}>⏻</button>
      </div>
       
      <aside className="sidebar">
        <div>
          {/* Logo de Artenity como botón */}
          <div className="header-botton">
            {/* Solo el logo es clickeable */}
            <button 
              className="logo-btn"
              onClick={() => navigate("/")}
            >
              <img src={logoImg} alt="Logo Artenity" className="logo" />
            </button>
          </div>
          
          <nav>
            <ul className="space-y-4">
              <li><button className="nav-btn" onClick={() => navigate("/principal")}><Home /> Home</button></li>
              <li><button className="nav-btn" onClick={() => navigate("/categorias")}><Grid /> Categorías</button></li>
              <li><button className="nav-btn" onClick={() => navigate("/mensajes")}><MessageSquare /> Mensajes</button></li>
              <li><button className="nav-btn" onClick={() => navigate("/configuraciones")}><Settings /> Configuración</button></li>
              <li><button className="nav-btn" onClick={() => navigate("/galeria")}><Image size={20} /> Galería de Arte</button></li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Sección central */}
      <section className="center-section">
        <div className="tabs"></div>

        {/* Crear nuevo post */}
        <div className="post-input">
       <textarea
        placeholder="¿QUÉ QUIERES ESCRIBIR?"
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={3}
        className="post-textarea"
        />
          
          {/* Selector de etiquetas */}
          <div className="etiquetas-container">
            <div className="etiquetas-input-wrapper">
              <div className="input-with-icon">
                <Tag size={16} className="tag-icon" />
                <input
                  type="text"
                  placeholder="Agregar etiquetas (ej: Danza, Música)..."
                  value={inputEtiqueta}
                  onChange={(e) => setInputEtiqueta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputEtiqueta.trim()) {
                      agregarEtiqueta(inputEtiqueta.trim());
                    }
                  }}
                  list="categorias-lista"
                  className="etiqueta-input"
                />
              </div>
              <datalist id="categorias-lista">
                {categoriasDisponibles.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <button 
                type="button" 
                onClick={() => inputEtiqueta.trim() && agregarEtiqueta(inputEtiqueta.trim())}
                className="btn-agregar-etiqueta"
              >
                Agregar
              </button>
            </div>
            
            {/* Etiquetas seleccionadas */}
            {etiquetas.length > 0 && (
              <div className="etiquetas-seleccionadas">
                <div className="etiquetas-header">
                  <span className="etiquetas-titulo">Etiquetas:</span>
                  <span className="etiquetas-contador">{etiquetas.length}/5</span>
                </div>
                <div className="etiquetas-chips">
                  {etiquetas.map((etiqueta, index) => (
                    <div key={index} className="etiqueta-chip">
                      {etiqueta}
                      <button 
                        type="button" 
                        onClick={() => eliminarEtiqueta(index)}
                        className="btn-eliminar-etiqueta"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="file-upload-section">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              id="file-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="file-upload-btn">
              <FileImage size={16} /> Agregar imágenes/videos
            </label>
            
            {files.length > 0 && (
              <div className="selected-files">
                <div className="files-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="Preview" className="file-preview" />
                      ) : (
                        <div className="video-preview">
                          <video className="file-preview">
                            <source src={URL.createObjectURL(file)} type={file.type} />
                          </video>
                          <div className="video-indicator">🎥</div>
                        </div>
                      )}
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <button type="button" onClick={() => removeFile(index)} className="remove-file-btn">
                          <CloseIcon size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="files-count">{files.length} archivo(s) seleccionado(s)</div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handlePost} 
            disabled={!contenido.trim() && files.length === 0}
            className="post-button"
          >
            POST
          </button>
        </div>

        <div className="banner">NUEVOS POSTERS!!</div>

        {/* Publicaciones */}
        <div className="posts">
          {publicaciones.map((post) => (
            <div key={post.id_publicacion} className="post-card">
              <div className="post-header">
                <Link to={`/usuario/${post.usuario?.id_usuario}`}>
                  <img
                    src={post.usuario?.perfil?.foto_perfil?.trim() ? post.usuario.perfil.foto_perfil : defaultProfile}
                    alt="foto de perfil"
                    className="foto-perfil-post"
                  />
                </Link>

                <div className="user-info">
                  <span className="username">{post.usuario?.nombre_usuario || "Usuario"}</span>
                  <span className="timestamp">{new Date(post.fecha_creacion).toLocaleString()}</span>
                </div>

                <div className="post-menu-container">
                  <button className="menu-btn" onClick={(e) => { e.stopPropagation(); toggleMenu(post.id_publicacion); }}>
                    <MoreVertical size={16} />
                  </button>

                  {menuAbierto === post.id_publicacion && (
                    <div className="post-menu" onClick={(e) => e.stopPropagation()}>
                      {post.usuario?.id_usuario === usuario?.id_usuario && (
                        <button className="menu-item delete" onClick={() => handleEliminarPublicacion(post.id_publicacion)}>
                          Eliminar publicación
                        </button>
                      )}
                      {post.usuario?.id_usuario !== usuario?.id_usuario && (
                        <button className="menu-item block" onClick={() => handleBloquearUsuario(post.usuario.id_usuario, post.usuario.nombre_usuario)}>
                          Bloquear usuario
                        </button>
                      )}
                      <button className="menu-item not-interested" onClick={() => handleNoMeInteresa(post.id_publicacion)}>
                        No me interesa
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Mostrar etiquetas si existen */}
{post.etiquetas && (
  <div className="etiquetas-post">
    {(() => {
      try {
        const etiquetasArray = typeof post.etiquetas === 'string' 
          ? JSON.parse(post.etiquetas) 
          : post.etiquetas;
        
        if (Array.isArray(etiquetasArray)) {
          return etiquetasArray.map((tag: string, index: number) => (
            <span key={index} className="etiqueta-post">
              #{tag}
            </span>
          ));
        }
        return null;
      } catch (error) {
        console.error("Error parsing etiquetas:", error);
        return null;
      }
    })()}
  </div>
)}
             {/* Contenido del post */}
             
<div className="post-content">
  
  <p>{post.contenido}</p> 
  {/* Renderizado de medios */}
  {post.medios && post.medios.length > 0 && (
    <div className={`post-media ${post.medios.length > 1 ? 'multiple-media' : 'single-media'}`}>
      {post.medios.map((medio: string, index: number) => (
        <div key={index} className="media-item">
          {esVideo(medio) ? (
            <div className="video-container">
              <video 
                controls 
                className="post-video"
                preload="metadata"
              >
                <source src={medio} type="video/mp4" />
                <source src={medio} type="video/webm" />
                Tu navegador no soporta el elemento video.
              </video>
            </div>
          ) : (
            <img 
              src={medio} 
              alt={`Post media ${index + 1}`} 
              className="post-image"
            />
          )}
        </div>
      ))}
    </div>
  )}
  
  {/* Compatibilidad con imagen única - SOLO si no hay medios */}
  {(!post.medios || post.medios.length === 0) && post.imagen && (
    <img src={post.imagen} alt="post" className="post-image" />
  )}
</div>

              {/* Acciones */}
              <div className="post-actions-x">
                <button className="action-btn-x comment-btn" onClick={() => toggleComentarios(post.id_publicacion)}>
                  <div className="btn-content">
                    <MessageCircle size={18} />
                    <span className="count">{estadisticas[post.id_publicacion]?.total_comentarios || 0}</span>
                  </div>
                </button>
                
                <button className="action-btn-x retweet-btn" onClick={(e) => { e.stopPropagation(); setCompartirAbierto(compartirAbierto === post.id_publicacion ? null : post.id_publicacion); }}>
                  <div className="btn-content"><Share2 size={18} /></div>
                </button>
                
                <button className={`action-btn-x like-btn ${estadisticas[post.id_publicacion]?.me_gusta_dado ? 'liked' : ''}`} onClick={() => handleMeGusta(post.id_publicacion)}>
                  <div className="btn-content">
                    <Heart size={18} />
                    <span className="count">{estadisticas[post.id_publicacion]?.total_me_gusta || 0}</span>
                  </div>
                </button>
                
                <button className={`action-btn-x bookmark-btn ${estadisticas[post.id_publicacion]?.guardado ? 'saved' : ''}`} onClick={() => handleGuardar(post.id_publicacion)}>
                  <div className="btn-content"><Bookmark size={18} /></div>
                </button>
              </div>

              {/* Panel de compartir */}
              {compartirAbierto === post.id_publicacion && (
                <div className="compartir-panel-x" onClick={(e) => e.stopPropagation()}>
                  <div className="compartir-header-x">
                    <div className="header-content">
                      <div className="icon-circle"><Share2 size={20} /></div>
                      <h3>Compartir publicación</h3>
                    </div>
                    <button className="cerrar-compartir-x" onClick={() => { setCompartirAbierto(null); setMostrarSeleccionAmigos(false); setAmigosSeleccionados([]); }}>
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="redes-sociales-x">
                    <div className="redes-grid">
                      <button className="red-social-btn-x whatsapp-x" onClick={() => compartirEnRedSocial("whatsapp", post)}>
                        <div className="red-social-icon"><MessageCircle size={22} /></div>
                        <span>WhatsApp</span>
                      </button>
                      <button className="red-social-btn-x facebook-x" onClick={() => compartirEnRedSocial("facebook", post)}>
                        <div className="red-social-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </div>
                        <span>Facebook</span>
                      </button>
                      <button className="red-social-btn-x twitter-x" onClick={() => compartirEnRedSocial("twitter", post)}>
                        <div className="red-social-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <span>X</span>
                      </button>
                    </div>
                  </div>

                  <div className="compartir-interno-x">
                    <div className="seccion-titulo-x">
                      <Users size={18} />
                      <h4>Compartir en Artenity</h4>
                    </div>
                    
                    <button className="btn-compartir-amigos-x" onClick={() => setMostrarSeleccionAmigos(!mostrarSeleccionAmigos)}>
                      <div className="btn-amigos-content">
                        <div className="icon-wrapper"><Users size={20} /></div>
                        <div className="text-content">
                          <span className="btn-title">Compartir con amigos</span>
                          <span className="btn-subtitle">Selecciona amigos específicos</span>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="chevron">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                      </div>
                    </button>

                    {mostrarSeleccionAmigos && (
                      <div className="seleccion-amigos-x">
                        <div className="seleccion-amigos-header-x">
                          <div className="header-info">
                            <Users size={20} />
                            <div>
                              <h5>Seleccionar amigos</h5>
                              <p>Elige con quién quieres compartir</p>
                            </div>
                          </div>
                          <button className="btn-seleccionar-todos-x" onClick={toggleTodosAmigos}>
                            {amigosSeleccionados.length === amigos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                          </button>
                        </div>
                        
                        <div className="lista-amigos-x">
                          {amigos.length > 0 ? (
                            amigos.map(amigo => (
                              <div key={amigo.id_usuario} className="amigo-item-x">
                                <label className="amigo-checkbox-x">
                                  <input
                                    type="checkbox"
                                    checked={amigosSeleccionados.includes(amigo.id_usuario)}
                                    onChange={() => toggleAmigoSeleccionado(amigo.id_usuario)}
                                  />
                                  <div className="amigo-info">
                                    <img src={amigo.foto_perfil || defaultProfile} alt={amigo.nombre_usuario} className="foto-amigo-x" />
                                    <div className="amigo-details">
                                      <span className="nombre-amigo-x">{amigo.nombre_usuario}</span>
                                      <span className="amigo-username">@{amigo.nombre_usuario.toLowerCase()}</span>
                                    </div>
                                  </div>
                                </label>
                              </div>
                            ))
                          ) : (
                            <div className="sin-amigos-x">
                              <Users size={32} />
                              <p>No tienes amigos agregados</p>
                              <span>Agrega amigos para compartir contenido</span>
                            </div>
                          )}
                        </div>

                        {amigosSeleccionados.length > 0 && (
                          <div className="acciones-amigos-x">
                            <button className="btn-compartir-seleccionados-x" onClick={() => handleCompartir(post.id_publicacion, "amigos")}>
                              <div className="btn-share-content">
                                <Share2 size={18} />
                                <span>Compartir con {amigosSeleccionados.length} amigo{amigosSeleccionados.length !== 1 ? 's' : ''}</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="compartir-perfil-x">
                      <div className="compartir-input-container">
                        <div className="user-avatar">
                          <img src={usuario?.perfil?.foto_perfil || defaultProfile} alt="Tu avatar" className="avatar-img" />
                        </div>
                        <div className="input-content">
                          <textarea
                            placeholder="Añade un comentario..."
                            value={mensajeCompartir}
                            onChange={(e) => setMensajeCompartir(e.target.value)}
                            rows={2}
                            className="compartir-textarea-x"
                          />
                          <div className="compartir-actions">
                            <button className="btn-compartir-perfil-x" onClick={() => handleCompartir(post.id_publicacion, "perfil")}>
                              <Share2 size={16} />
                              Compartir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sección de comentarios */}
              {comentariosAbiertos[post.id_publicacion] && (
                <div className="comentarios-section">
                  <div className="nuevo-comentario">
                    {respondiendoA[post.id_publicacion] && (
                      <div className="respondiendo-a">
                        <span>Respondiendo a un comentario...</span>
                        <button onClick={() => cancelarRespuesta(post.id_publicacion)} className="btn-cancelar-respuesta">
                          Cancelar
                        </button>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder={respondiendoA[post.id_publicacion] ? "Escribe tu respuesta..." : "Escribe un comentario..."}
                      value={nuevoComentario[post.id_publicacion]?.contenido || ""}
                      onChange={(e) => setNuevoComentario(prev => ({ 
                        ...prev, 
                        [post.id_publicacion]: { contenido: e.target.value } 
                      }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          publicarComentario(post.id_publicacion, respondiendoA[post.id_publicacion] || null);
                        }
                      }}
                    />
                    <button 
                      onClick={() => publicarComentario(post.id_publicacion, respondiendoA[post.id_publicacion] || null)} 
                      className="btn-comentar"
                      disabled={!nuevoComentario[post.id_publicacion]?.contenido.trim()}
                    >
                      {respondiendoA[post.id_publicacion] ? 'Responder' : 'Comentar'}
                    </button>
                  </div>
                  
                  <div className="lista-comentarios">
                    {comentarios[post.id_publicacion]?.comentarios && comentarios[post.id_publicacion].comentarios.length > 0 ? (
                      comentarios[post.id_publicacion].comentarios.map(comentario => (
                        <ComentarioComponent 
                          key={comentario.id_comentario} 
                          comentario={comentario} 
                          idPublicacion={post.id_publicacion}
                          onMeGusta={handleMeGustaComentario}
                          onResponder={manejarRespuesta}
                          nuevoComentario={nuevoComentario}
                          onNuevoComentarioChange={(idPublicacion, contenido) => setNuevoComentario(prev => ({ 
                            ...prev, 
                            [idPublicacion]: { contenido } 
                          }))}
                          onPublicarComentario={publicarComentario}
                          respondiendoA={respondiendoA}
                          onCancelarRespuesta={cancelarRespuesta}
                        />
                      ))
                    ) : (
                      <p className="sin-comentarios">Sé el primero en comentar...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sidebar derecha */}
      <aside className="right-sidebar">
        <div className="card"><h2>LO QUE SUCEDE CON EL MUNDO DEL ARTE</h2></div>
        
        {/* SECCIÓN "A QUIÉN SEGUIR" */}
     <div className="card sugerencias-seguir">
  <div className="sugerencias-header">
    <h2>A QUIÉN SEGUIR</h2>
    {sugerencias.length > 0 && !cargandoSugerencias && (
      <span className="sugerencias-contador">
        {sugerencias.length} sugerencias
      </span>
    )}
  </div>
  
  {cargandoSugerencias ? (
    <div className="cargando-sugerencias">
      <div className="spinner"></div>
      <p>Cargando sugerencias...</p>
    </div>
  ) : sugerencias.length > 0 ? (
    <>
      <div className="lista-sugerencias">
        {sugerencias.map((sugerencia) => (
          <div key={sugerencia.id_usuario} className="sugerencia-item">
            <Link to={`/usuario/${sugerencia.id_usuario}`} className="sugerencia-link">
              <img
                src={sugerencia.foto_perfil || defaultProfile}
                alt={sugerencia.nombre_usuario}
                className="foto-perfil-sugerencia"
                onError={(e) => {
                  e.currentTarget.src = defaultProfile;
                }}
              />
              <div className="sugerencia-info">
                <span className="sugerencia-username" title={sugerencia.nombre_usuario}>
                  {sugerencia.nombre_usuario}
                </span>
                <span className="sugerencia-nombre" title={sugerencia.nombre}>
                  {sugerencia.nombre}
                </span>
                
                {/* Indicador de popularidad */}
                {sugerencia.tipo === "popular" && sugerencia.estadisticas.likes_totales > 0 && (
                  <div className="popularidad-indicator">
                    <Heart size={12} />
                    <span title={`${sugerencia.estadisticas.likes_totales} likes totales`}>
                      {sugerencia.estadisticas.likes_totales.toLocaleString()} likes
                    </span>
                    <span className="separador">•</span>
                    <span title={`${sugerencia.estadisticas.seguidores} seguidores`}>
                      {sugerencia.estadisticas.seguidores.toLocaleString()} seguidores
                    </span>
                  </div>
                )}
                
                {sugerencia.tipo === "recomendado_amigos" && (
                  <div className="recomendado-por" title="Recomendado por tus amigos">
                    <Users size={12} />
                    <span>Recomendado por amigos</span>
                  </div>
                )}
              </div>
            </Link>
            
            <button 
              onClick={() => manejarSeguirSugerido(sugerencia.id_usuario)}
              className="btn-seguir-sugerencia"
              title={`Seguir a ${sugerencia.nombre_usuario}`}
            >
              Seguir
            </button>
          </div>
        ))}
      </div>
      
      <div className="sugerencias-footer">
        <button 
          onClick={cargarSugerenciasUsuarios}
          className="btn-ver-mas"
          title="Cargar más sugerencias"
        >
          Ver más sugerencias
        </button>
      </div>
    </>
  ) : (
    <div className="sin-sugerencias">
      <Users size={24} />
      <p>No hay sugerencias disponibles</p>
      <span>Interactúa más para ver recomendaciones</span>
    </div>
  )}
</div>
      </aside>
    </div>
  );
}