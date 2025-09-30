import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Productos = () => {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria_id: '',
    activo: ''
  });
  
  // Estado separado para el input de búsqueda (para debouncing)
  const [busquedaInput, setBusquedaInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [ultimaBusqueda, setUltimaBusqueda] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['productos', filtros],
    queryFn: () => api.get('/productos', { params: filtros }).then(res => res.data.data),
    keepPreviousData: true,
    staleTime: 30000, // Los datos se consideran frescos por 30 segundos
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
  });

  // Obtener categorías para el filtro
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then(res => res.data.data.categorias),
  });

  // Debouncing inteligente para la búsqueda
  useEffect(() => {
    // Si el campo está vacío, buscar inmediatamente
    if (busquedaInput === '') {
      setFiltros(prev => ({
        ...prev,
        busqueda: ''
      }));
      setBuscando(false);
      setUltimaBusqueda('');
      return;
    }

    // Si está escribiendo (texto más largo), usar debouncing
    if (busquedaInput.length > ultimaBusqueda.length) {
      setBuscando(true);
      const timeoutId = setTimeout(() => {
        setFiltros(prev => ({
          ...prev,
          busqueda: busquedaInput
        }));
        setBuscando(false);
        setUltimaBusqueda(busquedaInput);
      }, 300); // Debouncing más corto para escritura

      return () => {
        clearTimeout(timeoutId);
        setBuscando(false);
      };
    }

    // Si está borrando, buscar inmediatamente
    if (busquedaInput.length < ultimaBusqueda.length) {
      setFiltros(prev => ({
        ...prev,
        busqueda: busquedaInput
      }));
      setBuscando(false);
      setUltimaBusqueda(busquedaInput);
    }
  }, [busquedaInput, ultimaBusqueda]);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await api.delete(`/productos/${id}`);
        toast.success('Producto eliminado exitosamente');
        refetch();
      } catch (error) {
        toast.error('Error al eliminar el producto');
      }
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'busqueda') {
      // Para búsqueda, usar el estado separado para debouncing
      setBusquedaInput(value);
    } else {
      // Para otros filtros, actualizar inmediatamente
      setFiltros({
        ...filtros,
        [name]: value
      });
    }
  };

  // Solo mostrar loading completo si es la carga inicial, no durante búsquedas
  if (isLoading && !data) {
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
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona el inventario de productos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/productos/nuevo"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Buscar</label>
              <div className="relative">
                {buscando ? (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
                <input
                  type="text"
                  name="busqueda"
                  className="form-input pl-10"
                  placeholder="Nombre, código o descripción..."
                  value={busquedaInput}
                  onChange={handleFiltroChange}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Categoría</label>
              <select
                name="categoria_id"
                className="form-select"
                value={filtros.categoria_id}
                onChange={handleFiltroChange}
              >
                <option value="">Todas las categorías</option>
                {categoriasData?.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltros({ busqueda: '', categoria_id: '', activo: '' });
                  setBusquedaInput('');
                  setBuscando(false);
                  setUltimaBusqueda('');
                }}
                className="btn btn-outline w-full"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="card">
        <div className="card-body p-0">
          {data?.productos?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio Compra (Q)</th>
                    <th>Precio Venta (Q)</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">{producto.nombre}</div>
                          {producto.descripcion && (
                            <div className="text-sm text-gray-500">{producto.descripcion}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {producto.categoria?.nombre}
                        </span>
                      </td>
                      <td className="text-sm text-gray-900">
                        Q{producto.precio_compra.toLocaleString()}
                      </td>
                      <td className="text-sm text-gray-900">
                        Q{producto.precio_venta.toLocaleString()}
                      </td>
                      <td>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {producto.stock}
                          </span>
                          {producto.stock <= producto.stock_minimo && (
                            <AlertTriangle className="ml-2 h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          producto.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/productos/${producto.id}/editar`}
                            className="action-btn edit"
                            title="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEliminar(producto.id)}
                            className="action-btn delete"
                            title="Eliminar producto"
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
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin productos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron productos con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {data?.paginacion && data.paginacion.totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((data.paginacion.pagina - 1) * data.paginacion.limite) + 1} a{' '}
            {Math.min(data.paginacion.pagina * data.paginacion.limite, data.paginacion.total)} de{' '}
            {data.paginacion.total} resultados
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
