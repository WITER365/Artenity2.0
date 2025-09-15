import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Artenity from "./components/artenity";
import Login from "./components/login";
import Register from "./components/register";
import AdminPanel from "./components/AdminPanel";

function App() {
  const [userRole, setUserRole] = useState<string | null>(null);

  return (
    <Router>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<Artenity />} />

        {/* Login con props */}
        <Route path="/login" element={<Login setUserRole={setUserRole} />} />

        {/* Registro */}
        <Route path="/register" element={<Register />} />

        {/* Panel admin */}
        <Route
          path="/admin"
          element={userRole === "admin" ? <AdminPanel /> : <h2>No autorizado</h2>}
        />

        {/* Usuario normal */}
        <Route
          path="/user"
          element={userRole === "user" ? <h2>Bienvenido usuario normal</h2> : <h2>No autorizado</h2>}
        />
      </Routes>
    </Router>
  );
}

export default App;
