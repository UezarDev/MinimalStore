import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import api from "../api/axios";

const CreatePublication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category_id: "",
    description: "",
    location: "Santiago"
  });
  const [images, setImages] = useState([""]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageInput = () => {
    setImages([...images, ""]);
  };

  const removeImageInput = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages.length ? newImages : [""]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (categories.length === 0) {
      setError("No se pueden crear publicaciones si no hay categorías creadas en la base de datos.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        price: parseInt(formData.price, 10),
        category_id: parseInt(formData.category_id, 10),
        stock: 1,
        images: images
          .filter(url => url.trim() !== "")
          .map((url, index) => ({
            url: url.trim(),
            position: index + 1
          }))
      };
      
      await api.post("/products", payload);
      navigate("/perfil");
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la publicación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <hgroup>
        <h1>Nueva Publicación</h1>
        <p>Completa los datos para vender un artículo</p>
      </hgroup>

      <form onSubmit={handleSubmit} className="card wide-form">
        {error && <p style={{ color: "var(--red-color, #ff4d4d)", marginBottom: "1rem", fontWeight: "bold" }}>{error}</p>}
        {categories.length === 0 && (
          <div style={{ background: "rgba(255,193,7,0.2)", border: "1px solid #ffc107", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <strong>Aviso:</strong> No se han detectado categorías en la base de datos. Recuerda insertar categorías ejecutando el script en Neon (ej. Muebles, Tecnología, Decoración).
          </div>
        )}
        <div className="form-group">
          <label htmlFor="name">
            Título del Artículo
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <fieldset className="form-group">
          <label htmlFor="price">
            Precio ($)
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="category">
            Categoría
            <select
              id="category"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Seleccione una categoría...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <div className="form-group">
          <label>URLs de Imágenes</label>
          {images.map((imgUrl, index) => (
            <div key={index} style={{ marginBottom: '0.5rem' }}>
              <input
                type="url"
                placeholder="https://..."
                value={imgUrl}
                onChange={(e) => handleImageChange(index, e.target.value)}
                required
              />
            </div>
          ))}
          <button 
            type="button" 
            onClick={addImageInput}
            style={{ background: 'transparent', color: 'var(--pink-color)', padding: '0.5rem 0', border: 'none' }}
          >
            <PlusCircle size={16} /> Añadir otra imagen
          </button>

          {/* Vista Previa de Imágenes en Tiempo Real */}
          {images.some(url => url.trim() !== "") && (
            <div style={{ marginTop: '1.5rem', display: 'block' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                Vista Previa de Imágenes
              </span>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '1rem',
                background: 'rgba(0,0,0,0.2)',
                padding: '1rem',
                borderRadius: 'var(--radius-lg)'
              }}>
                {images.map((imgUrl, index) => {
                  if (!imgUrl.trim()) return null;
                  return (
                    <div key={index} style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '2px solid var(--pink-color)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                    }}>
                      <img 
                        src={imgUrl} 
                        alt={`Vista Previa ${index + 1}`}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150?text=Error+Carga";
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '0.7rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 'bold'
                      }}>
                        #{index + 1}
                      </span>
                      
                      {/* Botón de Eliminar flotante */}
                      <div
                        onClick={() => removeImageInput(index)}
                        className="delete-thumb-btn"
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          background: 'rgba(239, 68, 68, 0.95)',
                          color: 'white',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          zIndex: 10,
                          transition: 'transform 0.2s ease, background-color 0.2s ease'
                        }}
                      >
                        <Trash2 size={15} color="white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Descripción
          <textarea
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
          </label>
        </div>

        <nav>
          <button type="button" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="secondary" disabled={loading}>
            {loading ? "Publicando..." : "Publicar Artículo"}
          </button>
        </nav>
      </form>
    </>
  );
};

export default CreatePublication;
