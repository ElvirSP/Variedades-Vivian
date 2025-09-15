import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
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
      reset(data);
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
      if (isEditing) {
        return api.put(`/productos/${id}`, data);
      } else {
        return api.post('/productos', data);
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

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
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
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Código *</label>
                <input
                  type="text"
                  className={`form-input ${errors.codigo ? 'error' : ''}`}
                  {...register('codigo', { required: 'El código es requerido' })}
                />
                {errors.codigo && (
                  <p className="form-error">{errors.codigo.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className={`form-input ${errors.nombre ? 'error' : ''}`}
                  {...register('nombre', { required: 'El nombre es requerido' })}
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
                <label className="form-label">Precio de Compra *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input ${errors.precio_compra ? 'error' : ''}`}
                  {...register('precio_compra', { 
                    required: 'El precio de compra es requerido',
                    min: { value: 0, message: 'El precio debe ser mayor a 0' }
                  })}
                />
                {errors.precio_compra && (
                  <p className="form-error">{errors.precio_compra.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Precio de Venta *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input ${errors.precio_venta ? 'error' : ''}`}
                  {...register('precio_venta', { 
                    required: 'El precio de venta es requerido',
                    min: { value: 0, message: 'El precio debe ser mayor a 0' }
                  })}
                />
                {errors.precio_venta && (
                  <p className="form-error">{errors.precio_venta.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Stock Inicial</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  {...register('stock', { min: 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  {...register('stock_minimo', { min: 0 })}
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
