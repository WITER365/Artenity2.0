// src/pages/PaginaPrincipal.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Home,
  Compass,
  Grid,
  MessageSquare,
  Settings,
  Image,
  MoreVertical,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Reply,
  MoreHorizontal,
  Share2, 
  Facebook, 
  Twitter, 
  Send,
  X,
  Users,
  User
} from "lucide-react";
import "../styles/paginaprincipal.css";
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
  obtenerPublicacionesCompartidas,
  eliminarCompartido,
  obtenerAmigos
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import NotificacionesPanel from "../components/NotificacionesPanel";

// Interfaces TypeScript
interface Publicacion {
  id_publicacion: number;
  id_usuario: number;
  contenido: string;
  imagen?: string;
  fecha_creacion: string;
  usuario: {
    id_usuario: number;
    nombre_usuario: string;
    nombre: string;
    perfil?: {
      foto_perfil?: string;
    };
  };
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

interface Compartido {
  id_compartido: number;
  fecha: string;
  mensaje: string;
  tipo: string;
  publicacion: Publicacion;
}

interface Amigo {
  id_usuario: number;
  nombre_usuario: string;
  foto_perfil?: string;
}

export default function PaginaPrincipal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const [comentariosAbiertos, setComentariosAbiertos] = useState<{[key: number]: boolean}>({});
  const [nuevoComentario, setNuevoComentario] = useState<{[key: number]: {contenido: string}}>({});
  const [respondiendoA, setRespondiendoA] = useState<{[key: number]: number | null}>({});
  const [comentarios, setComentarios] = useState<{[key: number]: ComentariosResponse}>({});
  const [estadisticas, setEstadisticas] = useState<{[key: number]: EstadisticasPublicacion}>({});
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [contenido, setContenido] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [menuComentarioAbierto, setMenuComentarioAbierto] = useState<number | null>(null);

  // Estados para compartir
  const [compartirAbierto, setCompartirAbierto] = useState<number | null>(null);
  const [mensajeCompartir, setMensajeCompartir] = useState("");
  const [mostrarCompartidos, setMostrarCompartidos] = useState(false);
  const [publicacionesCompartidas, setPublicacionesCompartidas] = useState<Compartido[]>([]);
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState<number[]>([]);
  const [mostrarSeleccionAmigos, setMostrarSeleccionAmigos] = useState(false);

  // ✅ Añadir clase al body
  useEffect(() => {
    document.body.classList.add("pagina-principal");
    return () => {
      document.body.classList.remove("pagina-principal");
    };
  }, []);

  // ✅ Función para cargar amigos
  const cargarAmigos = async () => {
    try {
      const amigosData = await obtenerAmigos();
      setAmigos(amigosData);
    } catch (error) {
      console.error("Error cargando amigos:", error);
    }
  };

// En tu PaginaPrincipal.tsx, asegúrate de tener esta función:
const verCompartidoEspecifico = (compartido: Compartido) => {
  navigate("/compartidos", { 
    state: { 
      compartidoEspecifico: compartido 
    } 
    
  });
};
  // ✅ Función para cargar estadísticas de una publicación
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

  // ✅ Función para cargar comentarios de una publicación
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

  // ✅ Función para manejar me gusta en publicación
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

  // ✅ Función para manejar me gusta en comentario
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

  // ✅ Función para encontrar un comentario en la estructura anidada
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

  // ✅ Función para manejar guardar
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

  // ✅ Función para manejar comentarios
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

  // ✅ Función para publicar comentario
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

  // ✅ Función para manejar respuesta a comentario
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

  // ✅ Función para cancelar respuesta
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


const handleCompartir = async (idPublicacion: number, tipo: string = "perfil") => {
  try {
    console.log(`Compartiendo publicación ${idPublicacion} con tipo: ${tipo}`);
    
    // Preparar datos para compartir
    let amigosIdsParam: number[] = [];
    
    if (tipo === "amigos" && amigosSeleccionados.length > 0) {
      amigosIdsParam = amigosSeleccionados;
      console.log(`Compartiendo con ${amigosIdsParam.length} amigos:`, amigosIdsParam);
    }
    
    // Llamar a la API
    const resultado = await compartirPublicacion(
      idPublicacion, 
      mensajeCompartir, 
      tipo, 
      amigosIdsParam
    );
    
    console.log("✅ Publicación compartida exitosamente:", resultado);
    
    // Mostrar notificación de éxito
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
    
    // Recargar notificaciones si el panel está abierto
    if (document.querySelector('.notificaciones-panel')) {
      window.dispatchEvent(new Event('recargarNotificaciones'));
    }
    
  } catch (error: any) {
    console.error("❌ Error compartiendo publicación:", error);
    let mensajeError = 'Error al compartir publicación';
    
    if (error.response?.data?.detail) {
      mensajeError = error.response.data.detail;
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    const notificacionEvent = new CustomEvent('nuevaNotificacion', {
      detail: { mensaje: mensajeError, tipo: 'error' }
    });
    window.dispatchEvent(notificacionEvent);
  }
};

// También actualiza la función de compartir en redes sociales:
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
    case "linkedin":
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      break;
    default:
      console.warn("Red social no soportada:", redSocial);
      return;
  }
  
  window.open(shareUrl, '_blank', 'width=600,height=400');
  setCompartirAbierto(null);

   const notificacionEvent = new CustomEvent('nuevaNotificacion', {
    detail: { 
      mensaje: `Compartido en ${redSocial}`, 
      tipo: 'info' 
    }
  });
  window.dispatchEvent(notificacionEvent);
};

  // ✅ Función para cargar publicaciones compartidas
  const cargarPublicacionesCompartidas = async () => {
    try {
      const compartidos = await obtenerPublicacionesCompartidas();
      setPublicacionesCompartidas(compartidos);
    } catch (error) {
      console.error("Error cargando publicaciones compartidas:", error);
    }
  };

  // ✅ Función para manejar selección de amigos
  const toggleAmigoSeleccionado = (idAmigo: number) => {
    setAmigosSeleccionados(prev => 
      prev.includes(idAmigo)
        ? prev.filter(id => id !== idAmigo)
        : [...prev, idAmigo]
    );
  };

  // ✅ Función para seleccionar/deseleccionar todos los amigos
  const toggleTodosAmigos = () => {
    if (amigosSeleccionados.length === amigos.length) {
      setAmigosSeleccionados([]);
    } else {
      setAmigosSeleccionados(amigos.map(amigo => amigo.id_usuario));
    }
  };

  // Efecto para cargar publicaciones compartidas cuando se muestre el panel
  useEffect(() => {
    if (mostrarCompartidos) {
      cargarPublicacionesCompartidas();
    }
  }, [mostrarCompartidos]);

  // Efecto para cargar amigos cuando se abre el panel de compartir con amigos
  useEffect(() => {
    if (mostrarSeleccionAmigos) {
      cargarAmigos();
    }
  }, [mostrarSeleccionAmigos]);

  // ✅ Componente para mostrar comentarios recursivamente
  const ComentarioComponent = ({ comentario, nivel = 0, idPublicacion }: { comentario: Comentario, nivel?: number, idPublicacion: number }) => {
    const [mostrarRespuestas, setMostrarRespuestas] = useState(nivel < 2); // Mostrar hasta 2 niveles por defecto
    const [respondiendo, setRespondiendo] = useState(false);

    return (
      <div className={`comentario ${nivel > 0 ? 'comentario-respuesta' : ''}`} style={{ marginLeft: `${nivel * 20}px` }}>
        <div className="comentario-contenido">
          <Link to={`/usuario/${comentario.usuario.id_usuario}`}>
            <img
              src={
                comentario.usuario?.perfil?.foto_perfil &&
                comentario.usuario.perfil.foto_perfil.trim() !== ""
                  ? comentario.usuario.perfil.foto_perfil
                  : defaultProfile
              }
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
                onClick={() => handleMeGustaComentario(comentario.id_comentario, idPublicacion)}
              >
                <Heart size={14} />
                <span>{comentario.total_me_gusta || 0}</span>
              </button>
              
              <button 
                className="accion-comentario"
                onClick={() => {
                  setRespondiendo(!respondiendo);
                  if (!respondiendo) {
                    manejarRespuesta(idPublicacion, comentario.id_comentario);
                  }
                }}
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

            {/* Campo de respuesta directa */}
            {respondiendo && (
              <div className="respuesta-directa">
                <input
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  value={nuevoComentario[idPublicacion]?.contenido || ""}
                  onChange={(e) => setNuevoComentario(prev => ({
                    ...prev,
                    [idPublicacion]: { contenido: e.target.value }
                  }))}
                />
                <div className="acciones-respuesta">
                  <button 
                    onClick={() => publicarComentario(idPublicacion, comentario.id_comentario)}
                    className="btn-enviar"
                  >
                    Responder
                  </button>
                  <button 
                    onClick={() => {
                      setRespondiendo(false);
                      cancelarRespuesta(idPublicacion);
                    }}
                    className="btn-cancelar"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Respuestas anidadas */}
        {mostrarRespuestas && comentario.respuestas.length > 0 && (
          <div className="respuestas">
            {comentario.respuestas.map(respuesta => (
              <ComentarioComponent 
                key={respuesta.id_comentario} 
                comentario={respuesta} 
                nivel={nivel + 1}
                idPublicacion={idPublicacion}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ✅ Cargar publicaciones
  const cargarPublicaciones = async () => {
    try {
      const posts = await getPublicaciones();

      const postsConFotosActualizadas = posts.map((p: Publicacion) => {
        let fotoPerfil = defaultProfile;

        if (
          p.usuario?.perfil?.foto_perfil &&
          p.usuario.perfil.foto_perfil.trim() !== ""
        ) {
          fotoPerfil = `${p.usuario.perfil.foto_perfil}?t=${new Date().getTime()}`;
        }

        return {
          ...p,
          usuario: {
            ...p.usuario,
            perfil: {
              ...p.usuario?.perfil,
              foto_perfil: fotoPerfil,
            },
          },
        };
      });

      setPublicaciones(postsConFotosActualizadas);

      // Cargar estadísticas para cada publicación
      postsConFotosActualizadas.forEach((post: Publicacion) => {
        cargarEstadisticas(post.id_publicacion);
      });
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    }
  };

  useEffect(() => {
    cargarPublicaciones();
  }, []);

  // ✅ Recargar cuando cambie una foto de perfil
  useEffect(() => {
    const handleFotoActualizada = () => cargarPublicaciones();
    window.addEventListener("fotoPerfilActualizada", handleFotoActualizada);
    return () =>
      window.removeEventListener("fotoPerfilActualizada", handleFotoActualizada);
  }, []);

  // ✅ Hacer scroll a publicación cuando se navega desde notificación (estado)
  useEffect(() => {
    const idPublicacion = (location.state as any)?.scrollToPublicacion;
    console.log("Scroll effect (estado) - idPublicacion:", idPublicacion, "publicaciones.length:", publicaciones.length);
    
    if (idPublicacion) {
        const intentarScroll = (intento: number = 1) => {
          console.log(`Intento ${intento} de scroll (estado) para publicación ${idPublicacion}`);
          console.log("Publicaciones disponibles:", publicaciones.map(p => p.id_publicacion));
          
          // Buscar por atributo data
          let elemento = document.querySelector(`[data-publicacion-id="${idPublicacion}"]`);
          
          // Si no se encuentra, buscar por ID directamente
          if (!elemento) {
            elemento = document.getElementById(`publicacion-${idPublicacion}`);
          }
          
          // Si aún no se encuentra, buscar en todos los elementos con la clase post-card
          if (!elemento) {
            const todosLosPosts = document.querySelectorAll('.post-card');
            todosLosPosts.forEach((post: any) => {
              if (post.getAttribute('data-publicacion-id') === String(idPublicacion)) {
                elemento = post;
              }
            });
          }
          
          console.log("Buscando elemento con id:", idPublicacion, "Encontrado:", elemento);
          
          if (elemento) {
            console.log("Elemento encontrado, haciendo scroll");
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // También intentar hacer scroll manualmente por si acaso
            setTimeout(() => {
              elemento?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return true;
          } else {
            console.warn(`Elemento no encontrado en intento ${intento}. Publicaciones en DOM:`, 
              Array.from(document.querySelectorAll('.post-card')).map((el: any) => el.getAttribute('data-publicacion-id')));
            return false;
          }
        };
      
      // Si las publicaciones ya están cargadas, intentar scroll
      if (publicaciones.length > 0) {
        const intentos = [300, 800, 1500, 2500];
        
        intentos.forEach((delay, index) => {
          setTimeout(() => {
            if (!intentarScroll(index + 1) && index === intentos.length - 1) {
              console.error(`No se pudo encontrar la publicación ${idPublicacion} después de ${intentos.length} intentos`);
            }
          }, delay);
        });
      } else {
        // Si no están cargadas, esperar a que se carguen
        console.log("Esperando a que se carguen las publicaciones...");
        const checkInterval = setInterval(() => {
          if (publicaciones.length > 0) {
            clearInterval(checkInterval);
            console.log("Publicaciones cargadas, intentando scroll");
            const intentos = [300, 800, 1500, 2500];
            
            intentos.forEach((delay, index) => {
              setTimeout(() => {
                if (!intentarScroll(index + 1) && index === intentos.length - 1) {
                  console.error(`No se pudo encontrar la publicación ${idPublicacion} después de ${intentos.length} intentos`);
                }
              }, delay);
            });
          }
        }, 100);
        
        // Limpiar después de 10 segundos si no se cargan
        setTimeout(() => {
          clearInterval(checkInterval);
          console.warn("Timeout esperando publicaciones");
        }, 10000);
      }
      
      // Limpiar el estado para evitar scrolls repetidos
      window.history.replaceState({}, document.title);
    }
  }, [location.state, publicaciones]);

  // ✅ Escuchar evento personalizado para scroll (funciona incluso si ya estás en la página)
  useEffect(() => {
    const handleScrollEvent = (event: any) => {
      const idPublicacion = event.detail?.idPublicacion;
      console.log("Evento scrollToPublicacion recibido:", idPublicacion, "publicaciones.length:", publicaciones.length);
      
      if (idPublicacion) {
        const intentarScroll = (intento: number = 1) => {
          console.log(`Intento ${intento} de scroll (evento) para publicación ${idPublicacion}`);
          console.log("Publicaciones disponibles:", publicaciones.map(p => p.id_publicacion));
          
          // Buscar por atributo data
          let elemento = document.querySelector(`[data-publicacion-id="${idPublicacion}"]`);
          
          // Si no se encuentra, buscar por ID directamente
          if (!elemento) {
            elemento = document.getElementById(`publicacion-${idPublicacion}`);
          }
          
          // Si aún no se encuentra, buscar en todos los elementos con la clase post-card
          if (!elemento) {
            const todosLosPosts = document.querySelectorAll('.post-card');
            todosLosPosts.forEach((post: any) => {
              if (post.getAttribute('data-publicacion-id') === String(idPublicacion)) {
                elemento = post;
              }
            });
          }
          
          console.log("Buscando elemento con id:", idPublicacion, "Encontrado:", elemento);
          
          if (elemento) {
            console.log("Elemento encontrado, haciendo scroll");
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // También intentar hacer scroll manualmente por si acaso
            setTimeout(() => {
              elemento?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return true;
          } else {
            console.warn(`Elemento no encontrado en intento ${intento}. Publicaciones en DOM:`, 
              Array.from(document.querySelectorAll('.post-card')).map((el: any) => el.getAttribute('data-publicacion-id')));
            return false;
          }
        };
        
        // Intentar scroll múltiples veces con diferentes delays
        const intentos = [300, 800, 1500, 2500];
        
        intentos.forEach((delay, index) => {
          setTimeout(() => {
            if (!intentarScroll(index + 1) && index === intentos.length - 1) {
              console.error(`No se pudo encontrar la publicación ${idPublicacion} después de ${intentos.length} intentos`);
              // Intentar una última vez después de un delay más largo
              setTimeout(() => intentarScroll(intentos.length + 1), 2000);
            }
          }, delay);
        });
      }
    };

    window.addEventListener('scrollToPublicacion', handleScrollEvent);
    return () => {
      window.removeEventListener('scrollToPublicacion', handleScrollEvent);
    };
  }, [publicaciones]);

  // ✅ Crear publicación
  const handlePost = async () => {
    if (!contenido.trim() && !file) return;

    const data = new FormData();
    data.append("id_usuario", usuario!.id_usuario.toString());
    data.append("contenido", contenido);
    if (file) data.append("file", file);

    try {
      await crearPublicacion(data);
      setContenido("");
      setFile(null);
      await cargarPublicaciones();
    } catch (error) {
      console.error("Error creando publicación:", error);
    }
  };

  // ✅ Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  };

  // ✅ Funciones del menú
  const toggleMenu = (postId: number) => {
    setMenuAbierto(menuAbierto === postId ? null : postId);
  };

  const handleEliminarPublicacion = async (postId: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta publicación?"))
      return;

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
    if (!window.confirm(`¿Estás seguro de que quieres bloquear a ${userName}?`))
      return;

    try {
      await bloquearUsuario(userId);
      setPublicaciones(publicaciones.filter((p) => p.usuario.id_usuario !== userId));
      setMenuAbierto(null);
      alert("Usuario bloqueado correctamente");
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

  // ✅ Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuAbierto(null);
      setMenuComentarioAbierto(null);
      setCompartirAbierto(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="main-container">
      {/* 🔹 Barra superior */}
      <div className="topbar">
        <input type="text" placeholder="Buscar" className="search-input" />

        <NotificacionesPanel usuario={usuario} />

        <button className="img-btn" onClick={() => navigate("/perfil")}>
          <img
            src={
              usuario?.perfil?.foto_perfil
                ? `${usuario.perfil.foto_perfil}?t=${new Date().getTime()}`
                : defaultProfile
            }
            alt="perfil"
            className="perfiles perfiles-topbar"
          />
        </button>

        <button className="icon-btn" onClick={handleLogout}>
          ⏻
        </button>
      </div>

      {/* 🔹 Sidebar izquierda */}
      <aside className="sidebar">
        <div>
          <div className="text-center text-2xl font-bold mb-8">🎨 Artenity</div>
          <nav>
            <ul className="space-y-4">
              <li>
                <button className="nav-btn" onClick={() => navigate("/principal")}>
                  <Home /> Home
                </button>
              </li>
              <li>
                <button className="nav-btn">
                  <Compass /> Explorar
                </button>
              </li>
              <li>
                <button className="nav-btn">
                  <Grid /> Categorías
                </button>
              </li>
              <li>
                <button className="nav-btn" onClick={() => navigate("/mensajes")}>
                  <MessageSquare /> Mensajes
                </button>
              </li>
              <li>
                <button className="nav-btn">
                  <Settings /> Configuración
                </button>
              </li>
              <li>
                <button className="nav-btn">
                  <Image /> Galería de Arte
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* 🔹 Sección central */}
      <section className="center-section">
        <div className="tabs">
          <button>PARA TI</button>
          <button>SEGUIR</button>
          <button>GUARDADO</button>
        </div>

        {/* Crear nuevo post */}
        <div className="post-input">
          <input
            type="text"
            placeholder="¿QUÉ QUIERES ESCRIBIR?"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button onClick={handlePost}>POST</button>
        </div>

        <div className="banner">NUEVOS POSTERS!!</div>

        {/* 🔹 Publicaciones */}
        <div className="posts">
          {publicaciones.map((post) => (
            <div key={post.id_publicacion} className="post-card" data-publicacion-id={post.id_publicacion}>
              <div className="post-header">
                <Link to={`/usuario/${post.usuario?.id_usuario}`}>
                  <img
                    src={
                      post.usuario?.perfil?.foto_perfil &&
                      post.usuario.perfil.foto_perfil.trim() !== ""
                        ? post.usuario.perfil.foto_perfil
                        : defaultProfile
                    }
                    alt="foto de perfil"
                    className="foto-perfil-post"
                  />
                </Link>

                <div className="user-info">
                  <span className="username">
                    {post.usuario?.nombre_usuario || "Usuario"}
                  </span>
                  <span className="timestamp">
                    {new Date(post.fecha_creacion).toLocaleString()}
                  </span>
                </div>

                {/* Menú de tres puntos */}
                <div className="post-menu-container">
                  <button
                    className="menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleMenu(post.id_publicacion);
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {menuAbierto === post.id_publicacion && (
                    <div
                      className="post-menu"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      {post.usuario?.id_usuario === usuario?.id_usuario && (
                        <button
                          className="menu-item delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarPublicacion(post.id_publicacion);
                          }}
                        >
                          Eliminar publicación
                        </button>
                      )}

                      {post.usuario?.id_usuario !== usuario?.id_usuario && (
                        <button
                          className="menu-item block"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBloquearUsuario(
                              post.usuario.id_usuario,
                              post.usuario.nombre_usuario
                            );
                          }}
                        >
                          Bloquear usuario
                        </button>
                      )}

                      <button
                        className="menu-item not-interested"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNoMeInteresa(post.id_publicacion);
                        }}
                      >
                        No me interesa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido del post */}
              <div className="post-content">
                <p>{post.contenido}</p>
                {post.imagen && (
                  <img src={post.imagen} alt="post" className="post-image" />
                )}
              </div>

              <div className="post-actions-x">
  <button 
    className="action-btn-x comment-btn"
    onClick={() => toggleComentarios(post.id_publicacion)}
  >
    <div className="btn-content">
      <MessageCircle size={18} />
      <span className="count">{estadisticas[post.id_publicacion]?.total_comentarios || 0}</span>
    </div>
  </button>
  
  <button 
    className="action-btn-x retweet-btn"
    onClick={(e) => {
      e.stopPropagation();
      setCompartirAbierto(compartirAbierto === post.id_publicacion ? null : post.id_publicacion);
    }}
  >
    <div className="btn-content">
      <Share2 size={18} />
    </div>
  </button>
  
  <button 
    className={`action-btn-x like-btn ${estadisticas[post.id_publicacion]?.me_gusta_dado ? 'liked' : ''}`}
    onClick={() => handleMeGusta(post.id_publicacion)}
  >
    <div className="btn-content">
      <Heart size={18} />
      <span className="count">{estadisticas[post.id_publicacion]?.total_me_gusta || 0}</span>
    </div>
  </button>
  
  <button 
    className={`action-btn-x bookmark-btn ${estadisticas[post.id_publicacion]?.guardado ? 'saved' : ''}`}
    onClick={() => handleGuardar(post.id_publicacion)}
  >
    <div className="btn-content">
      <Bookmark size={18} />
    </div>
  </button>
</div>

{/* Panel de compartir - ESTILO X/TWITTER MODERNO */}
{compartirAbierto === post.id_publicacion && (
  <div className="compartir-panel-x" onClick={(e) => e.stopPropagation()}>
    <div className="compartir-header-x">
      <div className="header-content">
        <div className="icon-circle">
          <Share2 size={20} />
        </div>
        <h3>Compartir publicación</h3>
      </div>
      <button 
        className="cerrar-compartir-x"
        onClick={() => {
          setCompartirAbierto(null);
          setMostrarSeleccionAmigos(false);
          setAmigosSeleccionados([]);
        }}
      >
        <X size={20} />
      </button>
    </div>
    
    {/* Redes sociales externas - ESTILO MODERNO */}
    <div className="redes-sociales-x">
      <div className="redes-grid">
        <button 
          className="red-social-btn-x whatsapp-x"
          onClick={() => compartirEnRedSocial("whatsapp", post)}
        >
          <div className="red-social-icon">
            <MessageCircle size={22} />
          </div>
          <span>WhatsApp</span>
        </button>
        
        <button 
          className="red-social-btn-x facebook-x"
          onClick={() => compartirEnRedSocial("facebook", post)}
        >
          <div className="red-social-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <span>Facebook</span>
        </button>
        
        <button 
          className="red-social-btn-x twitter-x"
          onClick={() => compartirEnRedSocial("twitter", post)}
        >
          <div className="red-social-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <span>X</span>
        </button>
        
        <button 
          className="red-social-btn-x linkedin-x"
          onClick={() => compartirEnRedSocial("linkedin", post)}
        >
          <div className="red-social-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <span>LinkedIn</span>
        </button>
      </div>
    </div>

    {/* Compartir dentro de la aplicación - ESTILO X */}
    <div className="compartir-interno-x">
      <div className="seccion-titulo-x">
        <Users size={18} />
        <h4>Compartir en Artenity</h4>
      </div>
      
      {/* Botón para compartir con amigos */}
      <button 
        className="btn-compartir-amigos-x"
        onClick={() => setMostrarSeleccionAmigos(!mostrarSeleccionAmigos)}
      >
        <div className="btn-amigos-content">
          <div className="icon-wrapper">
            <Users size={20} />
          </div>
          <div className="text-content">
            <span className="btn-title">Compartir con amigos</span>
            <span className="btn-subtitle">Selecciona amigos específicos</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="chevron">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </div>
      </button>

      {/* Selección de amigos - ESTILO MODERNO */}
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
            <button 
              className="btn-seleccionar-todos-x"
              onClick={toggleTodosAmigos}
            >
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
                      <img
                        src={amigo.foto_perfil || defaultProfile}
                        alt={amigo.nombre_usuario}
                        className="foto-amigo-x"
                      />
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
              <button 
                className="btn-compartir-seleccionados-x"
                onClick={() => handleCompartir(post.id_publicacion, "amigos")}
              >
                <div className="btn-share-content">
                  <Share2 size={18} />
                  <span>Compartir con {amigosSeleccionados.length} amigo{amigosSeleccionados.length !== 1 ? 's' : ''}</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compartir en perfil - ESTILO X */}
      <div className="compartir-perfil-x">
        <div className="compartir-input-container">
          <div className="user-avatar">
            <img 
              src={usuario?.foto_perfil || defaultProfile} 
              alt="Tu avatar" 
              className="avatar-img"
            />
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
              <button 
                className="btn-compartir-perfil-x"
                onClick={() => handleCompartir(post.id_publicacion, "perfil")}
              >
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
                        <button 
                          onClick={() => cancelarRespuesta(post.id_publicacion)}
                          className="btn-cancelar-respuesta"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder={
                        respondiendoA[post.id_publicacion] 
                          ? "Escribe tu respuesta..." 
                          : "Escribe un comentario..."
                      }
                      value={nuevoComentario[post.id_publicacion]?.contenido || ""}
                      onChange={(e) => setNuevoComentario(prev => ({
                        ...prev,
                        [post.id_publicacion]: { contenido: e.target.value }
                      }))}
                    />
                    <button 
                      onClick={() => publicarComentario(
                        post.id_publicacion, 
                        respondiendoA[post.id_publicacion] || null
                      )}
                      className="btn-comentar"
                    >
                      {respondiendoA[post.id_publicacion] ? 'Responder' : 'Comentar'}
                    </button>
                  </div>
                  
                  {/* Lista de comentarios */}
                  <div className="lista-comentarios">
                    {comentarios[post.id_publicacion]?.comentarios && comentarios[post.id_publicacion].comentarios.length > 0 ? (
                      comentarios[post.id_publicacion].comentarios.map(comentario => (
                        <ComentarioComponent 
                          key={comentario.id_comentario} 
                          comentario={comentario} 
                          idPublicacion={post.id_publicacion}
                        />
                      ))
                    ) : (
                      <p className="sin-comentarios">
                        Sé el primero en comentar...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    

     {/* 🔹 Sidebar derecha */}
      <aside className="right-sidebar">
        <div className="card">
          <h2>COMUNIDADES A SEGUIR</h2>
        </div>
        <div className="card">
          <h2>LO QUE SUCEDE CON EL MUNDO DEL ARTE</h2>
        </div>
        <div className="card">
          <h2>A QUIÉN SEGUIR</h2>
        </div>
      </aside>

    </div>
  );
}