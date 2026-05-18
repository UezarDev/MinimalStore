import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import api from "../api/axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useSession();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/login", { email, password });
      const { user, token } = response.data;
      login(user, token);
      navigate("/catalogo");
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión. Intenta de nuevo.");
    }
  };

  return (
    <>
      <hgroup>
        <h1>Inicio de Sesión</h1>
        <p>Ingresa tus credenciales para acceder a la galería privada</p>
      </hgroup>

      <form onSubmit={handleSubmit} className="card">
        {error && <p style={{ color: "var(--red-color, #ff4d4d)", marginBottom: "1rem", fontWeight: "bold" }}>{error}</p>}
        <label htmlFor="email">
          Email
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label htmlFor="password">
          Contraseña
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="secondary" style={{ width: '100%', marginTop: '1rem' }}>
          Iniciar Sesión
        </button>
        
        <footer>
          ¿Aún no tienes cuenta? <Link to="/registro">Registro</Link>
        </footer>
      </form>
    </>
  );
};

export default Login;
