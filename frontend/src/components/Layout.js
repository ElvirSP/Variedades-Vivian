import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Truck, 
  ShoppingCart, 
  RotateCcw,
  User,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Productos', href: '/productos', icon: Package },
    { name: 'Categorías', href: '/categorias', icon: Tag },
    { name: 'Proveedores', href: '/proveedores', icon: Truck },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Devoluciones', href: '/devoluciones', icon: RotateCcw },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar desktop */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '256px', 
        height: '100vh', 
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        zIndex: 40,
        display: 'none'
      }} className="lg:block">
        <div style={{ padding: '1rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
            Tienda Variedades
          </h1>
        </div>
        <nav style={{ padding: '1rem 0.5rem' }}>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  marginBottom: '0.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  color: isActive(item.href) ? '#1e40af' : '#4b5563',
                  backgroundColor: isActive(item.href) ? '#dbeafe' : 'transparent'
                }}
              >
                <Icon style={{ marginRight: '0.75rem', width: '1.25rem', height: '1.25rem' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div style={{ 
          position: 'absolute', 
          bottom: '1rem', 
          left: '1rem', 
          right: '1rem',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
            <User style={{ width: '2rem', height: '2rem', color: '#9ca3af', marginRight: '0.75rem' }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{user?.nombre}</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user?.rol}</p>
            </div>
          </div>
          <div>
            <Link
              to="/perfil"
              style={{
                display: 'block',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                color: '#4b5563',
                textDecoration: 'none'
              }}
            >
              Mi Perfil
            </Link>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                color: '#4b5563',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <LogOut style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ marginLeft: '256px' }} className="lg:ml-64">
        {/* Header móvil */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          height: '4rem',
          alignItems: 'center',
          gap: '1rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white',
          padding: '0 1rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }} className="lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            style={{ color: '#374151' }}
          >
            <Menu style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
          <div style={{ display: 'flex', flex: 1, gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User style={{ width: '1.5rem', height: '1.5rem', color: '#9ca3af' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{user?.nombre}</span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main style={{ padding: '1.5rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar móvil */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: 'rgba(75, 85, 99, 0.75)'
        }} onClick={() => setSidebarOpen(false)}>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '16rem',
            height: '100vh',
            backgroundColor: 'white',
            padding: '1rem'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Tienda Variedades</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ color: '#9ca3af' }}
              >
                <X style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>
            <nav style={{ marginBottom: '1rem' }}>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem',
                      marginBottom: '0.25rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      textDecoration: 'none',
                      color: isActive(item.href) ? '#1e40af' : '#4b5563',
                      backgroundColor: isActive(item.href) ? '#dbeafe' : 'transparent'
                    }}
                  >
                    <Icon style={{ marginRight: '0.75rem', width: '1.25rem', height: '1.25rem' }} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <User style={{ width: '2rem', height: '2rem', color: '#9ca3af', marginRight: '0.75rem' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{user?.nombre}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user?.rol}</p>
                </div>
              </div>
              <div>
                <Link
                  to="/perfil"
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'block',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: '#4b5563',
                    textDecoration: 'none'
                  }}
                >
                  Mi Perfil
                </Link>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: '#4b5563',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;