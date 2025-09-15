import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  RotateCcw
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const { data: resumen, isLoading, error } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => api.get('/dashboard/resumen').then(res => res.data.data.resumen),
    refetchInterval: 30000,
  });

  if (error) {
    console.error('Error en Dashboard:', error);
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Error al cargar datos: {error.message}</p>
        <p>Verifica que el backend esté funcionando en http://localhost:3001</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Cargando...</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Ventas Hoy',
      value: resumen?.ventasHoy?.cantidad || 0,
      change: `$${resumen?.ventasHoy?.total?.toLocaleString() || 0}`,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Productos con Stock Bajo',
      value: resumen?.alertas?.productosStockBajo || 0,
      change: 'Requieren atención',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Devoluciones Pendientes',
      value: resumen?.alertas?.devolucionesPendientes || 0,
      change: 'Por procesar',
      icon: RotateCcw,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Total Productos',
      value: resumen?.inventario?.totalProductos || 0,
      change: `${resumen?.inventario?.totalCategorias || 0} categorías`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
          Dashboard
        </h1>
        <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Resumen del día {new Date().toLocaleDateString('es-ES')}
        </p>
      </div>

      {/* Estadísticas principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '2rem' 
      }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  flexShrink: 0,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: stat.bgColor.replace('bg-', '#').replace('-100', '')
                }}>
                  <Icon style={{ width: '1.5rem', height: '1.5rem', color: stat.color.replace('text-', '#').replace('-600', '') }} />
                </div>
                <div style={{ marginLeft: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>{stat.name}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>{stat.value}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{stat.change}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje de bienvenida */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
          ¡Bienvenido al Sistema de Gestión!
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Tu sistema de gestión para tienda de variedades está funcionando correctamente.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
            <Package style={{ width: '2rem', height: '2rem', color: '#3b82f6', margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Gestionar Productos</h3>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
            <ShoppingCart style={{ width: '2rem', height: '2rem', color: '#10b981', margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Registrar Ventas</h3>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
            <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#f59e0b', margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Control de Stock</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;