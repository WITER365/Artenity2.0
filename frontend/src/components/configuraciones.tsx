import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  actualizarUsuario,
  cambiarContrasena,
  eliminarCuenta,
  reportarProblema,
  obtenerCategoriasPublicas,
} from "../services/api";
import {
  validateEmail,
  validatePassword,
  formatPhoneNumber
} from "../utils/validation";
import {
  Settings,
  User,
  Lock,
  HelpCircle,
  Shield,
  Globe,
  Sun,
  Moon,
  Bell,
  Trash2,
  Key,
  LogOut,
  ArrowLeft,
  Check,
  AlertCircle,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Save,
  X,
  Info,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import "../styles/configuraciones.css";

interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  fecha_nacimiento: string | null;
  genero: string;
  tipo_arte_preferido: string;
  telefono: string;
  nombre_usuario: string;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
}

const Configuraciones: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("tu-cuenta");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  // Estados para validación
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  const [idiomas] = useState([
    { codigo: "es", nombre: "Español", nativo: "Español" },
    { codigo: "en", nombre: "Inglés", nativo: "English" },
    { codigo: "fr", nombre: "Francés", nativo: "Français" },
    { codigo: "de", nombre: "Alemán", nativo: "Deutsch" },
    { codigo: "pt", nombre: "Portugués", nativo: "Português" },
  ]);
  
  const [modoOscuro, setModoOscuro] = useState<boolean>(false);
  const [tamanoFuente, setTamanoFuente] = useState<number>(16);
  const [notificaciones, setNotificaciones] = useState({
    meGusta: true,
    comentarios: true,
    seguidores: true,
    mensajes: true,
    anuncios: false,
  });

  // Formularios
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo_electronico: "",
    fecha_nacimiento: "",
    genero: "",
    tipo_arte_preferido: "",
    telefono: "",
    nombre_usuario: "",
  });

  const [passwordData, setPasswordData] = useState({
    passwordActual: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [reporteData, setReporteData] = useState({
    tipoProblema: "tecnico",
    descripcion: "",
    emailContacto: "",
  });

  const [showPassword, setShowPassword] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  // Estados para mensajes
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string>("");

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosUsuario();
    cargarCategorias();
    
    // Cargar preferencias del localStorage
    const modoOscuroGuardado = localStorage.getItem("modoOscuro") === "true";
    const tamanoFuenteGuardado = localStorage.getItem("tamanoFuente");
    const notificacionesGuardadas = localStorage.getItem("notificaciones");
    
    setModoOscuro(modoOscuroGuardado);
    if (tamanoFuenteGuardado) {
      setTamanoFuente(parseInt(tamanoFuenteGuardado));
    }
    if (notificacionesGuardadas) {
      setNotificaciones(JSON.parse(notificacionesGuardadas));
    }
    
    // Aplicar modo oscuro si está activado
    if (modoOscuroGuardado) {
      document.documentElement.classList.add("dark-mode");
    }
  }, []);

  const cargarDatosUsuario = () => {
    try {
      const usuarioStorage = localStorage.getItem("usuario");
      if (usuarioStorage) {
        const usuarioData: Usuario = JSON.parse(usuarioStorage);
        setUsuario(usuarioData);
        setFormData({
          nombre: usuarioData.nombre || "",
          apellido: usuarioData.apellido || "",
          correo_electronico: usuarioData.correo_electronico || "",
          fecha_nacimiento: usuarioData.fecha_nacimiento?.split("T")[0] || "",
          genero: usuarioData.genero || "",
          tipo_arte_preferido: usuarioData.tipo_arte_preferido || "",
          telefono: usuarioData.telefono || "",
          nombre_usuario: usuarioData.nombre_usuario || "",
        });
        
        // También cargar email de contacto para reportes
        setReporteData(prev => ({
          ...prev,
          emailContacto: usuarioData.correo_electronico || ""
        }));
      }
    } catch (error) {
      console.error("Error cargando datos del usuario:", error);
      setMessage({ type: "error", text: "Error cargando datos del usuario" });
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const categoriasData = await obtenerCategoriasPublicas();
      setCategorias(categoriasData);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      setMessage({ type: "error", text: "Error cargando categorías" });
    }
  };

  // Manejar cambios en formularios con validación
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Limpiar error de validación para este campo
    setValidationErrors(prev => ({ ...prev, [name]: "" }));
    
    // Formatear teléfono si es el campo de teléfono
    if (name === "telefono") {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Validar email en tiempo real
    if (name === "correo_electronico" && value && !validateEmail(value)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        [name]: "Email inválido" 
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Validar nueva contraseña en tiempo real
    if (name === "newPassword") {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
    }
  };

  const handleReporteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReporteData(prev => ({ ...prev, [name]: value }));
  };

  // Validar formulario completo
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }
    
    if (!formData.apellido.trim()) {
      errors.apellido = "El apellido es requerido";
    }
    
    if (!formData.correo_electronico.trim()) {
      errors.correo_electronico = "El email es requerido";
    } else if (!validateEmail(formData.correo_electronico)) {
      errors.correo_electronico = "Email inválido";
    }
    
    if (!formData.nombre_usuario.trim()) {
      errors.nombre_usuario = "El nombre de usuario es requerido";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar cambios en cuenta
  const guardarCambiosCuenta = async () => {
    if (!usuario) return;
    
    // Validar formulario
    if (!validateForm()) {
      setMessage({ type: "error", text: "Por favor corrige los errores en el formulario" });
      return;
    }
    
    setSaving(true);
    try {
      const response = await actualizarUsuario(usuario.id_usuario, formData);
      
      // Actualizar en localStorage y estado
      const usuarioActualizado = {
        ...usuario,
        ...formData
      };
      localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      setUsuario(usuarioActualizado);
      
      setMessage({ type: "success", text: response.mensaje || "Cambios guardados correctamente" });
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.detail || "Error al guardar los cambios" 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Cambiar contraseña - VERSIÓN TEMPORAL SIN BACKEND
  const cambiarContrasena = async () => {
    if (!usuario) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    
    const validation = validatePassword(passwordData.newPassword);
    if (!validation.isValid) {
      setMessage({ 
        type: "error", 
        text: "La contraseña no cumple con los requisitos mínimos" 
      });
      setPasswordErrors(validation.errors);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    
    setSaving(true);
    try {
      // TEMPORAL: Simular llamada a API hasta que tengas el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: "success", text: "Contraseña cambiada correctamente" });
      setPasswordData({
        passwordActual: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors([]);
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.detail || "Error al cambiar la contraseña" 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Eliminar cuenta - VERSIÓN TEMPORAL SIN BACKEND
  const eliminarCuenta = async () => {
    if (!usuario) return;
    
    if (deleteConfirm !== "ELIMINAR") {
      setMessage({ type: "error", text: "Debes escribir 'ELIMINAR' para confirmar" });
      return;
    }
    
    setSaving(true);
    try {
      // TEMPORAL: Simular llamada a API hasta que tengas el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Limpiar localStorage y redirigir
      localStorage.clear();
      navigate("/");
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.detail || "Error al eliminar la cuenta" 
      });
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteConfirm("");
    }
  };

  // Enviar reporte - VERSIÓN TEMPORAL SIN BACKEND
  const enviarReporte = async () => {
    if (!reporteData.descripcion.trim()) {
      setMessage({ type: "error", text: "Por favor describe el problema" });
      return;
    }
    
    if (!validateEmail(reporteData.emailContacto)) {
      setMessage({ type: "error", text: "Email de contacto inválido" });
      return;
    }
    
    setSaving(true);
    try {
      // TEMPORAL: Simular llamada a API hasta que tengas el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: "success", text: "Reporte enviado. Te contactaremos pronto." });
      setReporteData({
        tipoProblema: "tecnico",
        descripcion: "",
        emailContacto: usuario?.correo_electronico || "",
      });
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.detail || "Error al enviar el reporte" 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Manejar cambios en preferencias
  const toggleModoOscuro = () => {
    const nuevoModo = !modoOscuro;
    setModoOscuro(nuevoModo);
    localStorage.setItem("modoOscuro", nuevoModo.toString());
    document.documentElement.classList.toggle("dark-mode", nuevoModo);
  };

  const cambiarTamanoFuente = (tamano: number) => {
    setTamanoFuente(tamano);
    localStorage.setItem("tamanoFuente", tamano.toString());
    document.documentElement.style.fontSize = `${tamano}px`;
  };

  const toggleNotificacion = (tipo: keyof typeof notificaciones) => {
    const nuevasNotificaciones = {
      ...notificaciones,
      [tipo]: !notificaciones[tipo]
    };
    setNotificaciones(nuevasNotificaciones);
    localStorage.setItem("notificaciones", JSON.stringify(nuevasNotificaciones));
  };

  // Componente de campo con validación
  const renderField = (
    name: keyof typeof formData,
    label: string,
    type: string = "text",
    placeholder: string = ""
  ) => (
    <div className="form-field">
      <label className="form-label">
        {label}
        {validationErrors[name] && <span className="required-indicator">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className={`form-input ${validationErrors[name] ? 'input-error' : ''}`}
        placeholder={placeholder}
      />
      {validationErrors[name] && (
        <p className="error-message">
          <AlertTriangle size={12} />
          {validationErrors[name]}
        </p>
      )}
    </div>
  );

  // Renderizar sección activa
  const renderSection = () => {
    switch (activeSection) {
      case "tu-cuenta":
        return (
          <div className="settings-section animate-fadeIn">
            <div className="section-header">
              <h2 className="section-title">
                <div className="section-icon blue">
                  <User className="icon" size={24} />
                </div>
                Tu Cuenta
              </h2>
              <div className="last-update">
                Última actualización: Hoy
              </div>
            </div>
            
            <div className="info-card blue-gradient">
              <h3 className="card-title">
                <User size={18} />
                Información Personal
              </h3>
              <div className="form-grid">
                {renderField("nombre", "Nombre", "text", "Tu nombre")}
                {renderField("apellido", "Apellido", "text", "Tu apellido")}
                
                <div className="form-field">
                  <label className="form-label">
                    Correo Electrónico
                    {validationErrors.correo_electronico && <span className="required-indicator">*</span>}
                  </label>
                  <div className="input-with-icon">
                    <input
                      type="email"
                      name="correo_electronico"
                      value={formData.correo_electronico}
                      onChange={handleInputChange}
                      className={`form-input ${validationErrors.correo_electronico ? 'input-error' : ''}`}
                      placeholder="tu@email.com"
                    />
                    <Mail className="input-icon" size={18} />
                  </div>
                  {validationErrors.correo_electronico && (
                    <p className="error-message">
                      <AlertTriangle size={12} />
                      {validationErrors.correo_electronico}
                    </p>
                  )}
                </div>
                
                <div className="form-field">
                  <label className="form-label">
                    Teléfono
                  </label>
                  <div className="input-with-icon">
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="+34 123 456 789"
                    />
                    <Phone className="input-icon" size={18} />
                  </div>
                </div>
                
                {renderField("nombre_usuario", "Nombre de Usuario", "text", "@usuario")}
                {renderField("fecha_nacimiento", "Fecha de Nacimiento", "date")}
                
                <div className="form-field">
                  <label className="form-label">
                    Género
                  </label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero-no-decir">Prefiero no decir</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">
                    Tipo de Arte Preferido
                  </label>
                  <select
                    name="tipo_arte_preferido"
                    value={formData.tipo_arte_preferido}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.nombre}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  onClick={guardarCambiosCuenta}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <div className="spinner"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case "pantalla-idiomas":
        return (
          <div className="settings-section animate-fadeIn">
            <h2 className="section-title">
              <div className="section-icon purple">
                <Globe className="icon" size={24} />
              </div>
              Pantalla e Idiomas
            </h2>
            
            <div className="settings-list">
              <div className="setting-card">
                <div className="setting-content">
                  <div className="setting-icon">
                    {modoOscuro ? 
                      <Moon className="moon-icon" size={22} /> : 
                      <Sun className="sun-icon" size={22} />
                    }
                  </div>
                  <div className="setting-info">
                    <h3 className="setting-title">Modo Oscuro</h3>
                    <p className="setting-description">Activar interfaz oscura</p>
                  </div>
                </div>
                <button
                  onClick={toggleModoOscuro}
                  className={`toggle-switch ${modoOscuro ? 'active' : ''}`}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>
              
              <div className="setting-card">
                <h3 className="setting-title">Tamaño de Fuente</h3>
                <div className="size-options">
                  {[14, 16, 18].map((size) => (
                    <button
                      key={size}
                      onClick={() => cambiarTamanoFuente(size)}
                      className={`size-option ${tamanoFuente === size ? 'active' : ''}`}
                    >
                      {size === 14 ? 'Pequeño' : size === 16 ? 'Normal' : 'Grande'}
                    </button>
                  ))}
                </div>
                <div className="size-slider">
                  <div 
                    className="size-slider-fill"
                    style={{ width: `${((tamanoFuente - 12) / 6) * 100}%` }}
                  />
                </div>
                <p className="size-indicator">
                  Tamaño actual: <span className="current-size">{tamanoFuente}px</span>
                </p>
              </div>
              
              <div className="setting-card">
                <h3 className="setting-title">Idioma</h3>
                <div className="language-grid">
                  {idiomas.map(idioma => (
                    <button
                      key={idioma.codigo}
                      onClick={() => {
                        setMessage({ 
                          type: "info", 
                          text: `Idioma cambiado a ${idioma.nombre}` 
                        });
                        setTimeout(() => setMessage(null), 2000);
                      }}
                      className={`language-option ${idioma.codigo === 'es' ? 'active' : ''}`}
                    >
                      <div className="language-info">
                        <div className="language-name">{idioma.nombre}</div>
                        <div className="language-native">{idioma.nativo}</div>
                      </div>
                      {idioma.codigo === 'es' ? (
                        <div className="language-selected">
                          <Check size={14} />
                          <span>Seleccionado</span>
                        </div>
                      ) : (
                        <ChevronRight size={18} className="language-chevron" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "privacidad-seguridad":
        return (
          <div className="settings-section animate-fadeIn">
            <h2 className="section-title">
              <div className="section-icon green">
                <Shield className="icon" size={24} />
              </div>
              Privacidad y Seguridad
            </h2>
            
            <div className="security-settings">
              <div className="security-card green-gradient">
                <h3 className="card-title">
                  <div className="card-icon">
                    <Key className="icon" size={20} />
                  </div>
                  Cambiar Contraseña
                </h3>
                
                <div className="password-fields">
                  {[
                    { 
                      label: "Contraseña Actual", 
                      name: "passwordActual", 
                      show: showPassword.actual,
                      toggle: () => setShowPassword(prev => ({ ...prev, actual: !prev.actual }))
                    },
                    { 
                      label: "Nueva Contraseña", 
                      name: "newPassword", 
                      show: showPassword.nueva,
                      toggle: () => setShowPassword(prev => ({ ...prev, nueva: !prev.nueva }))
                    },
                    { 
                      label: "Confirmar Nueva Contraseña", 
                      name: "confirmPassword", 
                      show: showPassword.confirmar,
                      toggle: () => setShowPassword(prev => ({ ...prev, confirmar: !prev.confirmar }))
                    }
                  ].map((field) => (
                    <div key={field.name} className="password-field">
                      <label className="form-label">
                        {field.label}
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          type={field.show ? "text" : "password"}
                          name={field.name}
                          value={passwordData[field.name as keyof typeof passwordData]}
                          onChange={handlePasswordChange}
                          className="password-input"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={field.toggle}
                          className="password-toggle"
                        >
                          {field.show ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {field.name === "newPassword" && passwordErrors.length > 0 && (
                        <div className="password-errors">
                          <ul>
                            {passwordErrors.map((error, index) => (
                              <li key={index}>
                                <X size={14} />
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={cambiarContrasena}
                  disabled={saving}
                  className="btn-primary full-width"
                >
                  {saving ? (
                    <>
                      <div className="spinner"></div>
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <Key size={18} />
                      Cambiar Contraseña
                    </>
                  )}
                </button>
              </div>
              
              <div className="danger-card">
                <div className="danger-content">
                  <div className="danger-icon">
                    <Trash2 className="icon" size={24} />
                  </div>
                  <div className="danger-info">
                    <h3 className="danger-title">
                      Eliminar Cuenta
                    </h3>
                    <p className="danger-description">
                      Esta acción es <strong>permanente</strong> y no se puede deshacer. Todos tus datos, publicaciones y conexiones se eliminarán permanentemente.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="btn-danger"
                    >
                      <Trash2 size={18} />
                      Eliminar Mi Cuenta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "centro-ayuda":
        return (
          <div className="settings-section animate-fadeIn">
            <h2 className="section-title">
              <div className="section-icon orange">
                <HelpCircle className="icon" size={24} />
              </div>
              Centro de Ayuda
            </h2>
            
            <div className="help-settings">
              <div className="help-card orange-gradient">
                <h3 className="card-title">Preguntas Frecuentes</h3>
                <div className="faq-list">
                  {[
                    { q: "¿Cómo cambio mi foto de perfil?", a: "Ve a tu perfil, haz clic en el ícono de editar y selecciona una nueva imagen." },
                    { q: "¿Cómo reporto contenido inapropiado?", a: "En cada publicación, haz clic en los tres puntos y selecciona 'Reportar'." },
                    { q: "¿Cómo bloqueo a un usuario?", a: "Ve al perfil del usuario, haz clic en los tres puntos y selecciona 'Bloquear'." },
                    { q: "¿Cómo recupero mi contraseña?", a: "En la página de login, haz clic en 'Olvidé mi contraseña' y sigue las instrucciones." },
                    { q: "¿Cómo elimino mi cuenta?", a: "Ve a Configuración → Privacidad y Seguridad → Eliminar Cuenta." },
                  ].map((item, index) => (
                    <div key={index} className="faq-item">
                      <div className="faq-question">
                        <span>{item.q}</span>
                        <ChevronRight size={18} className="faq-chevron" />
                      </div>
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="help-card">
                <h3 className="card-title">
                  <div className="card-icon blue">
                    <Mail className="icon" size={20} />
                  </div>
                  Reportar un Problema
                </h3>
                
                <div className="report-form">
                  <div className="form-field">
                    <label className="form-label">
                      Tipo de Problema
                    </label>
                    <select
                      name="tipoProblema"
                      value={reporteData.tipoProblema}
                      onChange={handleReporteChange}
                      className="form-select"
                    >
                      <option value="tecnico">Problema Técnico</option>
                      <option value="contenido">Contenido Inapropiado</option>
                      <option value="usuario">Usuario Problemático</option>
                      <option value="funcionalidad">Error de Funcionalidad</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">
                      Descripción del Problema
                    </label>
                    <textarea
                      name="descripcion"
                      value={reporteData.descripcion}
                      onChange={handleReporteChange}
                      rows={4}
                      className="form-textarea"
                      placeholder="Describe detalladamente el problema que estás experimentando..."
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      name="emailContacto"
                      value={reporteData.emailContacto}
                      onChange={handleReporteChange}
                      className="form-input"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
                
                <button
                  onClick={enviarReporte}
                  disabled={saving}
                  className="btn-primary full-width"
                >
                  {saving ? (
                    <>
                      <div className="spinner"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      Enviar Reporte
                    </>
                  )}
                </button>
              </div>
              
              <div className="help-card gray-gradient">
                <h3 className="card-title">Contacto de Soporte</h3>
                <div className="support-contacts">
                  <div className="contact-item">
                    <div className="contact-icon blue">
                      <Mail className="icon" size={18} />
                    </div>
                    <div className="contact-info">
                      <div className="contact-type">Email</div>
                      <div className="contact-value">soporte@artiverse.com</div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon green">
                      <Phone className="icon" size={18} />
                    </div>
                    <div className="contact-info">
                      <div className="contact-type">Teléfono</div>
                      <div className="contact-value">+34 900 123 456</div>
                    </div>
                  </div>
                </div>
                <p className="support-hours">
                  Horario de atención: Lunes a Viernes, 9:00 - 18:00
                </p>
              </div>
            </div>
          </div>
        );

      case "notificaciones":
        return (
          <div className="settings-section animate-fadeIn">
            <h2 className="section-title">
              <div className="section-icon pink">
                <Bell className="icon" size={24} />
              </div>
              Notificaciones
            </h2>
            
            <div className="notifications-card">
              <div className="notifications-list">
                {[
                  { key: 'meGusta', label: 'Me gusta', desc: 'Cuando alguien da me gusta a tus publicaciones', icon: '❤️' },
                  { key: 'comentarios', label: 'Comentarios', desc: 'Cuando alguien comenta tus publicaciones', icon: '💬' },
                  { key: 'seguidores', label: 'Nuevos seguidores', desc: 'Cuando alguien comienza a seguirte', icon: '👥' },
                  { key: 'mensajes', label: 'Mensajes', desc: 'Cuando recibes nuevos mensajes', icon: '📩' },
                  { key: 'anuncios', label: 'Anuncios', desc: 'Actualizaciones y novedades de Artiverse', icon: '📢' },
                ].map(({ key, label, desc, icon }) => (
                  <div key={key} className="notification-item">
                    <div className="notification-content">
                      <div className="notification-icon">{icon}</div>
                      <div className="notification-info">
                        <h3 className="notification-title">{label}</h3>
                        <p className="notification-description">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleNotificacion(key as keyof typeof notificaciones)}
                      className={`toggle-switch ${notificaciones[key as keyof typeof notificaciones] ? 'active' : ''}`}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="notification-settings">
                <div className="notification-settings-info">
                  <h4 className="settings-title">Configuración de Notificaciones</h4>
                  <p className="settings-description">Personaliza cómo recibes las notificaciones</p>
                </div>
                <button className="btn-secondary">
                  Configurar
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Modal de confirmación para eliminar cuenta
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content animate-slideUp">
          <div className="modal-header">
            <div className="modal-icon">
              <AlertCircle className="icon" size={28} />
            </div>
            <div>
              <h3 className="modal-title">Eliminar Cuenta</h3>
              <p className="modal-subtitle">Esta acción no se puede deshacer</p>
            </div>
          </div>
          
          <p className="modal-message">
            Para confirmar que quieres eliminar tu cuenta permanentemente, escribe 
            <strong>"ELIMINAR"</strong> 
            en el campo de abajo.
          </p>
          
          <div className="modal-inputs">
            <div className="modal-input-wrapper">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="modal-input"
                placeholder='Escribe "ELIMINAR" aquí'
              />
              {deleteConfirm === "ELIMINAR" && (
                <Check className="modal-check" size={20} />
              )}
            </div>
            
            <div className="modal-warning">
              <AlertTriangle size={16} />
              <p>
                Todos tus datos, publicaciones y conexiones se eliminarán permanentemente.
              </p>
            </div>
          </div>
          
          <div className="modal-actions">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirm("");
              }}
              className="btn-cancel"
            >
              Cancelar
            </button>
            <button
              onClick={eliminarCuenta}
              disabled={saving || deleteConfirm !== "ELIMINAR"}
              className={`btn-delete ${deleteConfirm !== "ELIMINAR" ? 'disabled' : ''}`}
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Eliminar Permanentemente
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <Settings className="spinner-icon" size={24} />
        </div>
        <p className="loading-text">
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <div className="configuraciones-container">
      {/* Barra superior */}
      <div className="settings-header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={() => navigate(-1)}
              className="back-button"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="header-title">
              <h1 className="main-title">Configuración</h1>
              <p className="subtitle">Personaliza tu experiencia en Artiverse</p>
            </div>
          </div>
          
          {message && (
            <div className={`message-alert ${message.type}`}>
              {message.type === 'success' && <Check size={20} />}
              {message.type === 'error' && <X size={20} />}
              {message.type === 'info' && <Info size={20} />}
              <span className="message-text">{message.text}</span>
            </div>
          )}
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-layout">
          {/* Menú lateral */}
          <div className="settings-sidebar">
            <div className="sidebar-menu">
              {[
                { id: "tu-cuenta", label: "Tu Cuenta", icon: User, color: "blue" },
                { id: "pantalla-idiomas", label: "Pantalla e Idiomas", icon: Globe, color: "purple" },
                { id: "notificaciones", label: "Notificaciones", icon: Bell, color: "pink" },
                { id: "privacidad-seguridad", label: "Privacidad y Seguridad", icon: Shield, color: "green" },
                { id: "centro-ayuda", label: "Centro de Ayuda", icon: HelpCircle, color: "orange" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`sidebar-item ${activeSection === item.id ? `active ${item.color}` : ''}`}
                >
                  <div className="sidebar-item-content">
                    <div className={`sidebar-icon ${activeSection === item.id ? item.color : ''}`}>
                      <item.icon size={20} />
                    </div>
                    <span className="sidebar-label">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className={`sidebar-chevron ${activeSection === item.id ? 'active' : ''}`} />
                </button>
              ))}
              
              <div className="sidebar-divider"></div>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("usuario");
                  navigate("/login");
                }}
                className="sidebar-item logout"
              >
                <div className="sidebar-item-content">
                  <div className="sidebar-icon logout">
                    <LogOut size={20} />
                  </div>
                  <span className="sidebar-label">Cerrar Sesión</span>
                </div>
                <LogOut size={18} className="logout-icon" />
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="settings-main">
            <div className="settings-panel">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de eliminación de cuenta */}
      {renderDeleteModal()}
    </div>
  );
};

export default Configuraciones;