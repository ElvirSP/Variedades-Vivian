import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Loader2 } from 'lucide-react';
import api from '../services/api';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Graficas = () => {
  const [datosVentas, setDatosVentas] = useState([]);
  const [datosCategorias, setDatosCategorias] = useState([]);
  const [datosVentasCategoria, setDatosVentasCategoria] = useState([]);
  const [datosProductosVendidos, setDatosProductosVendidos] = useState([]);
  const [datosVentasMeta, setDatosVentasMeta] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [metaMensual, setMetaMensual] = useState(5000); // Meta por defecto en Quetzales

  // Cargar datos de devoluciones mensuales
  const cargarDevolucionesMensuales = async () => {
    try {
      setCargando(true);
      console.log('Cargando devoluciones mensuales...');
      const response = await api.get('/dashboard/devoluciones-mensuales?meses=12');
      console.log('Respuesta del servidor:', response.data);
      setDatosVentas(response.data.data.devolucionesPorMes);
    } catch (error) {
      console.error('Error al cargar devoluciones mensuales:', error);
      console.error('Detalles del error:', error.response?.data);
    } finally {
      setCargando(false);
    }
  };

  // Cargar categorías más vendidas
  const cargarCategorias = async () => {
    try {
      console.log('Cargando categorías...');
      const response = await api.get('/dashboard/categorias-mas-vendidas?dias=30');
      console.log('Categorías:', response.data);
      setDatosCategorias(response.data.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      console.error('Detalles del error:', error.response?.data);
    }
  };

  // Cargar ventas por categoría
  const cargarVentasCategoria = async () => {
    try {
      console.log('Cargando ventas por categoría...');
      const response = await api.get('/dashboard/ventas-categoria?dias=30');
      console.log('Ventas por categoría:', response.data);
      setDatosVentasCategoria(response.data.data);
    } catch (error) {
      console.error('Error al cargar ventas por categoría:', error);
      console.error('Detalles del error:', error.response?.data);
    }
  };

  // Cargar productos más vendidos
  const cargarProductosVendidos = async () => {
    try {
      console.log('Cargando productos más vendidos...');
      const response = await api.get('/dashboard/productos-mas-vendidos?dias=30');
      console.log('Productos vendidos:', response.data);
      setDatosProductosVendidos(response.data.data);
    } catch (error) {
      console.error('Error al cargar productos vendidos:', error);
      console.error('Detalles del error:', error.response?.data);
    }
  };

  // Cargar datos de ventas vs meta
  const cargarVentasMeta = async () => {
    try {
      console.log('Cargando datos de ventas vs meta...');
      const response = await api.get('/dashboard/ventas-meta?dias=30');
      console.log('Ventas vs meta:', response.data);
      setDatosVentasMeta(response.data.data);
    } catch (error) {
      console.error('Error al cargar ventas vs meta:', error);
      console.error('Detalles del error:', error.response?.data);
    }
  };

  useEffect(() => {
    // Cargar datos con delay para evitar rate limiting
    const cargarDatos = async () => {
      await cargarDevolucionesMensuales();
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      
      await cargarCategorias();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await cargarVentasCategoria();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await cargarProductosVendidos();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await cargarVentasMeta();
    };
    
    cargarDatos();
  }, []);


  // Configuración de colores púrpura
  const colores = {
    primario: 'rgba(139, 136, 184, 1)',
    primarioClaro: 'rgba(139, 136, 184, 0.2)',
    secundario: 'rgba(124, 58, 237, 1)',
    secundarioClaro: 'rgba(124, 58, 237, 0.2)',
    acento: 'rgba(168, 85, 247, 1)',
    acentoClaro: 'rgba(168, 85, 247, 0.2)',
    success: 'rgba(34, 197, 94, 1)',
    warning: 'rgba(245, 158, 11, 1)',
    error: 'rgba(239, 68, 68, 1)',
    gradiente: [
      'rgba(139, 136, 184, 0.8)',
      'rgba(124, 58, 237, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(196, 181, 253, 0.8)',
      'rgba(221, 214, 254, 0.8)'
    ]
  };

  // Configuración de la gráfica de líneas (devoluciones mensuales)
  const configDevolucionesLinea = {
    type: 'line',
    data: {
      labels: datosVentas.map(item => item.mes),
      datasets: [{
        label: 'Devoluciones',
        data: datosVentas.map(item => item.cantidad),
        borderColor: colores.error,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colores.error,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: 'var(--secondary-700)',
            font: {
              size: 14,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: colores.primario,
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            }
          }
        },
        x: {
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            }
          }
        }
      }
    }
  };

  // Configuración de la gráfica de barras (categorías más vendidas)
  const configCategoriasBarras = {
    type: 'bar',
    data: {
      labels: datosCategorias.slice(0, 8).map(item => item.categoria),
      datasets: [{
        label: 'Total Vendido ($)',
        data: datosCategorias.slice(0, 8).map(item => parseFloat(item.total)),
        backgroundColor: colores.gradiente,
        borderColor: colores.primario,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: 'var(--secondary-700)',
            font: {
              size: 14,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: colores.primario,
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            }
          }
        },
        x: {
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            }
          }
        }
      }
    }
  };

  // Configuración de la gráfica de pastel (ventas por categoría)
  const configVentasPastel = {
    type: 'doughnut',
    data: {
      labels: datosVentasCategoria.categorias?.slice(0, 6).map(item => item.categoria) || [],
      datasets: [{
        data: datosVentasCategoria.categorias?.slice(0, 6).map(item => parseFloat(item.total)) || [],
        backgroundColor: colores.gradiente,
        borderColor: 'white',
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'var(--secondary-700)',
            font: {
              size: 12,
              weight: '500'
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: colores.primario,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: $${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      }
    }
  };

  // Configuración de la gráfica de ventas vs meta
  const configVentasMeta = {
    type: 'bar',
    data: {
      labels: ['Ventas Reales', 'Meta Mensual'],
      datasets: [{
        label: 'Monto (Q)',
        data: [
          datosVentasMeta.ventasReales || 0,
          metaMensual
        ],
        backgroundColor: [
          datosVentasMeta.ventasReales >= metaMensual ? colores.success : colores.warning,
          colores.primarioClaro
        ],
        borderColor: [
          datosVentasMeta.ventasReales >= metaMensual ? colores.success : colores.warning,
          colores.primario
        ],
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: colores.primario,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed.y;
              const porcentaje = context.dataIndex === 0 ? 
                ((value / metaMensual) * 100).toFixed(1) : '100%';
              return `${label}: Q${value.toLocaleString()} (${porcentaje})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            },
            callback: function(value) {
              return 'Q' + value.toLocaleString();
            }
          }
        },
        x: {
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            }
          }
        }
      }
    }
  };

  // Configuración de productos más vendidos
  const configProductosVendidos = {
    type: 'bar',
    data: {
      labels: datosProductosVendidos.slice(0, 8).map(item => item.nombre),
      datasets: [{
        label: 'Cantidad Vendida',
        data: datosProductosVendidos.slice(0, 8).map(item => item.cantidad),
        backgroundColor: colores.gradiente,
        borderColor: colores.primario,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Barras horizontales
      plugins: {
        legend: {
          labels: {
            color: 'var(--secondary-700)',
            font: {
              size: 14,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: colores.primario,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const producto = datosProductosVendidos[context.dataIndex];
              return [
                `Producto: ${producto.nombre}`,
                `Cantidad: ${context.parsed.x} unidades`,
                `Categoría: ${producto.categoria}`,
                `Total vendido: Q${producto.total.toLocaleString()}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            }
          }
        },
        y: {
          grid: {
            color: 'var(--secondary-200)'
          },
          ticks: {
            color: 'var(--secondary-600)',
            font: {
              size: 12
            }
          }
        }
      }
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginTop: '2rem'
    }}>
      {/* Gráfica de ventas por período */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--secondary-200)',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <TrendingDown style={{ width: '1.5rem', height: '1.5rem', color: 'var(--error-600)' }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--secondary-800)',
            margin: 0
          }}>
            Devoluciones Mensuales
          </h3>
        </div>
        
        <div style={{ height: '300px', position: 'relative' }}>
          {cargando ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <Loader2 style={{ width: '2rem', height: '2rem', color: 'var(--primary-600)', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--secondary-600)', margin: 0 }}>Cargando datos...</p>
            </div>
          ) : (
            <Line {...configDevolucionesLinea} />
          )}
        </div>
      </div>

      {/* Gráfica de ventas vs meta */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--secondary-200)',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <BarChart3 style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary-600)' }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--secondary-800)',
              margin: 0
            }}>
              Ventas vs Meta Mensual
            </h3>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <label style={{
              fontSize: '0.875rem',
              color: 'var(--secondary-600)',
              fontWeight: '500'
            }}>
              Meta: Q
            </label>
            <input
              type="number"
              value={metaMensual}
              onChange={(e) => setMetaMensual(parseInt(e.target.value) || 0)}
              style={{
                width: '100px',
                padding: '0.25rem 0.5rem',
                border: '1px solid var(--secondary-300)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                textAlign: 'right'
              }}
            />
          </div>
        </div>
        
        <div style={{ height: '300px', position: 'relative' }}>
          <Bar {...configVentasMeta} />
        </div>
      </div>

      {/* Gráfica de productos más vendidos */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--secondary-200)',
        padding: '1.5rem',
        gridColumn: 'span 2'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <PieChart style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary-600)' }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--secondary-800)',
            margin: 0
          }}>
            Top Productos Más Vendidos
          </h3>
        </div>
        
        <div style={{ height: '300px', position: 'relative' }}>
          <Bar {...configProductosVendidos} />
        </div>
      </div>
    </div>
  );
};

export default Graficas;
