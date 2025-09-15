import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Eye, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Devoluciones = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['devoluciones'],
    queryFn: () => api.get('/devoluciones').then(res => res.data.data)
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
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprobada':
        return 'bg-blue-100 text-blue-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'procesada':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMotivoColor = (motivo) => {
    switch (motivo) {
      case 'defectuoso':
        return 'bg-red-100 text-red-800';
      case 'no_solicitado':
        return 'bg-yellow-100 text-yellow-800';
      case 'cambio':
        return 'bg-blue-100 text-blue-800';
      case 'otro':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devoluciones</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las devoluciones de productos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/devoluciones/nueva" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Devolución
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {data?.devoluciones?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Factura</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.devoluciones.map((devolucion) => (
                    <tr key={devolucion.id}>
                      <td className="font-mono text-sm font-medium text-gray-900">
                        {devolucion.numero_devolucion}
                      </td>
                      <td className="font-mono text-sm text-gray-600">
                        {devolucion.venta?.numero_factura}
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">
                            {devolucion.producto?.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {devolucion.producto?.codigo}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-900">
                        {devolucion.cantidad}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMotivoColor(devolucion.motivo)}`}>
                          {devolucion.motivo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-sm font-semibold text-gray-900">
                        ${parseFloat(devolucion.monto_devolucion).toLocaleString()}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(devolucion.estado)}`}>
                          {devolucion.estado}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {format(new Date(devolucion.fecha_devolucion), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Link
                            to={`/devoluciones/${devolucion.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {devolucion.estado === 'pendiente' && (
                            <button
                              onClick={() => {
                                // Aquí iría la lógica para procesar la devolución
                                console.log('Procesar devolución:', devolucion.id);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Procesar devolución"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin devoluciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se han registrado devoluciones.
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

export default Devoluciones;
