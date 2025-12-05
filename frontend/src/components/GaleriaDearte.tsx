// frontend/components/GaleriaDeArte.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, FileImage, FileVideo, FileAudio, FileText, Upload,
  Edit, Trash2, Eye, Share2, Grid, List, Search,
  FolderPlus, Download, X, FolderOpen, FolderTree,
  BarChart3, Globe, Lock, Plus, AlertCircle, Info,
  File, Music, Image, Video, FileIcon, Loader2
} from 'lucide-react';
import {
  obtenerEstadisticasGaleria,
  obtenerCarpetasGaleria,
  crearCarpetaGaleria,
  actualizarCarpetaGaleria,
  eliminarCarpetaGaleria,
  subirArchivoGaleria,
  obtenerArchivosGaleria,
  obtenerArchivoDetalle,
  eliminarArchivoGaleria,
  publicarDesdeGaleria,
  CarpetaGaleria,
  ArchivoGaleria,
  EstadisticasGaleria
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/GaleriaDeArte.css';

// Funciones auxiliares que pueden ser usadas fuera del componente
const getIconoTipo = (tipo: string) => {
  switch (tipo) {
    case 'imagen': return <Image size={24} />;
    case 'video': return <Video size={24} />;
    case 'audio': return <Music size={24} />;
    default: return <FileIcon size={24} />;
  }
};

const getColorTipo = (tipo: string) => {
  switch (tipo) {
    case 'imagen': return '#4CAF50';
    case 'video': return '#FF5722';
    case 'audio': return '#9C27B0';
    case 'documento': return '#2196F3';
    default: return '#607D8B';
  }
};

const formatTamano = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatFecha = (fechaString: string) => {
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Componente para cuadros de diálogo de confirmación
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  tipo?: 'peligro' | 'info';
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", tipo = 'peligro' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal confirm-modal">
        <div className="modal-header">
          <div className="modal-header-icon">
            {tipo === 'peligro' ? <AlertCircle size={24} /> : <Info size={24} />}
          </div>
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-galeria btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`btn-galeria ${tipo === 'peligro' ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar previsualizaciones
const PreviewArchivo: React.FC<{ archivo: ArchivoGaleria }> = ({ archivo }) => {
  const [error, setError] = useState(false);
  
  if (error || !archivo.ruta) {
    return (
      <div className="icono-preview" style={{ backgroundColor: getColorTipo(archivo.tipo) + '20' }}>
        {getIconoTipo(archivo.tipo)}
        <span className="extension">{archivo.extension?.toUpperCase() || 'FILE'}</span>
      </div>
    );
  }

  switch (archivo.tipo) {
    case 'imagen':
      return (
        <img 
          src={archivo.ruta} 
          alt={archivo.nombre_original}
          onError={() => setError(true)}
          loading="lazy"
        />
      );
    case 'video':
      return (
        <div className="video-preview">
          <video 
            src={archivo.ruta}
            preload="metadata"
            onError={() => setError(true)}
          >
            Tu navegador no soporta videos.
          </video>
          <div className="video-overlay">
            <FileVideo size={32} />
          </div>
        </div>
      );
    case 'audio':
      return (
        <div className="audio-preview">
          <Music size={48} />
          <span className="audio-label">Audio</span>
        </div>
      );
    default:
      return (
        <div className="icono-preview" style={{ backgroundColor: getColorTipo(archivo.tipo) + '20' }}>
          {getIconoTipo(archivo.tipo)}
          <span className="extension">{archivo.extension?.toUpperCase() || 'DOC'}</span>
        </div>
      );
  }
};

// Componente principal
const GaleriaDeArte: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [estadisticas, setEstadisticas] = useState<EstadisticasGaleria | null>(null);
  const [carpetas, setCarpetas] = useState<CarpetaGaleria[]>([]);
  const [archivos, setArchivos] = useState<ArchivoGaleria[]>([]);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<number | null>(null);
  const [vista, setVista] = useState<'grid' | 'list'>('grid');
  const [cargando, setCargando] = useState(true);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  
  // Estados para modales
  const [mostrarModalCarpeta, setMostrarModalCarpeta] = useState(false);
  const [mostrarModalSubir, setMostrarModalSubir] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [mostrarModalPublicar, setMostrarModalPublicar] = useState(false);
  
  // Estados para confirmaciones
  const [confirmacionCarpeta, setConfirmacionCarpeta] = useState<{
    isOpen: boolean;
    idCarpeta: number | null;
    titulo: string;
    mensaje: string;
  }>({
    isOpen: false,
    idCarpeta: null,
    titulo: '',
    mensaje: ''
  });
  
  const [confirmacionArchivo, setConfirmacionArchivo] = useState<{
    isOpen: boolean;
    idArchivo: number | null;
    titulo: string;
    mensaje: string;
  }>({
    isOpen: false,
    idArchivo: null,
    titulo: '',
    mensaje: ''
  });
  
  // Formularios
  const [formCarpeta, setFormCarpeta] = useState({
    nombre: '',
    descripcion: '',
    color: '#6C63FF',
    icono: 'folder',
    es_publica: false
  });
  const [editandoCarpeta, setEditandoCarpeta] = useState<CarpetaGaleria | null>(null);
  
  const [archivoSubiendo, setArchivoSubiendo] = useState<File | null>(null);
  const [descripcionArchivo, setDescripcionArchivo] = useState('');
  const [etiquetasArchivo, setEtiquetasArchivo] = useState('');
  const [esPublicoArchivo, setEsPublicoArchivo] = useState(false);
  
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoGaleria | null>(null);
  
  // Filtros
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  
  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [estats, carpetasData] = await Promise.all([
        obtenerEstadisticasGaleria(),
        obtenerCarpetasGaleria()
      ]);
      
      setEstadisticas(estats);
      setCarpetas(carpetasData);
      
      // Cargar archivos de la primera carpeta si existe
      if (carpetasData.length > 0) {
        await cargarArchivosCarpeta(carpetasData[0].id_carpeta);
      }
    } catch (error) {
      console.error('Error cargando galería:', error);
      alert('Error al cargar la galería. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };
  
  const cargarArchivosCarpeta = async (idCarpeta: number) => {
    try {
      setCarpetaSeleccionada(idCarpeta);
      const archivosData = await obtenerArchivosGaleria({ id_carpeta: idCarpeta });
      setArchivos(archivosData);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      alert('Error al cargar archivos de la carpeta');
    }
  };
  
  const cargarArchivosFiltrados = useCallback(async () => {
    try {
      const filtros: any = {};
      if (carpetaSeleccionada) filtros.id_carpeta = carpetaSeleccionada;
      if (tipoFiltro !== 'todos') filtros.tipo = tipoFiltro;
      if (busqueda) filtros.busqueda = busqueda;
      
      const archivosData = await obtenerArchivosGaleria(filtros);
      setArchivos(archivosData);
    } catch (error) {
      console.error('Error cargando archivos filtrados:', error);
    }
  }, [carpetaSeleccionada, tipoFiltro, busqueda]);
  
  // Efecto para recargar cuando cambian los filtros
  useEffect(() => {
    if (carpetaSeleccionada) {
      cargarArchivosFiltrados();
    }
  }, [carpetaSeleccionada, tipoFiltro, cargarArchivosFiltrados]);
  
  const handleCrearCarpeta = async () => {
    try {
      if (!formCarpeta.nombre.trim()) {
        alert('El nombre de la carpeta es requerido');
        return;
      }
      
      if (editandoCarpeta) {
        const carpetaActualizada = await actualizarCarpetaGaleria(editandoCarpeta.id_carpeta, formCarpeta);
        setCarpetas(carpetas.map(c => c.id_carpeta === carpetaActualizada.id_carpeta ? carpetaActualizada : c));
      } else {
        const nuevaCarpeta = await crearCarpetaGaleria(formCarpeta);
        setCarpetas([...carpetas, nuevaCarpeta]);
        // Seleccionar la nueva carpeta
        await cargarArchivosCarpeta(nuevaCarpeta.id_carpeta);
      }
      
      setMostrarModalCarpeta(false);
      resetFormCarpeta();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al guardar carpeta');
    }
  };
  
  const resetFormCarpeta = () => {
    setFormCarpeta({
      nombre: '',
      descripcion: '',
      color: '#6C63FF',
      icono: 'folder',
      es_publica: false
    });
    setEditandoCarpeta(null);
  };
  
  const editarCarpeta = (carpeta: CarpetaGaleria) => {
    setEditandoCarpeta(carpeta);
    setFormCarpeta({
      nombre: carpeta.nombre,
      descripcion: carpeta.descripcion || '',
      color: carpeta.color,
      icono: carpeta.icono,
      es_publica: carpeta.es_publica
    });
    setMostrarModalCarpeta(true);
  };
  
  const solicitarEliminarCarpeta = (idCarpeta: number, nombreCarpeta: string) => {
    setConfirmacionCarpeta({
      isOpen: true,
      idCarpeta,
      titulo: 'Eliminar Carpeta',
      mensaje: `¿Estás seguro de eliminar la carpeta "${nombreCarpeta}" y todos sus archivos? Esta acción no se puede deshacer.`
    });
  };
  
  const eliminarCarpetaConfirmada = async () => {
    if (!confirmacionCarpeta.idCarpeta) return;
    
    try {
      await eliminarCarpetaGaleria(confirmacionCarpeta.idCarpeta);
      const nuevasCarpetas = carpetas.filter(c => c.id_carpeta !== confirmacionCarpeta.idCarpeta);
      setCarpetas(nuevasCarpetas);
      
      // Si la carpeta eliminada era la seleccionada
      if (carpetaSeleccionada === confirmacionCarpeta.idCarpeta) {
        if (nuevasCarpetas.length > 0) {
          await cargarArchivosCarpeta(nuevasCarpetas[0].id_carpeta);
        } else {
          setCarpetaSeleccionada(null);
          setArchivos([]);
        }
      }
      
      setConfirmacionCarpeta({
        isOpen: false,
        idCarpeta: null,
        titulo: '',
        mensaje: ''
      });
      
      // Actualizar estadísticas
      const nuevasEstadisticas = await obtenerEstadisticasGaleria();
      setEstadisticas(nuevasEstadisticas);
      
    } catch (error) {
      alert('Error eliminando carpeta');
    }
  };
  
  const handleSubirArchivo = async () => {
    try {
      if (!archivoSubiendo) {
        alert('Selecciona un archivo');
        return;
      }
      
      if (!carpetaSeleccionada) {
        alert('Selecciona una carpeta primero');
        return;
      }
      
      // Validar tamaño del archivo (100MB máximo)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (archivoSubiendo.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo es 100MB.');
        return;
      }
      
      setSubiendoArchivo(true);
      
      const formData = new FormData();
      formData.append('id_carpeta', carpetaSeleccionada.toString());
      formData.append('archivo', archivoSubiendo);
      if (descripcionArchivo) formData.append('descripcion', descripcionArchivo);
      if (etiquetasArchivo) formData.append('etiquetas', etiquetasArchivo);
      formData.append('es_publico', esPublicoArchivo.toString());
      
      const nuevoArchivo = await subirArchivoGaleria(formData);
      setArchivos([nuevoArchivo, ...archivos]);
      
      // Actualizar estadísticas
      const nuevasEstadisticas = await obtenerEstadisticasGaleria();
      setEstadisticas(nuevasEstadisticas);
      
      // Actualizar carpeta en la lista
      const carpetasActualizadas = await obtenerCarpetasGaleria();
      setCarpetas(carpetasActualizadas);
      
      setMostrarModalSubir(false);
      resetFormArchivo();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error subiendo archivo');
    } finally {
      setSubiendoArchivo(false);
    }
  };
  
  const resetFormArchivo = () => {
    setArchivoSubiendo(null);
    setDescripcionArchivo('');
    setEtiquetasArchivo('');
    setEsPublicoArchivo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'text/'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isValidType) {
        alert('Tipo de archivo no permitido. Solo se aceptan imágenes, videos, audio, PDF y documentos de texto.');
        return;
      }
      
      setArchivoSubiendo(file);
    }
  };
  
  const verDetalleArchivo = async (idArchivo: number) => {
    try {
      const archivo = await obtenerArchivoDetalle(idArchivo);
      setArchivoSeleccionado(archivo);
      setMostrarModalDetalle(true);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      alert('Error al cargar los detalles del archivo');
    }
  };
  
  const descargarArchivo = (url: string, nombre: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const solicitarEliminarArchivo = (idArchivo: number, nombreArchivo: string) => {
    setConfirmacionArchivo({
      isOpen: true,
      idArchivo,
      titulo: 'Eliminar Archivo',
      mensaje: `¿Estás seguro de eliminar el archivo "${nombreArchivo}"? Esta acción no se puede deshacer.`
    });
  };
  
  const eliminarArchivoConfirmado = async () => {
    if (!confirmacionArchivo.idArchivo) return;
    
    try {
      await eliminarArchivoGaleria(confirmacionArchivo.idArchivo);
      setArchivos(archivos.filter(a => a.id_archivo !== confirmacionArchivo.idArchivo));
      
      // Actualizar estadísticas
      const nuevasEstadisticas = await obtenerEstadisticasGaleria();
      setEstadisticas(nuevasEstadisticas);
      
      // Actualizar carpetas
      const carpetasActualizadas = await obtenerCarpetasGaleria();
      setCarpetas(carpetasActualizadas);
      
      if (archivoSeleccionado?.id_archivo === confirmacionArchivo.idArchivo) {
        setMostrarModalDetalle(false);
      }
      
      setConfirmacionArchivo({
        isOpen: false,
        idArchivo: null,
        titulo: '',
        mensaje: ''
      });
    } catch (error) {
      alert('Error eliminando archivo');
    }
  };
  
  const handlePublicarDesdeGaleria = async () => {
    if (!archivoSeleccionado) return;
    
    try {
      const mensaje = (document.querySelector('#mensaje-publicacion') as HTMLTextAreaElement)?.value || 
                     `Compartiendo ${archivoSeleccionado.nombre_original} desde mi galería`;
      const etiquetasInput = (document.querySelector('#etiquetas-publicacion') as HTMLInputElement)?.value || '';
      
      const data = {
        id_archivo: archivoSeleccionado.id_archivo,
        contenido: mensaje,
        etiquetas: etiquetasInput.split(',').map(t => t.trim()).filter(t => t)
      };
      
      await publicarDesdeGaleria(data);
      alert('¡Publicado exitosamente!');
      setMostrarModalPublicar(false);
      navigate('/principal');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error publicando');
    }
  };
  
  if (cargando) {
    return (
      <div className="galeria-cargando">
        <div className="spinner"></div>
        <p>Cargando galería...</p>
      </div>
    );
  }
  
  return (
    <div className="galeria-container">
      {/* Header */}
      <div className="galeria-header">
        <div className="galeria-titulo">
          <FolderTree size={32} />
          <div>
            <h1>Galería de Arte</h1>
            <p>Organiza y comparte tus obras creativas</p>
          </div>
        </div>
        
        <div className="galeria-acciones">
          <button 
            className="btn-galeria btn-secondary" 
            onClick={() => setMostrarModalCarpeta(true)}
          >
            <FolderPlus size={18} />
            Nueva Carpeta
          </button>
          <button 
            className="btn-galeria btn-primary" 
            onClick={() => {
              if (carpetas.length === 0) {
                alert('Primero crea una carpeta para organizar tus archivos');
                setMostrarModalCarpeta(true);
              } else {
                setMostrarModalSubir(true);
              }
            }}
          >
            <Upload size={18} />
            Subir Archivo
          </button>
        </div>
      </div>
      
      {/* Estadísticas */}
      {estadisticas && (
        <div className="galeria-estadisticas">
          <div className="estadistica-card">
            <FolderOpen size={24} />
            <div>
              <h3>{estadisticas.total_carpetas}</h3>
              <p>Carpetas</p>
            </div>
          </div>
          <div className="estadistica-card">
            <FileImage size={24} />
            <div>
              <h3>{estadisticas.total_archivos}</h3>
              <p>Archivos</p>
            </div>
          </div>
          <div className="estadistica-card">
            <BarChart3 size={24} />
            <div>
              <h3>{estadisticas.tamano_total_mb} MB</h3>
              <p>Espacio usado</p>
            </div>
          </div>
          <div className="estadistica-card">
            <Globe size={24} />
            <div>
              <h3>{Object.values(estadisticas.tipos_archivos).reduce((a, b) => a + b, 0)}</h3>
              <p>Tipos de archivos</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="galeria-contenido">
        {/* Sidebar - Carpetas */}
        <div className="galeria-sidebar">
          <div className="sidebar-header">
            <h3><Folder size={18} /> Carpetas</h3>
            <span>{carpetas.length}</span>
          </div>
          
          <div className="carpetas-lista">
            {carpetas.map(carpeta => (
              <div
                key={carpeta.id_carpeta}
                className={`carpeta-item ${carpetaSeleccionada === carpeta.id_carpeta ? 'activa' : ''}`}
                onClick={() => cargarArchivosCarpeta(carpeta.id_carpeta)}
                style={{ borderLeftColor: carpeta.color }}
              >
                <div className="carpeta-info">
                  <Folder size={20} style={{ color: carpeta.color }} />
                  <div>
                    <h4>{carpeta.nombre}</h4>
                    <p>{carpeta.total_archivos} archivos • {formatTamano(carpeta.tamano_total)}</p>
                  </div>
                </div>
                
                <div className="carpeta-acciones">
                  <button
                    className="btn-icon"
                    title={carpeta.es_publica ? "Carpeta pública" : "Carpeta privada"}
                    aria-label={carpeta.es_publica ? "Carpeta pública" : "Carpeta privada"}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {carpeta.es_publica ? <Globe size={16} /> : <Lock size={16} />}
                  </button>
                  
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      editarCarpeta(carpeta);
                    }}
                    title="Editar carpeta"
                  >
                    <Edit size={16} />
                  </button>
                  
                  <button
                    className="btn-icon btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      solicitarEliminarCarpeta(carpeta.id_carpeta, carpeta.nombre);
                    }}
                    title="Eliminar carpeta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {carpetas.length === 0 && (
              <div className="sin-carpetas">
                <Folder size={48} />
                <p>No hay carpetas creadas</p>
                <button 
                  className="btn-galeria btn-outline"
                  onClick={() => setMostrarModalCarpeta(true)}
                >
                  <Plus size={16} />
                  Crear primera carpeta
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Contenido principal - Archivos */}
        <div className="galeria-main">
          <div className="archivos-header">
            <div className="filtros">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar archivos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && cargarArchivosFiltrados()}
                />
                {busqueda && (
                  <button 
                    className="btn-icon" 
                    onClick={() => {
                      setBusqueda('');
                      cargarArchivosFiltrados();
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <select 
                className="select-filtro"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                <option value="todos">Todos los tipos</option>
                <option value="imagen">Imágenes</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="documento">Documentos</option>
              </select>
              
              <div className="vista-botones">
                <button 
                  className={`btn-icon ${vista === 'grid' ? 'active' : ''}`}
                  onClick={() => setVista('grid')}
                  title="Vista cuadrícula"
                >
                  <Grid size={18} />
                </button>
                <button 
                  className={`btn-icon ${vista === 'list' ? 'active' : ''}`}
                  onClick={() => setVista('list')}
                  title="Vista lista"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            
            <div className="info-carpeta">
              {carpetaSeleccionada 
                ? carpetas.find(c => c.id_carpeta === carpetaSeleccionada)?.nombre
                : 'Selecciona una carpeta'}
              {carpetaSeleccionada && (
                <span className="contador-archivos">
                  {archivos.length} archivo{archivos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          {/* Lista de archivos */}
          {archivos.length > 0 ? (
            <div className={`archivos-container ${vista}`}>
              {archivos.map(archivo => (
                <div key={archivo.id_archivo} className="archivo-card">
                  <div 
                    className="archivo-preview" 
                    onClick={() => verDetalleArchivo(archivo.id_archivo)}
                  >
                    <PreviewArchivo archivo={archivo} />
                    
                    {archivo.es_publico && (
                      <div className="badge-publico" title="Archivo público">
                        <Globe size={12} />
                      </div>
                    )}
                  </div>
                  
                  <div className="archivo-info">
                    <h4 title={archivo.nombre_original}>
                      {archivo.nombre_original.length > 30 
                        ? archivo.nombre_original.substring(0, 30) + '...' 
                        : archivo.nombre_original}
                    </h4>
                    
                    <div className="archivo-meta">
                      <span style={{ color: getColorTipo(archivo.tipo) }}>
                        {getIconoTipo(archivo.tipo)}
                        {archivo.tipo.charAt(0).toUpperCase() + archivo.tipo.slice(1)}
                      </span>
                      <span>•</span>
                      <span>{formatTamano(archivo.tamano)}</span>
                      {archivo.resolucion && (
                        <>
                          <span>•</span>
                          <span>{archivo.resolucion}</span>
                        </>
                      )}
                    </div>
                    
                    {archivo.descripcion && (
                      <p className="archivo-descripcion">
                        {archivo.descripcion.length > 100
                          ? archivo.descripcion.substring(0, 100) + '...'
                          : archivo.descripcion}
                      </p>
                    )}
                    
                    <div className="archivo-acciones">
                      <button 
                        className="btn-icon"
                        onClick={() => verDetalleArchivo(archivo.id_archivo)}
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button 
                        className="btn-icon"
                        onClick={() => descargarArchivo(archivo.ruta, archivo.nombre_original)}
                        title="Descargar"
                      >
                        <Download size={16} />
                      </button>
                      
                      <button 
                        className="btn-icon"
                        onClick={() => {
                          setArchivoSeleccionado(archivo);
                          setMostrarModalPublicar(true);
                        }}
                        title="Publicar en página principal"
                      >
                        <Share2 size={16} />
                      </button>
                      
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => solicitarEliminarArchivo(archivo.id_archivo, archivo.nombre_original)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sin-archivos">
              <FileImage size={64} />
              <h3>No hay archivos en esta carpeta</h3>
              <p>Sube tu primera obra o selecciona otra carpeta</p>
              <button 
                className="btn-galeria btn-primary"
                onClick={() => setMostrarModalSubir(true)}
              >
                <Upload size={18} />
                Subir archivo
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal: Crear/Editar Carpeta */}
      {mostrarModalCarpeta && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editandoCarpeta ? 'Editar Carpeta' : 'Nueva Carpeta'}</h3>
              <button className="btn-icon" onClick={() => {
                setMostrarModalCarpeta(false);
                resetFormCarpeta();
              }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre de la carpeta *</label>
                <input
                  type="text"
                  value={formCarpeta.nombre}
                  onChange={(e) => setFormCarpeta({...formCarpeta, nombre: e.target.value})}
                  placeholder="Ej: Mis Pinturas, Música Original, etc."
                />
              </div>
              
              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  value={formCarpeta.descripcion}
                  onChange={(e) => setFormCarpeta({...formCarpeta, descripcion: e.target.value})}
                  placeholder="Describe el contenido de esta carpeta..."
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Color de la carpeta</label>
                <div className="color-picker">
                  <input
                    type="color"
                    value={formCarpeta.color}
                    onChange={(e) => setFormCarpeta({...formCarpeta, color: e.target.value})}
                  />
                  <span>{formCarpeta.color}</span>
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="es_publica"
                  checked={formCarpeta.es_publica}
                  onChange={(e) => setFormCarpeta({...formCarpeta, es_publica: e.target.checked})}
                />
                <label htmlFor="es_publica">
                  <Globe size={16} />
                  <div>
                    <span>Hacer carpeta pública</span>
                    <small>Otros usuarios podrán ver el contenido de esta carpeta</small>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-galeria btn-outline"
                onClick={() => {
                  setMostrarModalCarpeta(false);
                  resetFormCarpeta();
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-galeria btn-primary"
                onClick={handleCrearCarpeta}
                disabled={!formCarpeta.nombre.trim()}
              >
                {editandoCarpeta ? 'Guardar cambios' : 'Crear carpeta'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Subir Archivo */}
      {mostrarModalSubir && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3><Upload size={20} /> Subir Archivo a la Galería</h3>
              <button className="btn-icon" onClick={() => {
                setMostrarModalSubir(false);
                resetFormArchivo();
              }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Seleccionar carpeta *</label>
                <select 
                  className="select-filtro"
                  value={carpetaSeleccionada || ''}
                  onChange={(e) => setCarpetaSeleccionada(Number(e.target.value))}
                >
                  <option value="">Selecciona una carpeta</option>
                  {carpetas.map(carpeta => (
                    <option key={carpeta.id_carpeta} value={carpeta.id_carpeta}>
                      {carpeta.nombre}
                    </option>
                  ))}
                </select>
                {carpetas.length === 0 && (
                  <small className="text-muted">
                    <AlertCircle size={12} /> Crea una carpeta primero
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label>Seleccionar archivo *</label>
                <div 
                  className={`file-upload-area ${archivoSubiendo ? 'has-file' : ''}`}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {archivoSubiendo ? (
                    <div className="file-selected">
                      <File size={32} />
                      <div>
                        <strong>{archivoSubiendo.name}</strong>
                        <p>{formatTamano(archivoSubiendo.size)} • {archivoSubiendo.type || 'Tipo desconocido'}</p>
                      </div>
                      <button 
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchivoSubiendo(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={48} />
                      <p>Arrastra y suelta o haz clic para seleccionar</p>
                      <small>Tipos soportados: Imágenes, Videos, Audio, Documentos (max 100MB)</small>
                    </>
                  )}
                  <input
                    id="file-input"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  value={descripcionArchivo}
                  onChange={(e) => setDescripcionArchivo(e.target.value)}
                  placeholder="Describe este archivo..."
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Etiquetas (opcional)</label>
                <input
                  type="text"
                  value={etiquetasArchivo}
                  onChange={(e) => setEtiquetasArchivo(e.target.value)}
                  placeholder="Ej: pintura, abstracto, 2024 (separadas por comas)"
                />
                <small>Separa las etiquetas con comas</small>
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="es_publico_archivo"
                  checked={esPublicoArchivo}
                  onChange={(e) => setEsPublicoArchivo(e.target.checked)}
                />
                <label htmlFor="es_publico_archivo">
                  <Globe size={16} />
                  <div>
                    <span>Hacer archivo público</span>
                    <small>Este archivo será visible para otros usuarios en tu galería pública</small>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-galeria btn-outline"
                onClick={() => {
                  setMostrarModalSubir(false);
                  resetFormArchivo();
                }}
                disabled={subiendoArchivo}
              >
                Cancelar
              </button>
              <button 
                className="btn-galeria btn-primary"
                onClick={handleSubirArchivo}
                disabled={!archivoSubiendo || !carpetaSeleccionada || subiendoArchivo}
              >
                {subiendoArchivo ? (
                  <>
                    <Loader2 size={18} className="spinning" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Subir archivo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Detalles del Archivo */}
      {mostrarModalDetalle && archivoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3><File size={20} /> Detalles del Archivo</h3>
              <button className="btn-icon" onClick={() => setMostrarModalDetalle(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="archivo-detalle">
                <div className="detalle-preview">
                  {archivoSeleccionado.tipo === 'imagen' ? (
                    <img 
                      src={archivoSeleccionado.ruta} 
                      alt={archivoSeleccionado.nombre_original}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="preview-error">
                            <FileIcon size={64} />
                            <p>No se pudo cargar la imagen</p>
                          </div>
                        `;
                      }}
                    />
                  ) : archivoSeleccionado.tipo === 'video' ? (
                    <div className="video-detalle">
                      <video controls>
                        <source src={archivoSeleccionado.ruta} type={`video/${archivoSeleccionado.extension}`} />
                        Tu navegador no soporta el elemento de video.
                      </video>
                    </div>
                  ) : archivoSeleccionado.tipo === 'audio' ? (
                    <div className="audio-detalle">
                      <Music size={64} />
                      <audio controls>
                        <source src={archivoSeleccionado.ruta} type={`audio/${archivoSeleccionado.extension}`} />
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                    </div>
                  ) : (
                    <div className="documento-detalle">
                      <FileText size={64} />
                      <p>Documento: {archivoSeleccionado.nombre_original}</p>
                      <a 
                        href={archivoSeleccionado.ruta} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-galeria btn-outline"
                      >
                        <Eye size={16} />
                        Ver documento
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="detalle-info">
                  <div className="info-row">
                    <span className="label">Nombre:</span>
                    <span className="value">{archivoSeleccionado.nombre_original}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">Tipo:</span>
                    <span className="value" style={{ color: getColorTipo(archivoSeleccionado.tipo) }}>
                      {getIconoTipo(archivoSeleccionado.tipo)}
                      {archivoSeleccionado.tipo.charAt(0).toUpperCase() + archivoSeleccionado.tipo.slice(1)} 
                      ({archivoSeleccionado.extension?.toUpperCase() || 'N/A'})
                    </span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">Tamaño:</span>
                    <span className="value">{formatTamano(archivoSeleccionado.tamano)}</span>
                  </div>
                  
                  {archivoSeleccionado.resolucion && (
                    <div className="info-row">
                      <span className="label">Resolución:</span>
                      <span className="value">{archivoSeleccionado.resolucion}</span>
                    </div>
                  )}
                  
                  {archivoSeleccionado.duracion && (
                    <div className="info-row">
                      <span className="label">Duración:</span>
                      <span className="value">
                        {Math.floor(archivoSeleccionado.duracion / 60)}:
                        {String(Math.floor(archivoSeleccionado.duracion % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  
                  <div className="info-row">
                    <span className="label">Carpeta:</span>
                    <span className="value">{archivoSeleccionado.carpeta_nombre}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">Subido:</span>
                    <span className="value">{formatFecha(archivoSeleccionado.fecha_subida)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">Visibilidad:</span>
                    <span className="value">
                      {archivoSeleccionado.es_publico ? (
                        <span className="badge-publico">
                          <Globe size={12} />
                          Público
                        </span>
                      ) : (
                        <span className="badge-privado">
                          <Lock size={12} />
                          Privado
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {archivoSeleccionado.descripcion && (
                    <div className="info-row">
                      <span className="label">Descripción:</span>
                      <p className="value descripcion">{archivoSeleccionado.descripcion}</p>
                    </div>
                  )}
                  
                  {archivoSeleccionado.etiquetas && archivoSeleccionado.etiquetas.length > 0 && (
                    <div className="info-row">
                      <span className="label">Etiquetas:</span>
                      <div className="etiquetas">
                        {archivoSeleccionado.etiquetas.map((etiqueta, index) => (
                          <span key={index} className="etiqueta">{etiqueta}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-galeria btn-outline"
                onClick={() => {
                  setMostrarModalDetalle(false);
                  solicitarEliminarArchivo(archivoSeleccionado.id_archivo, archivoSeleccionado.nombre_original);
                }}
              >
                <Trash2 size={18} />
                Eliminar
              </button>
              
              <button 
                className="btn-galeria btn-outline"
                onClick={() => descargarArchivo(archivoSeleccionado.ruta, archivoSeleccionado.nombre_original)}
              >
                <Download size={18} />
                Descargar
              </button>
              
              <button 
                className="btn-galeria btn-primary"
                onClick={() => {
                  setMostrarModalDetalle(false);
                  setMostrarModalPublicar(true);
                }}
              >
                <Share2 size={18} />
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Publicar desde Galería */}
      {mostrarModalPublicar && archivoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3><Share2 size={20} /> Publicar desde Galería</h3>
              <button className="btn-icon" onClick={() => setMostrarModalPublicar(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="publicar-preview">
                <PreviewArchivo archivo={archivoSeleccionado} />
                <p><strong>{archivoSeleccionado.nombre_original}</strong></p>
              </div>
              
              <div className="form-group">
                <label>Mensaje (opcional)</label>
                <textarea
                  id="mensaje-publicacion"
                  placeholder="Añade un mensaje para acompañar tu publicación..."
                  rows={3}
                  defaultValue={`Compartiendo ${archivoSeleccionado.nombre_original} desde mi galería`}
                />
              </div>
              
              <div className="form-group">
                <label>Etiquetas (opcional)</label>
                <input
                  id="etiquetas-publicacion"
                  type="text"
                  placeholder="Etiquetas separadas por comas"
                  defaultValue={archivoSeleccionado.etiquetas?.join(', ')}
                />
              </div>
              
              <div className="alert alert-info">
                <Info size={18} />
                <p>Esta publicación aparecerá en la página principal visible para todos tus seguidores.</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-galeria btn-outline"
                onClick={() => setMostrarModalPublicar(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-galeria btn-primary"
                onClick={handlePublicarDesdeGaleria}
              >
                <Share2 size={18} />
                Publicar ahora
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Diálogos de confirmación */}
      <ConfirmDialog
        isOpen={confirmacionCarpeta.isOpen}
        title={confirmacionCarpeta.titulo}
        message={confirmacionCarpeta.mensaje}
        onConfirm={eliminarCarpetaConfirmada}
        onCancel={() => setConfirmacionCarpeta({
          isOpen: false,
          idCarpeta: null,
          titulo: '',
          mensaje: ''
        })}
        confirmText="Eliminar"
        cancelText="Cancelar"
        tipo="peligro"
      />
      
      <ConfirmDialog
        isOpen={confirmacionArchivo.isOpen}
        title={confirmacionArchivo.titulo}
        message={confirmacionArchivo.mensaje}
        onConfirm={eliminarArchivoConfirmado}
        onCancel={() => setConfirmacionArchivo({
          isOpen: false,
          idArchivo: null,
          titulo: '',
          mensaje: ''
        })}
        confirmText="Eliminar"
        cancelText="Cancelar"
        tipo="peligro"
      />
    </div>
  );
};

export default GaleriaDeArte;