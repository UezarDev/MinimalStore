import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, User, Heart, PackageOpen } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { usePopup } from "../context/PopupContext";
import api from "../api/axios";

const Gallery = () => {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useSession();
  const { showAlert } = usePopup();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data);

        if (user) {
          const favsResponse = await api.get("/favorites");
          setFavorites(favsResponse.data);
        }
      } catch (err) {
        setError("Error al cargar el catálogo. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryData();
  }, [user]);

  const handleToggleFavorite = async (e, productId) => {
    e.preventDefault(); // Prevent navigating to ProductDetail

    if (!user) {
      showAlert("Debes iniciar sesión para agregar favoritos.");
      navigate("/login");
      return;
    }

    const isFavorited = favorites.some(f => f.product_id === productId || f.id === productId);

    try {
      if (isFavorited) {
        // Find the actual favorite ID from the user's favorites list
        const favItem = favorites.find(f => f.product_id === productId || f.id === productId);
        // Sometimes favItem.id is the product id if the backend didn't alias it. Let's send the product ID for safety based on backend route
        await api.delete(`/favorites/${productId}`);
        setFavorites(favorites.filter(f => f.product_id !== productId && f.id !== productId));
      } else {
        await api.post("/favorites", { product_id: productId });
        // Optimistically add it
        setFavorites([...favorites, { product_id: productId, id: productId }]);
      }
    } catch (err) {
      showAlert("Error al actualizar favoritos.");
    }
  };

  if (loading) return <p style={{ textAlign: "center", padding: "4rem" }}>Cargando catálogo...</p>;
  if (error) return <p style={{ textAlign: "center", padding: "4rem", color: "var(--red-color, #ff4d4d)" }}>{error}</p>;

  if (products.length === 0) {
    return (
      <>
        <header>
          <hgroup>
            <h1>Catálogo</h1>
            <p>Explora las publicaciones de otros usuarios</p>
          </hgroup>
          <Link to="/publicar" role="button" className="secondary">
            <PlusCircle size={18} /> Nueva Publicación
          </Link>
        </header>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'var(--surface-color)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '500px',
          margin: '4rem auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(217, 70, 239, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            color: 'var(--pink-color)'
          }}>
            <PackageOpen size={40} />
          </div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem', color: 'var(--text-main)' }}>Catálogo Vacío</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
            Actualmente no hay nada en la galería. ¡Puedes añadir la primera publicación para inaugurar la tienda!
          </p>
          <Link to="/publicar" role="button" className="secondary">
            Crear Publicación
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <header>
        <hgroup>
          <h1>Catálogo</h1>
          <p>Explora las publicaciones de otros usuarios</p>
        </hgroup>
        <Link to="/publicar" role="button" className="secondary">
          <PlusCircle size={18} /> Nueva Publicación
        </Link>
      </header>

      <section>
        <div>
          {products.map((product) => {
            const isFavorited = favorites.some(f => f.product_id === product.id || f.id === product.id);

            return (
              <Link to={`/publicacion/${product.id}`} key={product.id}>
                <article className="card">
                  <figure>
                    <img 
                      src={product.images && product.images.length > 0 ? product.images[0].url : "https://via.placeholder.com/300"} 
                      alt={product.name} 
                    />
                    <nav style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <button 
                        className="icon-only" 
                        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                        onClick={(e) => handleToggleFavorite(e, product.id)}
                      >
                        <Heart 
                          size={20} 
                          color={isFavorited ? "#ff4d4d" : "white"} 
                          fill={isFavorited ? "#ff4d4d" : "transparent"} 
                        />
                      </button>
                    </nav>
                    <mark>$ {product.price.toLocaleString('es-CL')}</mark>
                  </figure>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.location}</small>
                    <footer>
                      <div>
                        <User size={14} color="var(--text-muted)" />
                      </div>
                      {product.seller_name || "Vendedor"}
                    </footer>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default Gallery;
