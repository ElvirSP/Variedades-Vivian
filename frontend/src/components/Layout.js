import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Truck, 
  ShoppingCart, 
  RotateCcw,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--secondary-50)' }}>
      {/* Sidebar desktop */}
      <div className="sidebar-desktop">
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--secondary-200)' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--secondary-800)' }}>
            Variedades Vivian
          </h1>
        </div>
        <nav style={{ padding: 'var(--space-4)' }}>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-1)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--primary-700)' : 'var(--secondary-600)',
                  backgroundColor: isActive(item.href) ? 'var(--primary-100)' : 'transparent',
                  boxShadow: isActive(item.href) ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = 'var(--secondary-100)';
                    e.target.style.color = 'var(--secondary-800)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--secondary-600)';
                  }
                }}
              >
                <Icon style={{ marginRight: 'var(--space-3)', width: '1.25rem', height: '1.25rem' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div style={{ 
          position: 'absolute', 
          bottom: 'var(--space-4)', 
          left: 'var(--space-4)', 
          right: 'var(--space-4)',
          borderTop: '1px solid var(--secondary-200)',
          paddingTop: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <User style={{ width: '2rem', height: '2rem', color: 'var(--secondary-400)', marginRight: 'var(--space-3)' }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--secondary-700)' }}>{user?.nombre}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary-500)' }}>{user?.rol}</p>
            </div>
          </div>
          <div>
            <Link
              to="/perfil"
              style={{
                display: 'block',
                padding: 'var(--space-3)',
                fontSize: '0.875rem',
                color: 'var(--secondary-600)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--secondary-100)';
                e.target.style.color = 'var(--secondary-800)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--secondary-600)';
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
                padding: 'var(--space-3)',
                fontSize: '0.875rem',
                color: 'var(--secondary-600)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--secondary-100)';
                e.target.style.color = 'var(--secondary-800)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--secondary-600)';
              }}
            >
              <LogOut style={{ marginRight: 'var(--space-2)', width: '1rem', height: '1rem' }} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="main-content">
        {/* Header móvil */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          height: '4rem',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--secondary-200)',
          backgroundColor: 'white',
          padding: '0 1rem',
          boxShadow: 'var(--shadow-sm)'
        }} className="header-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User style={{ width: '1.5rem', height: '1.5rem', color: 'var(--secondary-400)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--secondary-700)' }}>{user?.nombre}</span>
          </div>
        </div>

        {/* Contenido */}
        <main style={{ padding: '1.5rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default Layout;