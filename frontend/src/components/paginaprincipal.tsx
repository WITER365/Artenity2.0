// src/pages/PaginaPrincipal.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [compartirConAmigo, setCompartirConAmigo] = useState<number | null>(null);

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

  // ✅ Función para compartir publicación
  const handleCompartir = async (idPublicacion: number, tipo: string = "perfil", idAmigo?: number) => {
    try {
      await compartirPublicacion(idPublicacion, mensajeCompartir, tipo, idAmigo);
      
      // Mostrar notificación
      let mensajeNotificacion = 'Publicación compartida exitosamente';
      if (tipo === 'mensaje' && idAmigo) {
        const amigo = amigos.find(a => a.id_usuario === idAmigo);
        mensajeNotificacion = `Publicación compartida con ${amigo?.nombre_usuario || 'tu amigo'}`;
      }
      
      const notificacionEvent = new CustomEvent('nuevaNotificacion', {
        detail: { mensaje: mensajeNotificacion, tipo: 'exito' }
      });
      window.dispatchEvent(notificacionEvent);
      
      setCompartirAbierto(null);
      setMensajeCompartir("");
      setCompartirConAmigo(null);
    } catch (error) {
      console.error("Error compartiendo publicación:", error);
      const notificacionEvent = new CustomEvent('nuevaNotificacion', {
        detail: { mensaje: 'Error al compartir publicación', tipo: 'error' }
      });
      window.dispatchEvent(notificacionEvent);
    }
  };

  // ✅ Función para compartir en redes sociales
  const compartirEnRedSocial = (redSocial: string, publicacion: Publicacion) => {
    const texto = `Mira esta publicación de ${publicacion.usuario.nombre_usuario} en Artenity: ${publicacion.contenido.substring(0, 100)}...`;
    const url = window.location.href;
    
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
      case "instagram":
        // Instagram no permite sharing directo, abrir la app
        shareUrl = `instagram://`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setCompartirAbierto(null);
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

  // Efecto para cargar publicaciones compartidas cuando se muestre el panel
  useEffect(() => {
    if (mostrarCompartidos) {
      cargarPublicacionesCompartidas();
    }
  }, [mostrarCompartidos]);

  // Cargar amigos cuando se abre el panel de compartir
  useEffect(() => {
    if (compartirAbierto) {
      cargarAmigos();
    }
  }, [compartirAbierto]);

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
                <button 
                  className="nav-btn" 
                  onClick={() => setMostrarCompartidos(!mostrarCompartidos)}
                >
                  <Share2 /> Compartidos
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
            <div key={post.id_publicacion} className="post-card">
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

              {/* Botones de acción */}
              <div className="post-actions">
                <button 
                  className="action-btn"
                  onClick={() => toggleComentarios(post.id_publicacion)}
                >
                  <MessageCircle size={18} />
                  {estadisticas[post.id_publicacion]?.total_comentarios || 0}
                </button>
                
                <button 
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompartirAbierto(compartirAbierto === post.id_publicacion ? null : post.id_publicacion);
                  }}
                >
                  <Share2 size={18} />
                </button>
                
                <button 
                  className={`action-btn ${estadisticas[post.id_publicacion]?.me_gusta_dado ? 'liked' : ''}`}
                  onClick={() => handleMeGusta(post.id_publicacion)}
                >
                  <Heart size={18} />
                  {estadisticas[post.id_publicacion]?.total_me_gusta || 0}
                </button>
                
                <button 
                  className={`action-btn ${estadisticas[post.id_publicacion]?.guardado ? 'saved' : ''}`}
                  onClick={() => handleGuardar(post.id_publicacion)}
                >
                  <Bookmark size={18} />
                </button>
              </div>

              {/* Panel de compartir */}
              {compartirAbierto === post.id_publicacion && (
                <div className="compartir-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="compartir-header">
                    <h3>Compartir publicación</h3>
                    <button 
                      className="cerrar-compartir"
                      onClick={() => {
                        setCompartirAbierto(null);
                        setCompartirConAmigo(null);
                        setMensajeCompartir("");
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="redes-sociales">
                    <button 
                      className="red-social-btn whatsapp"
                      onClick={() => compartirEnRedSocial("whatsapp", post)}
                    >
                      <MessageCircle size={20} />
                      WhatsApp
                    </button>
                    
                    <button 
                      className="red-social-btn facebook"
                      onClick={() => compartirEnRedSocial("facebook", post)}
                    >
                      <Facebook size={20} />
                      Facebook
                    </button>
                    
                    <button 
                      className="red-social-btn twitter"
                      onClick={() => compartirEnRedSocial("twitter", post)}
                    >
                      <Twitter size={20} />
                      Twitter
                    </button>
                    
                    <button 
                      className="red-social-btn instagram"
                      onClick={() => compartirEnRedSocial("instagram", post)}
                    >
                      <Send size={20} />
                      Instagram
                    </button>
                  </div>
                  
                  <div className="compartir-interno">
                    <h4>Compartir dentro de Artenity</h4>
                    
                    {/* Compartir en perfil */}
                    <div className="opcion-compartir">
                      <button 
                        className="btn-compartir-opcion"
                        onClick={() => handleCompartir(post.id_publicacion, "perfil")}
                      >
                        <User size={16} />
                        Compartir en mi perfil
                      </button>
                    </div>
                    
                    {/* Compartir con amigos */}
                    <div className="opcion-compartir">
                      <div className="amigos-lista">
                        <h5>Compartir con amigos:</h5>
                        {amigos.length > 0 ? (
                          <div className="lista-amigos">
                            {amigos.map(amigo => (
                              <button
                                key={amigo.id_usuario}
                                className={`btn-amigo ${compartirConAmigo === amigo.id_usuario ? 'seleccionado' : ''}`}
                                onClick={() => {
                                  if (compartirConAmigo === amigo.id_usuario) {
                                    setCompartirConAmigo(null);
                                  } else {
                                    setCompartirConAmigo(amigo.id_usuario);
                                  }
                                }}
                              >
                                <img
                                  src={amigo.foto_perfil || defaultProfile}
                                  alt={amigo.nombre_usuario}
                                  className="foto-amigo"
                                />
                                <span>{amigo.nombre_usuario}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="sin-amigos">No tienes amigos agregados</p>
                        )}
                        
                        {compartirConAmigo && (
                          <div className="compartir-amigo-seleccionado">
                            <textarea
                              placeholder={`Escribe un mensaje para tu amigo...`}
                              value={mensajeCompartir}
                              onChange={(e) => setMensajeCompartir(e.target.value)}
                              rows={2}
                            />
                            <button 
                              className="btn-compartir-amigo"
                              onClick={() => handleCompartir(post.id_publicacion, "mensaje", compartirConAmigo)}
                            >
                              <Send size={16} />
                              Enviar a amigo
                            </button>
                          </div>
                        )}
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
          <h2>LO QUE SUCEDE CON EL MUNDO DEL ARTE</h2>
        </div>
        <div className="card">
          <h2>A QUIÉN SEGUIR</h2>
        </div>
      </aside>

      {/* Panel de publicaciones compartidas */}
      {mostrarCompartidos && (
        <div className="panel-compartidos-overlay" onClick={() => setMostrarCompartidos(false)}>
          <div className="panel-compartidos" onClick={(e) => e.stopPropagation()}>
            <div className="panel-compartidos-header">
              <h2>Publicaciones Compartidas</h2>
              <button 
                className="cerrar-panel"
                onClick={() => setMostrarCompartidos(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="lista-compartidos">
              {publicacionesCompartidas.length > 0 ? (
                publicacionesCompartidas.map((compartido) => (
                  <div key={compartido.id_compartido} className="compartido-item">
                    <div className="compartido-header">
                      <div>
                        <span className="fecha-compartido">
                          Compartido el {new Date(compartido.fecha).toLocaleString()}
                        </span>
                        <span className="tipo-compartido">
                          {compartido.tipo === 'perfil' ? 'En tu perfil' : 
                           compartido.tipo === 'mensaje' ? 'Con un amigo' : 'Compartido'}
                        </span>
                      </div>
                      <button 
                        className="eliminar-compartido"
                        onClick={async () => {
                          try {
                            await eliminarCompartido(compartido.id_compartido);
                            cargarPublicacionesCompartidas();
                          } catch (error) {
                            console.error("Error eliminando compartido:", error);
                          }
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    {compartido.mensaje && (
                      <p className="mensaje-compartido">"{compartido.mensaje}"</p>
                    )}
                    
                    <div className="publicacion-compartida">
                      <div className="post-header">
                        <img
                          src={
                            compartido.publicacion.usuario?.perfil?.foto_perfil &&
                            compartido.publicacion.usuario.perfil.foto_perfil.trim() !== ""
                              ? compartido.publicacion.usuario.perfil.foto_perfil
                              : defaultProfile
                          }
                          alt="foto de perfil"
                          className="foto-perfil-post"
                        />
                        <div className="user-info">
                          <span className="username">
                            {compartido.publicacion.usuario?.nombre_usuario || "Usuario"}
                          </span>
                          <span className="timestamp">
                            {new Date(compartido.publicacion.fecha_creacion).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="post-content">
                        <p>{compartido.publicacion.contenido}</p>
                        {compartido.publicacion.imagen && (
                          <img src={compartido.publicacion.imagen} alt="post" className="post-image" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sin-compartidos">
                  <Share2 size={48} />
                  <p>No has compartido ninguna publicación aún</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}