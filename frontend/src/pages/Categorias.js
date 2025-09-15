import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Categorias = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then(res => res.data.data.categorias)
  });

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await api.delete(`/categorias/${id}`);
        toast.success('Categoría eliminada exitosamente');
        refetch();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar la categoría');
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
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las categorías de productos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/categorias/nueva" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
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
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((categoria) => (
                    <tr key={categoria.id}>
                      <td className="font-medium text-gray-900">{categoria.nombre}</td>
                      <td className="text-sm text-gray-500">{categoria.descripcion || '-'}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          categoria.activa 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {categoria.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Link
                            to={`/categorias/${categoria.id}/editar`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEliminar(categoria.id)}
                            className="text-red-600 hover:text-red-900"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin categorías</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primera categoría.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categorias;
