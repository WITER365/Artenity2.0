import React, { useState } from "react";
import "../styles/register.css";
import { Link } from "react-router-dom";
import { registerUsuario } from "../services/api";

// Imágenes decorativas
import brushImg from "../assets/img/loginmusic.png";
import logoImg from "../assets/img/logo.png";

const Register: React.FC = () => {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo_electronico: "",
    contrasena: "",
    fecha_nacimiento: "",
    genero: "",
    tipo_arte_preferido: "",
    telefono: "",
    nombre_usuario: "",
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevo = await registerUsuario(form);
      setMensaje(`Usuario registrado: ${nuevo.nombre_usuario}`);
      setForm({
        nombre: "",
        apellido: "",
        correo_electronico: "",
        contrasena: "",
        fecha_nacimiento: "",
        genero: "",
        tipo_arte_preferido: "",
        telefono: "",
        nombre_usuario: "",
      });
    } catch (error: any) {
      setMensaje(error.message || "Error al registrar usuario");
    }
  };

  return (
    <div>
      {/* Pinceladas decorativas */}
      <img src={brushImg} alt="" aria-hidden="true" className="brush top-left" />
      <img src={brushImg} alt="" aria-hidden="true" className="brush bottom-right" />

      <div className="registro-container">
        {/* Cabecera */}
        <div className="header">
          <img src={logoImg} alt="Logo" className="logo" />
          <div className="capsula-titulo">REGISTRO</div>
        </div>

        {/* Formulario */}
        <form className="registro-form" onSubmit={handleSubmit}>
          <div className="campo-doble">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <label>Fecha de nacimiento</label>
          <input
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={handleChange}
            required
          />

          <label>Género</label>
          <div className="campo-genero">
            <label>
              <input
                type="radio"
                name="genero"
                value="Mujer"
                checked={form.genero === "Mujer"}
                onChange={handleChange}
              />{" "}
              Mujer
            </label>
            <label>
              <input
                type="radio"
                name="genero"
                value="Hombre"
                checked={form.genero === "Hombre"}
                onChange={handleChange}
              />{" "}
              Hombre
            </label>
            <label>
              <input
                type="radio"
                name="genero"
                value="Personalizado"
                checked={form.genero === "Personalizado"}
                onChange={handleChange}
              />{" "}
              Personalizado
            </label>

          </div >
         <input
            type="tex"
            name="especifique_genero"
            placeholder=" Especifique su género"
            value={form.genero} 
            onChange={handleChange}
            required
          />
            
          
          <input
            type="text"
            name="correo_electronico"
            placeholder="Correo electrónico"
            value={form.correo_electronico}
            onChange={handleChange}
            required
          />

          <select
            name="tipo_arte_preferido"
            value={form.tipo_arte_preferido}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione una categoría de arte</option>
            <optgroup label="Artes visuales">
              <option value="pintura">Pintura</option>
              <option value="escultura">Escultura</option>
              <option value="dibujo">Dibujo</option>
              <option value="grabado">Grabado</option>
              <option value="fotografia">Fotografía</option>
              <option value="cine">Cine</option>
              <option value="arquitectura">Arquitectura</option>
              <option value="diseno">Diseño</option>
            </optgroup>
            <optgroup label="Artes escénicas">
              <option value="teatro">Teatro</option>
              <option value="danza">Danza</option>
              <option value="opera">Ópera</option>
              <option value="ballet">Ballet</option>
              <option value="circo">Circo</option>
              <option value="mimica">Mímica</option>
            </optgroup>
            <optgroup label="Artes musicales">
              <option value="musica_clasica">Música clásica</option>
              <option value="jazz">Jazz</option>
              <option value="rock">Rock</option>
              <option value="pop">Pop</option>
              <option value="folclorica">Folclórica</option>
              <option value="electronica">Electrónica</option>
            </optgroup>
            <optgroup label="Artes literarias">
              <option value="poesia">Poesía</option>
              <option value="narrativa">Narrativa</option>
              <option value="drama">Drama</option>
              <option value="ensayo">Ensayo</option>
            </optgroup>
            <optgroup label="Artes digitales y multimedia">
              <option value="arte_digital">Arte digital</option>
              <option value="animacion">Animación</option>
              <option value="videojuegos">Videojuegos</option>
            </optgroup>
            <optgroup label="Artes tradicionales y populares">
              <option value="artesania">Artesanía</option>
              <option value="ceramica">Cerámica</option>
              <option value="textiles">Textiles</option>
              <option value="joyeria">Joyería</option>
              <option value="orfebreria">Orfebrería</option>
            </optgroup>
          </select>

          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
          />

          <input
            type="text"
            name="nombre_usuario"
            placeholder="Nombre de usuario"
            value={form.nombre_usuario}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="contrasena"
            placeholder="Contraseña"
            value={form.contrasena}
            onChange={handleChange}
            required
          />

          <button type="submit" className="btn-registro">
            Regístrate!!
          </button>
        </form>

        {mensaje && <p>{mensaje}</p>}

        {/* Enlace al login */}
        <p className="cuenta">
          <Link to="/login">¿Ya tienes una cuenta?</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
