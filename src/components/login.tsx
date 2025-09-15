import { useState } from "react";
import "../styles/login.css";
import { Link } from "react-router-dom";

// Imágenes
import brushImg from "../assets/img/loginmusic.png";
import logoImg from "../assets/img/logo.png";
import googleImg from "../assets/img/google.png";
import facebookImg from "../assets/img/facebook.png";
import appleImg from "../assets/img/apple.png";
import discordImg from "../assets/img/discord.png";
import instagramImg from "../assets/img/instagram.png";

interface LoginProps {
  setUserRole: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ setUserRole }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === "admin@admin.com" && password === "1234") {
      setUserRole("admin");
    } else {
      setUserRole("user");
    }
  };

  return (
    <div>
      {/* Pinceladas decorativas */}
      <img src={brushImg} alt="Decoración" className="brush top-left" />
      <img src={brushImg} alt="Decoración" className="brush bottom-right" />

      {/* Contenedor Login */}
      <div className="login-container">
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">EMAIL</label>
            <input
              type="text"
              id="email"
              placeholder="CORREO ELECTRÓNICO O TELÉFONO"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">PASSWORD</label>
            <input
              type="password"
              id="password"
              placeholder="CONTRASEÑA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-btn">
            Iniciar Sesión!!
          </button>
        </form>

        {/* Logo */}
        <div className="header-box">
          <h1>ARTENITY</h1>
          <img src={logoImg} alt="Logo" className="logo" />
        </div>

        {/* Iconos sociales */}
        <div className="social-icons">
          <img src={googleImg} alt="Google" />
          <img src={facebookImg} alt="Facebook" />
          <img src={appleImg} alt="Apple" />
          <img src={discordImg} alt="Discord" />
          <img src={instagramImg} alt="Instagram" />
        </div>

        <p className="register">
          ¿No tienes una cuenta? <Link to="/Register">Regístrate</Link>
          <br />
          <a href="/#">Olvidé mi contraseña</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
