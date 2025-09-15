import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Perfil = () => {
  const { user, updateUser } = useAuth();
  const [cambiarPassword, setCambiarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      nombre: user?.nombre || '',
      telefono: user?.telefono || ''
    }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword }, reset: resetPassword } = useForm();

  const onSubmitPerfil = async (data) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/perfil', data);
      if (response.data.success) {
        updateUser(response.data.data.usuario);
        toast.success('Perfil actualizado exitosamente');
      }
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/cambiar-password', data);
      if (response.data.success) {
        toast.success('Contraseña actualizada exitosamente');
        setCambiarPassword(false);
        resetPassword();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tu información personal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del perfil */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className={`form-input pl-10 ${errors.nombre ? 'error' : ''}`}
                    {...register('nombre', { required: 'El nombre es requerido' })}
                  />
                </div>
                {errors.nombre && (
                  <p className="form-error">{errors.nombre.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    className="form-input pl-10 bg-gray-50"
                    value={user?.email}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede cambiar
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    className={`form-input pl-10 ${errors.telefono ? 'error' : ''}`}
                    {...register('telefono')}
                  />
                </div>
                {errors.telefono && (
                  <p className="form-error">{errors.telefono.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Rol</label>
                <input
                  type="text"
                  className="form-input bg-gray-50"
                  value={user?.rol}
                  disabled
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>
              <button
                type="button"
                onClick={() => setCambiarPassword(!cambiarPassword)}
                className="btn btn-outline btn-sm"
              >
                {cambiarPassword ? 'Cancelar' : 'Cambiar'}
              </button>
            </div>
          </div>
          <div className="card-body">
            {cambiarPassword ? (
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Contraseña Actual</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      className={`form-input pl-10 ${errorsPassword.password_actual ? 'error' : ''}`}
                      {...registerPassword('password_actual', { 
                        required: 'La contraseña actual es requerida' 
                      })}
                    />
                  </div>
                  {errorsPassword.password_actual && (
                    <p className="form-error">{errorsPassword.password_actual.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      className={`form-input pl-10 ${errorsPassword.password_nueva ? 'error' : ''}`}
                      {...registerPassword('password_nueva', { 
                        required: 'La nueva contraseña es requerida',
                        minLength: {
                          value: 6,
                          message: 'La contraseña debe tener al menos 6 caracteres'
                        }
                      })}
                    />
                  </div>
                  {errorsPassword.password_nueva && (
                    <p className="form-error">{errorsPassword.password_nueva.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      className={`form-input pl-10 ${errorsPassword.confirmar_password ? 'error' : ''}`}
                      {...registerPassword('confirmar_password', { 
                        required: 'Confirma la nueva contraseña',
                        validate: (value) => {
                          const password = document.querySelector('input[name="password_nueva"]').value;
                          return value === password || 'Las contraseñas no coinciden';
                        }
                      })}
                    />
                  </div>
                  {errorsPassword.confirmar_password && (
                    <p className="form-error">{errorsPassword.confirmar_password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <Lock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Contraseña</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Haz clic en "Cambiar" para actualizar tu contraseña.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
