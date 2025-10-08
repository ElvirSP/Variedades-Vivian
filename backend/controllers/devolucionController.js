const { Devolucion, Venta, DetalleVenta, Producto, Usuario } = require('../models');
const { Op } = require('sequelize');


// Obtener todas las devoluciones
const obtenerDevoluciones = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      fecha_desde, 
      fecha_hasta, 
      estado,
      motivo,
      busqueda 
    } = req.query;
    
    const offset = (pagina - 1) * limite;

    // Construir filtros
    const filtros = {};
    
    if (fecha_desde && fecha_hasta) {
      filtros.fecha_devolucion = {
        [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)]
      };
    } else if (fecha_desde) {
      filtros.fecha_devolucion = {
        [Op.gte]: new Date(fecha_desde)
      };
    } else if (fecha_hasta) {
      filtros.fecha_devolucion = {
        [Op.lte]: new Date(fecha_hasta)
      };
    }

    if (estado) {
      filtros.estado = estado;
    }

    if (motivo) {
      filtros.motivo = motivo;
    }

    if (busqueda) {
      filtros[Op.or] = [
        { descripcion: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const { count, rows: devoluciones } = await Devolucion.findAndCountAll({
      where: filtros,
      include: [
        { 
          model: Usuario, 
          as: 'usuario', 
          attributes: ['id', 'nombre'] 
        },
        {
          model: Venta,
          as: 'venta',
          attributes: ['id', 'fecha']
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre']
        }
      ],
      limit: parseInt(limite),
      offset: parseInt(offset),
      order: [['fecha_devolucion', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        devoluciones,
        paginacion: {
          total: count,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(count / limite)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener devolución por ID
const obtenerDevolucion = async (req, res) => {
  try {
    const { id } = req.params;

    const devolucion = await Devolucion.findByPk(id, {
      include: [
        { 
          model: Usuario, 
          as: 'usuario', 
          attributes: ['id', 'nombre'] 
        },
        {
          model: Venta,
          as: 'venta',
          attributes: ['id', 'fecha', 'total']
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'precio_venta']
        }
      ]
    });

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    res.json({
      success: true,
      data: { devolucion }
    });

  } catch (error) {
    console.error('Error al obtener devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva devolución
const crearDevolucion = async (req, res) => {
  const transaction = await Devolucion.sequelize.transaction();
  
  try {
    const {
      venta_id,
      producto_id,
      cantidad,
      motivo,
      descripcion
    } = req.body;

    // Validar datos requeridos
    if (!venta_id || !producto_id || !cantidad || !motivo) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Venta, producto, cantidad y motivo son requeridos'
      });
    }

    // Verificar que la venta existe
    const venta = await Venta.findByPk(venta_id);
    if (!venta) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Verificar que el producto existe
    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que el producto está en la venta
    const detalleVenta = await DetalleVenta.findOne({
      where: { 
        venta_id: venta_id,
        producto_id: producto_id
      }
    });

    if (!detalleVenta) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El producto no está en esta venta'
      });
    }

    const cantidadVendida = detalleVenta.cantidad;
    
    // Calcular cuántas unidades ya se han devuelto de este producto en esta venta
    const devolucionesPrevias = await Devolucion.findAll({
      where: {
        venta_id: venta_id,
        producto_id: producto_id
      },
      attributes: ['cantidad']
    });
    
    const cantidadYaDevuelta = devolucionesPrevias.reduce((total, dev) => total + dev.cantidad, 0);
    const cantidadDisponibleParaDevolver = cantidadVendida - cantidadYaDevuelta;
    
    if (cantidad > cantidadDisponibleParaDevolver) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La cantidad a devolver (${cantidad}) no puede ser mayor a la disponible (${cantidadDisponibleParaDevolver}). Ya se han devuelto ${cantidadYaDevuelta} de ${cantidadVendida} unidades vendidas.`
      });
    }
    
    if (cantidadDisponibleParaDevolver === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `No hay unidades disponibles para devolver. Ya se han devuelto todas las ${cantidadVendida} unidades vendidas.`
      });
    }


    // Calcular monto de devolución
    const monto_devolucion = cantidad * producto.precio_venta;

    // Crear devolución
    const devolucion = await Devolucion.create({
      venta_id,
      producto_id,
      cantidad,
      motivo,
      descripcion,
      monto_devolucion,
      usuario_id: req.usuario.id
    }, { transaction });

    await transaction.commit();

    // Obtener la devolución creada con sus relaciones
    const devolucionCompleta = await Devolucion.findByPk(devolucion.id, {
      include: [
        {
          model: Venta,
          as: 'venta',
          attributes: ['id', 'fecha']
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Devolución creada exitosamente',
      data: { devolucion: devolucionCompleta }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Procesar devolución (aprobar y restaurar stock)
const procesarDevolucion = async (req, res) => {
  const transaction = await Devolucion.sequelize.transaction();
  
  try {
    const { id } = req.params;

    const devolucion = await Devolucion.findByPk(id, {
      include: [
        {
          model: Producto,
          as: 'producto'
        }
      ]
    });

    if (!devolucion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    if (devolucion.estado !== 'pendiente') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden procesar devoluciones pendientes'
      });
    }

    // Restaurar stock del producto
    await devolucion.producto.update({
      stock: devolucion.producto.stock + devolucion.cantidad
    }, { transaction });

    // Actualizar estado de la devolución
    await devolucion.update({
      estado: 'procesada'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Devolución procesada exitosamente',
      data: { devolucion }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al procesar devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar estado de devolución
const actualizarEstadoDevolucion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const devolucion = await Devolucion.findByPk(id);

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    await devolucion.update({ estado });

    res.json({
      success: true,
      message: 'Estado de devolución actualizado exitosamente',
      data: { devolucion }
    });

  } catch (error) {
    console.error('Error al actualizar estado de devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar devolución
const eliminarDevolucion = async (req, res) => {
  try {
    const { id } = req.params;

    const devolucion = await Devolucion.findByPk(id);

    if (!devolucion) {
      return res.status(404).json({
        success: false,
        message: 'Devolución no encontrada'
      });
    }

    if (devolucion.estado === 'procesada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una devolución ya procesada'
      });
    }

    await devolucion.destroy();

    res.json({
      success: true,
      message: 'Devolución eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar devolución:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar reporte de devoluciones
const generarReporteDevoluciones = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, formato = 'pdf' } = req.query;
    
    // Construir filtros de fecha
    const filtros = {};
    if (fecha_desde && fecha_hasta) {
      // Ajustar fecha_hasta para incluir todo el día (hasta 23:59:59)
      const fechaHastaAjustada = new Date(fecha_hasta);
      fechaHastaAjustada.setHours(23, 59, 59, 999);
      
      filtros.fecha_devolucion = {
        [Op.between]: [new Date(fecha_desde), fechaHastaAjustada]
      };
    } else if (fecha_desde) {
      filtros.fecha_devolucion = {
        [Op.gte]: new Date(fecha_desde)
      };
    } else if (fecha_hasta) {
      // Ajustar fecha_hasta para incluir todo el día
      const fechaHastaAjustada = new Date(fecha_hasta);
      fechaHastaAjustada.setHours(23, 59, 59, 999);
      
      filtros.fecha_devolucion = {
        [Op.lte]: fechaHastaAjustada
      };
    }

    // Obtener devoluciones con detalles
    const devoluciones = await Devolucion.findAll({
      where: filtros,
      include: [
        {
          model: Venta,
          as: 'venta',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['nombre', 'email']
            }
          ]
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['nombre', 'precio_venta']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombre', 'email']
        }
      ],
      order: [['fecha_devolucion', 'DESC']]
    });

    // Calcular estadísticas
    const totalDevoluciones = devoluciones.length;
    const totalMonto = devoluciones.reduce((sum, dev) => sum + parseFloat(dev.monto_devolucion || 0), 0);
    const devolucionesProcesadas = devoluciones.filter(d => d.estado === 'procesada').length;
    const devolucionesPendientes = devoluciones.filter(d => d.estado === 'pendiente').length;

    const reporte = {
      periodo: {
        desde: fecha_desde || 'Inicio',
        hasta: fecha_hasta || 'Actual'
      },
      resumen: {
        totalDevoluciones,
        totalMonto,
        devolucionesProcesadas,
        devolucionesPendientes
      },
      devoluciones: devoluciones.map(devolucion => ({
        id: devolucion.id,
        fecha: devolucion.fecha_devolucion,
        motivo: devolucion.motivo,
        descripcion: devolucion.descripcion,
        cantidad: devolucion.cantidad,
        monto: devolucion.monto_devolucion,
        estado: devolucion.estado,
        producto: devolucion.producto?.nombre,
        venta_id: devolucion.venta_id,
        vendedor_original: devolucion.venta?.usuario?.nombre,
        procesado_por: devolucion.usuario?.nombre
      }))
    };

    res.json({
      success: true,
      data: reporte
    });

  } catch (error) {
    console.error('Error al generar reporte de devoluciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de devoluciones'
    });
  }
};

module.exports = {
  obtenerDevoluciones,
  obtenerDevolucion,
  crearDevolucion,
  procesarDevolucion,
  actualizarEstadoDevolucion,
  eliminarDevolucion,
  generarReporteDevoluciones
};
