const { Categoria } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
  try {
    const { activa, busqueda } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (busqueda) {
      filtros[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { descripcion: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (activa !== undefined) {
      filtros.activa = activa === 'true';
    }

    const categorias = await Categoria.findAll({
      where: filtros,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: { categorias }
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener categoría por ID
const obtenerCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: { categoria }
    });

  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva categoría
const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validar datos requeridos
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    // Verificar si la categoría ya existe
    const categoriaExistente = await Categoria.findOne({ 
      where: { nombre: { [Op.like]: `%${nombre}%` } } 
    });
    
    if (categoriaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con este nombre'
      });
    }

    const categoria = await Categoria.create({
      nombre,
      descripcion,
      usuario_id: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { categoria }
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar categoría
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activa } = req.body;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si el nombre ya existe en otra categoría
    if (nombre && nombre !== categoria.nombre) {
      const categoriaExistente = await Categoria.findOne({ 
        where: { 
          nombre: { [Op.iLike]: nombre },
          id: { [Op.ne]: id }
        } 
      });
      
      if (categoriaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra categoría con este nombre'
        });
      }
    }

    // Actualizar categoría
    await categoria.update({
      nombre: nombre || categoria.nombre,
      descripcion: descripcion !== undefined ? descripcion : categoria.descripcion,
      activa: activa !== undefined ? activa : categoria.activa
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: { categoria }
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar categoría
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si la categoría tiene productos asociados
    const productosAsociados = await categoria.countProductos();
    
    if (productosAsociados > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${productosAsociados} producto(s) asociado(s)`
      });
    }

    await categoria.destroy();

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar si un nombre de categoría ya existe
const verificarNombreCategoria = async (req, res) => {
  try {
    const { nombre } = req.query;
    const { id } = req.query; // Para excluir la categoría actual en edición

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const filtros = { nombre: nombre.trim() };
    
    // Si se está editando una categoría, excluir su propio ID
    if (id) {
      filtros.id = { [Op.ne]: id };
    }

    const categoriaExistente = await Categoria.findOne({ where: filtros });

    res.json({
      success: true,
      data: {
        exists: !!categoriaExistente,
        categoria: categoriaExistente ? { id: categoriaExistente.id, nombre: categoriaExistente.nombre } : null
      }
    });

  } catch (error) {
    console.error('Error al verificar nombre de categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  obtenerCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  verificarNombreCategoria
};
