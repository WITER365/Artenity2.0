import React, { useState, useEffect, useRef } from "react";
import "../styles/Messages.css";
import { useNavigate } from "react-router-dom";
import { 
  obtenerChats, 
  obtenerMensajesChat, 
  enviarMensaje, 
  crearObtenerChat,
  configurarChat,
  obtenerAmigos,
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
  const [chatConfig, setChatConfig] = useState<ConfiguracionChat>({
    fondo_chat: "default",
    color_burbuja: "#6C63FF"
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar chats y amigos
  useEffect(() => {
    cargarChats();
    cargarAmigos();
  }, []);

  // Cargar mensajes cuando se selecciona un chat
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

  const cargarConfiguracionChat = () => {
    setChatConfig({
      fondo_chat: "default",
      color_burbuja: selectedChat?.color || "#6C63FF"
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if ((newMessage.trim() === "" && !filePreview) || !selectedChat) return;

    try {
      // Si hay un archivo para enviar, enviarlo primero
      if (filePreview) {
        await handleSendFile();
      }
      
      // Si hay mensaje de texto, enviarlo
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

      // Enviar archivo
      const mensajeEnviado = await enviarMensajeArchivo(selectedChat.id, filePreview.file, filePreview.type);
      
      // Agregar mensaje a la lista
      setMessages(prev => [...prev, {
        ...mensajeEnviado,
        sender: "yo",
        sender_id: parseInt(localStorage.getItem("usuario") ? JSON.parse(localStorage.getItem("usuario")!).id_usuario : "0"),
        sender_username: "yo",
        fecha: new Date().toISOString(),
        leido: false
      }]);
      
      // Limpiar previsualización
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

    // Determinar el tipo de archivo
    const esImagen = file.type.startsWith('image/');
    const esVideo = file.type.startsWith('video/');
    
    if (!esImagen && !esVideo) {
      alert("Solo se permiten imágenes y videos");
      return;
    }

    const tipo = esImagen ? "imagen" : "video";

    // Verificar tamaño del archivo (50MB máximo)
    if (file.size > 50 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 50MB");
      return;
    }

    // Crear URL para previsualización
    const url = URL.createObjectURL(file);
    
    setFilePreview({
      file,
      type: tipo,
      url
    });

    // Limpiar input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const handleSaveConfig = async () => {
    if (!selectedChat) return;

    try {
      await configurarChat(selectedChat.id, chatConfig);
      setShowConfigModal(false);
      setSelectedChat(prev => prev ? {...prev, color: chatConfig.color_burbuja} : null);
      await cargarChats();
    } catch (error) {
      console.error("Error guardando configuración:", error);
    }
  };

  const getChatBackground = () => {
    switch (chatConfig.fondo_chat) {
      case "dark": return "#1a1a1a";
      case "blue": return "#0d47a1";
      case "green": return "#1b5e20";
      default: return "#ffffff";
    }
  };

  return (
    <div className="messages-layout">
      {/* Panel izquierdo - Lista de chats */}
      <div className="sidebar-chats">
        <div className="chats-header">
          <h2>Mensajes</h2>
          <button 
            className="btn-new-chat"
            onClick={() => setShowFriendsModal(true)}
          >
            + Nuevo chat
          </button>
        </div>
        
        <div className="chats-list">
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
        style={{ backgroundColor: getChatBackground() }}
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

      {/* Modal de amigos para nuevo chat */}
      {showFriendsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Selecciona un amigo para chatear</h3>
              <button 
                className="btn-close"
                onClick={() => setShowFriendsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="friends-list">
              {amigos.length === 0 ? (
                <p>No tienes amigos agregados</p>
              ) : (
                amigos.map((amigo) => (
                  <div
                    key={amigo.id_usuario}
                    className="friend-item"
                    onClick={() => handleStartChat(amigo)}
                  >
                    <div className="friend-avatar">
                      {amigo.foto_perfil ? (
                        <img src={amigo.foto_perfil} alt={amigo.nombre_usuario} />
                      ) : (
                        <div className="avatar-placeholder">
                          {amigo.nombre_usuario.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="friend-info">
                      <span className="friend-username">@{amigo.nombre_usuario}</span>
                      <span className="friend-name">{amigo.nombre_completo}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración del chat */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-content">
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
              <div className="config-group">
                <label>Fondo del chat:</label>
                <select 
                  value={chatConfig.fondo_chat}
                  onChange={(e) => setChatConfig(prev => ({
                    ...prev,
                    fondo_chat: e.target.value
                  }))}
                >
                  <option value="default">Predeterminado</option>
                  <option value="dark">Oscuro</option>
                  <option value="blue">Azul</option>
                  <option value="green">Verde</option>
                </select>
              </div>
              <div className="config-group">
                <label>Color de tus mensajes:</label>
                <input
                  type="color"
                  value={chatConfig.color_burbuja}
                  onChange={(e) => setChatConfig(prev => ({
                    ...prev,
                    color_burbuja: e.target.value
                  }))}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowConfigModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveConfig}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel derecho de iconos */}
      <div className="sidebar-icons">
        <div className="icons-group">
          <i className="fas fa-bell"></i>
          <i className="fas fa-user"></i>
          <i className="fas fa-comments"></i>
          <i className="fas fa-cog"></i>
        </div>

        <div className="icons-group">
          <i className="fas fa-home" onClick={() => navigate("/principal")}></i>
          <i className="fas fa-search"></i>
          <i className="fas fa-th"></i>
          <i className="fas fa-image"></i>
        </div>
      </div>
    </div>
  );
};

export default Messages;