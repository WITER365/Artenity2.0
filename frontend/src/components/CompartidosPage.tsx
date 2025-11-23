// src/pages/CompartidosPage.tsx - VERSIÓN CORREGIDA COMPLETA
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  X,
  Home,
  MessageSquare,
  Settings,
  Image,
  Users
} from "lucide-react";
import "../styles/compartidos.css";
import defaultProfile from "../assets/img/fotoperfildefault.jpg";
import { 
  obtenerCompartidoPorId,
  eliminarCompartido,
  darMeGusta, 
  quitarMeGusta, 
  guardarPublicacion, 
  quitarGuardado,
  obtenerEstadisticasPublicacion,
  crearComentario,
  obtenerComentarios,
  obtenerMisCompartidos,
  obtenerCompartidosAmigos
} from "../services/api";
import { useAuth } from "../context/AuthContext";

// Interfaces
interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  foto_perfil?: string;
}

interface Publicacion {
  id_publicacion: number;
  contenido: string;
  imagen_url?: string;
  usuario: Usuario;
  fecha_creacion: string;
}

interface Compartido {
  id_compartido: number;
  publicacion: Publicacion;
  usuario_compartio: Usuario;
  fecha_compartido: string;
  mensaje?: string;
  tipo?: string;
}

interface EstadisticasPublicacion {
  me_gusta: number;
  comentarios: number;
  compartidos: number;
  usuario_dio_me_gusta: boolean;
  usuario_guardo: boolean;
}

interface ComentarioData {
  id_comentario: number;
  contenido: string;
  usuario: Usuario;
  fecha_creacion: string;
  respuestas?: ComentarioData[];
}

interface NuevoComentarioData {
  contenido: string;
  id_publicacion: number;
  id_comentario_padre?: number | null;
}

// Función helper para manejar errores
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  } else {
    return 'Error desconocido al cargar la publicación compartida';
  }
};

export default function CompartidosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  
  const [compartidoEspecifico, setCompartidoEspecifico] = useState<Compartido | null>(null);
  const [compartidosLista, setCompartidosLista] = useState<Compartido[]>([]);
  const [vista, setVista] = useState<'especifico' | 'lista'>('lista');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<{[key: number]: EstadisticasPublicacion}>({});
  const [comentariosAbiertos, setComentariosAbiertos] = useState<{[key: number]: boolean}>({});
  const [nuevoComentario, setNuevoComentario] = useState<{[key: number]: string}>({});
  const [comentarios, setComentarios] = useState<{[key: number]: ComentarioData[]}>({});

  // 🔹 MEJORAR LA CARGA DE COMPARTIDOS
  useEffect(() => {
    const cargarCompartidos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        console.log("🔍 Iniciando carga de compartidos...");
        console.log("📍 Location state recibido:", location.state);
        
        // Verificar si viene de notificación o tiene datos específicos
        const fromNotification = location.state?.fromNotification;
        const compartidoFromState = location.state?.compartidoEspecifico;
        const idCompartidoFromState = location.state?.idCompartido;
        
        if (fromNotification || compartidoFromState || idCompartidoFromState) {
          // VISTA ESPECÍFICA - desde notificación
          console.log("🎯 Modo vista específica (desde notificación)");
          setVista('especifico');
          await cargarCompartidoEspecifico();
        } else {
          // VISTA DE LISTA - normal
          console.log("📋 Modo lista de compartidos");
          setVista('lista');
          await cargarListaCompartidos();
        }
        
      } catch (error) {
        console.error("❌ Error cargando compartidos:", error);
        setError("Error al cargar las publicaciones compartidas");
        setCargando(false);
      }
    };

    cargarCompartidos();
  }, [location]);

  const cargarCompartidoEspecifico = async () => {
    try {
      const compartidoFromState = location.state?.compartidoEspecifico;
      const idCompartidoFromState = location.state?.idCompartido;
      const fromNotification = location.state?.fromNotification;
      
      console.log("🔄 Cargando compartido específico:", {
        compartidoFromState: !!compartidoFromState,
        idCompartidoFromState,
        fromNotification
      });
      
      let compartido: Compartido | null = null;
      
      if (compartidoFromState) {
        // Usar el compartido del estado (ya viene cargado)
        console.log("✅ Usando compartido desde estado");
        compartido = compartidoFromState;
      } else if (idCompartidoFromState) {
        // Cargar desde API usando el ID
        console.log("🔄 Cargando compartido desde API:", idCompartidoFromState);
        try {
          compartido = await obtenerCompartidoPorId(idCompartidoFromState);
          console.log("✅ Compartido cargado desde API:", compartido);
        } catch (apiError) {
          console.error("❌ Error cargando desde API:", apiError);
          throw apiError;
        }
      }
      
      if (!compartido) {
        console.error("❌ No se pudo cargar el compartido");
        throw new Error("No se pudo cargar la publicación compartida");
      }
      
      setCompartidoEspecifico(compartido);
      
      // Cargar estadísticas para esta publicación
      if (compartido.publicacion) {
        await cargarEstadisticas(compartido.publicacion.id_publicacion);
      }
      
      console.log("✅ Compartido específico cargado exitosamente");
      
    } catch (error) {
      console.error("❌ Error cargando compartido específico:", error);
      
      // CORREGIDO: Usar la función helper para manejar el error
      const errorMessage = getErrorMessage(error);
      setError(`No se pudo cargar la publicación compartida: ${errorMessage}`);
      
      // Opcional: redirigir a la vista de lista después de un tiempo
      setTimeout(() => {
        navigate("/compartidos", { replace: true });
      }, 3000);
      
      throw error;
    } finally {
      setCargando(false);
    }
  };

  const cargarListaCompartidos = async () => {
    try {
      console.log("📋 Cargando lista de compartidos...");
      
      // Cargar tanto mis compartidos como los de amigos
      const [misCompartidos, compartidosAmigos] = await Promise.all([
        obtenerMisCompartidos(),
        obtenerCompartidosAmigos()
      ]);
      
      console.log("📊 Resultados:", {
        misCompartidos: misCompartidos?.length || 0,
        compartidosAmigos: compartidosAmigos?.length || 0
      });
      
      // Combinar y ordenar por fecha
      const todosCompartidos = [
        ...(misCompartidos || []),
        ...(compartidosAmigos || [])
      ].sort((a, b) => new Date(b.fecha_compartido).getTime() - new Date(a.fecha_compartido).getTime());
      
      console.log("📦 Total de compartidos:", todosCompartidos.length);
      setCompartidosLista(todosCompartidos);
      
      // Cargar estadísticas para cada publicación
      todosCompartidos.forEach(compartido => {
        if (compartido.publicacion) {
          cargarEstadisticas(compartido.publicacion.id_publicacion)
            .catch(err => console.error("Error cargando estadísticas:", err));
        }
      });
      
    } catch (error) {
      console.error("❌ Error cargando lista de compartidos:", error);
      throw error;
    } finally {
      setCargando(false);
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
      setComentarios(prev => ({ ...prev, [idPublicacion]: comentariosData }));
    } catch (error) {
      console.error("Error cargando comentarios:", error);
    }
  };

  const handleMeGusta = async (idPublicacion: number) => {
    try {
      const stats = estadisticas[idPublicacion];
      if (stats.usuario_dio_me_gusta) {
        await quitarMeGusta(idPublicacion);
        setEstadisticas(prev => ({
          ...prev,
          [idPublicacion]: {
            ...stats,
            me_gusta: stats.me_gusta - 1,
            usuario_dio_me_gusta: false
          }
        }));
      } else {
        await darMeGusta(idPublicacion);
        setEstadisticas(prev => ({
          ...prev,
          [idPublicacion]: {
            ...stats,
            me_gusta: stats.me_gusta + 1,
            usuario_dio_me_gusta: true
          }
        }));
      }
    } catch (error) {
      console.error("Error al manejar me gusta:", error);
    }
  };

  const handleGuardar = async (idPublicacion: number) => {
    try {
      const stats = estadisticas[idPublicacion];
      if (stats.usuario_guardo) {
        await quitarGuardado(idPublicacion);
        setEstadisticas(prev => ({
          ...prev,
          [idPublicacion]: {
            ...stats,
            usuario_guardo: false
          }
        }));
      } else {
        await guardarPublicacion(idPublicacion);
        setEstadisticas(prev => ({
          ...prev,
          [idPublicacion]: {
            ...stats,
            usuario_guardo: true
          }
        }));
      }
    } catch (error) {
      console.error("Error al manejar guardado:", error);
    }
  };

  const toggleComentarios = async (idPublicacion: number) => {
    const nuevoEstado = !comentariosAbiertos[idPublicacion];
    setComentariosAbiertos(prev => ({ ...prev, [idPublicacion]: nuevoEstado }));
    
    if (nuevoEstado && !comentarios[idPublicacion]) {
      await cargarComentarios(idPublicacion);
    }
  };

  const publicarComentario = async (idPublicacion: number) => {
    try {
      const comentario = nuevoComentario[idPublicacion]?.trim();
      if (!comentario) return;

      const comentarioData: NuevoComentarioData = {
        contenido: comentario,
        id_publicacion: idPublicacion
      };

      await crearComentario(comentarioData);

      setNuevoComentario(prev => ({ ...prev, [idPublicacion]: '' }));
      await cargarComentarios(idPublicacion);

      const stats = estadisticas[idPublicacion];
      if (stats) {
        setEstadisticas(prev => ({
          ...prev,
          [idPublicacion]: {
            ...stats,
            comentarios: stats.comentarios + 1
          }
        }));
      }
    } catch (error) {
      console.error("Error publicando comentario:", error);
    }
  };

  const handleEliminarCompartido = async (idCompartido: number) => {
    try {
      await eliminarCompartido(idCompartido);
      
      // Si estamos en vista específica, volver a la lista
      if (vista === 'especifico') {
        navigate("/compartidos", { replace: true });
      } else {
        // Recargar la lista
        await cargarListaCompartidos();
      }
    } catch (error) {
      console.error("Error eliminando compartido:", error);
    }
  };

  const verCompartidoEspecifico = (compartido: Compartido) => {
    navigate("/compartidos", { 
      state: { 
        compartidoEspecifico: compartido 
      } 
    });
  };

  const verPublicacion = (idPublicacion: number) => {
    navigate(`/publicacion/${idPublicacion}`);
  };

  // 🔹 NUEVA FUNCIÓN: Volver a lista desde vista específica
  const volverALista = () => {
    console.log("↩️ Volviendo a lista de compartidos");
    // Limpiar el estado de navegación y recargar lista
    navigate("/compartidos", { replace: true });
    window.location.reload(); // Forzar recarga para limpiar estado
  };

  // 🔹 Renderizar compartido específico
  const renderCompartidoEspecifico = () => {
    if (!compartidoEspecifico) {
      return (
        <div className="error">
          <p>No se pudo cargar la publicación compartida específica.</p>
          <button onClick={volverALista} className="btn-volver-lista">
            Ver todas las publicaciones compartidas
          </button>
        </div>
      );
    }

    const publicacion = compartidoEspecifico.publicacion;
    const stats = estadisticas[publicacion.id_publicacion];
    const comentariosPublicacion = comentarios[publicacion.id_publicacion] || [];

    return (
      <div className="compartido-especifico-container">
        {/* Header del compartido MEJORADO */}
        <div className="compartido-especifico-header">
          <button 
            className="btn-volver-lista" 
            onClick={volverALista}
          >
            <ArrowLeft size={20} />
            Ver todos los compartidos
          </button>
          
          <div className="compartido-indicator-notification">
            <Share2 size={18} />
            <span>Publicación compartida específica</span>
          </div>
          
          <div className="compartido-especifico-info">
            <img
              src={compartidoEspecifico.usuario_compartio.foto_perfil || defaultProfile}
              alt="Perfil"
              className="foto-perfil-post"
            />
            <div className="compartido-especifico-details">
              <div className="user-info">
                <span className="username">{compartidoEspecifico.usuario_compartio.nombre_usuario}</span>
                <span className="compartido-texto">compartió esta publicación</span>
                <span className="timestamp">
                  {new Date(compartidoEspecifico.fecha_compartido).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {usuario?.id_usuario === compartidoEspecifico.usuario_compartio.id_usuario && (
            <button
              onClick={() => handleEliminarCompartido(compartidoEspecifico.id_compartido)}
              className="btn-eliminar-especifico"
              title="Eliminar compartido"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Mensaje del compartido */}
        {compartidoEspecifico.mensaje && (
          <div className="compartido-mensaje-especifico">
            <p>"{compartidoEspecifico.mensaje}"</p>
          </div>
        )}

        {/* Publicación original */}
        <div className="publicacion-original-especifica">
          <div className="post-header-especifico">
            <img
              src={publicacion.usuario.foto_perfil || defaultProfile}
              alt="Perfil"
              className="foto-perfil-post"
            />
            <div className="user-info">
              <span className="username">{publicacion.usuario.nombre_usuario}</span>
              <span className="timestamp">
                {new Date(publicacion.fecha_creacion).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="post-content-especifico">
            <p>{publicacion.contenido}</p>
            {publicacion.imagen_url && (
              <img
                src={publicacion.imagen_url}
                alt="Publicación"
                className="post-image-especifico"
                onClick={() => verPublicacion(publicacion.id_publicacion)}
              />
            )}
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="publicacion-stats-especifico">
              <span>{stats.me_gusta} me gusta</span>
              <span>{stats.comentarios} comentarios</span>
              <span>{stats.compartidos} compartidos</span>
            </div>
          )}

          {/* Acciones */}
          {stats && (
            <div className="post-actions-especifico">
              <button
                onClick={() => handleMeGusta(publicacion.id_publicacion)}
                className={`action-btn ${stats.usuario_dio_me_gusta ? 'liked' : ''}`}
              >
                <Heart size={20} />
                <span>Me gusta</span>
              </button>
              <button
                onClick={() => toggleComentarios(publicacion.id_publicacion)}
                className="action-btn"
              >
                <MessageCircle size={20} />
                <span>Comentar</span>
              </button>
              <button className="action-btn">
                <Share2 size={20} />
                <span>Compartir</span>
              </button>
              <button
                onClick={() => handleGuardar(publicacion.id_publicacion)}
                className={`action-btn ${stats.usuario_guardo ? 'saved' : ''}`}
              >
                <Bookmark size={20} />
                <span>Guardar</span>
              </button>
            </div>
          )}

          {/* Sección de comentarios */}
          <div className="comentarios-section-especifico">
            <div className="comentarios-lista-especifico">
              {comentariosPublicacion.length > 0 ? (
                comentariosPublicacion.map((comentario) => (
                  <div key={comentario.id_comentario} className="comentario-especifico">
                    <img
                      src={comentario.usuario.foto_perfil || defaultProfile}
                      alt="Perfil"
                      className="foto-perfil-comentario"
                    />
                    <div className="comentario-content">
                      <div className="comentario-header">
                        <span className="comentario-usuario">{comentario.usuario.nombre_usuario}</span>
                        <span className="comentario-fecha">
                          {new Date(comentario.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="comentario-texto">{comentario.contenido}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sin-comentarios-especifico">
                  <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
                </div>
              )}
            </div>

            {/* Input de nuevo comentario */}
            <div className="nuevo-comentario-especifico">
              <input
                type="text"
                placeholder="Escribe un comentario..."
                value={nuevoComentario[publicacion.id_publicacion] || ''}
                onChange={(e) => setNuevoComentario(prev => ({
                  ...prev,
                  [publicacion.id_publicacion]: e.target.value
                }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    publicarComentario(publicacion.id_publicacion);
                  }
                }}
              />
              <button
                onClick={() => publicarComentario(publicacion.id_publicacion)}
                disabled={!nuevoComentario[publicacion.id_publicacion]?.trim()}
                className="btn-comentar-especifico"
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Renderizar lista de compartidos
  const renderListaCompartidos = () => {
    if (compartidosLista.length === 0) {
      return (
        <div className="sin-compartidos">
          <Share2 size={64} />
          <h3>No hay publicaciones compartidas</h3>
          <p>Cuando tú o tus amigos compartan publicaciones, aparecerán aquí.</p>
        </div>
      );
    }

    return (
      <div className="compartidos-lista">
        {compartidosLista.map((compartido) => {
          const publicacion = compartido.publicacion;
          const stats = estadisticas[publicacion.id_publicacion];
          const comentariosPublicacion = comentarios[publicacion.id_publicacion] || [];

          return (
            <div key={compartido.id_compartido} className="compartido-item">
              {/* Header del compartido */}
              <div className="compartido-header">
                <div className="compartido-info">
                  <img
                    src={compartido.usuario_compartio.foto_perfil || defaultProfile}
                    alt="Perfil"
                    className="foto-perfil-post"
                  />
                  <div className="compartido-details">
                    <div className="user-info">
                      <span className="username">{compartido.usuario_compartio.nombre_usuario}</span>
                      <span className="compartido-texto">compartió esta publicación</span>
                      <span className="timestamp">
                        {new Date(compartido.fecha_compartido).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {usuario?.id_usuario === compartido.usuario_compartio.id_usuario && (
                  <button
                    onClick={() => handleEliminarCompartido(compartido.id_compartido)}
                    className="btn-eliminar-compartido"
                    title="Eliminar compartido"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Mensaje del compartido */}
              {compartido.mensaje && (
                <div className="compartido-mensaje">
                  <p>"{compartido.mensaje}"</p>
                </div>
              )}

              {/* Publicación original */}
              <div className="publicacion-original">
                <div className="post-header">
                  <img
                    src={publicacion.usuario.foto_perfil || defaultProfile}
                    alt="Perfil"
                    className="foto-perfil-post"
                  />
                  <div className="user-info">
                    <span className="username">{publicacion.usuario.nombre_usuario}</span>
                    <span className="timestamp">
                      {new Date(publicacion.fecha_creacion).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="post-content">
                  <p>{publicacion.contenido}</p>
                  {publicacion.imagen_url && (
                    <img
                      src={publicacion.imagen_url}
                      alt="Publicación"
                      className="post-image"
                      onClick={() => verPublicacion(publicacion.id_publicacion)}
                    />
                  )}
                </div>

                {/* Estadísticas */}
                {stats && (
                  <div className="publicacion-stats">
                    <span>{stats.me_gusta} me gusta</span>
                    <span>{stats.comentarios} comentarios</span>
                    <span>{stats.compartidos} compartidos</span>
                  </div>
                )}

                {/* Acciones */}
                {stats && (
                  <div className="post-actions">
                    <button
                      onClick={() => handleMeGusta(publicacion.id_publicacion)}
                      className={`action-btn ${stats.usuario_dio_me_gusta ? 'liked' : ''}`}
                    >
                      <Heart size={18} />
                      <span>Me gusta</span>
                    </button>
                    <button
                      onClick={() => toggleComentarios(publicacion.id_publicacion)}
                      className="action-btn"
                    >
                      <MessageCircle size={18} />
                      <span>Comentar</span>
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => verCompartidoEspecifico(compartido)}
                    >
                      <Share2 size={18} />
                      <span>Ver compartido</span>
                    </button>
                    <button
                      onClick={() => handleGuardar(publicacion.id_publicacion)}
                      className={`action-btn ${stats.usuario_guardo ? 'saved' : ''}`}
                    >
                      <Bookmark size={18} />
                      <span>Guardar</span>
                    </button>
                  </div>
                )}

                {/* Sección de comentarios (colapsable) */}
                {comentariosAbiertos[publicacion.id_publicacion] && (
                  <div className="comentarios-section">
                    <div className="comentarios-lista">
                      {comentariosPublicacion.length > 0 ? (
                        comentariosPublicacion.map((comentario) => (
                          <div key={comentario.id_comentario} className="comentario">
                            <img
                              src={comentario.usuario.foto_perfil || defaultProfile}
                              alt="Perfil"
                              className="foto-perfil-comentario"
                            />
                            <div className="comentario-content">
                              <div className="comentario-header">
                                <span className="comentario-usuario">{comentario.usuario.nombre_usuario}</span>
                                <span className="comentario-fecha">
                                  {new Date(comentario.fecha_creacion).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="comentario-texto">{comentario.contenido}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="sin-comentarios">
                          <p>No hay comentarios aún.</p>
                        </div>
                      )}
                    </div>

                    <div className="nuevo-comentario">
                      <input
                        type="text"
                        placeholder="Escribe un comentario..."
                        value={nuevoComentario[publicacion.id_publicacion] || ''}
                        onChange={(e) => setNuevoComentario(prev => ({
                          ...prev,
                          [publicacion.id_publicacion]: e.target.value
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            publicarComentario(publicacion.id_publicacion);
                          }
                        }}
                      />
                      <button
                        onClick={() => publicarComentario(publicacion.id_publicacion)}
                        disabled={!nuevoComentario[publicacion.id_publicacion]?.trim()}
                        className="btn-comentar"
                      >
                        Comentar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="compartidos-page">
      <div className="main-container compartidos-layout">
        
        {/* Sidebar izquierda */}
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

        {/* Sección central */}
        <section className="center-section compartidos-center">
          
          {/* Header */}
          <div className="compartidos-header">
            <button 
              className="btn-volver" 
              onClick={() => navigate("/principal")}
            >
              <ArrowLeft size={20} />
              Volver al inicio
            </button>

            <h1>
              {vista === 'especifico' ? 'Publicación Compartida' : 'Publicaciones Compartidas'}
            </h1>

            <div className="compartido-indicator">
              <Users size={18} />
              <span>
                {vista === 'especifico' 
                  ? 'Vista de publicación compartida' 
                  : `${compartidosLista.length} publicaciones compartidas`}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="compartidos-content">
            {cargando ? (
              <div className="cargando">
                <div className="spinner"></div>
                <p>
                  {vista === 'especifico' 
                    ? 'Cargando publicación compartida...' 
                    : 'Cargando publicaciones compartidas...'}
                </p>
              </div>
            ) : error ? (
              <div className="error">
                <X size={48} />
                <h3>{error}</h3>
                <button 
                  onClick={volverALista}
                  className="btn-volver-error"
                >
                  Ver publicaciones compartidas
                </button>
              </div>
            ) : vista === 'especifico' ? (
              renderCompartidoEspecifico()
            ) : (
              renderListaCompartidos()
            )}
          </div>
        </section>

        {/* Sidebar derecha */}
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
    </div>
  );
}