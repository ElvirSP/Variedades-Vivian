const { 
  Venta, 
  Producto, 
  Categoria, 
  Proveedor, 
  Devolucion,
  Usuario,
  DetalleVenta
} = require('../models');
const { Op } = require('sequelize');
const recalcularTotales = require('../utils/recalcularTotales');
const sequelize = require('../config/database');

// Obtener resumen del dashboard
const obtenerResumen = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

    // Estadísticas del día
    const ventasHoy = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [inicioDia, finDia]
        },
        estado: 'completada'
      }
    });

    const totalVentasHoy = ventasHoy.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
    const cantidadVentasHoy = ventasHoy.length;

    // Productos con stock bajo
    const productosStockBajo = await Producto.count({
      where: {
        activo: true,
        stock: {
          [Op.lte]: sequelize.col('stock_minimo')
        }
      }
    });

    // Devoluciones del día
    const devolucionesHoy = await Devolucion.count({
      where: {
        fecha_devolucion: {
          [Op.between]: [inicioDia, finDia]
        }
      }
    });

    // Total de productos activos
    const totalProductos = await Producto.count({
      where: { activo: true }
    });

    // Total de categorías activas
    const totalCategorias = await Categoria.count({
      where: { activa: true }
    });

    // Total de proveedores activos
    const totalProveedores = await Proveedor.count({
      where: { activo: true }
    });


    res.json({
      success: true,
      data: {
        resumen: {
          ventasHoy: {
            cantidad: cantidadVentasHoy,
            total: totalVentasHoy
          },
          alertas: {
            productosStockBajo,
            devolucionesHoy
          },
          inventario: {
            totalProductos,
            totalCategorias,
            totalProveedores
          }
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas por período
const obtenerEstadisticas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, tipo = 'diario' } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas desde y hasta son requeridas'
      });
    }

    const fechaDesde = new Date(fecha_desde);
    const fechaHasta = new Date(fecha_hasta);

    // Ventas en el período
    const ventas = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaDesde, fechaHasta]
        },
        estado: 'completada'
      },
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              include: [
                {
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['nombre']
                }
              ]
            }
          ]
        }
      ]
    });

    // Calcular estadísticas
    const totalVentas = ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
    const cantidadVentas = ventas.length;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    // Productos más vendidos
    const productosVendidos = {};
    ventas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const productoId = detalle.producto_id;
        const productoNombre = detalle.producto.nombre;
        const categoriaNombre = detalle.producto.categoria.nombre;
        
        if (!productosVendidos[productoId]) {
          productosVendidos[productoId] = {
            nombre: productoNombre,
            categoria: categoriaNombre,
            cantidad: 0,
            total: 0
          };
        }
        
        productosVendidos[productoId].cantidad += detalle.cantidad;
        productosVendidos[productoId].total += parseFloat(detalle.subtotal);
      });
    });

    const productosMasVendidos = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // Ventas por categoría
    const ventasPorCategoria = {};
    ventas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const categoriaNombre = detalle.producto.categoria.nombre;
        
        if (!ventasPorCategoria[categoriaNombre]) {
          ventasPorCategoria[categoriaNombre] = {
            categoria: categoriaNombre,
            cantidad: 0,
            total: 0
          };
        }
        
        ventasPorCategoria[categoriaNombre].cantidad += detalle.cantidad;
        ventasPorCategoria[categoriaNombre].total += parseFloat(detalle.subtotal);
      });
    });

    const ventasPorCategoriaArray = Object.values(ventasPorCategoria)
      .sort((a, b) => b.total - a.total);

    // Ventas por día (si es período diario)
    let ventasPorDia = [];
    if (tipo === 'diario') {
      const ventasPorDiaMap = {};
      
      ventas.forEach(venta => {
        const fecha = venta.fecha.toISOString().split('T')[0];
        
        if (!ventasPorDiaMap[fecha]) {
          ventasPorDiaMap[fecha] = {
            fecha,
            cantidad: 0,
            total: 0
          };
        }
        
        ventasPorDiaMap[fecha].cantidad += 1;
        ventasPorDiaMap[fecha].total += parseFloat(venta.total);
      });
      
      ventasPorDia = Object.values(ventasPorDiaMap)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }

    res.json({
      success: true,
      data: {
        periodo: {
          fecha_desde,
          fecha_hasta,
          tipo
        },
        resumen: {
          totalVentas,
          cantidadVentas,
          promedioVenta
        },
        productosMasVendidos,
        ventasPorCategoria: ventasPorCategoriaArray,
        ventasPorDia
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener gráficos para el dashboard
const obtenerGraficos = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));

    // Ventas por día
    const ventasPorDia = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'completada'
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('fecha')), 'fecha'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: [sequelize.fn('DATE', sequelize.col('fecha'))],
      order: [[sequelize.fn('DATE', sequelize.col('fecha')), 'ASC']]
    });

    // Ventas por método de pago
    const ventasPorMetodo = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'completada'
      },
      attributes: [
        'metodo_pago',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: ['metodo_pago']
    });

    // Top 5 productos más vendidos
    const topProductos = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'completada'
      },
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    const productosVendidos = {};
    topProductos.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const productoNombre = detalle.producto.nombre;
        
        if (!productosVendidos[productoNombre]) {
          productosVendidos[productoNombre] = {
            nombre: productoNombre,
            cantidad: 0
          };
        }
        
        productosVendidos[productoNombre].cantidad += detalle.cantidad;
      });
    });

    const top5Productos = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        ventasPorDia,
        ventasPorMetodo,
        topProductos: top5Productos
      }
    });

  } catch (error) {
    console.error('Error al obtener gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ventas por período (para gráficas dinámicas)
const obtenerVentasPorPeriodo = async (req, res) => {
  try {
    const { periodo, fecha } = req.query;
    
    console.log('Endpoint llamado con:', { periodo, fecha });
    
    if (!periodo || !fecha) {
      return res.status(400).json({
        success: false,
        message: 'Los parámetros periodo y fecha son requeridos'
      });
    }

    const fechaBase = new Date(fecha);
    let whereClause = {};
    let groupBy = '';

    switch(periodo) {
      case 'dia':
        const inicioDia = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate());
        const finDia = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate() + 1);
        whereClause = {
          fecha: { [Op.between]: [inicioDia, finDia] },
          estado: 'completada'
        };
        groupBy = sequelize.fn('HOUR', sequelize.col('fecha'));
        break;
        
      case 'semana':
        const inicioSemana = new Date(fechaBase);
        inicioSemana.setDate(fechaBase.getDate() - fechaBase.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        whereClause = {
          fecha: { [Op.between]: [inicioSemana, finSemana] },
          estado: 'completada'
        };
        groupBy = sequelize.fn('DATE', sequelize.col('fecha'));
        break;
        
      case 'mes':
        const inicioMes = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
        const finMes = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
        whereClause = {
          fecha: { [Op.between]: [inicioMes, finMes] },
          estado: 'completada'
        };
        groupBy = sequelize.fn('DATE', sequelize.col('fecha'));
        break;
        
      case 'año':
        const inicioAño = new Date(fechaBase.getFullYear(), 0, 1);
        const finAño = new Date(fechaBase.getFullYear(), 11, 31);
        whereClause = {
          fecha: { [Op.between]: [inicioAño, finAño] },
          estado: 'completada'
        };
        groupBy = sequelize.fn('MONTH', sequelize.col('fecha'));
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Período no válido. Use: dia, semana, mes, año'
        });
    }

    console.log('Consulta SQL:', { whereClause, groupBy });
    
    const ventas = await Venta.findAll({
      where: whereClause,
      attributes: [
        [groupBy, 'periodo'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ],
      group: [groupBy],
      order: [[groupBy, 'ASC']]
    });

    console.log('Resultados encontrados:', ventas.length);
    console.log('Datos:', ventas);

    res.json({
      success: true,
      data: {
        periodo,
        fecha,
        ventas
      }
    });

  } catch (error) {
    console.error('Error al obtener ventas por período:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener categorías más vendidas
const obtenerCategoriasMasVendidas = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));

    const categorias = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'completada'
      },
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              include: [
                {
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['nombre']
                }
              ]
            }
          ]
        }
      ]
    });

    const categoriasVendidas = {};
    categorias.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const categoriaNombre = detalle.producto.categoria.nombre;
        
        if (!categoriasVendidas[categoriaNombre]) {
          categoriasVendidas[categoriaNombre] = {
            categoria: categoriaNombre,
            cantidad: 0,
            total: 0
          };
        }
        
        categoriasVendidas[categoriaNombre].cantidad += detalle.cantidad;
        categoriasVendidas[categoriaNombre].total += parseFloat(detalle.subtotal);
      });
    });

    const categoriasArray = Object.values(categoriasVendidas)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    res.json({
      success: true,
      data: categoriasArray
    });

  } catch (error) {
    console.error('Error al obtener categorías más vendidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ventas por categoría (gráfica de pastel)
const obtenerVentasPorCategoria = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));

    const ventas = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'completada'
      },
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              include: [
                {
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['nombre']
                }
              ]
            }
          ]
        }
      ]
    });

    const ventasPorCategoria = {};
    let totalGeneral = 0;

    ventas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const categoriaNombre = detalle.producto.categoria.nombre;
        const subtotal = parseFloat(detalle.subtotal);
        
        if (!ventasPorCategoria[categoriaNombre]) {
          ventasPorCategoria[categoriaNombre] = {
            categoria: categoriaNombre,
            total: 0,
            cantidad: 0
          };
        }
        
        ventasPorCategoria[categoriaNombre].total += subtotal;
        ventasPorCategoria[categoriaNombre].cantidad += detalle.cantidad;
        totalGeneral += subtotal;
      });
    });

    // Calcular porcentajes
    const categoriasConPorcentaje = Object.values(ventasPorCategoria).map(cat => ({
      ...cat,
      porcentaje: totalGeneral > 0 ? ((cat.total / totalGeneral) * 100).toFixed(2) : 0
    })).sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      data: {
        categorias: categoriasConPorcentaje,
        totalGeneral
      }
    });

  } catch (error) {
    console.error('Error al obtener ventas por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


// Obtener productos más vendidos
const obtenerProductosMasVendidos = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));

    const ventas = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'completada'
      },
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              include: [
                {
                  model: Categoria,
                  as: 'categoria',
                  attributes: ['nombre']
                }
              ]
            }
          ]
        }
      ]
    });

    const productosVendidos = {};
    ventas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const productoId = detalle.producto_id;
        const productoNombre = detalle.producto.nombre;
        const categoriaNombre = detalle.producto.categoria.nombre;
        
        if (!productosVendidos[productoId]) {
          productosVendidos[productoId] = {
            nombre: productoNombre,
            categoria: categoriaNombre,
            cantidad: 0,
            total: 0
          };
        }
        
        productosVendidos[productoId].cantidad += detalle.cantidad;
        productosVendidos[productoId].total += parseFloat(detalle.subtotal);
      });
    });

    const productosArray = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    res.json({
      success: true,
      data: productosArray
    });

  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener datos de ventas vs meta
const obtenerVentasMeta = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));

    const ventas = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        },
        estado: 'completada'
      }
    });

    const ventasReales = ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
    const cantidadVentas = ventas.length;
    const promedioVenta = cantidadVentas > 0 ? ventasReales / cantidadVentas : 0;

    res.json({
      success: true,
      data: {
        ventasReales,
        cantidadVentas,
        promedioVenta,
        periodo: {
          dias,
          fechaInicio: fechaInicio.toISOString().split('T')[0],
          fechaFin: fechaFin.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener ventas vs meta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener devoluciones mensuales
const obtenerDevolucionesMensuales = async (req, res) => {
  try {
    const { meses = 12 } = req.query;
    
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - parseInt(meses));

    const devoluciones = await Devolucion.findAll({
      where: {
        fecha_devolucion: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      include: [
        {
          model: Producto,
          as: 'producto',
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    // Agrupar por mes
    const devolucionesPorMes = {};
    devoluciones.forEach(devolucion => {
      const fecha = new Date(devolucion.fecha_devolucion);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      if (!devolucionesPorMes[mes]) {
        devolucionesPorMes[mes] = {
          mes: nombreMes,
          cantidad: 0,
          monto: 0,
          productos: {}
        };
      }
      
      devolucionesPorMes[mes].cantidad += 1;
      devolucionesPorMes[mes].monto += parseFloat(devolucion.monto_devolucion);
      
      // Contar productos devueltos
      const productoId = devolucion.producto_id;
      const productoNombre = devolucion.producto.nombre;
      const categoriaNombre = devolucion.producto.categoria.nombre;
      
      if (!devolucionesPorMes[mes].productos[productoId]) {
        devolucionesPorMes[mes].productos[productoId] = {
          nombre: productoNombre,
          categoria: categoriaNombre,
          cantidad: 0
        };
      }
      
      devolucionesPorMes[mes].productos[productoId].cantidad += 1;
    });

    // Convertir a array y ordenar por mes
    const devolucionesArray = Object.values(devolucionesPorMes)
      .sort((a, b) => new Date(a.mes) - new Date(b.mes));

    // Obtener productos más devueltos en el período
    const productosDevueltos = {};
    devoluciones.forEach(devolucion => {
      const productoId = devolucion.producto_id;
      const productoNombre = devolucion.producto.nombre;
      const categoriaNombre = devolucion.producto.categoria.nombre;
      
      if (!productosDevueltos[productoId]) {
        productosDevueltos[productoId] = {
          nombre: productoNombre,
          categoria: categoriaNombre,
          cantidad: 0,
          monto: 0
        };
      }
      
      productosDevueltos[productoId].cantidad += 1;
      productosDevueltos[productoId].monto += parseFloat(devolucion.monto_devolucion);
    });

    const topProductosDevueltos = Object.values(productosDevueltos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        devolucionesPorMes: devolucionesArray,
        topProductosDevueltos,
        resumen: {
          totalDevoluciones: devoluciones.length,
          montoTotal: devoluciones.reduce((sum, dev) => sum + parseFloat(dev.monto_devolucion), 0),
          promedioMensual: devolucionesArray.length > 0 ? 
            devolucionesArray.reduce((sum, mes) => sum + mes.cantidad, 0) / devolucionesArray.length : 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener devoluciones mensuales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Recalcular totales de ventas
const recalcularTotalesVentas = async (req, res) => {
  try {
    console.log('Iniciando recálculo de totales...');
    await recalcularTotales();
    
    res.json({
      success: true,
      message: 'Totales recalculados exitosamente'
    });
  } catch (error) {
    console.error('Error al recalcular totales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular totales'
    });
  }
};

// Generar reporte consolidado (ventas - devoluciones)
const generarReporteConsolidado = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, formato = 'pdf' } = req.query;
    
    // Construir filtros de fecha
    const filtrosVentas = {};
    const filtrosDevoluciones = {};
    
    if (fecha_desde && fecha_hasta) {
      // Ajustar fechas para incluir todo el día
      const fechaDesdeAjustada = new Date(fecha_desde);
      fechaDesdeAjustada.setHours(0, 0, 0, 0);
      
      // Extender la fecha hasta al día siguiente para capturar registros guardados en UTC
      const fechaHastaAjustada = new Date(fecha_hasta);
      fechaHastaAjustada.setDate(fechaHastaAjustada.getDate() + 1);
      fechaHastaAjustada.setHours(23, 59, 59, 999);
      
      filtrosVentas.fecha = {
        [Op.between]: [fechaDesdeAjustada, fechaHastaAjustada]
      };
      
      filtrosDevoluciones.fecha_devolucion = {
        [Op.between]: [fechaDesdeAjustada, fechaHastaAjustada]
      };
    } else if (fecha_desde) {
      const fechaDesdeAjustada = new Date(fecha_desde);
      fechaDesdeAjustada.setHours(0, 0, 0, 0);
      
      filtrosVentas.fecha = {
        [Op.gte]: fechaDesdeAjustada
      };
      filtrosDevoluciones.fecha_devolucion = {
        [Op.gte]: fechaDesdeAjustada
      };
    } else if (fecha_hasta) {
      // Extender la fecha hasta al día siguiente para capturar registros guardados en UTC
      const fechaHastaAjustada = new Date(fecha_hasta);
      fechaHastaAjustada.setDate(fechaHastaAjustada.getDate() + 1);
      fechaHastaAjustada.setHours(23, 59, 59, 999);
      
      filtrosVentas.fecha = {
        [Op.lte]: fechaHastaAjustada
      };
      filtrosDevoluciones.fecha_devolucion = {
        [Op.lte]: fechaHastaAjustada
      };
    }

    // Obtener ventas con detalles
    const ventas = await Venta.findAll({
      where: filtrosVentas,
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              include: [
                {
                  model: Categoria,
                  as: 'categoria'
                }
              ]
            }
          ]
        }
      ],
      order: [['fecha', 'DESC']]
    });

    // Obtener devoluciones con detalles
    const devoluciones = await Devolucion.findAll({
      where: filtrosDevoluciones,
      include: [
        {
          model: Producto,
          as: 'producto',
          include: [
            {
              model: Categoria,
              as: 'categoria'
            }
          ]
        }
      ],
      order: [['fecha_devolucion', 'DESC']]
    });

    // Calcular totales
    const totalVentas = ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
    const totalDevoluciones = devoluciones.reduce((sum, dev) => sum + parseFloat(dev.monto_devolucion), 0);
    const totalNeto = totalVentas - totalDevoluciones;

    // Preparar datos del reporte
    const reporte = {
      resumen: {
        totalVentas: ventas.length,
        totalDevoluciones: devoluciones.length,
        montoVentas: totalVentas,
        montoDevoluciones: totalDevoluciones,
        totalNeto: totalNeto,
        ventasCompletadas: ventas.filter(v => v.estado === 'completada').length,
        ventasPendientes: ventas.filter(v => v.estado === 'pendiente').length,
        devolucionesProcesadas: devoluciones.filter(d => d.estado === 'procesada').length,
        devolucionesPendientes: devoluciones.filter(d => d.estado === 'pendiente').length
      },
      ventas: ventas.map(venta => ({
        id: venta.id,
        fecha: venta.fecha,
        total: venta.total,
        observaciones: venta.observaciones || 'N/A',
        productos: venta.detalles.map(detalle => ({
          nombre: detalle.producto?.nombre || 'N/A',
          categoria: detalle.producto?.categoria?.nombre || 'N/A',
          cantidad: detalle.cantidad,
          precio: detalle.precio_unitario
        }))
      })),
      devoluciones: devoluciones.map(devolucion => ({
        id: devolucion.id,
        fecha: devolucion.fecha_devolucion,
        producto: devolucion.producto?.nombre || 'N/A',
        categoria: devolucion.producto?.categoria?.nombre || 'N/A',
        cantidad: devolucion.cantidad,
        monto: devolucion.monto_devolucion,
        motivo: devolucion.motivo || 'N/A',
        descripcion: devolucion.descripcion || 'N/A'
      }))
    };

    res.json({
      success: true,
      data: reporte
    });

  } catch (error) {
    console.error('Error al generar reporte consolidado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte consolidado'
    });
  }
};

module.exports = {
  obtenerResumen,
  obtenerEstadisticas,
  obtenerGraficos,
  obtenerVentasPorPeriodo,
  obtenerCategoriasMasVendidas,
  obtenerVentasPorCategoria,
  obtenerProductosMasVendidos,
  obtenerVentasMeta,
  obtenerDevolucionesMensuales,
  recalcularTotalesVentas,
  generarReporteConsolidado
};