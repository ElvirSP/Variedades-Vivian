import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Save, ArrowLeft, Calendar, Search, X } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

// Constantes para estilos
const STYLES = {
  cardSelected: {
    backgroundColor: 'var(--primary-100)',
    border: '2px solid var(--primary-600)',
    boxShadow: 'var(--shadow-md)'
  },
  cardInteractive: {
    backgroundColor: 'white',
    border: '1px solid var(--secondary-200)',
    boxShadow: 'var(--shadow-sm)'
  },
  cardDisabled: {
    backgroundColor: 'var(--secondary-100)',
    border: '1px solid var(--secondary-200)',
    boxShadow: 'var(--shadow-sm)'
  },
  indicatorSelected: {
    backgroundColor: 'var(--primary-600)'
  },
  indicatorNormal: {
    backgroundColor: 'var(--secondary-300)'
  },
  textSelected: {
    color: 'var(--primary-900)'
  },
  textSecondary: {
    color: 'var(--secondary-800)'
  },
  textMuted: {
    color: 'var(--secondary-600)'
  },
  badgeSelected: {
    backgroundColor: 'var(--primary-200)',
    color: 'var(--primary-800)'
  },
  badgeNormal: {
    backgroundColor: 'var(--secondary-100)',
    color: 'var(--secondary-600)'
  },
  badgeSuccess: {
    backgroundColor: 'var(--success-50)',
    color: 'var(--success-600)'
  }
};

// Funciones helper para estilos
const getCardStyle = (isSelected, isDisabled = false) => {
  if (isDisabled) return STYLES.cardDisabled;
  return isSelected ? STYLES.cardSelected : STYLES.cardInteractive;
};

const getIndicatorStyle = (isSelected) => {
  return isSelected ? STYLES.indicatorSelected : STYLES.indicatorNormal;
};

const getTextStyle = (isSelected, type = 'primary') => {
  if (type === 'muted') return STYLES.textMuted;
  return isSelected ? STYLES.textSelected : STYLES.textSecondary;
};

const getBadgeStyle = (isSelected, variant = 'normal') => {
  if (variant === 'success') return STYLES.badgeSuccess;
  return isSelected ? STYLES.badgeSelected : STYLES.badgeNormal;
};

const DevolucionForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  // Query para obtener ventas por rango de fechas
  const { data: ventasData, isLoading: cargandoVentas, refetch: buscarVentas, error: errorVentas } = useQuery({
    queryKey: ['ventas-para-devolucion', fechaDesde, fechaHasta],
    queryFn: () => api.get('/ventas/para-devolucion', {
      params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
    }).then(res => res.data.data.ventas),
    enabled: false // Solo se ejecuta cuando se llama manualmente
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/devoluciones', data),
    onSuccess: () => {
      queryClient.invalidateQueries('devoluciones');
      toast.success('Devolución creada exitosamente');
      navigate('/devoluciones');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear la devolución');
    }
  });

  const buscarVentasPorFecha = () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Debe seleccionar ambas fechas');
      return;
    }

    if (new Date(fechaDesde) > new Date(fechaHasta)) {
      toast.error('La fecha desde debe ser anterior a la fecha hasta');
      return;
    }

    buscarVentas();
  };

  const seleccionarVenta = (venta) => {
    setVentaSeleccionada(venta);
    setProductoSeleccionado(null);
    setValue('venta_id', venta.id);
  };

  const seleccionarProducto = (detalle) => {
    setProductoSeleccionado(detalle);
    setValue('producto_id', detalle.producto.id);
    setValue('cantidad', Math.min(1, detalle.cantidad_disponible_devolver));
  };

  const onSubmit = (data) => {
    if (!ventaSeleccionada || !productoSeleccionado) {
      toast.error('Debe seleccionar una venta y un producto');
      return;
    }

    mutation.mutate(data);
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/devoluciones')}
          className="btn btn-outline mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Devolución</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra una nueva devolución de producto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selección de fechas */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Seleccionar Período</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Fecha Desde *</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Hasta *</label>
                <input
                  type="date"
                  className="form-input"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const hoy = new Date();
                    const hace30Dias = new Date();
                    hace30Dias.setDate(hace30Dias.getDate() - 30);
                    
                    setFechaDesde(hace30Dias.toISOString().split('T')[0]);
                    setFechaHasta(hoy.toISOString().split('T')[0]);
                  }}
                  className="btn btn-outline"
                  style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Últimos 30 días
                </button>
                
                <button
                  type="button"
                  onClick={buscarVentasPorFecha}
                  disabled={!fechaDesde || !fechaHasta}
                  className="btn btn-primary"
                  style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Ventas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de ventas */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Ventas del Período</h3>
          </div>
          <div className="card-body">
            {cargandoVentas ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Buscando ventas...</p>
              </div>
            ) : errorVentas ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-sm text-red-600">Error al buscar ventas</p>
                <p className="text-xs text-gray-500 mt-1">
                  {errorVentas.response?.data?.message || 'Error desconocido'}
                </p>
              </div>
            ) : ventasData && ventasData.length > 0 ? (
              <div className="space-y-5 max-h-96 overflow-y-auto">
                {ventasData.map((venta) => {
                  const isSelected = ventaSeleccionada?.id === venta.id;
                  
                  return (
                    <button
                      key={venta.id}
                      type="button"
                      onClick={() => seleccionarVenta(venta)}
                      className={`w-full text-left p-6 rounded-lg transition-all duration-200 ${
                        isSelected ? 'card-selected' : 'card-interactive'
                      }`}
                      style={getCardStyle(isSelected)}
                      aria-label={`Seleccionar venta ${venta.id} del ${new Date(venta.fecha).toLocaleDateString()}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={getIndicatorStyle(isSelected)}
                            aria-hidden="true"
                          ></div>
                          <div>
                            <div 
                              className="font-semibold"
                              style={getTextStyle(isSelected)}
                            >
                              Venta #{venta.id}
                            </div>
                            <div 
                              className="text-sm"
                              style={getTextStyle(isSelected, 'muted')}
                            >
                              {new Date(venta.fecha).toLocaleDateString()} - Q{parseFloat(venta.total).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div 
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={getBadgeStyle(isSelected)}
                        >
                          {venta.detalles?.length || 0} producto(s)
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : ventasData && ventasData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay ventas en este período</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Selecciona un período para buscar ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos de la venta seleccionada */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Productos de la Venta</h3>
          </div>
          <div className="card-body">
            {ventaSeleccionada ? (
              <div className="space-y-5 max-h-96 overflow-y-auto">
                {ventaSeleccionada.detalles?.map((detalle) => {
                  const isSelected = productoSeleccionado?.producto?.id === detalle.producto.id;
                  const isDisabled = detalle.cantidad_disponible_devolver === 0;
                  
                  return (
                    <button
                      key={detalle.id}
                      type="button"
                      onClick={() => seleccionarProducto(detalle)}
                      disabled={isDisabled}
                      className={`w-full text-left p-6 rounded-lg transition-all duration-200 ${
                        isSelected ? 'card-selected' : isDisabled ? 'opacity-50 cursor-not-allowed' : 'card-interactive'
                      }`}
                      style={getCardStyle(isSelected, isDisabled)}
                      aria-label={`Seleccionar producto ${detalle.producto.nombre}${isDisabled ? ' (no disponible)' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={getIndicatorStyle(isSelected)}
                            aria-hidden="true"
                          ></div>
                          <div className="flex-1">
                            <div 
                              className="font-semibold"
                              style={getTextStyle(isSelected)}
                            >
                              {detalle.producto.nombre}
                            </div>
                            <div 
                              className="text-sm"
                              style={getTextStyle(isSelected, 'muted')}
                            >
                              Cantidad vendida: {detalle.cantidad} | Precio: Q{detalle.precio_unitario.toLocaleString()}
                            </div>
                            {detalle.cantidad_devuelta > 0 && (
                              <div className="text-xs font-medium mt-1" style={{ color: 'var(--warning-600)' }}>
                                Ya devueltas: {detalle.cantidad_devuelta} | Disponibles: {detalle.cantidad_disponible_devolver}
                              </div>
                            )}
                            {isDisabled && (
                              <div className="text-xs font-medium mt-1" style={{ color: 'var(--error-600)' }}>
                                ⚠️ Todas las unidades ya fueron devueltas
                              </div>
                            )}
                          </div>
                        </div>
                        {!isDisabled && (
                          <div 
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={getBadgeStyle(isSelected, 'success')}
                          >
                            Disponible: {detalle.cantidad_disponible_devolver}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Selecciona una venta para ver sus productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario de devolución */}
      {ventaSeleccionada && productoSeleccionado && (
        <div className="mt-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Detalles de la Devolución</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Resumen de la selección */}
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--primary-50)',
                    border: '1px solid var(--primary-200)'
                  }}
                >
                  <h4 
                    className="font-semibold mb-3 flex items-center"
                    style={{ color: 'var(--primary-900)' }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: 'var(--primary-600)' }}
                      aria-hidden="true"
                    ></div>
                    Resumen de la Devolución
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div 
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid var(--primary-100)'
                      }}
                    >
                      <span className="font-medium" style={{ color: 'var(--primary-600)' }}>Venta:</span>
                      <div className="font-semibold mt-1" style={{ color: 'var(--primary-900)' }}>#{ventaSeleccionada.id}</div>
                    </div>
                    <div 
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid var(--primary-100)'
                      }}
                    >
                      <span className="font-medium" style={{ color: 'var(--primary-600)' }}>Producto:</span>
                      <div className="font-semibold mt-1" style={{ color: 'var(--primary-900)' }}>{productoSeleccionado.producto.nombre}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">
                      Cantidad a Devolver * 
                      <span className="text-sm text-gray-500 ml-2">
                        (Máximo: {productoSeleccionado.cantidad_disponible_devolver})
                      </span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={productoSeleccionado.cantidad_disponible_devolver}
                      className={`form-input ${errors.cantidad ? 'error' : ''}`}
                      {...register('cantidad', { 
                        required: 'La cantidad es requerida',
                        min: { value: 1, message: 'La cantidad debe ser mayor a 0' },
                        max: { 
                          value: productoSeleccionado.cantidad_disponible_devolver, 
                          message: `La cantidad máxima disponible es ${productoSeleccionado.cantidad_disponible_devolver}` 
                        }
                      })}
                    />
                    {errors.cantidad && (
                      <p className="form-error">{errors.cantidad.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Motivo *</label>
                    <select
                      className={`form-select ${errors.motivo ? 'error' : ''}`}
                      {...register('motivo', { required: 'El motivo es requerido' })}
                    >
                      <option value="">Seleccionar motivo</option>
                      <option value="defectuoso">Producto Defectuoso</option>
                      <option value="cambio">Cambio</option>
                      <option value="otro">Otro</option>
                    </select>
                    {errors.motivo && (
                      <p className="form-error">{errors.motivo.message}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    {...register('descripcion')}
                    placeholder="Describe el motivo de la devolución..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/devoluciones')}
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
                    {mutation.isLoading ? 'Guardando...' : 'Crear Devolución'}
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

export default DevolucionForm;