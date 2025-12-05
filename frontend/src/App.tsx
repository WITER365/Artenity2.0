// frontend/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import GaleriaDeArte from './components/GaleriaDearte';
import Artenity from "./components/artenity";
import Login from "./components/login";
import Register from "./components/register";
import PaginaPrincipal from "./components/paginaprincipal";
import Perfil from "./components/perfil";
import Busqueda from "./components/busqueda";
import Messages from "./components/Menssages";
import PerfilUsuario from "./components/PerfilUsuario";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import CompartidosPage from "./components/CompartidosPage";
import CategoriasPage from "./components/CategoriasPage";
import Configuraciones from "./components/configuraciones";
function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* 🔹 Página inicial */}
      <Route path="/" element={<Artenity />} />

      {/* 🔹 Rutas públicas (acceso sin login) */}
      <Route path="/login" element={token ? <Navigate to="/principal" /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/principal" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* 🔹 IMPORTANTE: Búsqueda debe ser pública */}
      <Route path="/busqueda" element={<Busqueda />} />

      {/* 🔹 Rutas protegidas (requieren login) */}
      <Route path="/principal" element={token ? <PaginaPrincipal /> : <Navigate to="/login" />} />
      <Route path="/perfil" element={token ? <Perfil /> : <Navigate to="/login" />} />
      <Route path="/usuario/:id" element={token ? <PerfilUsuario /> : <Navigate to="/login" />} />
      <Route path="/mensajes" element={token ? <Messages /> : <Navigate to="/login" />} />
      <Route path="/categorias" element={token ? <CategoriasPage /> : <Navigate to="/login" />} />
      <Route path="/compartidos" element={token ? <CompartidosPage /> : <Navigate to="/login" />} />
      <Route path="/galeria" element={<GaleriaDeArte />} />

<Route path="/configuraciones" element={token ? <Configuraciones /> : <Navigate to="/login" />} />
      {/* Ruta fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;