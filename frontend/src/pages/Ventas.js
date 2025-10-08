import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Eye, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Ventas = () => {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: ''
  });

  // Convertir filtros para el backend
  const paramsBackend = {
    fecha_desde: filtros.fechaInicio || undefined,
    fecha_hasta: filtros.fechaFin || undefined,
    limite: 100 // Aumentar el límite para mostrar más resultados
  };

  const { data, isLoading } = useQuery({
    queryKey: ['ventas', filtros],
    queryFn: () => api.get('/ventas', { params: paramsBackend }).then(res => res.data.data)
  });

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: ''
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Historial de ventas realizadas
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/ventas/nueva" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Link>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Fecha Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="fechaInicio"
                  className="form-input pl-10"
                  value={filtros.fechaInicio}
                  onChange={handleFiltroChange}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Fecha Fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="fechaFin"
                  className="form-input pl-10"
                  value={filtros.fechaFin}
                  onChange={handleFiltroChange}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="btn btn-outline w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {data?.ventas?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Subtotal</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ventas.map((venta) => (
                    <tr key={venta.id}>
                      <td className="font-mono text-sm font-medium text-gray-900">
                        #{venta.id}
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="text-sm font-medium text-gray-900">
                        Q{parseFloat(venta.subtotal).toLocaleString()}
                      </td>
                      <td className="text-sm font-semibold text-gray-900">
                        Q{parseFloat(venta.total).toLocaleString()}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                          {venta.estado}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/ventas/${venta.id}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Ver detalles de la venta"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin ventas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza registrando tu primera venta.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información de resultados */}
      {data?.ventas && data.ventas.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {data.paginacion ? (
              <>
                Mostrando {((data.paginacion.pagina - 1) * data.paginacion.limite) + 1} a{' '}
                {Math.min(data.paginacion.pagina * data.paginacion.limite, data.paginacion.total)} de{' '}
                {data.paginacion.total} resultados
              </>
            ) : (
              <>
                Mostrando {data.ventas.length} resultado{data.ventas.length !== 1 ? 's' : ''}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Ventas;
