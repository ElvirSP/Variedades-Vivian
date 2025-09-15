const { Venta, DetalleVenta, Producto, Usuario } = require('../models');
const { Op } = require('sequelize');

// Generar número de factura único
const generarNumeroFactura = async () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  
  // Buscar la última factura del día
  const ultimaVenta = await Venta.findOne({
    where: {
      numero_factura: {
        [Op.like]: `F${año}${mes}${dia}%`
      }
    },
    order: [['numero_factura', 'DESC']]
  });

  let consecutivo = 1;
  if (ultimaVenta) {
    const ultimoConsecutivo = parseInt(ultimaVenta.numero_factura.slice(-4));
    consecutivo = ultimoConsecutivo + 1;
  }

  return `F${año}${mes}${dia}${String(consecutivo).padStart(4, '0')}`;
};

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

    if (metodo_pago) {
      filtros.metodo_pago = metodo_pago;
    }

    if (busqueda) {
      filtros[Op.or] = [
        { numero_factura: { [Op.like]: `%${busqueda}%` } },
        { cliente_nombre: { [Op.like]: `%${busqueda}%` } },
        { cliente_telefono: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const { count, rows: ventas } = await Venta.findAndCountAll({
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
              attributes: ['id', 'nombre', 'codigo']
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
          total: count,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(count / limite)
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
              attributes: ['id', 'nombre', 'codigo', 'precio_venta']
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
      cliente_nombre,
      cliente_telefono,
      productos,
      descuento = 0,
      impuesto = 0,
      metodo_pago = 'efectivo',
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

    // Generar número de factura
    const numero_factura = await generarNumeroFactura();

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
      const descuento_item = item.descuento || 0;
      const subtotal_item = (precio_unitario * item.cantidad) - descuento_item;

      subtotal += subtotal_item;

      detallesVenta.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario,
        descuento: descuento_item,
        subtotal: subtotal_item
      });
    }

    const total = subtotal - descuento + impuesto;

    // Crear venta
    const venta = await Venta.create({
      numero_factura,
      cliente_nombre,
      cliente_telefono,
      subtotal,
      descuento,
      impuesto,
      total,
      metodo_pago,
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
              attributes: ['id', 'nombre', 'codigo']
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
        'metodo_pago',
        'estado',
        [Venta.sequelize.fn('COUNT', Venta.sequelize.col('id')), 'cantidad'],
        [Venta.sequelize.fn('SUM', Venta.sequelize.col('total')), 'total']
      ],
      group: ['metodo_pago', 'estado']
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

module.exports = {
  obtenerVentas,
  obtenerVenta,
  crearVenta,
  actualizarEstadoVenta,
  eliminarVenta,
  obtenerEstadisticasVentas
};
