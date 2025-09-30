import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, X } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const CategoriaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: categoria, isLoading } = useQuery({
    queryKey: ['categoria', id],
    queryFn: () => api.get(`/categorias/${id}`).then(res => res.data.data.categoria),
    enabled: isEditing,
    onSuccess: (data) => {
      if (data) {
        reset({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          activa: data.activa !== undefined ? data.activa : true
        });
      }
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return api.put(`/categorias/${id}`, data);
      } else {
        return api.post('/categorias', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries('categorias');
      toast.success(`Categoría ${isEditing ? 'actualizada' : 'creada'} exitosamente`);
      navigate('/categorias');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al guardar la categoría');
    }
  });

  // Efecto para llenar los campos cuando los datos de la categoría cambien
  useEffect(() => {
    if (isEditing && categoria) {
      reset({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        activa: categoria.activa !== undefined ? categoria.activa : true
      });
    }
  }, [categoria, isEditing, reset]);

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de la categoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/categorias')}
          className="btn btn-outline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing ? 'Modifica la información de la categoría' : 'Crea una nueva categoría de productos'}
        </p>
        {isEditing && categoria && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              ✓ Datos de la categoría cargados correctamente
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
                {...register('nombre', { required: 'El nombre es requerido' })}
              />
              {errors.nombre && (
                <p className="form-error">{errors.nombre.message}</p>
              )}
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  {...register('activa')}
                >
                  <option value={true}>Activa</option>
                  <option value={false}>Inactiva</option>
                </select>
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
                onClick={() => navigate('/categorias')}
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

export default CategoriaForm;
