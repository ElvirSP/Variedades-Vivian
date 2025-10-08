import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  RotateCcw,
  BarChart3,
  TrendingDown,
  Target,
  TrendingUp,
  Calculator,
  FileText
} from 'lucide-react';
import api from '../services/api';
import Graficas from '../components/Graficas';
import ReporteConsolidadoModal from '../components/ReporteConsolidadoModal';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [mostrarReporte, setMostrarReporte] = useState(false);
  
  const { data: resumen, isLoading, error } = useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => api.get('/dashboard/resumen').then(res => res.data.data.resumen),
    refetchInterval: false, // Desactivar refetch automático
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: 1000,
  });

  const recalcularTotalesMutation = useMutation({
    mutationFn: () => api.post('/dashboard/recalcular-totales'),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-resumen']);
      alert('Totales recalculados exitosamente');
    },
    onError: (error) => {
      console.error('Error al recalcular totales:', error);
      alert('Error al recalcular totales');
    }
  });

  if (error) {
    console.error('Error en Dashboard:', error);
    return (
      <div className="card">
        <div className="card-body text-center">
          <h1 className="text-2xl font-bold text-secondary-800 mb-4">Dashboard</h1>
          <div className="text-error mb-2">Error al cargar datos: {error.message}</div>
          <div className="text-secondary-600">Verifica que el backend esté funcionando en http://localhost:3001</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <h1 className="text-2xl font-bold text-secondary-800 mb-4">Dashboard</h1>
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Ventas Hoy',
      value: resumen?.ventasHoy?.cantidad || 0,
      change: `Q${resumen?.ventasHoy?.total?.toLocaleString() || 0}`,
      icon: ShoppingCart,
      color: 'text-green-600',
    },
    {
      name: 'Productos con Stock Bajo',
      value: resumen?.alertas?.productosStockBajo || 0,
      change: 'Requieren atención',
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
    {
      name: 'Devoluciones del Día',
      value: resumen?.alertas?.devolucionesHoy || 0,
      change: 'Registradas hoy',
      icon: RotateCcw,
      color: 'text-purple-700',
    },
    {
      name: 'Total Productos',
      value: resumen?.inventario?.totalProductos || 0,
      change: `${resumen?.inventario?.totalCategorias || 0} categorías`,
      icon: Package,
      color: 'text-purple-700',
    },
  ];

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 50%, var(--secondary-50) 100%)',
      minHeight: '100vh',
      padding: '2rem 0'
    }}>
      <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: 'var(--secondary-800)',
              marginBottom: '0.5rem',
              margin: 0
            }}>
              Dashboard
            </h1>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--secondary-600)',
              margin: 0
            }}>
              Resumen del día {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>
          <button
            onClick={() => {
              setMostrarReporte(true);
              // Scroll automático al modal después de un breve delay
              setTimeout(() => {
                const modalElement = document.getElementById('reporte-consolidado-modal');
                if (modalElement) {
                  modalElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }
              }, 100);
            }}
            style={{
              background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <FileText style={{ width: '1rem', height: '1rem' }} />
            Reporte de Ventas Netas
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} style={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease-in-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  flexShrink: 0, 
                  marginRight: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ 
                    width: '2rem', 
                    height: '2rem', 
                    color: stat.color === 'text-green-600' ? '#059669' : 
                           stat.color === 'text-orange-600' ? '#d97706' :
                           stat.color === 'text-purple-700' ? '#7c3aed' : '#6b7280'
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--secondary-600)',
                    marginBottom: '0.25rem',
                    margin: 0
                  }}>{stat.name}</p>
                  <p style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: 'var(--secondary-800)',
                    marginBottom: '0.25rem',
                    margin: 0
                  }}>{stat.value}</p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--secondary-500)',
                    margin: 0
                  }}>{stat.change}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de Gráficas */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--secondary-800)',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <BarChart3 style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem', display: 'inline-block' }} />
          Análisis de Ventas
        </h2>
        
        <Graficas />
      </div>

      {/* Modal de Reporte de Ventas Netas */}
      <ReporteConsolidadoModal
        isOpen={mostrarReporte}
        onClose={() => setMostrarReporte(false)}
      />

    </div>
  );
};

export default Dashboard;