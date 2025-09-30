import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Proveedores = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['proveedores'],
    queryFn: () => api.get('/proveedores').then(res => res.data.data.proveedores)
  });

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      try {
        await api.delete(`/proveedores/${id}`);
        toast.success('Proveedor eliminado exitosamente');
        refetch();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar el proveedor');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los proveedores de productos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/proveedores/nuevo" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((proveedor) => (
                    <tr key={proveedor.id}>
                      <td className="font-medium text-gray-900">{proveedor.nombre}</td>
                      <td className="text-sm text-gray-500">{proveedor.contacto || '-'}</td>
                      <td>
                        {proveedor.telefono ? (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{proveedor.telefono}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {proveedor.email ? (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{proveedor.email}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          proveedor.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/proveedores/${proveedor.id}/editar`}
                            className="action-btn edit"
                            title="Editar proveedor"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEliminar(proveedor.id)}
                            className="action-btn delete"
                            title="Eliminar proveedor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin proveedores</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza agregando tu primer proveedor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Proveedores;
