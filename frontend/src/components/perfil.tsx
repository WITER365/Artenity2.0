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
  obtenerPublicacionesGuardadas,
  obtenerEstadisticasPublicacion,
  darMeGusta,
  quitarMeGusta,
  guardarPublicacion,
  quitarGuardado,
  obtenerEstadisticasMeGustas,
  obtenerMisCompartidos,
  eliminarCompartido // 🔥 Asegúrate de importar esta función
} from "../services/api";
import "../styles/perfil.css";

// Interfaces para los nuevos tipos de datos
interface PublicacionConEstadisticas {
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
  estadisticas?: {
    total_me_gusta: number;
    total_comentarios: number;
    total_guardados: number;
    me_gusta_dado: boolean;
    guardado: boolean;
  };
}

const Perfil: React.FC = () => {
  const { usuario, actualizarFotoPerfil, forzarActualizacionPerfil } = useAuth();
  const [descripcion, setDescripcion] = useState("");
  const [biografia, setBiografia] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [editar, setEditar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<'publicaciones' | 'guardados' | 'likes' | 'compartidos'>('publicaciones');

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
  const [estadisticasMeGustas, setEstadisticasMeGustas] = useState({
    me_gustas_recibidos: 0,
    me_gustas_dados: 0
  });
  const [publicaciones, setPublicaciones] = useState<PublicacionConEstadisticas[]>([]);
  const [publicacionesGuardadas, setPublicacionesGuardadas] = useState<PublicacionConEstadisticas[]>([]);
  const [publicacionesConLike, setPublicacionesConLike] = useState<PublicacionConEstadisticas[]>([]);
  const [compartidos, setCompartidos] = useState<any[]>([]);

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

  const cargarEstadisticasMeGustas = useCallback(async () => {
    if (!usuario?.id_usuario) return;
    try {
      const stats = await obtenerEstadisticasMeGustas(usuario.id_usuario);
      setEstadisticasMeGustas(stats);
    } catch (error) {
      console.error("Error cargando estadísticas de me gustas:", error);
    }
  }, [usuario?.id_usuario]);

  // ✅ Cargar publicaciones del usuario con estadísticas
  const cargarPublicaciones = useCallback(async () => {
    if (!usuario?.id_usuario) return;
    try {
      const posts = await obtenerPublicacionesUsuario(usuario.id_usuario);
      
      const postsConEstadisticas = await Promise.all(
        posts.map(async (post: any) => {
          try {
            const stats = await obtenerEstadisticasPublicacion(post.id_publicacion);
            return {
              ...post,
              estadisticas: stats
            };
          } catch (error) {
            console.error(`Error cargando estadísticas para publicación ${post.id_publicacion}:`, error);
            return {
              ...post,
              estadisticas: {
                total_me_gusta: 0,
                total_comentarios: 0,
                total_guardados: 0,
                me_gusta_dado: false,
                guardado: false
              }
            };
          }
        })
      );
      
      setPublicaciones(postsConEstadisticas);
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    }
  }, [usuario?.id_usuario]);

  // ✅ Cargar publicaciones guardadas
  const cargarPublicacionesGuardadas = useCallback(async () => {
    try {
      const posts = await obtenerPublicacionesGuardadas();
      
      const postsConEstadisticas = await Promise.all(
        posts.map(async (post: any) => {
          try {
            const stats = await obtenerEstadisticasPublicacion(post.id_publicacion);
            
            const fotoPerfil = post.usuario?.perfil?.foto_perfil
              ? `${post.usuario.perfil.foto_perfil}?t=${new Date().getTime()}`
              : defaultProfile;

            return {
              ...post,
              usuario: {
                ...post.usuario,
                perfil: {
                  ...post.usuario.perfil,
                  foto_perfil: fotoPerfil
                }
              },
              estadisticas: stats
            };
          } catch (error) {
            console.error(`Error cargando estadísticas para publicación guardada ${post.id_publicacion}:`, error);
            
            const fotoPerfil = post.usuario?.perfil?.foto_perfil
              ? `${post.usuario.perfil.foto_perfil}?t=${new Date().getTime()}`
              : defaultProfile;

            return {
              ...post,
              usuario: {
                ...post.usuario,
                perfil: {
                  ...post.usuario.perfil,
                  foto_perfil: fotoPerfil
                }
              },
              estadisticas: {
                total_me_gusta: 0,
                total_comentarios: 0,
                total_guardados: 0,
                me_gusta_dado: false,
                guardado: true
              }
            };
          }
        })
      );
      
      setPublicacionesGuardadas(postsConEstadisticas);
    } catch (error) {
      console.error("Error cargando publicaciones guardadas:", error);
    }
  }, []);

  const cargarPublicacionesConLike = useCallback(async () => {
    if (!usuario?.id_usuario) return;
    try {
      const token = localStorage.getItem("token");
      const usuarioStorage = localStorage.getItem("usuario");
      
      if (!token || !usuarioStorage) {
        throw new Error("No hay usuario autenticado");
      }
      
      const parsedUsuario = JSON.parse(usuarioStorage);
      
      const response = await fetch(`http://localhost:8000/usuarios/${usuario.id_usuario}/megusta-dados`, {
        headers: {
          'token': token,
          'id_usuario': parsedUsuario.id_usuario.toString(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar me gustas');
      
      const data = await response.json();

      const postsConEstadisticas = await Promise.all(
        data.map(async (item: any) => {
          try {
            const stats = await obtenerEstadisticasPublicacion(item.publicacion.id_publicacion);

            const fotoPerfilAutor = item.publicacion.usuario?.perfil?.foto_perfil
              ? `${item.publicacion.usuario.perfil.foto_perfil}?t=${new Date().getTime()}`
              : defaultProfile;

            return {
              ...item.publicacion,
              usuario: {
                ...item.publicacion.usuario,
                perfil: {
                  ...item.publicacion.usuario.perfil,
                  foto_perfil: fotoPerfilAutor,
                },
              },
              estadisticas: stats,
            };
          } catch (error) {
            console.error(`Error cargando estadísticas para publicación ${item.publicacion.id_publicacion}:`, error);

            const fotoPerfilAutor = item.publicacion.usuario?.perfil?.foto_perfil
              ? `${item.publicacion.usuario.perfil.foto_perfil}?t=${new Date().getTime()}`
              : defaultProfile;

            return {
              ...item.publicacion,
              usuario: {
                ...item.publicacion.usuario,
                perfil: {
                  ...item.publicacion.usuario.perfil,
                  foto_perfil: fotoPerfilAutor,
                },
              },
              estadisticas: {
                total_me_gusta: 0,
                total_comentarios: 0,
                total_guardados: 0,
                me_gusta_dado: true,
                guardado: false,
              },
            };
          }
        })
      );

      setPublicacionesConLike(postsConEstadisticas);
    } catch (error) {
      console.error("Error cargando publicaciones con like:", error);
    }
  }, [usuario?.id_usuario]);

  // ✅ Cargar compartidos - VERSIÓN CORREGIDA
  const cargarCompartidos = useCallback(async () => {
    if (!usuario?.id_usuario) return;
    try {
      const compartidosData = await obtenerMisCompartidos();
      
      console.log("📤 Datos crudos de compartidos:", compartidosData);

      const compartidosConEstadisticas = await Promise.all(
        compartidosData.map(async (compartido: any) => {
          try {
            const publicacion = compartido.publicacion || compartido;
            
            let publicacionCompleta = { ...publicacion };
            let usuarioAutor = publicacion.usuario;

            // Cargar perfil del autor si falta información
            if (publicacion.id_usuario && (!usuarioAutor || !usuarioAutor.perfil || !usuarioAutor.perfil.foto_perfil)) {
              try {
                const perfilAutor = await getPerfil(publicacion.id_usuario);
                
                usuarioAutor = {
                  id_usuario: publicacion.id_usuario,
                  nombre_usuario: perfilAutor.usuario?.nombre_usuario || "Usuario",
                  nombre: perfilAutor.usuario?.nombre || "",
                  perfil: {
                    foto_perfil: perfilAutor.foto_perfil || null
                  }
                };

                publicacionCompleta = {
                  ...publicacion,
                  usuario: usuarioAutor
                };
              } catch (error) {
                console.error(`❌ Error cargando perfil del autor ${publicacion.id_usuario}:`, error);
                usuarioAutor = {
                  id_usuario: publicacion.id_usuario,
                  nombre_usuario: "Usuario",
                  nombre: "",
                  perfil: { foto_perfil: null }
                };
              }
            }

            const stats = await obtenerEstadisticasPublicacion(publicacionCompleta.id_publicacion);
            
            // Función helper para obtener foto de perfil
            const obtenerFotoPerfil = (usuarioObj: any) => {
              if (!usuarioObj) return defaultProfile;
              
              const fotoPerfil = 
                usuarioObj.perfil?.foto_perfil || 
                usuarioObj.foto_perfil || 
                null;
                
              return fotoPerfil 
                ? `${fotoPerfil}?t=${new Date().getTime()}` 
                : defaultProfile;
            };

            // Información del usuario que compartió
            const usuarioCompartio = compartido.usuario_compartio || {
              ...usuario,
              id_usuario: usuario.id_usuario,
              nombre_usuario: usuario.nombre_usuario,
            };

            const resultado = {
              ...compartido,
              publicacion: {
                ...publicacionCompleta,
                usuario: usuarioAutor,
                estadisticas: stats
              },
              usuario_compartio: {
                ...usuarioCompartio,
                foto_perfil: obtenerFotoPerfil(usuarioCompartio)
              }
            };

            return resultado;

          } catch (error) {
            console.error(`❌ Error procesando compartido ${compartido.id_compartido}:`, error);
            
            const publicacion = compartido.publicacion || compartido;
            
            return {
              ...compartido,
              publicacion: {
                ...publicacion,
                usuario: {
                  id_usuario: publicacion.id_usuario || 0,
                  nombre_usuario: publicacion.usuario?.nombre_usuario || "Usuario",
                  nombre: publicacion.usuario?.nombre || "",
                  perfil: { 
                    foto_perfil: defaultProfile 
                  }
                },
                estadisticas: {
                  total_me_gusta: 0,
                  total_comentarios: 0,
                  total_guardados: 0,
                  me_gusta_dado: false,
                  guardado: false
                }
              },
              usuario_compartio: {
                ...usuario,
                id_usuario: usuario.id_usuario,
                nombre_usuario: usuario.nombre_usuario,
                foto_perfil: defaultProfile
              }
            };
          }
        })
      );
      
      console.log("✅ TODOS los compartidos procesados:", compartidosConEstadisticas);
      setCompartidos(compartidosConEstadisticas);
    } catch (error) {
      console.error("❌ Error cargando compartidos:", error);
      setCompartidos([]);
    }
  }, [usuario]);

  // ✅ Función para eliminar compartido
  const handleEliminarCompartido = async (idCompartido: number, usuarioCompartioNombre: string = "") => {
    const nombreUsuario = usuarioCompartioNombre || "este compartido";
    
    if (!window.confirm(`¿Estás seguro de que quieres eliminar ${nombreUsuario}?`)) {
      return;
    }

    try {
      setCargando(true);
      await eliminarCompartido(idCompartido);
      
      // Actualizar la lista de compartidos después de eliminar
      setCompartidos(prevCompartidos => 
        prevCompartidos.filter(compartido => compartido.id_compartido !== idCompartido)
      );
      
      alert("✅ Compartido eliminado correctamente");
    } catch (error) {
      console.error("❌ Error eliminando compartido:", error);
      alert("❌ Error al eliminar el compartido");
    } finally {
      setCargando(false);
    }
  };

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
    cargarPublicacionesGuardadas();
    cargarPublicacionesConLike();
    cargarUsuariosBloqueados();
    cargarNoMeInteresa();
    cargarEstadisticasMeGustas();
    cargarCompartidos();
  }, [
    cargarPerfil,
    cargarAmigos,
    cargarSeguidores,
    cargarSiguiendo,
    cargarEstadisticas,
    cargarPublicaciones,
    cargarPublicacionesGuardadas,
    cargarPublicacionesConLike,
    cargarUsuariosBloqueados,
    cargarNoMeInteresa,
    cargarEstadisticasMeGustas,
    cargarCompartidos,
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

  // ❤️ Manejar me gusta
  const handleMeGusta = async (publicacion: PublicacionConEstadisticas) => {
    try {
      if (publicacion.estadisticas?.me_gusta_dado) {
        await quitarMeGusta(publicacion.id_publicacion);
      } else {
        await darMeGusta(publicacion.id_publicacion);
      }
      
      // Recargar las publicaciones según la pestaña activa
      if (pestanaActiva === 'publicaciones') {
        await cargarPublicaciones();
      } else if (pestanaActiva === 'guardados') {
        await cargarPublicacionesGuardadas();
      } else if (pestanaActiva === 'likes') {
        await cargarPublicacionesConLike();
      }
    } catch (error) {
      console.error("Error con me gusta:", error);
    }
  };

  // 📥 Manejar guardar
  const handleGuardar = async (publicacion: PublicacionConEstadisticas) => {
    try {
      if (publicacion.estadisticas?.guardado) {
        await quitarGuardado(publicacion.id_publicacion);
      } else {
        await guardarPublicacion(publicacion.id_publicacion);
      }
      
      // Recargar las publicaciones según la pestaña activa
      if (pestanaActiva === 'publicaciones') {
        await cargarPublicaciones();
      } else if (pestanaActiva === 'guardados') {
        await cargarPublicacionesGuardadas();
      }
    } catch (error) {
      console.error("Error con guardar:", error);
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

  // Componente para mostrar publicaciones
  const PublicacionCard = ({ publicacion }: { publicacion: PublicacionConEstadisticas }) => {
    const [imgError, setImgError] = useState(false);
    const [profileImgError, setProfileImgError] = useState(false);

    const handleImageError = () => setImgError(true);
    const handleProfileImageError = () => setProfileImgError(true);

    const fotoPerfil = publicacion.usuario?.perfil?.foto_perfil && !profileImgError 
      ? publicacion.usuario.perfil.foto_perfil 
      : defaultProfile;

    return (
      <div key={publicacion.id_publicacion} className="publicacion-card">
        <div className="publicacion-header">
          <img
            src={fotoPerfil}
            alt="Foto perfil"
            className="publicacion-foto-perfil"
            onError={handleProfileImageError}
          />
          <div className="publicacion-info-usuario">
            <span className="publicacion-usuario">
              {publicacion.usuario?.nombre_usuario || "Usuario desconocido"}
            </span>
            <span className="publicacion-fecha">
              {new Date(publicacion.fecha_creacion).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="publicacion-contenido">
          <p className="publicacion-texto">{publicacion.contenido}</p>
          {publicacion.imagen && !imgError && (
            <img
              src={publicacion.imagen}
              alt="Publicación"
              className="publicacion-imagen"
              onError={handleImageError}
            />
          )}
        </div>
        <div className="publicacion-acciones">
          <button 
            className={`accion-btn ${publicacion.estadisticas?.me_gusta_dado ? 'liked' : ''}`}
            onClick={() => handleMeGusta(publicacion)}
          >
            ❤️ {publicacion.estadisticas?.total_me_gusta || 0}
          </button>
          <button className="accion-btn">
            💬 {publicacion.estadisticas?.total_comentarios || 0}
          </button>
          <button 
            className={`accion-btn ${publicacion.estadisticas?.guardado ? 'saved' : ''}`}
            onClick={() => handleGuardar(publicacion)}
          >
            📤
          </button>
        </div>
      </div>
    );
  };

  // Componente para mostrar compartidos - CON BOTÓN ELIMINAR
  const CompartidoCard = ({ compartido }: { compartido: any }) => {
    const [autorProfileImgError, setAutorProfileImgError] = useState(false);
    const [compartioProfileImgError, setCompartioProfileImgError] = useState(false);
    const [publicacionImgError, setPublicacionImgError] = useState(false);

    const publicacion = compartido.publicacion;
    const usuarioAutor = publicacion.usuario;
    const usuarioCompartio = compartido.usuario_compartio;

    // Función para obtener foto de perfil
    const obtenerFotoPerfil = (usuarioObj: any, errorState: boolean) => {
      if (!usuarioObj || errorState) return defaultProfile;
      
      const fotoPerfil = 
        usuarioObj.perfil?.foto_perfil || 
        usuarioObj.foto_perfil;
        
      return fotoPerfil 
        ? `${fotoPerfil}?t=${new Date().getTime()}` 
        : defaultProfile;
    };

    const fotoPerfilAutor = obtenerFotoPerfil(usuarioAutor, autorProfileImgError);
    const fotoPerfilCompartio = obtenerFotoPerfil(usuarioCompartio, compartioProfileImgError);

    return (
      <div className="publicacion-card compartido-card">
        {/* Header - Usuario que compartió */}
        <div className="compartido-header">
          <div className="usuario-compartio-info">
            <img
              src={fotoPerfilCompartio}
              alt="Foto perfil"
              className="compartido-foto-perfil"
              onError={() => setCompartioProfileImgError(true)}
            />
            <div className="compartido-info-usuario">
              <span className="compartido-usuario">
                {usuarioCompartio?.nombre_usuario || "Tú"}
              </span>
              <span className="compartido-accion">compartió una publicación</span>
              <span className="compartido-fecha">
                {new Date(compartido.fecha_compartido || compartido.fecha_creacion).toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* 🔥 BOTÓN ELIMINAR - Solo si el usuario actual es quien compartió */}
          {usuario?.id_usuario === usuarioCompartio?.id_usuario && (
            <button
              onClick={() => handleEliminarCompartido(compartido.id_compartido, usuarioCompartio.nombre_usuario)}
              className="btn-eliminar-compartido"
              title="Eliminar compartido"
              disabled={cargando}
            >
              {cargando ? "🗑️..." : "🗑️"}
            </button>
          )}
        </div>

        <div className="publicacion-original">
          <div className="publicacion-header">
            <img
              src={fotoPerfilAutor}
              alt="Foto perfil autor"
              className="publicacion-foto-perfil"
              onError={() => setAutorProfileImgError(true)}
            />
            <div className="publicacion-info-usuario">
              <span className="publicacion-usuario">
                {usuarioAutor?.nombre_usuario || "Usuario"}
              </span>
              <span className="publicacion-fecha">
                {new Date(publicacion.fecha_creacion).toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="publicacion-contenido">
            <p className="publicacion-texto">{publicacion.contenido}</p>
            {publicacion.imagen && !publicacionImgError && (
              <img
                src={`${publicacion.imagen}?t=${new Date().getTime()}`}
                alt="Publicación"
                className="publicacion-imagen"
                onError={() => setPublicacionImgError(true)}
              />
            )}
          </div>
          
          <div className="publicacion-acciones">
            <button className="accion-btn">
              ❤️ {publicacion.estadisticas?.total_me_gusta || 0}
            </button>
            <button className="accion-btn">
              💬 {publicacion.estadisticas?.total_comentarios || 0}
            </button>
            <button className="accion-btn">
              📤
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar publicaciones según la pestaña activa
  const renderPublicaciones = () => {
    let publicacionesARenderizar: PublicacionConEstadisticas[] = [];
    let titulo = "";
    let mensajeVacio = "";

    switch (pestanaActiva) {
      case 'publicaciones':
        publicacionesARenderizar = publicaciones;
        titulo = "Mis Publicaciones";
        mensajeVacio = "No hay publicaciones aún.\nComparte tu arte con la comunidad";
        break;
      case 'guardados':
        publicacionesARenderizar = publicacionesGuardadas;
        titulo = "Publicaciones Guardadas";
        mensajeVacio = "No tienes publicaciones guardadas.\nGuarda publicaciones que te interesen para verlas aquí";
        break;
      case 'likes':
        publicacionesARenderizar = publicacionesConLike;
        titulo = "Publicaciones que Me Gustan";
        mensajeVacio = "No tienes publicaciones con like.\nDale like a las publicaciones que te gusten";
        break;
      case 'compartidos':
        return (
          <div className="perfil-section">
            <div className="section-header">
              <h3 className="section-title">Mis Compartidos</h3>
              <span className="section-count">{compartidos.length}</span>
            </div>
            {compartidos.length > 0 ? (
              <div className="publicaciones-lista">
                {compartidos.map((compartido) => (
                  <CompartidoCard key={compartido.id_compartido} compartido={compartido} />
                ))}
              </div>
            ) : (
              <div className="sin-publicaciones">
                <p>No has compartido publicaciones aún.</p>
                <p><small>Comparte publicaciones que te gusten para verlas aquí</small></p>
              </div>
            )}
          </div>
        );
    }

    return (
      <div className="perfil-section">
        <div className="section-header">
          <h3 className="section-title">{titulo}</h3>
          <span className="section-count">{publicacionesARenderizar.length}</span>
        </div>
        {publicacionesARenderizar.length > 0 ? (
          <div className="publicaciones-lista">
            {publicacionesARenderizar.map((publicacion) => (
              <PublicacionCard key={publicacion.id_publicacion} publicacion={publicacion} />
            ))}
          </div>
        ) : (
          <div className="sin-publicaciones">
            <p>{mensajeVacio.split('\n')[0]}</p>
            <p><small>{mensajeVacio.split('\n')[1]}</small></p>
          </div>
        )}
      </div>
    );
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
            <div className="estadistica-item">
              <span className="estadistica-numero">{estadisticasMeGustas.me_gustas_recibidos}</span>
              <span className="estadistica-label">Me Gusta Recibidos</span>
            </div>
            <div className="estadistica-item">
              <span className="estadistica-numero">{estadisticasMeGustas.me_gustas_dados}</span>
              <span className="estadistica-label">Me Gusta Dados</span>
            </div>
          </div>

          {/* Pestañas de navegación */}
          <div className="perfil-pestanas">
            <button 
              className={`pestana ${pestanaActiva === 'publicaciones' ? 'activa' : ''}`}
              onClick={() => setPestanaActiva('publicaciones')}
            >
              Publicaciones
            </button>
            <button 
              className={`pestana ${pestanaActiva === 'guardados' ? 'activa' : ''}`}
              onClick={() => setPestanaActiva('guardados')}
            >
              Guardados
            </button>
            <button 
              className={`pestana ${pestanaActiva === 'likes' ? 'activa' : ''}`}
              onClick={() => setPestanaActiva('likes')}
            >
              Me Gusta
            </button>
            <button 
              className={`pestana ${pestanaActiva === 'compartidos' ? 'activa' : ''}`}
              onClick={() => setPestanaActiva('compartidos')}
            >
              Compartidos
            </button>
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

            {/* Publicaciones según pestaña activa */}
            {renderPublicaciones()}

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