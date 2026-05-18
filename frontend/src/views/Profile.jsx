import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, PlusCircle, Edit, Trash2, Heart, X, PackageOpen } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { usePopup } from "../context/PopupContext";
import api from "../api/axios";

const Profile = () => {
  const { user, login } = useSession();
  const { showAlert, showConfirm } = usePopup();
  const [activeTab, setActiveTab] = useState("publicaciones");
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingPost, setEditingPost] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Cargar todos los productos y filtrar por seller_id
        const productsRes = await api.get("/products");
        const userPosts = productsRes.data.filter(p => p.seller_id === user.id);
        setPosts(userPosts);

        // Cargar favoritos del usuario
        const favsRes = await api.get("/favorites");
        setFavorites(favsRes.data);
      } catch (err) {
        console.error("Error al cargar datos del perfil:", err);
        setError("Error al cargar la información del perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleRemoveFavorite = async (id) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (err) {
      showAlert("Error al eliminar de favoritos.");
    }
  };

  const handleEditClick = (post) => {
    setEditingPost({ ...post, title: post.name });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingPost,
        name: editingPost.title || editingPost.name,
        price: parseInt(editingPost.price, 10),
        category_id: parseInt(editingPost.category_id || editingPost.category, 10) || 1,
        images: editingPost.images
          .map(img => typeof img === 'object' ? img.url : img)
          .filter(url => typeof url === 'string' && url.trim() !== "")
          .map((url, idx) => ({
            url: url.trim(),
            position: idx + 1
          }))
      };

      await api.put(`/products/${editingPost.id}`, payload);
      setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...payload } : p));
      setEditingPost(null);
    } catch (err) {
      showAlert("Error al actualizar la publicación en la base de datos.");
    }
  };

  const handleDelete = (id) => {
    showConfirm("¿Estás seguro de eliminar esta publicación?", async () => {
      try {
        await api.delete(`/products/${id}`);
        setPosts(posts.filter(p => p.id !== id));
      } catch (err) {
        showAlert("Error al eliminar la publicación en el servidor.");
      }
    });
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/users/${user.id}`, editingProfile);
      login(res.data.user, localStorage.getItem('token'));
      setEditingProfile(null);
      showAlert("Perfil actualizado con éxito.", "¡Éxito!");
    } catch (err) {
      showAlert(err.response?.data?.message || "Error al actualizar el perfil.");
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Acceso Denegado</h2>
        <p>Debes iniciar sesión para ver tu perfil.</p>
        <Link to="/login" role="button" className="secondary">Ir al Login</Link>
      </div>
    );
  }

  if (loading) return <p style={{ textAlign: "center", padding: "4rem" }}>Cargando perfil...</p>;

  return (
    <>
      <header>
        <hgroup>
          <h1>Mi Perfil</h1>
          <p>Gestiona tu cuenta y tus publicaciones</p>
        </hgroup>
      </header>

      <div>
        <aside>
          <article className="card">
            <div>
              <User size={64} color="var(--text-muted)" />
            </div>
            <h2>{user?.name || "Usuario Demo"}</h2>
            <p>{user?.email || "usuario@ejemplo.com"}</p>
            {user?.phone && <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{user.phone}</p>}
            {user?.location && <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{user.location}</p>}
            <button onClick={() => setEditingProfile({ name: user?.name || '', phone: user?.phone || '', location: user?.location || '', avatar_url: user?.avatar_url || '' })}>
              <Edit size={16} color="var(--pink-color)" /> 
              <span>Editar Perfil</span>
            </button>
          </article>

          <article className="card">
            <ul>
              <li>
                <strong><User size={18} color="var(--pink-color)" /> {user?.name || "Usuario Demo"}</strong>
              </li>
              <li>
                <span>Publicaciones activas</span>
                <strong style={{ color: 'var(--text-main)' }}>{posts.length}</strong>
              </li>
              <li>
                <span>Artículos vendidos</span>
                <strong style={{ color: 'var(--text-main)' }}>0</strong>
              </li>
            </ul>
            
            <Link to="/publicar" role="button" className="secondary">
              <PlusCircle size={18} /> Nueva Publicación
            </Link>
          </article>
        </aside>

        <section>
          <nav>
            <button 
              aria-selected={activeTab === 'publicaciones'}
              onClick={() => setActiveTab('publicaciones')}
            >
              Mis Publicaciones
            </button>
            <button 
              aria-selected={activeTab === 'favoritos'}
              onClick={() => setActiveTab('favoritos')}
            >
              Mis Favoritos
            </button>
          </nav>

          <div>
            {activeTab === 'publicaciones' ? (
              posts.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  background: 'var(--surface-color)',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  gridColumn: '1 / -1'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(217, 70, 239, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    color: 'var(--pink-color)'
                  }}>
                    <PackageOpen size={36} />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>Sin Publicaciones</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Aún no has publicado ningún artículo para vender. ¡Anímate y publica hoy!
                  </p>
                  <Link to="/publicar" role="button" className="secondary" style={{ padding: '0.5rem 1.5rem !important', fontSize: '0.9rem' }}>
                    Publicar un Artículo
                  </Link>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="card">
                    <figure>
                      <img src={post.images[0].url} alt={post.name} />
                      
                      <header>
                        <strong>{post.name}</strong>
                        <button className="icon-only" onClick={() => handleEditClick(post)}>
                          <Edit size={20} />
                        </button>
                      </header>
                      
                      <mark>$ {post.price.toLocaleString('es-CL')}</mark>
                      
                      <nav>
                        <button className="icon-only" onClick={() => handleDelete(post.id)}>
                          <Trash2 size={20} />
                        </button>
                      </nav>
                    </figure>
                  </article>
                ))
              )
            ) : (
              favorites.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  background: 'var(--surface-color)',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  gridColumn: '1 / -1'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(255, 77, 77, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    color: '#ff4d4d'
                  }}>
                    <Heart size={36} fill="#ff4d4d" />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>Sin Favoritos</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    ¿Encontraste algo que te gusta? Agrégalo a tus favoritos para guardarlo aquí.
                  </p>
                  <Link to="/catalogo" role="button" className="secondary" style={{ padding: '0.5rem 1.5rem !important', fontSize: '0.9rem' }}>
                    Explorar Catálogo
                  </Link>
                </div>
              ) : (
                favorites.map((fav) => (
                  <Link to={`/publicacion/${fav.id}`} key={fav.id}>
                    <article className="card">
                      <figure>
                        <img src={fav.images[0].url} alt={fav.name} />
                        <nav style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="icon-only" 
                            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                            onClick={(e) => {
                              e.preventDefault();
                              handleRemoveFavorite(fav.id);
                            }}
                          >
                            <Heart size={20} fill="#ff4d4d" color="#ff4d4d" />
                          </button>
                        </nav>
                        <mark>$ {fav.price.toLocaleString('es-CL')}</mark>
                      </figure>
                      <div>
                        <strong>{fav.name}</strong>
                        <small>{fav.location || "Ubicación no disponible"}</small>
                        <footer>
                          <div>
                            <User size={14} color="var(--text-muted)" />
                          </div>
                          {fav.seller_name || "Vendedor"}
                        </footer>
                      </div>
                    </article>
                  </Link>
                ))
              )
            )}
          </div>
        </section>
      </div>

      {editingPost && (
        <dialog open>
          <article className="card">
            <button 
              className="icon-only"
              onClick={() => setEditingPost(null)}
              style={{ 
                position: 'absolute', 
                top: '1rem', 
                right: '1rem', 
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none'
              }}
            >
              <X size={24} />
            </button>
            <hgroup>
              <h2>Editar Publicación</h2>
              <p>Modifica los datos de tu artículo</p>
            </hgroup>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label htmlFor="edit-title">Título</label>
                <input
                  type="text"
                  id="edit-title"
                  value={editingPost.title || editingPost.name}
                  onChange={(e) => setEditingPost({...editingPost, title: e.target.value, name: e.target.value})}
                  required
                />
              </div>

              <fieldset className="form-group">
                <div>
                  <label htmlFor="edit-price">Precio ($)</label>
                  <input
                    type="number"
                    id="edit-price"
                    value={editingPost.price}
                    onChange={(e) => setEditingPost({...editingPost, price: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-category">Categoría</label>
                  <select
                    id="edit-category"
                    value={editingPost.category}
                    onChange={(e) => setEditingPost({...editingPost, category: e.target.value})}
                    required
                  >
                    <option value="muebles">Muebles</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="decoracion">Decoración</option>
                  </select>
                </div>
              </fieldset>

              <div className="form-group">
                <label>URLs de Imágenes</label>
                {editingPost.images.map((img, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={img.url || img}
                      onChange={(e) => {
                        const newImgs = [...editingPost.images];
                        if (typeof newImgs[index] === 'object') {
                          newImgs[index] = { ...newImgs[index], url: e.target.value };
                        } else {
                          newImgs[index] = e.target.value;
                        }
                        setEditingPost({ ...editingPost, images: newImgs });
                      }}
                      required
                    />
                    <button 
                      type="button"
                      className="icon-only"
                      onClick={() => {
                        const newImgs = editingPost.images.filter((_, i) => i !== index);
                        setEditingPost({ ...editingPost, images: newImgs.length ? newImgs : [{ url: "", position: 1 }] });
                      }}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => setEditingPost({ ...editingPost, images: [...editingPost.images, { url: "", position: editingPost.images.length + 1 }] })}
                  style={{ background: 'transparent', color: 'var(--pink-color)', padding: '0.5rem 0', border: 'none' }}
                >
                  <PlusCircle size={16} /> Añadir otra imagen
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Descripción</label>
                <textarea
                  id="edit-description"
                  rows="4"
                  value={editingPost.description}
                  onChange={(e) => setEditingPost({...editingPost, description: e.target.value})}
                  required
                ></textarea>
              </div>

              <nav>
                <button type="button" onClick={() => setEditingPost(null)}>
                  Cancelar
                </button>
                <button type="submit" className="secondary">
                  Guardar Cambios
                </button>
              </nav>
            </form>
          </article>
        </dialog>
      )}

      {editingProfile && (
        <dialog open>
          <article>
            <header>
              <button aria-label="Close" className="close" onClick={() => setEditingProfile(null)}></button>
              <strong>Editar Perfil</strong>
            </header>
            <form onSubmit={handleEditProfileSubmit}>
              <div className="form-group">
                <label>Email (No se puede cambiar)</label>
                <input type="email" value={user?.email || ""} disabled />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  value={editingProfile.name} 
                  onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  type="tel" 
                  value={editingProfile.phone} 
                  onChange={(e) => setEditingProfile({...editingProfile, phone: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Ubicación</label>
                <input 
                  type="text" 
                  value={editingProfile.location} 
                  onChange={(e) => setEditingProfile({...editingProfile, location: e.target.value})} 
                />
              </div>
              <nav>
                <button type="button" onClick={() => setEditingProfile(null)}>Cancelar</button>
                <button type="submit" className="secondary">Guardar Cambios</button>
              </nav>
            </form>
          </article>
        </dialog>
      )}
    </>
  );
};

export default Profile;
