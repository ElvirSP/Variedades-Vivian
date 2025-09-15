import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Eye, Calendar, CreditCard } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Ventas = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['ventas'],
    queryFn: () => api.get('/ventas').then(res => res.data.data)
  });

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

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

  const getMetodoPagoIcon = (metodo) => {
    switch (metodo) {
      case 'efectivo':
        return '💵';
      case 'tarjeta':
        return '💳';
      case 'transferencia':
        return '🏦';
      case 'mixto':
        return '💰';
      default:
        return '💵';
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

      <div className="card">
        <div className="card-body p-0">
          {data?.ventas?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Método de Pago</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ventas.map((venta) => (
                    <tr key={venta.id}>
                      <td className="font-mono text-sm font-medium text-gray-900">
                        {venta.numero_factura}
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">
                            {venta.cliente_nombre || 'Cliente General'}
                          </div>
                          {venta.cliente_telefono && (
                            <div className="text-sm text-gray-500">{venta.cliente_telefono}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <span className="mr-1">{getMetodoPagoIcon(venta.metodo_pago)}</span>
                          <span className="text-sm text-gray-900 capitalize">{venta.metodo_pago}</span>
                        </div>
                      </td>
                      <td className="text-sm font-semibold text-gray-900">
                        ${parseFloat(venta.total).toLocaleString()}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                          {venta.estado}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/ventas/${venta.id}`}
                          className="text-blue-600 hover:text-blue-900"
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

      {/* Paginación */}
      {data?.paginacion && data.paginacion.totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((data.paginacion.pagina - 1) * data.paginacion.limite) + 1} a{' '}
            {Math.min(data.paginacion.pagina * data.paginacion.limite, data.paginacion.total)} de{' '}
            {data.paginacion.total} resultados
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;
