import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const VentaForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/ventas', data),
    onSuccess: () => {
      queryClient.invalidateQueries('ventas');
      toast.success('Venta creada exitosamente');
      navigate('/ventas');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear la venta');
    }
  });

  const agregarProducto = () => {
    if (productoSeleccionado && cantidad > 0) {
      const productoExistente = productos.find(p => p.producto_id === productoSeleccionado.id);
      
      if (productoExistente) {
        setProductos(productos.map(p => 
          p.producto_id === productoSeleccionado.id 
            ? { ...p, cantidad: p.cantidad + cantidad }
            : p
        ));
      } else {
        setProductos([...productos, {
          producto_id: productoSeleccionado.id,
          cantidad: cantidad,
          precio_unitario: productoSeleccionado.precio_venta,
          nombre: productoSeleccionado.nombre
        }]);
      }
      
      setProductoSeleccionado(null);
      setCantidad(1);
    }
  };

  const eliminarProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return productos.reduce((total, producto) => {
      return total + (producto.precio_unitario * producto.cantidad);
    }, 0);
  };

  const onSubmit = (data) => {
    if (productos.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    const ventaData = {
      ...data,
      productos: productos.map(p => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario
      })),
      subtotal: calcularTotal(),
      total: calcularTotal()
    };

    mutation.mutate(ventaData);
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/ventas')}
          className="btn btn-outline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra una nueva venta de productos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del cliente */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nombre del Cliente</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('cliente_nombre')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  {...register('cliente_telefono')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Método de Pago *</label>
                <select
                  className={`form-select ${errors.metodo_pago ? 'error' : ''}`}
                  {...register('metodo_pago', { required: 'El método de pago es requerido' })}
                >
                  <option value="">Seleccionar método</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="mixto">Mixto</option>
                </select>
                {errors.metodo_pago && (
                  <p className="form-error">{errors.metodo_pago.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea
                  rows={3}
                  className="form-input"
                  {...register('observaciones')}
                />
              </div>
            </form>
          </div>
        </div>

        {/* Productos */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Productos</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {/* Agregar producto */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Agregar Producto</h4>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Producto</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Buscar producto por nombre o código..."
                      onChange={(e) => {
                        // Aquí iría la lógica de búsqueda de productos
                        // Por simplicidad, simulamos un producto
                        if (e.target.value) {
                          setProductoSeleccionado({
                            id: 1,
                            nombre: e.target.value,
                            precio_venta: 100
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="form-label">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarProducto}
                    className="btn btn-primary w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </button>
                </div>
              </div>

              {/* Lista de productos */}
              {productos.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Productos Agregados</h4>
                  {productos.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{producto.nombre}</div>
                        <div className="text-sm text-gray-500">
                          {producto.cantidad} x ${producto.precio_unitario.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          ${(producto.precio_unitario * producto.cantidad).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarProducto(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No hay productos agregados</p>
                </div>
              )}

              {/* Total */}
              {productos.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${calcularTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/ventas')}
          className="btn btn-outline"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isLoading || productos.length === 0}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          {mutation.isLoading ? 'Guardando...' : 'Guardar Venta'}
        </button>
      </div>
    </div>
  );
};

export default VentaForm;
