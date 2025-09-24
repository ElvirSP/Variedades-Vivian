import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const ProveedorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: proveedor, isLoading } = useQuery({
    queryKey: ['proveedor', id],
    queryFn: () => api.get(`/proveedores/${id}`).then(res => res.data.data.proveedor),
    enabled: isEditing,
    onSuccess: (data) => {
      if (data) {
        reset({
          nombre: data.nombre || '',
          contacto: data.contacto || '',
          telefono: data.telefono || '',
          email: data.email || '',
          direccion: data.direccion || '',
          activo: data.activo !== undefined ? data.activo : true
        });
      }
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return api.put(`/proveedores/${id}`, data);
      } else {
        return api.post('/proveedores', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries('proveedores');
      toast.success(`Proveedor ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
      navigate('/proveedores');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al guardar el proveedor');
    }
  });

  // Efecto para llenar los campos cuando los datos del proveedor cambien
  useEffect(() => {
    if (isEditing && proveedor) {
      reset({
        nombre: proveedor.nombre || '',
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        activo: proveedor.activo !== undefined ? proveedor.activo : true
      });
    }
  }, [proveedor, isEditing, reset]);

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del proveedor...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/proveedores')}
          className="btn btn-outline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing ? 'Modifica la información del proveedor' : 'Agrega un nuevo proveedor'}
        </p>
        {isEditing && proveedor && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              ✓ Datos del proveedor cargados correctamente
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
                <label className="form-label">Contacto</label>
                <input
                  type="text"
                  className="form-input"
                  {...register('contacto')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  {...register('telefono')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  {...register('activo')}
                >
                  <option value={true}>Activo</option>
                  <option value={false}>Inactivo</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección</label>
              <textarea
                rows={3}
                className="form-input"
                {...register('direccion')}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/proveedores')}
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

export default ProveedorForm;
