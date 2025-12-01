import React, { useState } from "react";
import "../styles/login.css";
import { Link, useNavigate } from "react-router-dom";
import brushImg from "../assets/img/loginmusic.png";
import logoImg from "../assets/img/logo.png";
import googleImg from "../assets/img/google.png";
import facebookImg from "../assets/img/facebook.png";
import discordImg from "../assets/img/discord.png";
import instagramImg from "../assets/img/instagram.png";
import { loginUsuario } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [correo_electronico, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await loginUsuario(correo_electronico, contrasena);

      if (res && res.token) {
        login(res.token, res.usuario); 
        navigate("/principal");  
      } else {
        alert("❌ No se recibió token válido. Verifica el backend.");
      }
    } catch {
      alert("❌ Credenciales incorrectas o error de conexión");
    }
  };

  return (
    <div>
      {/* Pinceladas decorativas */}
      <img src={brushImg} alt="Decoración" className="brush top-left" />
      <img src={brushImg} alt="Decoración" className="brush bottom-right" />

      {/* Contenedor Login */}
      <div className="login-container">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="correo">CORREO ELECTRÓNICO</label>
            <input
              type="email"
              name="correo_electronico"
              placeholder="CORREO ELECTRÓNICO"
              value={correo_electronico}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="contrasena">CONTRASEÑA</label>
            <input
              type="password"
              name="contrasena"
              placeholder="CONTRASEÑA"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">
            Iniciar Sesión!!
          </button>
        </form>

        <div className="header-box">
          <h1>ARTENITY</h1>
          <img src={logoImg} alt="Logo" className="logo" />
        </div>

        <div className="social-icons">
          <img src={googleImg} alt="Google" />
          <img src={facebookImg} alt="Facebook" />
          <img src={discordImg} alt="Discord" />
          <img src={instagramImg} alt="Instagram" />
        </div>

        <p className="register">
          ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
          <br />
          <a href="/forgot-password">Olvidé mi contraseña</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
