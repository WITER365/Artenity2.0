import React, { useState } from "react";
import "../styles/login.css";
import { Link, useNavigate } from "react-router-dom";

import brushImg from "../assets/img/loginmusic.png";
import logoImg from "../assets/img/logo.png";
import googleImg from "../assets/img/google.png";
import facebookImg from "../assets/img/facebook.png";
import discordImg from "../assets/img/discord.png";
import instagramImg from "../assets/img/instagram.png";

import { loginWithGoogle, loginWithFacebook } from "../services/firebase";
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

  // -----------------------------------------
  //  LOGIN GOOGLE
  // -----------------------------------------
 const googleLogin = async () => {
  try {
    const result = await loginWithGoogle();
    const email = result.user.email;

    if (!email) {
      alert("❌ No se pudo obtener el correo del usuario.");
      return;
    }

    const res = await loginUsuario(email, "firebase_oauth");
    login(res.token, res.usuario);
    navigate("/principal");
  } catch {
    alert("❌ Error iniciando sesión con Google");
  }
};

  // -----------------------------------------
  //  LOGIN FACEBOOK
  // -----------------------------------------
const facebookLogin = async () => {
  try {
    const result = await loginWithFacebook();
    const email = result.user.email;

    if (!email) {
      alert("❌ Facebook no devolvió un email válido.");
      return;
    }

    const res = await loginUsuario(email, "firebase_oauth");
    login(res.token, res.usuario);
    navigate("/principal");
  } catch {
    alert("❌ Error iniciando sesión con Facebook");
  }
};


  return (
    <div>
      <img src={brushImg} alt="Decoración" className="brush top-left" />
      <img src={brushImg} alt="Decoración" className="brush bottom-right" />

      <div className="login-container">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>CORREO ELECTRÓNICO</label>
            <input
              type="email"
              placeholder="CORREO ELECTRÓNICO"
              value={correo_electronico}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>CONTRASEÑA</label>
            <input
              type="password"
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
          <button 
                        className="logo-btn"
                        onClick={() => navigate("/")}
                      >
                        <img src={logoImg} alt="Logo Artenity" className="logo" />
                      </button>
        </div>

        {/* SOCIAL LOGIN */}
        <div className="social-icons">
          <img src={googleImg} onClick={googleLogin} alt="Google" />
          <img src={facebookImg} onClick={facebookLogin} alt="Facebook" />
          <img
            src={discordImg}
            onClick={() => (window.location.href = "/oauth/discord")}
            alt="Discord"
          />
          <img
            src={instagramImg}
            onClick={() => (window.location.href = "/oauth/instagram")}
            alt="Instagram"
          />
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
