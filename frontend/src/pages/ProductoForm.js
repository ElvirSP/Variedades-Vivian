import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, X } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const ProductoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: producto, isLoading } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => api.get(`/productos/${id}`).then(res => res.data.data.producto),
    enabled: isEditing,
    onSuccess: (data) => {
      if (data) {
        // Llenar todos los campos automáticamente
        reset({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          precio_compra: data.precio_compra || '',
          precio_venta: data.precio_venta || '',
          stock: data.stock || '',
          stock_minimo: data.stock_minimo || '',
          categoria_id: data.categoria_id || '',
          proveedor_id: data.proveedor_id || '',
          activo: data.activo !== undefined ? data.activo : true
        });
      }
    }
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then(res => res.data.data.categorias)
  });

  const { data: proveedores } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => api.get('/proveedores').then(res => res.data.data.proveedores)
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      // Asegurar que los valores numéricos se envíen correctamente
      const processedData = {
        ...data,
        stock: data.stock ? parseInt(data.stock) : 0,
        stock_minimo: data.stock_minimo ? parseInt(data.stock_minimo) : 5,
        precio_compra: data.precio_compra ? parseFloat(data.precio_compra) : 0,
        precio_venta: data.precio_venta ? parseFloat(data.precio_venta) : 0
      };
      
      console.log('Datos enviados:', processedData);
      
      if (isEditing) {
        return api.put(`/productos/${id}`, processedData);
      } else {
        return api.post('/productos', processedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries('productos');
      toast.success(`Producto ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
      navigate('/productos');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al guardar el producto');
    }
  });

  // Efecto para llenar los campos cuando los datos del producto cambien
  useEffect(() => {
    if (isEditing && producto) {
      reset({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio_compra: producto.precio_compra || '',
        precio_venta: producto.precio_venta || '',
        stock: producto.stock || '',
        stock_minimo: producto.stock_minimo || '',
        categoria_id: producto.categoria_id || '',
        proveedor_id: producto.proveedor_id || '',
        activo: producto.activo !== undefined ? producto.activo : true
      });
    }
  }, [producto, isEditing, reset]);

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/productos')}
          className="btn btn-outline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing ? 'Modifica la información del producto' : 'Agrega un nuevo producto al inventario'}
        </p>
        {isEditing && producto && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              ✓ Datos del producto cargados correctamente
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className={`form-input ${errors.nombre ? 'error' : ''}`}
                  {...register('nombre', { 
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 2,
                      message: 'El nombre debe tener al menos 2 caracteres'
                    },
                    maxLength: {
                      value: 100,
                      message: 'El nombre no puede exceder 100 caracteres'
                    },
                    pattern: {
                      value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d\-&.()]+$/,
                      message: 'El nombre contiene caracteres no válidos'
                    },
                    validate: async (value) => {
                      if (isEditing && producto && producto.nombre === value) {
                        return true; // No validar si es el mismo nombre
                      }
                      
                      try {
                        const url = isEditing && producto 
                          ? `/productos/verificar-nombre?nombre=${encodeURIComponent(value)}&id=${producto.id}`
                          : `/productos/verificar-nombre?nombre=${encodeURIComponent(value)}`;
                        const response = await api.get(url);
                        if (response.data.data.exists) {
                          return 'Ya existe un producto con este nombre';
                        }
                      } catch (error) {
                        // Si hay error en la verificación, permitir continuar
                        console.warn('Error verificando nombre duplicado:', error);
                      }
                      return true;
                    }
                  })}
                />
                {errors.nombre && (
                  <p className="form-error">{errors.nombre.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select
                  className={`form-select ${errors.categoria_id ? 'error' : ''}`}
                  {...register('categoria_id', { required: 'La categoría es requerida' })}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias?.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && (
                  <p className="form-error">{errors.categoria_id.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <select
                  className="form-select"
                  {...register('proveedor_id')}
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores?.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Precio de Compra (Q) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--secondary-500)',
                    fontWeight: '500'
                  }}>Q</span>
                  <input
                    type="text"
                    className={`form-input ${errors.precio_compra ? 'error' : ''}`}
                    style={{ paddingLeft: '32px' }}
                    placeholder="0.00"
                    {...register('precio_compra', { 
                      required: 'El precio de compra es requerido',
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: 'Formato inválido (ej: 120.50)'
                      },
                      onChange: (e) => {
                        // Permitir solo números y un punto decimal
                        let value = e.target.value.replace(/[^0-9.]/g, '');
                        // Solo permitir un punto decimal
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        // Limitar a 2 decimales
                        if (parts[1] && parts[1].length > 2) {
                          value = parts[0] + '.' + parts[1].substring(0, 2);
                        }
                        e.target.value = value;
                        
                        // Revalidar precio de venta si ya tiene valor
                        const precioVenta = document.querySelector('input[name="precio_venta"]');
                        if (precioVenta && precioVenta.value) {
                          precioVenta.dispatchEvent(new Event('blur'));
                        }
                      }
                    })}
                  />
                </div>
                {errors.precio_compra && (
                  <p className="form-error">{errors.precio_compra.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Precio de Venta (Q) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--secondary-500)',
                    fontWeight: '500'
                  }}>Q</span>
                  <input
                    type="text"
                    className={`form-input ${errors.precio_venta ? 'error' : ''}`}
                    style={{ paddingLeft: '32px' }}
                    placeholder="0.00"
                    {...register('precio_venta', { 
                      required: 'El precio de venta es requerido',
                      pattern: {
                        value: /^\d+(\.\d{1,2})?$/,
                        message: 'Formato inválido (ej: 200.00)'
                      },
                      validate: (value) => {
                        const precioCompra = parseFloat(document.querySelector('input[name="precio_compra"]')?.value || 0);
                        const precioVenta = parseFloat(value);
                        
                        if (precioCompra > 0 && precioVenta <= precioCompra) {
                          return 'El precio de venta debe ser mayor al precio de compra';
                        }
                        
                        if (precioCompra > 0 && precioVenta < precioCompra * 1.1) {
                          toast.warning(`Margen muy bajo (${((precioVenta - precioCompra) / precioCompra * 100).toFixed(1)}%). Se recomienda al menos 10%`, {
                            duration: 5000,
                          });
                        }
                        
                        return true;
                      },
                      onChange: (e) => {
                        // Permitir solo números y un punto decimal
                        let value = e.target.value.replace(/[^0-9.]/g, '');
                        // Solo permitir un punto decimal
                        const parts = value.split('.');
                        if (parts.length > 2) {
                          value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        // Limitar a 2 decimales
                        if (parts[1] && parts[1].length > 2) {
                          value = parts[0] + '.' + parts[1].substring(0, 2);
                        }
                        e.target.value = value;
                      }
                    })}
                  />
                </div>
                {errors.precio_venta && (
                  <p className="form-error">{errors.precio_venta.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Stock Inicial</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0"
                  {...register('stock', { 
                    min: 0,
                    onChange: (e) => {
                      // Permitir solo números enteros
                      let value = e.target.value.replace(/[^0-9]/g, '');
                      // Si está vacío, permitir que se mantenga vacío
                      if (value === '') {
                        e.target.value = '';
                        return;
                      }
                      // Convertir a entero
                      const intValue = parseInt(value);
                      e.target.value = intValue.toString();
                    }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Mínimo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="5"
                  {...register('stock_minimo', { 
                    min: 0,
                    onChange: (e) => {
                      // Permitir solo números enteros
                      let value = e.target.value.replace(/[^0-9]/g, '');
                      // Si está vacío, permitir que se mantenga vacío
                      if (value === '') {
                        e.target.value = '';
                        return;
                      }
                      // Convertir a entero
                      const intValue = parseInt(value);
                      e.target.value = intValue.toString();
                    }
                  })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                rows={3}
                className="form-input"
                {...register('descripcion')}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/productos')}
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
                {mutation.isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductoForm;
