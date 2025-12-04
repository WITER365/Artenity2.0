// frontend/components/busqueda.tsx (versión simplificada)
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
      return;
    }

    setBuscando(true);

    try {
      const resultado = await buscarContenido(query);
      setUsuarios(resultado.usuarios || []);
      setPublicaciones(resultado.publicaciones || []);
    } catch (error) {
      console.error("Error en búsqueda:", error);
    } finally {
      setBuscando(false);
    }
  };

  const procesarMediosPublicacion = (publicacion: any) => {
    // Tu función existente para procesar medios
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
        <button onClick={() => navigate("/")} className="back-btn">
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

        {publicaciones.length > 0 ? (
          <div className="publicaciones-grid">
            {publicaciones.map((publicacion) => {
              const medios = procesarMediosPublicacion(publicacion);
              const etiquetas = procesarEtiquetas(publicacion.etiquetas);
              
              return (
                <div key={publicacion.id_publicacion} className="resultado-card">
                  <div className="resultado-header">
                    <div className="usuario-link">
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
        ) : (
          <p className="no-resultados">
            {categoriaNombre 
              ? `No hay publicaciones en la categoría "${categoriaNombre}"`
              : "Realiza una búsqueda para encontrar contenido"}
          </p>
        )}
      </main>
    </div>
  );
};

export default Busqueda;