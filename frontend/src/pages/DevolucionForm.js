import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Search } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const DevolucionForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();

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

  const buscarVenta = async (numeroFactura) => {
    if (!numeroFactura) return;
    
    try {
      const response = await api.get('/ventas', {
        params: { busqueda: numeroFactura }
      });
      
      if (response.data.data.ventas.length > 0) {
        const venta = response.data.data.ventas[0];
        setVentaSeleccionada(venta);
        setValue('venta_id', venta.id);
      } else {
        toast.error('No se encontró la venta');
        setVentaSeleccionada(null);
      }
    } catch (error) {
      toast.error('Error al buscar la venta');
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la venta */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Información de la Venta</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Número de Factura</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Buscar por número de factura..."
                    onChange={(e) => buscarVenta(e.target.value)}
                  />
                </div>
              </div>

              {ventaSeleccionada && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-2">Venta Seleccionada</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Factura:</strong> {ventaSeleccionada.numero_factura}</div>
                    <div><strong>Cliente:</strong> {ventaSeleccionada.cliente_nombre || 'Cliente General'}</div>
                    <div><strong>Fecha:</strong> {new Date(ventaSeleccionada.fecha).toLocaleDateString()}</div>
                    <div><strong>Total:</strong> ${parseFloat(ventaSeleccionada.total).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del producto */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Producto a Devolver</h3>
          </div>
          <div className="card-body">
            {ventaSeleccionada ? (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Seleccionar Producto</label>
                  <div className="space-y-2">
                    {ventaSeleccionada.detalles?.map((detalle) => (
                      <button
                        key={detalle.id}
                        type="button"
                        onClick={() => seleccionarProducto(detalle.producto)}
                        className={`w-full text-left p-3 border rounded-lg ${
                          productoSeleccionado?.id === detalle.producto.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{detalle.producto.nombre}</div>
                        <div className="text-sm text-gray-500">
                          Cantidad vendida: {detalle.cantidad} | Precio: ${detalle.precio_unitario.toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {productoSeleccionado && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">Producto Seleccionado</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Nombre:</strong> {productoSeleccionado.nombre}</div>
                      <div><strong>Código:</strong> {productoSeleccionado.codigo}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Primero selecciona una venta</p>
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
