const { 
  Venta, 
  Producto, 
  Categoria, 
  Proveedor, 
  Devolucion,
  Usuario 
} = require('../models');
const { Op } = require('sequelize');
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

    // Devoluciones pendientes
    const devolucionesPendientes = await Devolucion.count({
      where: { estado: 'pendiente' }
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

    // Ventas por método de pago (hoy)
    const ventasPorMetodo = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [inicioDia, finDia]
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
            devolucionesPendientes
          },
          inventario: {
            totalProductos,
            totalCategorias,
            totalProveedores
          },
          ventasPorMetodo
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

module.exports = {
  obtenerResumen,
  obtenerEstadisticas,
  obtenerGraficos
};