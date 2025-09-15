import { useEffect, useState } from "react";

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
}

const API_URL = "http://localhost:8000";

const AdminPanel: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const fetchUsuarios = async () => {
    const res = await fetch(`${API_URL}/usuarios/`);
    const data: Usuario[] = await res.json();
    setUsuarios(data);
  };

  const eliminarUsuario = async (id: number) => {
    await fetch(`${API_URL}/usuarios/${id}`, { method: "DELETE" });
    fetchUsuarios();
  };

  const editarUsuario = async (id: number, nuevoNombre: string, nuevoCorreo: string) => {
    await fetch(
      `${API_URL}/usuarios/${id}?nombre=${nuevoNombre}&correo=${nuevoCorreo}`,
      { method: "PUT" }
    );
    fetchUsuarios();
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <div>
      <h2>Panel de Administración</h2>
      <ul>
        {usuarios.map((u) => (
          <li key={u.id}>
            {u.nombre} - {u.correo}
            <button onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
            <button onClick={() => editarUsuario(u.id, "NuevoNombre", "nuevo@correo.com")}>
              Editar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;
