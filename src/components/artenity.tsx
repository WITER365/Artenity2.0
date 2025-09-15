import React from "react";
import "../styles/artenity.css";
import { Link } from "react-router-dom";
import artenityimg from "../assets/img/artenity.png";
import libroImg from "../assets/img/libro.png";
import musicaImg from "../assets/img/musica.png";
import pinturaImg from "../assets/img/pintura.png";
import danzaImg from "../assets/img/danza.png";
import cineImg from "../assets/img/cine.png";

const Artenity: React.FC = () => {
  return (
    <div
      className="fullscreen-bg"
       style={{
       width: "100vw",
       minHeight: "100vh",
       background: `url(${artenityimg}) no-repeat center center`,
       backgroundSize: "cover",
     }}
      >
      <div className="header-text">ARTENITY</div>

      <div className="icons-row">
        <div className="icon libro">
          <img src={libroImg} alt="Libro" />
        </div>
        <div className="icon musica">
          <img src={musicaImg} alt="Música" />
        </div>
        <div className="icon pintura">
          <img src={pinturaImg} alt="Pintura" />
        </div>
        <div className="icon danza">
          <img src={danzaImg} alt="Danza" />
        </div>
        <div className="icon cine">
          <img src={cineImg} alt="Cine" />
        </div>
      </div>

      <div className="banner-buttons">
        <button className="banner-button">LO MÁS VISTO SOBRE EL ARTE</button>
        <Link to="/login" className="bannor-button">INGRESAR</Link>
        <Link to="/register" className="bannar-button">REGISTRAR</Link>
      </div>
    </div>
  );
};

export default Artenity;