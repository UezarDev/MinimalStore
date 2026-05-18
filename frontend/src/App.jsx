import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { PopupProvider } from "./context/PopupContext";

// Componentes
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

// Vistas
import Home from "./views/Home";
import Login from "./views/Login";
import Register from "./views/Register";
import Gallery from "./views/Gallery";
import ProductDetail from "./views/ProductDetail";
import CreatePublication from "./views/CreatePublication";
import Profile from "./views/Profile";

function App() {
  return (
    <BrowserRouter>
      <PopupProvider>
        <SessionProvider>
          <div>
            <Navbar />
            <main>
              <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Register />} />
                <Route path="/catalogo" element={<Gallery />} />

                {/* Rutas Privadas */}
                <Route 
                  path="/publicar" 
                  element={
                    <PrivateRoute>
                      <CreatePublication />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/perfil" 
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/publicacion/:id" 
                  element={
                    <PrivateRoute>
                      <ProductDetail />
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </main>
            <footer>
              <small>© {new Date().getFullYear()} MinimalStore. Todos los derechos reservados.</small>
            </footer>
          </div>
        </SessionProvider>
      </PopupProvider>
    </BrowserRouter>
  );
}

export default App;
