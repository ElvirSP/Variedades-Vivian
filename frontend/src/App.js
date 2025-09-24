import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import ProductoForm from './pages/ProductoForm';
import Categorias from './pages/Categorias';
import CategoriaForm from './pages/CategoriaForm';
import Proveedores from './pages/Proveedores';
import ProveedorForm from './pages/ProveedorForm';
import Ventas from './pages/Ventas';
import VentaForm from './pages/VentaForm';
import VentaDetalle from './pages/VentaDetalle';
import Devoluciones from './pages/Devoluciones';
import DevolucionForm from './pages/DevolucionForm';
import Perfil from './pages/Perfil';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/nuevo" element={<ProductoForm />} />
        <Route path="/productos/:id/editar" element={<ProductoForm />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/categorias/nueva" element={<CategoriaForm />} />
        <Route path="/categorias/:id/editar" element={<CategoriaForm />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
        <Route path="/proveedores/:id/editar" element={<ProveedorForm />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/ventas/nueva" element={<VentaForm />} />
        <Route path="/ventas/:id" element={<VentaDetalle />} />
        <Route path="/devoluciones" element={<Devoluciones />} />
        <Route path="/devoluciones/nueva" element={<DevolucionForm />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
