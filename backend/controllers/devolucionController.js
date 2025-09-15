const { Devolucion, Venta, Producto, Usuario } = require('../models');
const { Op } = require('sequelize');

// Generar número de devolución único
const generarNumeroDevolucion = async () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  
  // Buscar la última devolución del día
  const ultimaDevolucion = await Devolucion.findOne({
    where: {
      numero_devolucion: {
        [Op.like]: `D${año}${mes}${dia}%`
      }
    },
    order: [['numero_devolucion', 'DESC']]
  });

  let consecutivo = 1;
  if (ultimaDevolucion) {
    const ultimoConsecutivo = parseInt(ultimaDevolucion.numero_devolucion.slice(-4));
    consecutivo = ultimoConsecutivo + 1;
  }

  return `D${año}${mes}${dia}${String(consecutivo).padStart(4, '0')}`;
};

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
        { numero_devolucion: { [Op.like]: `%${busqueda}%` } },
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
          attributes: ['id', 'numero_factura', 'fecha']
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'codigo']
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
          attributes: ['id', 'numero_factura', 'fecha', 'total']
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'codigo', 'precio_venta']
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
    const detalleVenta = await venta.getDetalles({
      where: { producto_id }
    });

    if (detalleVenta.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El producto no está en esta venta'
      });
    }

    const cantidadVendida = detalleVenta[0].cantidad;
    if (cantidad > cantidadVendida) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `La cantidad a devolver (${cantidad}) no puede ser mayor a la vendida (${cantidadVendida})`
      });
    }

    // Generar número de devolución
    const numero_devolucion = await generarNumeroDevolucion();

    // Calcular monto de devolución
    const monto_devolucion = cantidad * producto.precio_venta;

    // Crear devolución
    const devolucion = await Devolucion.create({
      numero_devolucion,
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
          attributes: ['id', 'numero_factura', 'fecha']
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'codigo']
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

module.exports = {
  obtenerDevoluciones,
  obtenerDevolucion,
  crearDevolucion,
  procesarDevolucion,
  actualizarEstadoDevolucion,
  eliminarDevolucion
};
