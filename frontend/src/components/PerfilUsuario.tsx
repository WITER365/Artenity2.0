import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  getPerfil, 
  seguirUsuario, 
  enviarSolicitudAmistad, 
  dejarDeSeguirUsuario, 
  reportarUsuario, 
  getAmigos, 
  obtenerEstadisticasPerfil, 
  obtenerPublicacionesUsuario,
  obtenerSeguidoresUsuario,
  obtenerSiguiendoUsuario,
} from "../services/api";
import defaultProfile from "../assets/img/fotoperfildefault.jpg";
import { useAuth } from "../context/AuthContext";
import "../styles/perfil.css";

export default function PerfilUsuario() {
  const { id } = useParams();
  const { usuario: usuarioActual } = useAuth();
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [reporteModal, setReporteModal] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [amigos, setAmigos] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    seguidores: 0,
    siguiendo: 0,
    publicaciones: 0,
  });
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [seguidores, setSeguidores] = useState<any[]>([]);
  const [siguiendo, setSiguiendo] = useState<any[]>([]);
  const [evidencia, setEvidencia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const esAmigo = perfil ? amigos.some((a) => a.id_usuario === perfil.id_usuario) : false;
  const esMiPerfil = usuarioActual?.id_usuario === perfil?.id_usuario;

  useEffect(() => {
    if (id) {
      const userId = parseInt(id);
      cargarPerfilUsuario(userId);
      cargarAmigos(userId);
      cargarEstadisticas(userId);
      cargarPublicaciones(userId);
      cargarSeguidores(userId);
      cargarSiguiendo(userId);
    }
  }, [id]);

  const cargarPerfilUsuario = async (idUsuario: number) => {
    try {
      setCargando(true);
      const perfilData = await getPerfil(idUsuario);
      setPerfil(perfilData);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      alert("Error al cargar el perfil del usuario");
    } finally {
      setCargando(false);
    }
  };

  const cargarAmigos = async (idUsuario: number) => {
    try {
      const amigosData = await getAmigos(idUsuario);
      setAmigos(amigosData);
    } catch (error) {
      console.error("Error cargando amigos:", error);
    }
  };

  const cargarEstadisticas = async (idUsuario: number) => {
    try {
      const stats = await obtenerEstadisticasPerfil(idUsuario);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const cargarPublicaciones = async (idUsuario: number) => {
    try {
      const posts = await obtenerPublicacionesUsuario(idUsuario);
      setPublicaciones(posts);
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    }
  };

  const cargarSeguidores = async (idUsuario: number) => {
    try {
      const data = await obtenerSeguidoresUsuario(idUsuario);
      setSeguidores(data);
    } catch (error) {
      console.error("Error cargando seguidores:", error);
    }
  };

  const cargarSiguiendo = async (idUsuario: number) => {
    try {
      const data = await obtenerSiguiendoUsuario(idUsuario);
      setSiguiendo(data);
    } catch (error) {
      console.error("Error cargando siguiendo:", error);
    }
  };

  // --- Acciones ---
  const handleSeguir = async () => {
    if (!id) return;
    try {
      await seguirUsuario(parseInt(id));
      alert("¡Ahora sigues a este usuario!");
      cargarPerfilUsuario(parseInt(id));
      cargarEstadisticas(parseInt(id));
      cargarSeguidores(parseInt(id));
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al seguir usuario");
    }
  };

  const handleDejarSeguir = async () => {
    if (!id) return;
    try {
      await dejarDeSeguirUsuario(parseInt(id));
      alert("Has dejado de seguir a este usuario");
      cargarPerfilUsuario(parseInt(id));
      cargarEstadisticas(parseInt(id));
      cargarSeguidores(parseInt(id));
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al dejar de seguir usuario");
    }
  };

  const handleSolicitudAmistad = async () => {
    if (!id) return;
    try {
      await enviarSolicitudAmistad(parseInt(id));
      alert("¡Solicitud de amistad enviada!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al enviar solicitud");
    }
  };

  const handleReportar = async () => {
    if (!id || !motivoReporte.trim()) return alert("Debes indicar el motivo del reporte");
    try {
      await reportarUsuario(parseInt(id), motivoReporte, evidencia || undefined);
      alert("Usuario reportado correctamente");
      setReporteModal(false);
      setMotivoReporte("");
      setEvidencia(null);
      setPreview(null);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al reportar usuario");
    }
  };

  // Manejar la selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEvidencia(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // Remover imagen
  const handleRemoveImage = () => {
    setEvidencia(null);
    setPreview(null);
  };

  if (cargando) return <div className="cargando">Cargando perfil...</div>;
  if (!perfil) return <div className="error">Usuario no encontrado</div>;

  return (
    <div className="perfil-container">
      {/* ===== COLUMNA PRINCIPAL ===== */}
      <div className="perfil-main">
        {/* Header del Perfil */}
        <div className="perfil-header">
          <div className="perfil-avatar">
            <img
              src={perfil.foto_perfil || defaultProfile}
              alt="Foto de perfil"
              className="perfil-foto"
            />
          </div>
          <h1 className="perfil-nombre">
            {perfil.usuario?.nombre_usuario || "Usuario"}
          </h1>
          <p className="perfil-correo">{perfil.usuario?.correo_electronico}</p>

          {/* Estadísticas */}
          <div className="estadisticas-perfil">
            <div className="estadistica-item">
              <span className="estadistica-numero">{estadisticas.publicaciones}</span>
              <span className="estadistica-label">Publicaciones</span>
            </div>
            <div className="estadistica-item">
              <span className="estadistica-numero">{estadisticas.seguidores}</span>
              <span className="estadistica-label">Seguidores</span>
            </div>
            <div className="estadistica-item">
              <span className="estadistica-numero">{estadisticas.siguiendo}</span>
              <span className="estadistica-label">Siguiendo</span>
            </div>
          </div>

          {/* Botones de Acción */}
          {!esMiPerfil && (
            <div className="acciones-perfil">
              {perfil.sigo ? (
                <button onClick={handleDejarSeguir} className="btn-dejar-seguir">
                  🚫 Dejar de seguir
                </button>
              ) : (
                <button onClick={handleSeguir} className="btn-seguir">
                  👣 Seguir
                </button>
              )}
              
              <button 
                onClick={handleSolicitudAmistad} 
                className="btn-amistad" 
                disabled={esAmigo}
              >
                🤝 {esAmigo ? "Ya son amigos" : "Enviar solicitud"}
              </button>
              
              <button onClick={() => setReporteModal(true)} className="btn-reportar">
                ⚠️ Reportar
              </button>
            </div>
          )}
        </div>

        {/* Información del Perfil */}
        {(perfil.descripcion || perfil.biografia) && (
          <div className="perfil-section">
            <div className="section-header">
              <h3 className="section-title">Sobre {perfil.usuario?.nombre_usuario}</h3>
            </div>
            {perfil.descripcion && (
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <p className="publicacion-texto">{perfil.descripcion}</p>
              </div>
            )}
            {perfil.biografia && (
              <div className="form-group">
                <label className="form-label">Biografía</label>
                <p className="publicacion-texto">{perfil.biografia}</p>
              </div>
            )}
          </div>
        )}

        {/* Publicaciones del Usuario */}
        <div className="perfil-section">
          <div className="section-header">
            <h3 className="section-title">
              Publicaciones <span className="section-count">{publicaciones.length}</span>
            </h3>
          </div>
          
          {publicaciones.length > 0 ? (
            <div className="publicaciones-lista">
              {publicaciones.map((post) => (
                <div key={post.id_publicacion} className="publicacion-card">
                  <div className="publicacion-header">
                    <img
                      src={post.usuario?.perfil?.foto_perfil || defaultProfile}
                      alt="Foto perfil"
                      className="publicacion-foto-perfil"
                    />
                    <div className="publicacion-info-usuario">
                      <span className="publicacion-usuario">
                        {post.usuario?.nombre_usuario || "Usuario"}
                      </span>
                      <span className="publicacion-fecha">
                        {new Date(post.fecha_creacion).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="publicacion-contenido">
                    <p className="publicacion-texto">{post.contenido}</p>
                    {post.imagen && (
                      <img
                        src={post.imagen}
                        alt="Publicación"
                        className="publicacion-imagen"
                      />
                    )}
                  </div>
                  <div className="publicacion-acciones">
                    <button className="accion-btn">💬 Comentar</button>
                    <button className="accion-btn">🔄 Compartir</button>
                    <button className="accion-btn">❤️ Me gusta</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sin-publicaciones">
              <p>Este usuario no tiene publicaciones aún.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== SIDEBAR ===== */}
      <div className="perfil-sidebar">
        {/* Amigos */}
        <div className="sidebar-section">
          <div className="sidebar-title">
            Amigos <span className="sidebar-count">{amigos.length}</span>
          </div>
          {amigos.length > 0 ? (
            <div className="usuarios-lista">
              {amigos.map((amigo) => (
                <div key={amigo.id_usuario} className="usuario-item">
                  <img
                    src={amigo.foto_perfil || defaultProfile}
                    alt={`Foto de ${amigo.nombre_usuario}`}
                    className="usuario-foto"
                  />
                  <div className="usuario-info">
                    <span className="usuario-nombre">{amigo.nombre_usuario}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sin-contenido">Aún no tiene amigos</p>
          )}
        </div>

        {/* Seguidores */}
        <div className="sidebar-section">
          <div className="sidebar-title">
            Seguidores <span className="sidebar-count">{seguidores.length}</span>
          </div>
          {seguidores.length > 0 ? (
            <div className="usuarios-lista">
              {seguidores.slice(0, 5).map((seguidor) => (
                <div key={seguidor.id_seguimiento} className="usuario-item">
                  <img
                    src={seguidor.foto_perfil || defaultProfile}
                    alt={`Foto de ${seguidor.nombre_usuario}`}
                    className="usuario-foto"
                  />
                  <div className="usuario-info">
                    <span className="usuario-nombre">{seguidor.nombre_usuario}</span>
                  </div>
                </div>
              ))}
              {seguidores.length > 5 && (
                <div className="ver-mas">
                  <span>+{seguidores.length - 5} más</span>
                </div>
              )}
            </div>
          ) : (
            <p className="sin-contenido">No tiene seguidores</p>
          )}
        </div>

        {/* Siguiendo */}
        <div className="sidebar-section">
          <div className="sidebar-title">
            Siguiendo <span className="sidebar-count">{siguiendo.length}</span>
          </div>
          {siguiendo.length > 0 ? (
            <div className="usuarios-lista">
              {siguiendo.slice(0, 5).map((seguido) => (
                <div key={seguido.id_seguimiento} className="usuario-item">
                  <img
                    src={seguido.foto_perfil || defaultProfile}
                    alt={`Foto de ${seguido.nombre_usuario}`}
                    className="usuario-foto"
                  />
                  <div className="usuario-info">
                    <span className="usuario-nombre">{seguido.nombre_usuario}</span>
                  </div>
                </div>
              ))}
              {siguiendo.length > 5 && (
                <div className="ver-mas">
                  <span>+{siguiendo.length - 5} más</span>
                </div>
              )}
            </div>
          ) : (
            <p className="sin-contenido">No sigue a nadie</p>
          )}
        </div>
      </div>

      {/* Modal de Reporte */}
      {reporteModal && (
        <div className="modal-overlay">
          <div className="modal-reporte">
            <h2 className="titulo-reporte">⚠️ Reportar Usuario</h2>

            <div className="info-usuario-reportado">
              <img src={perfil.foto_perfil || defaultProfile} alt="Usuario" className="reporte-foto" />
              <span>@{perfil.usuario?.nombre_usuario}</span>
            </div>

            <div className="motivos-reporte">
              {[
                "🚫 Contenido ofensivo o inapropiado",
                "🎭 Suplantación de identidad",
                "🧠 Acoso o comportamiento abusivo",
                "🖼️ Plagio o uso no autorizado de obras",
                "📢 Spam o publicidad no deseada",
                "🔞 Contenido obsceno o inapropiado",
              ].map((motivo) => (
                <label key={motivo}>
                  <input
                    type="radio"
                    value={motivo}
                    checked={motivoReporte === motivo}
                    onChange={() => setMotivoReporte(motivo)}
                  />
                  {motivo}
                </label>
              ))}
            </div>

            <textarea
              className="reporte-textarea"
              placeholder="Describe brevemente lo sucedido (opcional)..."
              value={motivoReporte.includes("🚫") ? "" : motivoReporte}
              onChange={(e) => setMotivoReporte(e.target.value)}
            />

            {/* Sección de subir o cambiar evidencia */}
            <div className="contenedor-evidencia">
              {preview ? (
                <div className="preview-wrapper">
                  <img src={preview} alt="Evidencia subida" className="preview-img" />
                  <div className="botones-evidencia">
                    <label className="btn-cambiar">
                      Cambiar imagen
                      <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
                    </label>
                    <button onClick={handleRemoveImage} className="btn-cancelar-img">
                      Cancelar imagen
                    </button>
                  </div>
                </div>
              ) : (
                <label className="input-evidencia">
                  <img src="/static/icons/upload.png" alt="Subir evidencia" className="icono-upload" />
                  <span>Haz clic o arrastra una imagen aquí</span>
                  <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
                </label>
              )}
            </div>

            <div className="acciones-modal">
              <button onClick={handleReportar} className="btn-enviar-reporte">
                Enviar Reporte
              </button>
              <button
                onClick={() => {
                  setReporteModal(false);
                  setMotivoReporte("");
                  setPreview(null);
                  setEvidencia(null);
                }}
                className="btn-cancelar-reporte"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}