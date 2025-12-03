import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { 
  getUsuarios, 
  getPublicaciones,
  obtenerPublicacionesPorCategoria,
  buscarUsuarios
} from "../services/api";
import "../styles/busqueda.css";
import defaultProfile from "../assets/img/fotoperfildefault.jpg";

const Busqueda: React.FC = () => {
  const [query, setQuery] = useState("");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const categoriaNombre = params.get("categoria"); 
  const categoriaID = params.get("id");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Si viene categoría desde CategoriasPage
        if (categoriaNombre) {
          try {
            const publicacionesFiltradas = await obtenerPublicacionesPorCategoria(categoriaNombre);
            setPublicaciones(publicacionesFiltradas);
          } catch (error) {
            console.error("Error cargando publicaciones por categoría:", error);
            // Fallback: obtener todas y filtrar localmente
            const pubs = await getPublicaciones();
            const filtradas = pubs.filter((p: any) =>
              p.etiquetas?.some((tag: string) => 
                tag.toLowerCase().includes(categoriaNombre.toLowerCase())
              )
            );
            setPublicaciones(filtradas);
          }
        } else {
          // Si no hay categoría, obtener todas las publicaciones
          const pubs = await getPublicaciones();
          setPublicaciones(pubs);
        }

        // Obtener usuarios
        const users = await getUsuarios();
        setUsuarios(users);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoriaNombre]);

  // 🔍 Buscar usuarios y publicaciones
  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      // Si la búsqueda está vacía, recargar todo
      const pubs = await getPublicaciones();
      setPublicaciones(pubs);
      const users = await getUsuarios();
      setUsuarios(users);
      return;
    }

    setBuscando(true);

    try {
      // Buscar usuarios por nombre o correo
      const usuariosResultados = await buscarUsuarios(query);
      setUsuarios(usuariosResultados);

      // Buscar en publicaciones por contenido o etiquetas
      const todasPublicaciones = await getPublicaciones();
      const publicacionesFiltradas = todasPublicaciones.filter((p: any) => {
        const contenidoMatch = p.contenido?.toLowerCase().includes(query.toLowerCase());
        const etiquetasMatch = p.etiquetas?.some((tag: string | any) => {
          if (typeof tag === 'string') {
            return tag.toLowerCase().includes(query.toLowerCase());
          }
          return false;
        });
        const usuarioMatch = p.usuario?.nombre_usuario?.toLowerCase().includes(query.toLowerCase()) ||
                            p.usuario?.nombre?.toLowerCase().includes(query.toLowerCase());
        
        return contenidoMatch || etiquetasMatch || usuarioMatch;
      });
      
      setPublicaciones(publicacionesFiltradas);
    } catch (error) {
      console.error("Error en búsqueda:", error);
    } finally {
      setBuscando(false);
    }
  };

  // Función para procesar imágenes de publicaciones
  const procesarMediosPublicacion = (publicacion: any) => {
    let mediosArray: string[] = [];
    
    if (publicacion.medios && Array.isArray(publicacion.medios)) {
      mediosArray = publicacion.medios;
    } else if (publicacion.imagen) {
      try {
        if (typeof publicacion.imagen === 'string') {
          const parsed = JSON.parse(publicacion.imagen);
          if (Array.isArray(parsed)) {
            mediosArray = parsed;
          } else if (parsed.urls && Array.isArray(parsed.urls)) {
            mediosArray = parsed.urls;
          } else if (typeof parsed === 'string' && parsed.includes('http')) {
            mediosArray = [parsed];
          }
        } else if (typeof publicacion.imagen === 'string' && publicacion.imagen.includes('http')) {
          mediosArray = [publicacion.imagen];
        }
      } catch (error) {
        if (typeof publicacion.imagen === 'string' && publicacion.imagen.includes('http')) {
          mediosArray = [publicacion.imagen];
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

    return mediosArray;
  };
  
  // Función para procesar etiquetas
  const procesarEtiquetas = (etiquetas: any): string[] => {
    if (!etiquetas) return [];
    
    try {
      if (typeof etiquetas === 'string') {
        if (etiquetas.trim().startsWith('[') && etiquetas.trim().endsWith(']')) {
          return JSON.parse(etiquetas);
        }
        return [etiquetas];
      }
      return Array.isArray(etiquetas) ? etiquetas : [];
    } catch (error) {
      console.error("Error parsing etiquetas:", error);
      return [];
    }
  };

  if (loading) return <p className="no-resultados">Cargando...</p>;
 


  return (
    <div className="busqueda-container">
      {/* BARRA DE BÚSQUEDA */}
      <header className="busqueda-header">
        <form onSubmit={handleBuscar} className="busqueda-form">
          <input
            type="text"
            placeholder="Buscar usuarios, publicaciones o etiquetas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="busqueda-input"
          />
          <button type="submit" className="busqueda-btn">
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </header>

      <main className="busqueda-resultados">
        {buscando && (
          <div className="cargando-busqueda">
            <p>Buscando...</p>
          </div>
        )}
          <button onClick={() => navigate("/categorias")} className="back-btn">
            ← Volver al inicio
          </button>
        {/* ⭐ SI VIENE UNA CATEGORIA DESDE LA PÁGINA PRINCIPAL */}
        {categoriaNombre && !buscando && (
          <>
            <h2 className="titulo-categoria">
              Publicaciones en: <span>{categoriaNombre}</span>
            </h2>

            {publicaciones.length > 0 ? (
              publicaciones.map((publicacion) => {
                const medios = procesarMediosPublicacion(publicacion);
                const etiquetas = procesarEtiquetas(publicacion.etiquetas);
                
                return (
                  <div key={publicacion.id_publicacion} className="resultado-card">
                    {/* Header con información del usuario */}
                    <div className="resultado-header">
                      <Link to={`/usuario/${publicacion.usuario?.id_usuario}`} className="usuario-link">
                        <img
                          src={publicacion.usuario?.perfil?.foto_perfil || defaultProfile}
                          alt={`Perfil de ${publicacion.usuario?.nombre_usuario}`}
                          className="usuario-avatar"
                        />
                        <div className="usuario-info">
                          <strong className="usuario-nombre">
                            {publicacion.usuario?.nombre_usuario || "Usuario"}
                          </strong>
                          <span className="usuario-nombre-completo">
                            {publicacion.usuario?.nombre || ""}
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* Contenido de la publicación */}
                    <div className="resultado-content">
                      <p className="publicacion-contenido">{publicacion.contenido}</p>
                      
                      {/* Mostrar etiquetas si existen */}
                      {etiquetas.length > 0 && (
                        <div className="etiquetas-container">
                          {etiquetas.map((tag: string, index: number) => (
                            <span key={index} className="etiqueta-busqueda">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mostrar medios si existen */}
                      {medios.length > 0 && (
                        <div className="publicacion-medios">
                          {medios.slice(0, 3).map((medio: string, index: number) => {
                            const esVideo = medio.toLowerCase().includes('.mp4') || 
                                          medio.toLowerCase().includes('.avi') || 
                                          medio.toLowerCase().includes('.mov');
                            
                            return (
                              <div key={index} className="medio-item">
                                {esVideo ? (
                                  <div className="video-container">
                                    <video controls className="publicacion-video">
                                      <source src={medio} type="video/mp4" />
                                    </video>
                                  </div>
                                ) : (
                                  <img
                                    src={medio}
                                    className="publicacion-imagen"
                                    alt={`Publicación ${index + 1}`}
                                  />
                                )}
                              </div>
                            );
                          })}
                          {medios.length > 3 && (
                            <div className="mas-medios">+{medios.length - 3} más</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="resultado-footer">
                      <span className="fecha-publicacion">
                        {new Date(publicacion.fecha_creacion).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-resultados">No hay publicaciones en esta categoría.</p>
            )}
          </>
        )}
        
        {/* 🔵 RESULTADOS DE BÚSQUEDA GENERAL */}
        {!categoriaNombre && !buscando && (
          <>
            {/* Resultados de usuarios */}
            {usuarios.length > 0 && (
              <section className="seccion-resultados">
                <h3 className="subtitulo-resultados">Usuarios encontrados ({usuarios.length})</h3>
                <div className="usuarios-grid">
                  {usuarios.map((usuario) => (
                    <Link 
                      key={usuario.id_usuario} 
                      to={`/usuario/${usuario.id_usuario}`}
                      className="usuario-card"
                    >
                      <img
                        src={usuario.perfil?.foto_perfil || defaultProfile}
                        alt={`Perfil de ${usuario.nombre_usuario}`}
                        className="usuario-avatar-grande"
                      />
                      <div className="usuario-info-detallada">
                        <strong className="usuario-nombre">{usuario.nombre_usuario}</strong>
                        <span className="usuario-nombre-completo">
                          {usuario.nombre} {usuario.apellido}
                        </span>
                        {usuario.perfil?.descripcion && (
                          <p className="usuario-descripcion">
                            {usuario.perfil.descripcion.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Resultados de publicaciones */}
            {publicaciones.length > 0 && (
              <section className="seccion-resultados">
                <h3 className="subtitulo-resultados">Publicaciones encontradas ({publicaciones.length})</h3>
                <div className="publicaciones-grid">
                  {publicaciones.map((publicacion) => {
                    const medios = procesarMediosPublicacion(publicacion);
                    const etiquetas = procesarEtiquetas(publicacion.etiquetas);
                    
                    return (
                      <div key={publicacion.id_publicacion} className="resultado-card">
                        {/* Header con información del usuario */}
                        <div className="resultado-header">
                          <Link to={`/usuario/${publicacion.usuario?.id_usuario}`} className="usuario-link">
                            <img
                              src={publicacion.usuario?.perfil?.foto_perfil || defaultProfile}
                              alt={`Perfil de ${publicacion.usuario?.nombre_usuario}`}
                              className="usuario-avatar"
                            />
                            <div className="usuario-info">
                              <strong className="usuario-nombre">
                                {publicacion.usuario?.nombre_usuario || "Usuario"}
                              </strong>
                              <span className="usuario-nombre-completo">
                                {publicacion.usuario?.nombre || ""}
                              </span>
                            </div>
                          </Link>
                        </div>

                        {/* Contenido de la publicación */}
                        <div className="resultado-content">
                          <p className="publicacion-contenido">{publicacion.contenido}</p>
                          
                          {/* Mostrar etiquetas si existen */}
                          {etiquetas.length > 0 && (
                            <div className="etiquetas-container">
                              {etiquetas.map((tag: string, index: number) => (
                                <span key={index} className="etiqueta-busqueda">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Mostrar medios si existen */}
                          {medios.length > 0 && (
                            <div className="publicacion-medios">
                              {medios.slice(0, 3).map((medio: string, index: number) => {
                                const esVideo = medio.toLowerCase().includes('.mp4') || 
                                              medio.toLowerCase().includes('.avi') || 
                                              medio.toLowerCase().includes('.mov');
                                
                                return (
                                  <div key={index} className="medio-item">
                                    {esVideo ? (
                                      <div className="video-container">
                                        <video controls className="publicacion-video">
                                          <source src={medio} type="video/mp4" />
                                        </video>
                                      </div>
                                    ) : (
                                      <img
                                        src={medio}
                                        className="publicacion-imagen"
                                        alt={`Publicación ${index + 1}`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              {medios.length > 3 && (
                                <div className="mas-medios">+{medios.length - 3} más</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Información adicional */}
                        <div className="resultado-footer">
                          <span className="fecha-publicacion">
                            {new Date(publicacion.fecha_creacion).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Mensaje si no hay resultados */}
            {usuarios.length === 0 && publicaciones.length === 0 && query && !buscando && (
              <p className="no-resultados">
                No se encontraron resultados para "{query}"
              </p>
            )}

            {/* Mensaje si no se ha buscado nada */}
            {!query && usuarios.length === 0 && publicaciones.length === 0 && (
              <p className="no-resultados">
                Realiza una búsqueda para encontrar usuarios y publicaciones
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Busqueda;