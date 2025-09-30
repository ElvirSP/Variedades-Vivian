import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Calendar, Search, X } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const DevolucionForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  // Query para obtener ventas por rango de fechas
  const { data: ventasData, isLoading: cargandoVentas, refetch: buscarVentas, error: errorVentas } = useQuery({
    queryKey: ['ventas-para-devolucion', fechaDesde, fechaHasta],
    queryFn: () => api.get('/ventas/para-devolucion', {
      params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
    }).then(res => res.data.data.ventas),
    enabled: false // Solo se ejecuta cuando se llama manualmente
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/devoluciones', data),
    onSuccess: () => {
      queryClient.invalidateQueries('devoluciones');
      toast.success('Devolución creada exitosamente');
      navigate('/devoluciones');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear la devolución');
    }
  });

  const buscarVentasPorFecha = () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Debe seleccionar ambas fechas');
      return;
    }

    if (new Date(fechaDesde) > new Date(fechaHasta)) {
      toast.error('La fecha desde debe ser anterior a la fecha hasta');
      return;
    }

    console.log('Buscando ventas con fechas:', { fechaDesde, fechaHasta });
    buscarVentas();
  };

  const seleccionarVenta = (venta) => {
    setVentaSeleccionada(venta);
    setProductoSeleccionado(null);
    setValue('venta_id', venta.id);
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setValue('producto_id', producto.id);
    setValue('cantidad', 1);
  };

  const onSubmit = (data) => {
    if (!ventaSeleccionada || !productoSeleccionado) {
      toast.error('Debe seleccionar una venta y un producto');
      return;
    }

    mutation.mutate(data);
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/devoluciones')}
          className="btn btn-outline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Devolución</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra una nueva devolución de producto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selección de fechas */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Seleccionar Período</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Fecha Desde *</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Hasta *</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const hoy = new Date();
                    const hace30Dias = new Date();
                    hace30Dias.setDate(hace30Dias.getDate() - 30);
                    
                    setFechaDesde(hace30Dias.toISOString().split('T')[0]);
                    setFechaHasta(hoy.toISOString().split('T')[0]);
                  }}
                  className="btn btn-outline w-full text-sm"
                >
                  Últimos 30 días
                </button>
                
                <button
                  type="button"
                  onClick={buscarVentasPorFecha}
                  disabled={!fechaDesde || !fechaHasta}
                  className="btn btn-primary w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Ventas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de ventas */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Ventas del Período</h3>
          </div>
          <div className="card-body">
            {cargandoVentas ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Buscando ventas...</p>
              </div>
            ) : errorVentas ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-sm text-red-600">Error al buscar ventas</p>
                <p className="text-xs text-gray-500 mt-1">
                  {errorVentas.response?.data?.message || 'Error desconocido'}
                </p>
              </div>
            ) : ventasData && ventasData.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ventasData.map((venta) => (
                  <button
                    key={venta.id}
                    type="button"
                    onClick={() => seleccionarVenta(venta)}
                    className={`w-full text-left p-3 border rounded-lg ${
                      ventaSeleccionada?.id === venta.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      Venta #{venta.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(venta.fecha).toLocaleDateString()} - Q{parseFloat(venta.total).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {venta.detalles?.length || 0} producto(s)
                    </div>
                  </button>
                ))}
              </div>
            ) : ventasData && ventasData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay ventas en este período</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Selecciona un período para buscar ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos de la venta seleccionada */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Productos de la Venta</h3>
          </div>
          <div className="card-body">
            {ventaSeleccionada ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ventaSeleccionada.detalles?.map((detalle) => (
                  <button
                    key={detalle.id}
                    type="button"
                    onClick={() => seleccionarProducto(detalle.producto)}
                    className={`w-full text-left p-3 border rounded-lg ${
                      productoSeleccionado?.id === detalle.producto.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{detalle.producto.nombre}</div>
                    <div className="text-sm text-gray-500">
                      Cantidad: {detalle.cantidad} | Precio: Q{detalle.precio_unitario.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Código: {detalle.producto.codigo}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Selecciona una venta para ver sus productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario de devolución */}
      {ventaSeleccionada && productoSeleccionado && (
        <div className="mt-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Detalles de la Devolución</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Resumen de la selección */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Resumen de la Devolución</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Venta:</span>
                      <div className="font-medium">#{ventaSeleccionada.id}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Producto:</span>
                      <div className="font-medium">{productoSeleccionado.nombre}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Código:</span>
                      <div className="font-medium">{productoSeleccionado.codigo}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">Cantidad a Devolver *</label>
                    <input
                      type="number"
                      min="1"
                      className={`form-input ${errors.cantidad ? 'error' : ''}`}
                      {...register('cantidad', { 
                        required: 'La cantidad es requerida',
                        min: { value: 1, message: 'La cantidad debe ser mayor a 0' }
                      })}
                    />
                    {errors.cantidad && (
                      <p className="form-error">{errors.cantidad.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Motivo *</label>
                    <select
                      className={`form-select ${errors.motivo ? 'error' : ''}`}
                      {...register('motivo', { required: 'El motivo es requerido' })}
                    >
                      <option value="">Seleccionar motivo</option>
                      <option value="defectuoso">Producto Defectuoso</option>
                      <option value="no_solicitado">No Solicitado</option>
                      <option value="cambio">Cambio</option>
                      <option value="otro">Otro</option>
                    </select>
                    {errors.motivo && (
                      <p className="form-error">{errors.motivo.message}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    {...register('descripcion')}
                    placeholder="Describe el motivo de la devolución..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/devoluciones')}
                    className="btn btn-outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isLoading}
                    className="btn btn-primary"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {mutation.isLoading ? 'Guardando...' : 'Crear Devolución'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevolucionForm;