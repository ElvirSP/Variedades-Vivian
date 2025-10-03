const { Venta, DetalleVenta, Producto, Usuario } = require('../models');
const { Op } = require('sequelize');


// Obtener todas las ventas
const obtenerVentas = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      fecha_desde, 
      fecha_hasta, 
      estado,
      metodo_pago,
      busqueda 
    } = req.query;
    
    const offset = (pagina - 1) * limite;

    // Construir filtros
    const filtros = {};
    
    if (fecha_desde && fecha_hasta) {
      filtros.fecha = {
        [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)]
      };
    } else if (fecha_desde) {
      filtros.fecha = {
        [Op.gte]: new Date(fecha_desde)
      };
    } else if (fecha_hasta) {
      filtros.fecha = {
        [Op.lte]: new Date(fecha_hasta)
      };
    }

    if (estado) {
      filtros.estado = estado;
    }

    if (busqueda) {
      filtros[Op.or] = [
        { observaciones: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    // Primero obtener el conteo sin includes para evitar duplicados
    const totalVentas = await Venta.count({
      where: filtros
    });

    // Luego obtener las ventas con includes
    const ventas = await Venta.findAll({
      where: filtros,
      include: [
        { 
          model: Usuario, 
          as: 'usuario', 
          attributes: ['id', 'nombre'] 
        },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre']
            }
          ]
        }
      ],
      limit: parseInt(limite),
      offset: parseInt(offset),
      order: [['fecha', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        ventas,
        paginacion: {
          total: totalVentas,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(totalVentas / limite)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener venta por ID
const obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await Venta.findByPk(id, {
      include: [
        { 
          model: Usuario, 
          as: 'usuario', 
          attributes: ['id', 'nombre'] 
        },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'precio_venta']
            }
          ]
        }
      ]
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: { venta }
    });

  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva venta
const crearVenta = async (req, res) => {
  const transaction = await Venta.sequelize.transaction();
  
  try {
    const {
      productos,
      observaciones
    } = req.body;

    // Validar datos requeridos
    if (!productos || productos.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
    }


    // Calcular totales
    let subtotal = 0;
    const detallesVenta = [];

    // Verificar productos y calcular subtotal
    for (const item of productos) {
      const producto = await Producto.findByPk(item.producto_id);
      
      if (!producto) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${item.producto_id} no encontrado`
        });
      }

      if (!producto.activo) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `El producto ${producto.nombre} está inactivo`
        });
      }

      if (producto.stock < item.cantidad) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para el producto ${producto.nombre}. Disponible: ${producto.stock}`
        });
      }

      const precio_unitario = item.precio_unitario || producto.precio_venta;
      const subtotal_item = precio_unitario * item.cantidad;

      subtotal += subtotal_item;

      detallesVenta.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario,
        subtotal: subtotal_item
      });
    }

    const total = subtotal;

    // Crear venta
    const venta = await Venta.create({
      subtotal,
      total,
      observaciones,
      usuario_id: req.usuario.id
    }, { transaction });

    // Crear detalles de venta y actualizar stock
    for (const detalle of detallesVenta) {
      await DetalleVenta.create({
        venta_id: venta.id,
        ...detalle
      }, { transaction });

      // Actualizar stock del producto
      const producto = await Producto.findByPk(detalle.producto_id);
      await producto.update({
        stock: producto.stock - detalle.cantidad
      }, { transaction });
    }

    await transaction.commit();

    // Obtener la venta creada con sus detalles
    const ventaCompleta = await Venta.findByPk(venta.id, {
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: { venta: ventaCompleta }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar estado de venta
const actualizarEstadoVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const venta = await Venta.findByPk(id);

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    await venta.update({ estado });

    res.json({
      success: true,
      message: 'Estado de venta actualizado exitosamente',
      data: { venta }
    });

  } catch (error) {
    console.error('Error al actualizar estado de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar venta
const eliminarVenta = async (req, res) => {
  const transaction = await Venta.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const venta = await Venta.findByPk(id, {
      include: [
        {
          model: DetalleVenta,
          as: 'detalles'
        }
      ]
    });

    if (!venta) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Restaurar stock de productos
    for (const detalle of venta.detalles) {
      const producto = await Producto.findByPk(detalle.producto_id);
      await producto.update({
        stock: producto.stock + detalle.cantidad
      }, { transaction });
    }

    // Eliminar detalles de venta
    await DetalleVenta.destroy({
      where: { venta_id: id }
    }, { transaction });

    // Eliminar venta
    await venta.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Venta eliminada exitosamente'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de ventas
const obtenerEstadisticasVentas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const filtros = {};
    if (fecha_desde && fecha_hasta) {
      filtros.fecha = {
        [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)]
      };
    }

    const ventas = await Venta.findAll({
      where: filtros,
      attributes: [
        'estado',
        [Venta.sequelize.fn('COUNT', Venta.sequelize.col('id')), 'cantidad'],
        [Venta.sequelize.fn('SUM', Venta.sequelize.col('total')), 'total']
      ],
      group: ['estado']
    });

    const totalVentas = await Venta.sum('total', { where: filtros });
    const cantidadVentas = await Venta.count({ where: filtros });

    res.json({
      success: true,
      data: {
        estadisticas: ventas,
        resumen: {
          totalVentas,
          cantidadVentas,
          promedioVenta: cantidadVentas > 0 ? totalVentas / cantidadVentas : 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ventas por rango de fechas para devoluciones
const obtenerVentasParaDevolucion = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas desde y hasta son requeridas'
      });
    }

    // Ajustar fechas para incluir todo el día
    const fechaInicio = new Date(fecha_desde);
    fechaInicio.setHours(0, 0, 0, 0); // Inicio del día
    
    const fechaFin = new Date(fecha_hasta);
    fechaFin.setHours(23, 59, 59, 999); // Final del día

    const ventas = await Venta.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      include: [
        { 
          model: Usuario, 
          as: 'usuario', 
          attributes: ['id', 'nombre'] 
        },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre']
            }
          ]
        }
      ],
      order: [['fecha', 'DESC']]
    });

    // Para cada venta, calcular las cantidades ya devueltas por producto
    const { Devolucion } = require('../models');
    const ventasConDevoluciones = await Promise.all(ventas.map(async (venta) => {
      const ventaJSON = venta.toJSON();
      
      // Obtener todas las devoluciones de esta venta
      const devoluciones = await Devolucion.findAll({
        where: { venta_id: venta.id },
        attributes: ['producto_id', 'cantidad']
      });
      
      // Crear un mapa de cantidades devueltas por producto
      const cantidadesDevueltas = {};
      devoluciones.forEach(dev => {
        if (!cantidadesDevueltas[dev.producto_id]) {
          cantidadesDevueltas[dev.producto_id] = 0;
        }
        cantidadesDevueltas[dev.producto_id] += dev.cantidad;
      });
      
      // Agregar información de devoluciones a cada detalle
      ventaJSON.detalles = ventaJSON.detalles.map(detalle => ({
        ...detalle,
        cantidad_devuelta: cantidadesDevueltas[detalle.producto_id] || 0,
        cantidad_disponible_devolver: detalle.cantidad - (cantidadesDevueltas[detalle.producto_id] || 0)
      }));
      
      return ventaJSON;
    }));

    res.json({
      success: true,
      data: { ventas: ventasConDevoluciones }
    });

  } catch (error) {
    console.error('Error al obtener ventas para devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  obtenerVentas,
  obtenerVenta,
  crearVenta,
  actualizarEstadoVenta,
  eliminarVenta,
  obtenerEstadisticasVentas,
  obtenerVentasParaDevolucion
};
