import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Package, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const VentaDetalle = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['venta', id],
    queryFn: () => api.get(`/ventas/${id}`).then(res => res.data.data.venta),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la venta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar la venta</h3>
          <p className="text-gray-500 mb-4">No se pudieron cargar los detalles de esta venta.</p>
          <Link to="/ventas" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Ventas
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Venta no encontrada</h3>
          <p className="text-gray-500 mb-4">La venta solicitada no existe.</p>
          <Link to="/ventas" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Ventas
          </Link>
        </div>
      </div>
    );
  }

  const venta = data;

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            to="/ventas" 
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalle de Venta #{venta.id}
            </h1>
            <p className="text-sm text-gray-500">
              Información completa de la venta realizada
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información General */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Información General</h3>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {/* Fecha */}
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-900">
                    <span className="font-medium">Fecha:</span> {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>

                {/* Vendedor */}
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-900">
                    <span className="font-medium">Vendedor:</span> {venta.usuario?.nombre}
                  </span>
                </div>

                {/* Estado */}
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-900">
                    <span className="font-medium">Estado:</span> 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                      {venta.estado}
                    </span>
                  </span>
                </div>

                {venta.observaciones && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-500">{venta.observaciones}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Resumen Financiero</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">Q{parseFloat(venta.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productos Vendidos */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Productos Vendidos</h3>
            </div>
            <div className="card-body p-0">
              {venta.detalles && venta.detalles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venta.detalles.map((detalle) => (
                        <tr key={detalle.id}>
                          <td>
                            <div className="font-medium text-gray-900">
                              {detalle.producto?.nombre}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {detalle.cantidad}
                            </span>
                          </td>
                          <td className="text-sm font-medium text-gray-900">
                            Q{parseFloat(detalle.precio_unitario).toLocaleString()}
                          </td>
                          <td className="text-sm font-semibold text-gray-900">
                            Q{parseFloat(detalle.subtotal).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin productos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No se encontraron productos en esta venta.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaDetalle;
