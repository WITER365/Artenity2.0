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
  MoreHorizontal
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
  quitarMeGustaComentario
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

  // ✅ Añadir clase al body
  useEffect(() => {
    document.body.classList.add("pagina-principal");
    return () => {
      document.body.classList.remove("pagina-principal");
    };
  }, []);

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
          <nav className="space-y-4">
            <button className="nav-btn" onClick={() => navigate("/principal")}>
              <Home /> Home
            </button>
            <button className="nav-btn">
              <Compass /> Explorar
            </button>
            <button className="nav-btn">
              <Grid /> Categorías
            </button>
            <button className="nav-btn" onClick={() => navigate("/mensajes")}>
              <MessageSquare /> Mensajes
            </button>
            <button className="nav-btn">
              <Settings /> Configuración
            </button>
            <button className="nav-btn">
              <Image /> Galería de Arte
            </button>
          </nav>
        </div>

        <button className="post-btn mt-8" onClick={handlePost}>
          PUBLICAR
        </button>
        <button className="post-btn mt-4" onClick={handleLogout}>
          CERRAR SESIÓN
        </button>
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
                
                <button className="action-btn">
                  <Share size={18} />
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