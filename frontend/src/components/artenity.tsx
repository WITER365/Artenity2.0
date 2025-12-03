import React from "react";
import { useNavigate } from "react-router-dom"; // Importa useNavigate
import "../styles/artenity.css";
import { Link } from "react-router-dom";
import artenityimg from "../assets/img/artenity.png";
import libroImg from "../assets/img/libro.png";
import musicaImg from "../assets/img/musica.png";
import pinturaImg from "../assets/img/pintura.png";
import danzaImg from "../assets/img/danza.png";
import cineImg from "../assets/img/cine.png";

const Artenity: React.FC = () => {
  const navigate = useNavigate(); // Hook para navegación

  // Función para manejar clics en iconos
  const handleIconClick = (categoryName: string) => {
    navigate(`/busqueda?categoria=${encodeURIComponent(categoryName)}`);
  };

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
        <div 
          className="icon libro" 
          onClick={() => handleIconClick("Literatura")}
          data-name="Literatura"
        >
          <img src={libroImg} alt="Libro" />
        </div>
        <div 
          className="icon musica" 
          onClick={() => handleIconClick("Música")}
          data-name="Música"
        >
          <img src={musicaImg} alt="Música" />
        </div>
        <div 
          className="icon pintura" 
          onClick={() => handleIconClick("Pintura")}
          data-name="Pintura"
        >
          <img src={pinturaImg} alt="Pintura" />
        </div>
        <div 
          className="icon danza" 
          onClick={() => handleIconClick("Danza")}
          data-name="Danza"
        >
          <img src={danzaImg} alt="Danza" />
        </div>
        <div 
          className="icon cine" 
          onClick={() => handleIconClick("Cine")}
          data-name="Cine"
        >
          <img src={cineImg} alt="Cine" />
        </div>
      </div>

      <div className="banner-buttons">
        <button className="banner-button">LO QUE SUCEDE CON EL MUNDO DEL ARTE</button>
        <Link to="/login" className="bannor-button">INGRESAR</Link>
        <Link to="/register" className="bannar-button">REGISTRAR</Link>
      </div>
    </div>
  );
};

export default Artenity;