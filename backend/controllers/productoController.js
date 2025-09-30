const { Producto, Categoria, Proveedor } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const { pagina = 1, limite = 10, busqueda = '', categoria_id, activo } = req.query;
    const offset = (pagina - 1) * limite;

    // Construir filtros
    const filtros = {};
    
    if (busqueda) {
      filtros[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { codigo: { [Op.like]: `%${busqueda}%` } },
        { descripcion: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (categoria_id && categoria_id !== '') {
      filtros.categoria_id = categoria_id;
    }

    if (activo !== undefined && activo !== '') {
      filtros.activo = activo === 'true';
    }

    const { count, rows: productos } = await Producto.findAndCountAll({
      where: filtros,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }
      ],
      limit: parseInt(limite),
      offset: parseInt(offset),
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        productos,
        paginacion: {
          total: count,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(count / limite)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener producto por ID
const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Proveedor, as: 'proveedor' }
      ]
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: { producto }
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo producto
const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio_compra,
      precio_venta,
      stock,
      stock_minimo,
      categoria_id,
      proveedor_id
    } = req.body;

    // Validar datos requeridos
    if (!nombre || !precio_compra || !precio_venta || !categoria_id) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precios y categoría son requeridos'
      });
    }

    // Verificar que la categoría existe
    const categoria = await Categoria.findByPk(categoria_id);
    if (!categoria) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar que el proveedor existe (si se proporciona)
    if (proveedor_id) {
      const proveedor = await Proveedor.findByPk(proveedor_id);
      if (!proveedor) {
        return res.status(400).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
    }

    // Generar código automático
    const ultimoProducto = await Producto.findOne({
      order: [['id', 'DESC']]
    });
    const siguienteNumero = ultimoProducto ? ultimoProducto.id + 1 : 1;
    const codigo = `PROD-${String(siguienteNumero).padStart(4, '0')}`;

    const producto = await Producto.create({
      codigo,
      nombre,
      descripcion,
      precio_compra: parseFloat(precio_compra),
      precio_venta: parseFloat(precio_venta),
      stock: parseInt(stock) || 0,
      stock_minimo: parseInt(stock_minimo) || 5,
      categoria_id,
      proveedor_id: proveedor_id || null,
      usuario_id: req.usuario.id
    });

    // Obtener el producto creado con sus relaciones
    const productoCompleto = await Producto.findByPk(producto.id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Proveedor, as: 'proveedor' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { producto: productoCompleto }
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      descripcion,
      precio_compra,
      precio_venta,
      stock,
      stock_minimo,
      categoria_id,
      proveedor_id,
      activo
    } = req.body;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si el código ya existe en otro producto
    if (codigo && codigo !== producto.codigo) {
      const productoExistente = await Producto.findOne({ 
        where: { codigo, id: { [Op.ne]: id } } 
      });
      if (productoExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con este código'
        });
      }
    }

    // Verificar que la categoría existe
    if (categoria_id) {
      const categoria = await Categoria.findByPk(categoria_id);
      if (!categoria) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    }

    // Verificar que el proveedor existe (si se proporciona)
    if (proveedor_id) {
      const proveedor = await Proveedor.findByPk(proveedor_id);
      if (!proveedor) {
        return res.status(400).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
    }

    // Actualizar producto
    await producto.update({
      codigo: codigo || producto.codigo,
      nombre: nombre || producto.nombre,
      descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
      precio_compra: precio_compra !== undefined ? parseFloat(precio_compra) : producto.precio_compra,
      precio_venta: precio_venta !== undefined ? parseFloat(precio_venta) : producto.precio_venta,
      stock: stock !== undefined ? parseInt(stock) : producto.stock,
      stock_minimo: stock_minimo !== undefined ? parseInt(stock_minimo) : producto.stock_minimo,
      categoria_id: categoria_id || producto.categoria_id,
      proveedor_id: proveedor_id !== undefined ? proveedor_id : producto.proveedor_id,
      activo: activo !== undefined ? activo : producto.activo
    });

    // Obtener el producto actualizado con sus relaciones
    const productoActualizado = await Producto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Proveedor, as: 'proveedor' }
      ]
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { producto: productoActualizado }
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await producto.destroy();

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos con stock bajo
const obtenerProductosStockBajo = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: {
        activo: true,
        stock: {
          [Op.lte]: sequelize.col('stock_minimo')
        }
      },
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }
      ],
      order: [['stock', 'ASC']]
    });

    res.json({
      success: true,
      data: { productos }
    });

  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos por categoría para ventas
const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoria_id, busqueda = '' } = req.query;

    if (!categoria_id) {
      return res.status(400).json({
        success: false,
        message: 'La categoría es requerida'
      });
    }

    // Construir filtros
    const filtros = {
      categoria_id: parseInt(categoria_id),
      activo: true,
      stock: { [Op.gt]: 0 } // Solo productos con stock disponible
    };

    if (busqueda) {
      filtros[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { codigo: { [Op.like]: `%${busqueda}%` } },
        { descripcion: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const productos = await Producto.findAll({
      where: filtros,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }
      ],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: { productos }
    });

  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerProductosStockBajo,
  obtenerProductosPorCategoria
};
