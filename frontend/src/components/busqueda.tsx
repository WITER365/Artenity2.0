// frontend/components/busqueda.tsx (versión completa)
import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { 
  obtenerContenidoCategoria,
  buscarContenido,
  obtenerUsuarioBasico 
} from "../services/api";
import "../styles/busqueda.css";
import defaultProfile from "../assets/img/fotoperfildefault.jpg";

const Busqueda: React.FC = () => {
  const [query, setQuery] = useState("");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const categoriaNombre = params.get("categoria"); 
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        if (categoriaNombre) {
          // Obtener publicaciones por categoría
          const resultado = await obtenerContenidoCategoria(categoriaNombre);
          
          // La respuesta puede venir en diferentes formatos
          if (Array.isArray(resultado)) {
            setPublicaciones(resultado);
          } else if (resultado.publicaciones) {
            setPublicaciones(resultado.publicaciones);
          } else if (resultado.data) {
            setPublicaciones(resultado.data);
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoriaNombre]);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setUsuarios([]);
      setPublicaciones([]);
      setMostrarUsuarios(false);
      return;
    }

    setBuscando(true);
    setMostrarUsuarios(true); // Mostrar sección de usuarios

    try {
      const resultado = await buscarContenido(query);
      
      // Manejar diferentes formatos de respuesta
      if (resultado.usuarios !== undefined) {
        setUsuarios(resultado.usuarios || []);
      } else if (Array.isArray(resultado)) {
        // Si la respuesta es un array, asumir que son usuarios
        setUsuarios(resultado);
      }
      
      if (resultado.publicaciones !== undefined) {
        setPublicaciones(resultado.publicaciones || []);
      }
      
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setUsuarios([]);
      setPublicaciones([]);
    } finally {
      setBuscando(false);
    }
  };

  const procesarMediosPublicacion = (publicacion: any) => {
    let mediosArray: string[] = [];
    
    if (publicacion.medios && Array.isArray(publicacion.medios)) {
      mediosArray = publicacion.medios;
    } else if (publicacion.imagen) {
      try {
        if (typeof publicacion.imagen === 'string') {
          if (publicacion.imagen.startsWith('[')) {
            try {
              const parsed = JSON.parse(publicacion.imagen);
              if (Array.isArray(parsed)) {
                mediosArray = parsed;
              }
            } catch (e) {
              mediosArray = [publicacion.imagen];
            }
          } else {
            mediosArray = [publicacion.imagen];
          }
        }
      } catch (error) {
        mediosArray = [publicacion.imagen];
      }
    }

    return mediosArray
      .map(url => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
      })
      .filter((url): url is string => url !== null && url.trim() !== '');
  };

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

  const handleUsuarioClick = (idUsuario: number) => {
    if (!token) {
      alert("Debes iniciar sesión para ver perfiles de usuario");
      navigate("/login");
    } else {
      navigate(`/usuario/${idUsuario}`);
    }
  };

  if (loading) return <p className="no-resultados">Cargando...</p>;

  return (
    <div className="busqueda-container">
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
        <button onClick={() => navigate("/principal")} className="back-btn">
          ← Volver al inicio
        </button>

        {/* Mensaje si no hay token */}
        {!token && (
          <div className="aviso-sin-login">
            <p>📢 Estás viendo contenido público. <Link to="/login">Inicia sesión</Link> para acceder a todas las funciones.</p>
          </div>
        )}

        {categoriaNombre && (
          <h2 className="titulo-categoria">
            Publicaciones en: <span>{categoriaNombre}</span>
          </h2>
        )}

        {/* SECCIÓN DE USUARIOS ENCONTRADOS */}
        {mostrarUsuarios && usuarios.length > 0 && (
          <section className="seccion-usuarios">
            <h3 className="subtitulo-resultados">
              Usuarios encontrados ({usuarios.length})
            </h3>
            <div className="usuarios-grid">
              {usuarios.map((usuario) => (
                <div 
                  key={usuario.id_usuario} 
                  className="usuario-card"
                  onClick={() => handleUsuarioClick(usuario.id_usuario)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={usuario.foto_perfil || usuario.perfil?.foto_perfil || defaultProfile}
                    alt={`Perfil de ${usuario.nombre_usuario}`}
                    className="usuario-avatar-grande"
                  />
                  <div className="usuario-info-detallada">
                    <strong className="usuario-nombre">{usuario.nombre_usuario}</strong>
                    <span className="usuario-nombre-completo">
                      {usuario.nombre || ''} {usuario.apellido || ''}
                    </span>
                    {usuario.perfil?.descripcion && (
                      <p className="usuario-descripcion">
                        {usuario.perfil.descripcion.substring(0, 50)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN DE PUBLICACIONES */}
        {publicaciones.length > 0 ? (
          <section className="seccion-publicaciones">
            {mostrarUsuarios && (
              <h3 className="subtitulo-resultados">
                Publicaciones encontradas ({publicaciones.length})
              </h3>
            )}
            <div className="publicaciones-grid">
              {publicaciones.map((publicacion) => {
                const medios = procesarMediosPublicacion(publicacion);
                const etiquetas = procesarEtiquetas(publicacion.etiquetas);
                
                return (
                  <div key={publicacion.id_publicacion} className="resultado-card">
                    <div className="resultado-header">
                      <div 
                        className="usuario-link"
                        onClick={() => publicacion.usuario?.id_usuario && handleUsuarioClick(publicacion.usuario.id_usuario)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={publicacion.usuario?.perfil?.foto_perfil || defaultProfile}
                          alt="Perfil"
                          className="usuario-avatar"
                        />
                        <div className="usuario-info">
                          <strong className="usuario-nombre">
                            {publicacion.usuario?.nombre_usuario || "Usuario"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="resultado-content">
                      <p className="publicacion-contenido">{publicacion.contenido}</p>
                      
                      {etiquetas.length > 0 && (
                        <div className="etiquetas-container">
                          {etiquetas.map((tag: string, index: number) => (
                            <span key={index} className="etiqueta-busqueda">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {medios.length > 0 && (
                        <div className="publicacion-medios">
                          {medios.slice(0, 3).map((medio: string, index: number) => {
                            const esVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(medio);
                            
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
                        </div>
                      )}
                    </div>

                    <div className="resultado-footer">
                      <span className="fecha-publicacion">
                        {new Date(publicacion.fecha_creacion).toLocaleDateString()}
                      </span>
                      {!token && (
                        <span className="aviso-login-accion">
                          <Link to="/login">Inicia sesión</Link> para comentar o dar like
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <p className="no-resultados">
            {categoriaNombre 
              ? `No hay publicaciones en la categoría "${categoriaNombre}"`
              : query && !buscando
              ? "No se encontraron resultados"
              : "Realiza una búsqueda para encontrar contenido"}
          </p>
        )}

        {/* Mensaje si no hay resultados */}
        {mostrarUsuarios && usuarios.length === 0 && publicaciones.length === 0 && query && !buscando && (
          <p className="no-resultados">
            No se encontraron resultados para "{query}"
          </p>
        )}
      </main>
    </div>
  );
};

export default Busqueda;