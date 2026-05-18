import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import api from "../api/axios";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [countryCode, setCountryCode] = useState("+56");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  
  const { login } = useSession();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Combinar código de país y número
      const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : null;
      const payload = { ...formData, phone: fullPhone };

      // 1. Registrar usuario
      await api.post("/register", payload);
      // 2. Iniciar sesión automáticamente
      const loginRes = await api.post("/login", { email: formData.email, password: formData.password });
      const { user, token } = loginRes.data;
      login(user, token);
      navigate("/catalogo");
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrarse. Intenta de nuevo.");
    }
  };

  return (
    <>
      <hgroup>
        <h1>Registro de Usuario</h1>
        <p>Crea una cuenta para empezar a publicar</p>
      </hgroup>

      <form onSubmit={handleSubmit} className="card">
        {error && <p style={{ color: "var(--red-color, #ff4d4d)", marginBottom: "1rem", fontWeight: "bold" }}>{error}</p>}
        <label htmlFor="name">
          Nombre Completo
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="email">
          Email
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="phone">
          Teléfono
          <div className="phone">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              <option value="+56">🇨🇱 +56</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+34">🇪🇸 +34</option>
              <option value="+52">🇲🇽 +52</option>
              <option value="+54">🇦🇷 +54</option>
              <option value="+57">🇨🇴 +57</option>
              <option value="+51">🇵🇪 +51</option>
            </select>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Ej: 9 1234 5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </label>

        <label htmlFor="password">
          Contraseña
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" className="secondary" style={{ width: '100%', marginTop: '1rem' }}>
          Crear cuenta y entrar
        </button>
        
        <footer>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </footer>
      </form>
    </>
  );
};

export default Register;
