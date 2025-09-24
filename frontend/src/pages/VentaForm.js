import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Plus, Trash2, Search, ShoppingCart } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const VentaForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productosEnVenta, setProductosEnVenta] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  // Query para obtener categorías
  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then(res => res.data.data.categorias)
  });

  // Query para obtener productos por categoría
  const { data: productosData, isLoading: cargandoProductos } = useQuery({
    queryKey: ['productos-por-categoria', categoriaSeleccionada, busquedaProducto],
    queryFn: () => api.get('/productos/por-categoria', {
      params: { 
        categoria_id: categoriaSeleccionada,
        busqueda: busquedaProducto
      }
    }).then(res => res.data.data.productos),
    enabled: !!categoriaSeleccionada
  });

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

  const agregarProducto = (producto) => {
    const productoExistente = productosEnVenta.find(p => p.producto_id === producto.id);
    
    if (productoExistente) {
      // Si ya existe, aumentar la cantidad
      setProductosEnVenta(productosEnVenta.map(p => 
        p.producto_id === producto.id 
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      ));
    } else {
      // Si no existe, agregarlo
      setProductosEnVenta([...productosEnVenta, {
        producto_id: producto.id,
        cantidad: 1,
        precio_unitario: producto.precio_venta,
        nombre: producto.nombre,
        codigo: producto.codigo,
        stock_disponible: producto.stock
      }]);
    }
    
    toast.success(`${producto.nombre} agregado a la venta`);
  };

  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(productoId);
      return;
    }

    setProductosEnVenta(productosEnVenta.map(p => 
      p.producto_id === productoId 
        ? { ...p, cantidad: nuevaCantidad }
        : p
    ));
  };

  const eliminarProducto = (productoId) => {
    setProductosEnVenta(productosEnVenta.filter(p => p.producto_id !== productoId));
  };

  const calcularTotal = () => {
    return productosEnVenta.reduce((total, producto) => {
      return total + (producto.precio_unitario * producto.cantidad);
    }, 0);
  };

  const onSubmit = (data) => {
    if (productosEnVenta.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    const ventaData = {
      ...data,
      productos: productosEnVenta.map(p => ({
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selección de productos */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Seleccionar Productos</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* Selector de categoría */}
                <div className="form-group">
                  <label className="form-label">Categoría *</label>
                  <select
                    className="form-select"
                    value={categoriaSeleccionada}
                    onChange={(e) => {
                      setCategoriaSeleccionada(e.target.value);
                      setBusquedaProducto('');
                    }}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias?.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Búsqueda de productos */}
                {categoriaSeleccionada && (
                  <div className="form-group">
                    <label className="form-label">Buscar Producto</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="form-input pl-10"
                        placeholder="Buscar por nombre o código..."
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Lista de productos */}
                {categoriaSeleccionada ? (
                  <div className="border border-gray-200 rounded-lg">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900">Productos Disponibles</h4>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {cargandoProductos ? (
                        <div className="p-8 text-center">
                          <div className="spinner mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Cargando productos...</p>
                        </div>
                      ) : productosData && productosData.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {productosData.map((producto) => (
                            <div key={producto.id} className="p-3 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{producto.nombre}</div>
                                  <div className="text-sm text-gray-500">
                                    Código: {producto.codigo} | Stock: {producto.stock} | Precio: ${producto.precio_venta.toLocaleString()}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => agregarProducto(producto)}
                                  className="btn btn-primary btn-sm"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            {busquedaProducto ? 'No se encontraron productos con esa búsqueda' : 'No hay productos disponibles en esta categoría'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Selecciona una categoría para ver los productos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Carrito de venta */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Carrito de Venta</h3>
          </div>
          <div className="card-body">
            {productosEnVenta.length > 0 ? (
              <div className="space-y-4">
                {/* Lista de productos en el carrito */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {productosEnVenta.map((producto) => (
                    <div key={producto.producto_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{producto.nombre}</div>
                        <div className="text-xs text-gray-500">${producto.precio_unitario.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={producto.stock_disponible}
                          value={producto.cantidad}
                          onChange={(e) => actualizarCantidad(producto.producto_id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center text-sm border border-gray-300 rounded px-1 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarProducto(producto.producto_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${calcularTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay productos en el carrito</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario de venta */}
      {productosEnVenta.length > 0 && (
        <div className="mt-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Información de la Venta</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    {...register('observaciones')}
                    placeholder="Observaciones adicionales sobre la venta..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/ventas')}
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
                    {mutation.isLoading ? 'Guardando...' : 'Guardar Venta'}
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

export default VentaForm;