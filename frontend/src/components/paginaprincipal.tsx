// src/pages/PaginaPrincipal.jsx
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
} from "lucide-react";
import "../styles/paginaprincipal.css";
import defaultProfile from "../assets/img/fotoperfildefault.jpg";
import {
  getPublicaciones,
  crearPublicacion,
  eliminarPublicacion,
  bloquearUsuario,
  noMeInteresa,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import NotificacionesPanel from "../components/NotificacionesPanel";

export default function PaginaPrincipal() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [contenido, setContenido] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);

  // ✅ Añadir clase al body
  useEffect(() => {
    document.body.classList.add("pagina-principal");
    return () => {
      document.body.classList.remove("pagina-principal");
    };
  }, []);

  // ✅ Cargar publicaciones
  const cargarPublicaciones = async () => {
    try {
      const posts = await getPublicaciones();

      const postsConFotosActualizadas = posts.map((p: any) => {
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
    const handleClickOutside = () => setMenuAbierto(null);
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
              usuario?.foto_perfil
                ? `${usuario.foto_perfil}?t=${new Date().getTime()}`
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
                <button className="action-btn">💬</button>
                <button className="action-btn">🔄</button>
                <button className="action-btn">❤️</button>
                <button className="action-btn">📤</button>
              </div>
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
