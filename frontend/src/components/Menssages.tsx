// frontend/components/Messages.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef } from "react";
import "../styles/Messages.css";
import { useNavigate } from "react-router-dom";
import { 
  obtenerChats, 
  obtenerMensajesChat, 
  enviarMensaje, 
  crearObtenerChat,
  configurarChat,
  obtenerConfiguracionChat,
  subirFondoPersonalizado,
  eliminarFondoPersonalizado,
  obtenerAmigos,
  eliminarMensaje,
  eliminarChat,
  eliminarMensajeParaTodos,
  Chat as ChatType,
  Message as MessageType,
  ConfiguracionChat,
  enviarMensajeArchivo
} from "../services/api";

interface User {
  id_usuario: number;
  nombre_usuario: string;
  nombre_completo: string;
  foto_perfil?: string;
}

interface FilePreview {
  file: File;
  type: string;
  url: string;
}

const Messages: React.FC = () => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [amigos, setAmigos] = useState<User[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState<{x: number, y: number, message: MessageType} | null>(null);
  const [showChatMenu, setShowChatMenu] = useState<{x: number, y: number, chat: ChatType} | null>(null);
  const [chatConfig, setChatConfig] = useState<ConfiguracionChat>({
    fondo_chat: "default",
    color_burbuja: "#6C63FF"
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  // Cargar chats y amigos
  useEffect(() => {
    cargarChats();
    cargarAmigos();
  }, []);

  // Cargar mensajes y configuración cuando se selecciona un chat
  useEffect(() => {
    if (selectedChat) {
      cargarMensajes(selectedChat.id);
      cargarConfiguracionChat();
    }
  }, [selectedChat]);

  // Scroll automático al final de los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDeleteMenu(null);
      setShowChatMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const cargarChats = async () => {
    try {
      setLoading(true);
      const chatsData = await obtenerChats();
      setChats(chatsData);
    } catch (error) {
      console.error("Error cargando chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAmigos = async () => {
    try {
      const amigosData = await obtenerAmigos();
      setAmigos(amigosData);
    } catch (error) {
      console.error("Error cargando amigos:", error);
    }
  };

  const cargarMensajes = async (chatId: number) => {
    try {
      const mensajesData = await obtenerMensajesChat(chatId);
      setMessages(mensajesData);
    } catch (error) {
      console.error("Error cargando mensajes:", error);
    }
  };

  const cargarConfiguracionChat = async () => {
    if (!selectedChat) return;
    
    try {
      const configData = await obtenerConfiguracionChat(selectedChat.id);
      setChatConfig(configData);
      setBackgroundPreview(null);
    } catch (error) {
      console.error("Error cargando configuración:", error);
      setChatConfig({
        fondo_chat: "default",
        color_burbuja: "#6C63FF"
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goToHome = () => {
    navigate("/principal");
  };

  const handleSend = async () => {
    if ((newMessage.trim() === "" && !filePreview) || !selectedChat) return;

    try {
      if (filePreview) {
        await handleSendFile();
      }
      
      if (newMessage.trim() !== "") {
        const mensajeEnviado = await enviarMensaje(selectedChat.id, newMessage);
        
        setMessages(prev => [...prev, {
          ...mensajeEnviado,
          sender_id: parseInt(localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")!).id_usuario : "0"),
          sender_username: "yo",
          fecha: new Date().toISOString(),
          leido: false
        }]);
        
        setNewMessage("");
      }
      
      await cargarChats();
      
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      alert("Error al enviar el mensaje. Intenta nuevamente.");
    }
  };

  const handleSendFile = async () => {
    if (!filePreview || !selectedChat) return;

    try {
      setUploading(true);
      const mensajeEnviado = await enviarMensajeArchivo(selectedChat.id, filePreview.file, filePreview.type);
      
      setMessages(prev => [...prev, {
        ...mensajeEnviado,
        sender: "yo",
        sender_id: parseInt(localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")!).id_usuario : "0"),
        sender_username: "yo",
        fecha: new Date().toISOString(),
        leido: false
      }]);
      
      setFilePreview(null);
      
    } catch (error: any) {
      console.error("Error al enviar archivo:", error);
      if (error.response?.status === 403) {
        alert("Solo puedes enviar archivos a tus amigos");
      } else if (error.response?.status === 400) {
        alert(error.response.data.detail || "Error en el archivo");
      } else {
        alert("Error al enviar el archivo. Intenta nuevamente.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    const esImagen = file.type.startsWith('image/');
    const esVideo = file.type.startsWith('video/');
    
    if (!esImagen && !esVideo) {
      alert("Solo se permiten imágenes y videos");
      return;
    }

    const tipo = esImagen ? "imagen" : "video";

    if (file.size > 50 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 50MB");
      return;
    }

    const url = URL.createObjectURL(file);
    
    setFilePreview({
      file,
      type: tipo,
      url
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // NUEVA FUNCIÓN: Manejar selección de fondo personalizado
  const handleBackgroundSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    if (!file.type.startsWith('image/')) {
      alert("Solo se permiten imágenes para el fondo");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen de fondo es demasiado grande. Máximo 10MB");
      return;
    }

    try {
      setUploadingBackground(true);
      
      // Crear vista previa
      const url = URL.createObjectURL(file);
      setBackgroundPreview(url);
      
      // Subir al servidor
      const resultado = await subirFondoPersonalizado(selectedChat.id, file);
      
      // Actualizar configuración
      setChatConfig(prev => ({
        ...prev,
        fondo_chat: "personalizado",
        fondo_personalizado: resultado.fondo_url
      }));
      
      console.log("Fondo personalizado guardado:", resultado);
      
    } catch (error: any) {
      console.error("Error subiendo fondo:", error);
      alert(error.response?.data?.detail || "Error al subir el fondo personalizado");
      setBackgroundPreview(null);
    } finally {
      setUploadingBackground(false);
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = "";
      }
    }
  };

  // NUEVA FUNCIÓN: Eliminar fondo personalizado
  const handleRemoveBackground = async () => {
    if (!selectedChat) return;

    try {
      await eliminarFondoPersonalizado(selectedChat.id);
      
      setChatConfig(prev => ({
        ...prev,
        fondo_chat: "default",
        fondo_personalizado: undefined
      }));
      
      setBackgroundPreview(null);
      
      console.log("Fondo personalizado eliminado");
      
    } catch (error: any) {
      console.error("Error eliminando fondo:", error);
      alert("Error al eliminar el fondo personalizado");
    }
  };

  const cancelFilePreview = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview.url);
      setFilePreview(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Manejar clic derecho en mensajes
  const handleMessageContextMenu = (e: React.MouseEvent, message: MessageType) => {
    e.preventDefault();
    e.stopPropagation();
    
    setShowDeleteMenu({
      x: e.clientX,
      y: e.clientY,
      message
    });
  };

  // Manejar clic derecho en chats
  const handleChatContextMenu = (e: React.MouseEvent, chat: ChatType) => {
    e.preventDefault();
    e.stopPropagation();
    
    setShowChatMenu({
      x: e.clientX,
      y: e.clientY,
      chat
    });
  };

  // Eliminar mensaje
  const handleDeleteMessage = async (message: MessageType) => {
    if (!selectedChat) return;

    try {
      await eliminarMensaje(selectedChat.id, message.id);
      setMessages(prev => prev.filter(m => m.id !== message.id));
      setShowDeleteMenu(null);
    } catch (error: any) {
      console.error("Error eliminando mensaje:", error);
      if (error.response?.status === 404) {
        alert("El mensaje no existe o no tienes permisos para eliminarlo");
      } else {
        alert("Error al eliminar el mensaje");
      }
    }
  };

  // Eliminar mensaje para todos
  const handleDeleteMessageForEveryone = async (message: MessageType) => {
    try {
      await eliminarMensajeParaTodos(message.id);
      setMessages(prev => prev.filter(m => m.id !== message.id));
      setShowDeleteMenu(null);
      await cargarChats();
    } catch (error) {
      console.error("Error eliminando mensaje para todos:", error);
      alert("Error al eliminar el mensaje");
    }
  };

  // Eliminar chat
  const handleDeleteChat = async (chat: ChatType) => {
    try {
      await eliminarChat(chat.id);
      setChats(prev => prev.filter(c => c.id !== chat.id));
      setShowChatMenu(null);
      
      if (selectedChat?.id === chat.id) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error eliminando chat:", error);
      alert("Error al eliminar el chat");
    }
  };

  // Renderizar mensajes con archivos
  const renderMessageContent = (msg: MessageType) => {
    if (msg.tipo === "texto") {
      return msg.text;
    } else if (msg.tipo === "imagen" && msg.archivo_url) {
      return (
        <div className="message-file">
          <img 
            src={`http://localhost:8000${msg.archivo_url}`} 
            alt="Imagen enviada" 
            className="chat-image"
            onClick={() => window.open(`http://localhost:8000${msg.archivo_url}`, '_blank')}
          />
          <div className="file-caption">{msg.text}</div>
        </div>
      );
    } else if (msg.tipo === "video" && msg.archivo_url) {
      return (
        <div className="message-file">
          <video 
            controls 
            className="chat-video"
            src={`http://localhost:8000${msg.archivo_url}`}
          >
            Tu navegador no soporta el elemento video.
          </video>
          <div className="file-caption">{msg.text}</div>
        </div>
      );
    } else {
      return <div className="message-file">📎 Archivo no disponible</div>;
    }
  };

  const handleStartChat = async (amigo: User) => {
    try {
      const { id_chat } = await crearObtenerChat(amigo.id_usuario);
      
      const chatExistente = chats.find(chat => chat.id === id_chat);
      
      if (chatExistente) {
        setSelectedChat(chatExistente);
      } else {
        const nuevoChat: ChatType = {
          id: id_chat,
          username: amigo.nombre_usuario,
          nombre_completo: amigo.nombre_completo,
          foto_perfil: amigo.foto_perfil || null,
          lastMessage: "Iniciar conversación",
          color: "#6C63FF",
          ultima_actividad: new Date().toISOString(),
          no_leidos: 0
        };
        setSelectedChat(nuevoChat);
        setChats(prev => [nuevoChat, ...prev]);
      }
      
      setShowFriendsModal(false);
    } catch (error) {
      console.error("Error al iniciar chat:", error);
    }
  };

  // Guardar configuración
  const handleSaveConfig = async () => {
    if (!selectedChat) return;

    try {
      await configurarChat(selectedChat.id, chatConfig);
      setShowConfigModal(false);
      
      setSelectedChat(prev => prev ? {...prev, color: chatConfig.color_burbuja} : null);
      
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? {...chat, color: chatConfig.color_burbuja}
          : chat
      ));
      
    } catch (error) {
      console.error("Error guardando configuración:", error);
      alert("Error al guardar la configuración. Intenta nuevamente.");
    }
  };

  // Obtener estilo de fondo del chat
 // Actualizar la función getChatBackground
const getChatBackground = () => {
  if (chatConfig.fondo_chat === "personalizado" && chatConfig.fondo_personalizado) {
    return {
      backgroundImage: `url(http://localhost:8000${chatConfig.fondo_personalizado})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }

  switch (chatConfig.fondo_chat) {
    case "light-gray": 
      return { backgroundColor: "#f5f5f5" };
    case "dark": 
      return { backgroundColor: "#1a1a1a" };
    case "blue": 
      return { backgroundColor: "#0d47a1" };
    case "green": 
      return { backgroundColor: "#1b5e20" };
    case "purple": 
      return { backgroundColor: "#4a148c" };
    case "pink": 
      return { backgroundColor: "#880e4f" };
    case "orange": 
      return { backgroundColor: "#e65100" };
    case "gradient-blue":
      return { 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
      };
    case "gradient-sunset":
      return { 
        background: "linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)" 
      };
    case "gradient-forest":
      return { 
        background: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)" 
      };
    case "pattern-dots":
      return { 
        backgroundColor: "#f0f0f0",
        backgroundImage: `radial-gradient(#6C63FF 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      };
    case "pattern-grid":
      return { 
        backgroundColor: "#ffffff",
        backgroundImage: `
          linear-gradient(#e0e0e0 1px, transparent 1px),
          linear-gradient(90deg, #e0e0e0 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      };
    default: 
      return { backgroundColor: "#ffffff" };
  }
};

  return (
    <div className="messages-layout">
      {/* Panel izquierdo - Lista de chats */}
      <div className="sidebar-chats">
        <div className="chats-header">
          <div className="chats-header-top">
            <button 
              className="btn-home"
              onClick={goToHome}
              title="Ir a la página principal"
            >
              🏠
            </button>
            <h2>Mensajes</h2>
          </div>
          <button 
            className="btn-new-chat"
            onClick={() => setShowFriendsModal(true)}
          >
            + Nuevo chat
          </button>
        </div>
        
        <div className="chats-list" ref={chatListRef}>
          {loading ? (
            <div className="loading-chats">Cargando chats...</div>
          ) : chats.length === 0 ? (
            <div className="no-chats">
              <p>No tienes chats activos</p>
              <button 
                className="btn-start-chat"
                onClick={() => setShowFriendsModal(true)}
              >
                Iniciar una conversación
              </button>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-card ${selectedChat?.id === chat.id ? "active" : ""}`}
                style={{ borderLeftColor: chat.color }}
                onClick={() => setSelectedChat(chat)}
                onContextMenu={(e) => handleChatContextMenu(e, chat)}
              >
                <div className="chat-avatar">
                  {chat.foto_perfil ? (
                    <img src={chat.foto_perfil} alt={chat.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {chat.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {chat.no_leidos > 0 && (
                    <span className="unread-badge">{chat.no_leidos}</span>
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-header-info">
                    <span className="chat-user">@{chat.username}</span>
                    <span className="chat-time">
                      {new Date(chat.ultima_actividad).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <span className="chat-last">{chat.lastMessage}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel central - Chat */}
      <div 
        className="chat-panel"
        style={getChatBackground()}
      >
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="user-avatar">
                  {selectedChat.foto_perfil ? (
                    <img src={selectedChat.foto_perfil} alt={selectedChat.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {selectedChat.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <span className="chat-header-user">@{selectedChat.username}</span>
                  <span className="user-status">En línea</span>
                </div>
              </div>
              <div className="chat-actions">
                <button 
                  className="btn-home-mobile"
                  onClick={goToHome}
                  title="Ir a la página principal"
                >
                  🏠
                </button>
                <button 
                  className="btn-config"
                  onClick={() => setShowConfigModal(true)}
                  title="Configurar chat"
                >
                  ⚙️
                </button>
              </div>
            </div>

            <div className="chat-body">
              {messages.length === 0 ? (
                <div className="empty-chat-messages">
                  <p>No hay mensajes aún</p>
                  <p>Envía un mensaje para iniciar la conversación</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${msg.sender === "yo" ? "bubble-me" : "bubble-other"}`}
                    style={{ 
                      backgroundColor: msg.sender === "yo" ? chatConfig.color_burbuja : undefined 
                    }}
                    onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                  >
                    {msg.sender === "otro" && (
                      <div className="message-sender">
                        <strong>@{msg.sender_username}</strong>
                      </div>
                    )}
                    <div className="message-content">
                      {renderMessageContent(msg)}
                    </div>
                    <div className="message-time">
                      {new Date(msg.fecha).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Previsualización de archivo */}
            {filePreview && (
              <div className="file-preview">
                <div className="file-preview-header">
                  <span>Vista previa - {filePreview.type === 'imagen' ? 'Imagen' : 'Video'}</span>
                  <button 
                    className="btn-cancel-preview"
                    onClick={cancelFilePreview}
                    title="Cancelar"
                  >
                    ×
                  </button>
                </div>
                <div className="file-preview-content">
                  {filePreview.type === 'imagen' ? (
                    <img src={filePreview.url} alt="Vista previa" className="preview-image" />
                  ) : (
                    <video src={filePreview.url} controls className="preview-video" />
                  )}
                </div>
                <div className="file-preview-info">
                  <span>{filePreview.file.name}</span>
                  <span>{Math.round(filePreview.file.size / 1024)} KB</span>
                </div>
              </div>
            )}

            <div className="chat-input-box">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*,video/*"
              />
              <button 
                className="btn-attach"
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivo"
                disabled={uploading}
              >
                {uploading ? "⏳" : "📎"}
              </button>
              <input
                type="text"
                placeholder={filePreview ? "Escribe un mensaje opcional..." : "Escribe un mensaje..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={uploading}
              />
              <button 
                onClick={handleSend} 
                disabled={(newMessage.trim() === "" && !filePreview) || uploading}
                className={filePreview ? "btn-send-with-file" : ""}
              >
                {uploading ? "Enviando..." : filePreview ? "Enviar archivo" : "Enviar"}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-chat-content">
              <button 
                className="btn-home-large"
                onClick={goToHome}
                title="Ir a la página principal"
              >
                🏠
              </button>
              <h3>Selecciona un chat</h3>
              <p>Elige una conversación de la lista o inicia una nueva</p>
              <button 
                className="btn-start-conversation"
                onClick={() => setShowFriendsModal(true)}
              >
                Iniciar nueva conversación
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menú contextual para mensajes */}
      {showDeleteMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: showDeleteMenu.y,
            left: showDeleteMenu.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-content">
            <button 
              className="context-menu-item"
              onClick={() => handleDeleteMessage(showDeleteMenu.message)}
            >
              Eliminar para mí
            </button>
            {showDeleteMenu.message.sender === "yo" && (
              <button 
                className="context-menu-item"
                onClick={() => handleDeleteMessageForEveryone(showDeleteMenu.message)}
              >
                Eliminar para todos
              </button>
            )}
            <button 
              className="context-menu-item"
              onClick={() => setShowDeleteMenu(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Menú contextual para chats */}
      {showChatMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: showChatMenu.y,
            left: showChatMenu.x,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-content">
            <button 
              className="context-menu-item delete"
              onClick={() => handleDeleteChat(showChatMenu.chat)}
            >
              Eliminar chat
            </button>
            <button 
              className="context-menu-item"
              onClick={() => setShowChatMenu(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de amigos para nuevo chat */}
      {showConfigModal && (
  <div className="modal-overlay">
    <div className="modal-content config-modal">
      <div className="modal-header">
        <h3>Configuración del chat</h3>
        <button 
          className="btn-close"
          onClick={() => setShowConfigModal(false)}
        >
          ×
        </button>
      </div>
      
      <div className="config-options">
        {/* Sección: Fondo del chat */}
        <div className="config-section">
          <h4>Fondo del chat</h4>
          
          {/* Fondos predefinidos */}
          <div className="config-group">
            <label>Fondo predefinido:</label>
            <select 
              value={chatConfig.fondo_chat}
              onChange={(e) => setChatConfig(prev => ({
                ...prev,
                fondo_chat: e.target.value
              }))}
            >
              <option value="default">Predeterminado (Blanco)</option>
              <option value="light-gray">Gris claro</option>
              <option value="dark">Oscuro</option>
              <option value="blue">Azul</option>
              <option value="green">Verde</option>
              <option value="purple">Púrpura</option>
              <option value="pink">Rosa</option>
              <option value="orange">Naranja</option>
              <option value="gradient-blue">Gradiente Azul</option>
              <option value="gradient-sunset">Gradiente Atardecer</option>
              <option value="gradient-forest">Gradiente Bosque</option>
              <option value="pattern-dots">Patrón: Puntos</option>
              <option value="pattern-grid">Patrón: Cuadrícula</option>
            </select>
          </div>

          {/* Fondo personalizado */}
          <div className="config-group">
            <label>Fondo personalizado:</label>
            <div className="custom-background-options">
              <input
                type="file"
                ref={backgroundInputRef}
                style={{ display: 'none' }}
                onChange={handleBackgroundSelect}
                accept="image/*"
              />
              <button 
                className="btn-upload-background"
                onClick={() => backgroundInputRef.current?.click()}
                disabled={uploadingBackground}
              >
                {uploadingBackground ? "Subiendo..." : "Subir imagen"}
              </button>
              
              {(chatConfig.fondo_personalizado || backgroundPreview) && (
                <button 
                  className="btn-remove-background"
                  onClick={handleRemoveBackground}
                >
                  Eliminar fondo personalizado
                </button>
              )}
            </div>
            
            {/* Vista previa del fondo personalizado */}
            {(chatConfig.fondo_personalizado || backgroundPreview) && (
              <div className="background-preview">
                <p>Vista previa del fondo:</p>
                <div 
                  className="preview-container"
                  style={{
                    backgroundImage: `url(${backgroundPreview || `http://localhost:8000${chatConfig.fondo_personalizado}`})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <small>Imagen se ajustará automáticamente al chat</small>
              </div>
            )}
          </div>

          {/* Vista previa de fondos predefinidos */}
          <div className="background-previews">
            <p>Vista previa de fondos:</p>
            <div className="preview-grid">
              {[
                { value: "default", name: "Predeterminado", color: "#ffffff" },
                { value: "light-gray", name: "Gris", color: "#f5f5f5" },
                { value: "dark", name: "Oscuro", color: "#1a1a1a" },
                { value: "blue", name: "Azul", color: "#0d47a1" },
                { value: "green", name: "Verde", color: "#1b5e20" },
                { value: "purple", name: "Púrpura", color: "#4a148c" }
              ].map(bg => (
                <div
                  key={bg.value}
                  className={`preview-item ${chatConfig.fondo_chat === bg.value ? 'selected' : ''}`}
                  onClick={() => setChatConfig(prev => ({ ...prev, fondo_chat: bg.value }))}
                  style={{ backgroundColor: bg.color }}
                  title={bg.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sección: Colores de mensajes */}
        <div className="config-section">
          <h4>Colores de mensajes</h4>
          
          <div className="config-group">
            <label>Color de tus mensajes:</label>
            <div className="color-picker-container">
              <input
                type="color"
                value={chatConfig.color_burbuja}
                onChange={(e) => setChatConfig(prev => ({
                  ...prev,
                  color_burbuja: e.target.value
                }))}
                className="color-picker"
              />
              <span className="color-value">{chatConfig.color_burbuja}</span>
            </div>
          </div>

          {/* Colores predefinidos */}
          <div className="config-group">
            <label>Colores sugeridos:</label>
            <div className="color-presets">
              {[
                "#6C63FF", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
                "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE"
              ].map(color => (
                <div
                  key={color}
                  className="color-preset"
                  style={{ backgroundColor: color }}
                  onClick={() => setChatConfig(prev => ({ ...prev, color_burbuja: color }))}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sección: Opciones de visualización */}
        <div className="config-section">
          <h4>Opciones de visualización</h4>
          
          <div className="config-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                // Aquí puedes agregar más opciones de configuración
                onChange={() => {}}
              />
              Mostrar hora en todos los mensajes
            </label>
          </div>

          <div className="config-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                onChange={() => {}}
              />
              Notificaciones de mensajes nuevos
            </label>
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button 
          className="btn-cancel"
          onClick={() => {
            setShowConfigModal(false);
            setBackgroundPreview(null);
            cargarConfiguracionChat(); // Recargar configuración original
          }}
        >
          Cancelar
        </button>
        <button 
          className="btn-save"
          onClick={handleSaveConfig}
        >
          Guardar configuración
        </button>
      </div>
    </div>
  </div>
)}

      {/* Panel derecho de iconos - ELIMINADO para simplificar */}
    </div>
  );
};

export default Messages;