import React, { useState, useEffect, useCallback } from "react";
import defaultProfile from "../assets/img/fotoperfildefault.jpg";
import { useAuth } from "../context/AuthContext";
import {
  actualizarPerfil,
  getPerfil,
  getAmigos,
  obtenerSeguidores,
  eliminarAmigo,
  obtenerSiguiendo,
  obtenerEstadisticasPerfil,
  obtenerPublicacionesUsuario,
  obtenerUsuariosBloqueados,
  obtenerNoMeInteresa,
  desbloquearUsuario,
  quitarNoMeInteresa,
} from "../services/api";
import "../styles/perfil.css";

const Perfil: React.FC = () => {
  const { usuario, actualizarFotoPerfil, forzarActualizacionPerfil } = useAuth();

  const [descripcion, setDescripcion] = useState("");
  const [biografia, setBiografia] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [editar, setEditar] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [amigos, setAmigos] = useState<any[]>([]);
  const [seguidores, setSeguidores] = useState<any[]>([]);
  const [siguiendo, setSiguiendo] = useState<any[]>([]);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState<any[]>([]);
  const [noMeInteresa, setNoMeInteresa] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    seguidores: 0,
    siguiendo: 0,
    publicaciones: 0,
  });
  const [publicaciones, setPublicaciones] = useState<any[]>([]);

  // ✅ Cargar datos del perfil
  const cargarPerfil = useCallback(async () => {
    if (!usuario?.id_usuario) return;
    try {
      const perfilData = await getPerfil(usuario.id_usuario);
      setDescripcion(perfilData.descripcion || "");
      setBiografia(perfilData.biografia || "");
      const fotoConTimestamp = perfilData.foto_perfil
        ? `${perfilData.foto_perfil}?t=${new Date().getTime()}`
        : defaultProfile;
      setFotoPreview(fotoConTimestamp);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setFotoPreview(defaultProfile);
    }
  }, [usuario?.id_usuario]);

  // ✅ Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    if (!usuario?.id_usuario) return;
    try {
      const stats = await obtenerEstadisticasPerfil(usuario.id_usuario);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, [usuario?.id_usuario]);

  // ✅ Cargar publicaciones
  const cargarPublicaciones = useCallback(async () => {
    if (!usuario?.id_usuario) return;
    try {
      const posts = await obtenerPublicacionesUsuario(usuario.id_usuario);
      setPublicaciones(posts);
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    }
  }, [usuario?.id_usuario]);

  // ✅ Cargar amigos
  const cargarAmigos = useCallback(async () => {
    try {
      const amigosData = await getAmigos();
      const amigosConFoto = amigosData.map((a: any) => ({
        ...a,
        foto_perfil: a.foto_perfil
          ? `${a.foto_perfil}?t=${new Date().getTime()}`
          : defaultProfile,
      }));
      setAmigos(amigosConFoto);
    } catch (error) {
      console.error("Error cargando amigos:", error);
    }
  }, []);

  // ✅ Cargar seguidores
  const cargarSeguidores = useCallback(async () => {
    try {
      const data = await obtenerSeguidores();
      const seguidoresConFoto = data.map((s: any) => ({
        ...s,
        seguidor: {
          ...s.seguidor,
          foto_perfil: s.seguidor?.foto_perfil
            ? `${s.seguidor.foto_perfil}?t=${new Date().getTime()}`
            : defaultProfile,
        },
      }));
      setSeguidores(seguidoresConFoto);
    } catch (error) {
      console.error("Error cargando seguidores:", error);
    }
  }, []);

  // ✅ Cargar siguiendo
  const cargarSiguiendo = useCallback(async () => {
    try {
      const data = await obtenerSiguiendo();
      const siguiendoConFoto = data.map((s: any) => ({
        ...s,
        seguido: {
          ...s.seguido,
          foto_perfil: s.seguido?.foto_perfil
            ? `${s.seguido.foto_perfil}?t=${new Date().getTime()}`
            : defaultProfile,
        },
      }));
      setSiguiendo(siguiendoConFoto);
    } catch (error) {
      console.error("Error cargando siguiendo:", error);
    }
  }, []);

  // ✅ Cargar usuarios bloqueados
  const cargarUsuariosBloqueados = useCallback(async () => {
    try {
      const bloqueados = await obtenerUsuariosBloqueados();
      const bloqueadosConFoto = bloqueados.map((b: any) => ({
        ...b,
        usuario: {
          ...b.usuario,
          foto_perfil: b.usuario?.foto_perfil
            ? `${b.usuario.foto_perfil}?t=${new Date().getTime()}`
            : defaultProfile,
        },
      }));
      setUsuariosBloqueados(bloqueadosConFoto);
    } catch (error) {
      console.error("Error cargando usuarios bloqueados:", error);
    }
  }, []);

  // ✅ Cargar "No me interesa"
  const cargarNoMeInteresa = useCallback(async () => {
    try {
      const noInteresa = await obtenerNoMeInteresa();
      const noInteresaConFoto = noInteresa.map((item: any) => ({
        ...item,
        publicacion: {
          ...item.publicacion,
          usuario: {
            ...item.publicacion.usuario,
            foto_perfil: item.publicacion.usuario?.foto_perfil
              ? `${item.publicacion.usuario.foto_perfil}?t=${new Date().getTime()}`
              : defaultProfile,
          },
        },
      }));
      setNoMeInteresa(noInteresaConFoto);
    } catch (error) {
      console.error("Error cargando 'No me interesa':", error);
    }
  }, []);

  // ✅ Cargar todo al montar
  useEffect(() => {
    cargarPerfil();
    cargarAmigos();
    cargarSeguidores();
    cargarSiguiendo();
    cargarEstadisticas();
    cargarPublicaciones();
    cargarUsuariosBloqueados();
    cargarNoMeInteresa();
  }, [
    cargarPerfil,
    cargarAmigos,
    cargarSeguidores,
    cargarSiguiendo,
    cargarEstadisticas,
    cargarPublicaciones,
    cargarUsuariosBloqueados,
    cargarNoMeInteresa,
  ]);

  // 📸 Seleccionar imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 💾 Guardar perfil
  const handleSubmit = async () => {
    if (!usuario?.id_usuario) return;
    setCargando(true);
    try {
      const formData = new FormData();
      if (descripcion) formData.append("descripcion", descripcion);
      if (biografia) formData.append("biografia", biografia);
      if (imagen) formData.append("file", imagen);

      const perfilActualizado = await actualizarPerfil(usuario.id_usuario, formData);

      if (perfilActualizado.foto_perfil) {
        actualizarFotoPerfil(perfilActualizado.foto_perfil);
        forzarActualizacionPerfil();
      }

      await cargarPerfil();
      setEditar(false);
      alert("¡Perfil actualizado correctamente!");
      window.dispatchEvent(new Event("fotoPerfilActualizada"));
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      alert("Error al actualizar el perfil");
    } finally {
      setCargando(false);
    }
  };

  // 🔓 Desbloquear usuario
  const handleDesbloquearUsuario = async (idUsuario: number, nombreUsuario: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres desbloquear a ${nombreUsuario}?`)) {
      return;
    }

    try {
      await desbloquearUsuario(idUsuario);
      setUsuariosBloqueados(usuariosBloqueados.filter(u => u.usuario.id_usuario !== idUsuario));
      alert("Usuario desbloqueado correctamente");
    } catch (error) {
      console.error("Error desbloqueando usuario:", error);
      alert("Error al desbloquear el usuario");
    }
  };

  // ❌ Quitar "No me interesa"
  const handleQuitarNoMeInteresa = async (idPublicacion: number) => {
  try {
    await quitarNoMeInteresa(idPublicacion);
    setNoMeInteresa(noMeInteresa.filter(item => 
      item.publicacion.id_publicacion !== idPublicacion
    ));
    alert("Publicación removida de 'No me interesa'");
  } catch (error) {
    console.error("Error quitando 'No me interesa':", error);
    alert("Error al remover la publicación");
  }
};

  // ❌ Eliminar amigo
  const handleEliminarAmigo = async (amigo: any) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${amigo.nombre_usuario} de tus amigos?`)) {
      return;
    }

    try {
      await eliminarAmigo(amigo.id_usuario);
      setAmigos(amigos.filter((a) => a.id_usuario !== amigo.id_usuario));
      alert("Amigo eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando amigo:", error);
      alert("Error al eliminar amigo");
    }
  };

  if (!usuario) return <div className="cargando">Cargando perfil...</div>;

  return (
    <div className="perfil-container">
      {/* 🧩 COLUMNA PRINCIPAL */}
      <div className="perfil-main">
        {/* Header del Perfil */}
        <div className="perfil-header">
          <div className="perfil-avatar">
            <img src={fotoPreview} alt="Foto de perfil" className="perfil-foto" />
          </div>
          <h1 className="perfil-nombre">{usuario.nombre_usuario}</h1>
          <p className="perfil-correo">{usuario.correo_electronico}</p>

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

          <button onClick={() => setEditar(!editar)} className="btn-editar">
            {editar ? "Cancelar Edición" : "Editar Perfil"}
          </button>
        </div>

        {/* Formulario de Edición */}
        {editar && (
          <div className="perfil-section">
            <div className="section-header">
              <h3 className="section-title">Editar Perfil</h3>
            </div>
            <div className="perfil-edicion">
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Una breve descripción sobre ti..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biografía</label>
                <textarea
                  className="form-textarea"
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  placeholder="Cuéntanos más sobre ti, tus intereses, tu arte..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Foto de Perfil</label>
                <div className="file-upload">
                  <input
                    type="file"
                    className="file-input"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  <div className="file-label">
                    📸 Seleccionar nueva foto
                  </div>
                </div>
                {fotoPreview && (
                  <div className="preview-container">
                    <img src={fotoPreview} alt="Preview" className="preview-imagen" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  onClick={handleSubmit}
                  disabled={cargando}
                  className="btn-guardar"
                >
                  {cargando ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  onClick={() => setEditar(false)}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Información del Perfil */}
        {!editar && (
          <>
            {(descripcion || biografia) && (
              <div className="perfil-section">
                <div className="section-header">
                  <h3 className="section-title">Sobre Mí</h3>
                </div>
                {descripcion && (
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <p className="publicacion-texto">{descripcion}</p>
                  </div>
                )}
                {biografia && (
                  <div className="form-group">
                    <label className="form-label">Biografía</label>
                    <p className="publicacion-texto">{biografia}</p>
                  </div>
                )}
              </div>
            )}

            {/* Publicaciones del Usuario */}
            <div className="perfil-section">
              <div className="section-header">
                <h3 className="section-title">Mis Publicaciones</h3>
                <span className="section-count">{publicaciones.length}</span>
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
                  <p>No hay publicaciones aún.</p>
                  <p><small>Comparte tu arte con la comunidad</small></p>
                </div>
              )}
            </div>

            {/* Usuarios Bloqueados */}
            <div className="perfil-section">
              <div className="section-header">
                <h3 className="section-title">Usuarios Bloqueados</h3>
                <span className="section-count">{usuariosBloqueados.length}</span>
              </div>
              {usuariosBloqueados.length > 0 ? (
                <div className="usuarios-lista">
                  {usuariosBloqueados.map((bloqueo) => (
                    <div key={bloqueo.id_bloqueo} className="usuario-item bloqueado">
                      <img
                        src={bloqueo.usuario.foto_perfil || defaultProfile}
                        alt={`Foto de ${bloqueo.usuario.nombre_usuario}`}
                        className="usuario-foto"
                      />
                      <div className="usuario-info">
                        <span className="usuario-nombre">@{bloqueo.usuario.nombre_usuario}</span>
                        <span className="usuario-details">
                          Bloqueado el {new Date(bloqueo.fecha_bloqueo).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        className="btn-desbloquear"
                        onClick={() => handleDesbloquearUsuario(
                          bloqueo.usuario.id_usuario,
                          bloqueo.usuario.nombre_usuario
                        )}
                      >
                        Desbloquear
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sin-contenido">
                  <p>No tienes usuarios bloqueados</p>
                </div>
              )}
            </div>

            {/* No Me Interesa */}
            <div className="perfil-section">
              <div className="section-header">
                <h3 className="section-title">No Me Interesa</h3>
                <span className="section-count">{noMeInteresa.length}</span>
              </div>
              {noMeInteresa.length > 0 ? (
                <div className="publicaciones-lista">
                  {noMeInteresa.map((item) => (
                    <div key={item.id} className="publicacion-card no-me-interesa">
                      <div className="publicacion-header">
                        <img
                          src={item.publicacion.usuario?.foto_perfil || defaultProfile}
                          alt="Foto perfil"
                          className="publicacion-foto-perfil"
                        />
                        <div className="publicacion-info-usuario">
                          <span className="publicacion-usuario">
                            {item.publicacion.usuario?.nombre_usuario || "Usuario"}
                          </span>
                          <span className="publicacion-fecha">
                            {new Date(item.publicacion.fecha_creacion).toLocaleString()}
                          </span>
                          <span className="marcado-fecha">
                            Marcado el {new Date(item.fecha).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="publicacion-contenido">
                        <p className="publicacion-texto">{item.publicacion.contenido}</p>
                        {item.publicacion.imagen && (
                          <img
                            src={item.publicacion.imagen}
                            alt="Publicación"
                            className="publicacion-imagen"
                          />
                        )}
                      </div>
                      <div className="publicacion-acciones-especiales">
                        <button
                          className="btn-quitar-no-interesa"
                          onClick={() => handleQuitarNoMeInteresa(item.publicacion.id_publicacion)}
                        >
                          Quitar de "No me interesa"
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sin-contenido">
                  <p>No tienes publicaciones marcadas como "No me interesa"</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 🧩 SIDEBAR */}
      <div className="perfil-sidebar">
        {/* Siguiendo */}
        <div className="sidebar-section">
          <div className="sidebar-title">
            Siguiendo
            <span className="sidebar-count">{siguiendo.length}</span>
          </div>
          {siguiendo.length > 0 ? (
            <div className="usuarios-lista">
              {siguiendo.map((item) => (
                <div key={item.id_seguimiento} className="usuario-item">
                  <img
                    src={item.seguido.foto_perfil || defaultProfile}
                    alt={`Foto de ${item.seguido.nombre_usuario}`}
                    className="usuario-foto"
                  />
                  <div className="usuario-info">
                    <span className="usuario-nombre">{item.seguido.nombre_usuario}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sin-contenido">No sigues a nadie aún</p>
          )}
        </div>

        {/* Amigos */}
        <div className="sidebar-section">
          <div className="sidebar-title">
            Amigos
            <span className="sidebar-count">{amigos.length}</span>
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
                    <span className="usuario-nombre">
                      {amigo.nombre_usuario}
                    </span>
                  </div>
                  <button
                    className="btn-eliminar-amigo"
                    onClick={() => handleEliminarAmigo(amigo)}
                    title="Eliminar amigo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="sin-contenido">No tienes amigos aún</p>
          )}
        </div>

        {/* Seguidores */}
        <div className="sidebar-section">
          <div className="sidebar-title">
            Seguidores
            <span className="sidebar-count">{seguidores.length}</span>
          </div>
          {seguidores.length > 0 ? (
            <div className="usuarios-lista">
              {seguidores.map((seguidor) => (
                <div key={seguidor.id_seguimiento} className="usuario-item">
                  <img
                    src={seguidor.seguidor?.foto_perfil || defaultProfile}
                    alt={`Foto de ${seguidor.seguidor?.nombre_usuario}`}
                    className="usuario-foto"
                  />
                  <div className="usuario-info">
                    <span className="usuario-nombre">
                      {seguidor.seguidor?.nombre_usuario || "Usuario"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sin-contenido">No tienes seguidores aún</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;