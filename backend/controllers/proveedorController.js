const { Proveedor } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los proveedores
const obtenerProveedores = async (req, res) => {
  try {
    const { activo, busqueda } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (busqueda) {
      filtros[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { contacto: { [Op.like]: `%${busqueda}%` } },
        { telefono: { [Op.like]: `%${busqueda}%` } },
        { email: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (activo !== undefined) {
      filtros.activo = activo === 'true';
    }

    const proveedores = await Proveedor.findAll({
      where: filtros,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: { proveedores }
    });

  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener proveedor por ID
const obtenerProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: { proveedor }
    });

  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo proveedor
const crearProveedor = async (req, res) => {
  try {
    const { nombre, contacto, telefono, email, direccion } = req.body;

    // Validar datos requeridos
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es requerido'
      });
    }

    // Verificar si el proveedor ya existe
    const proveedorExistente = await Proveedor.findOne({ 
      where: { nombre: { [Op.like]: `%${nombre}%` } } 
    });
    
    if (proveedorExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con este nombre'
      });
    }

    const proveedor = await Proveedor.create({
      nombre,
      contacto,
      telefono,
      email,
      direccion,
      usuario_id: req.usuario.id
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: { proveedor }
    });

  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar proveedor
const actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email, direccion, activo } = req.body;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar si el nombre ya existe en otro proveedor
    if (nombre && nombre !== proveedor.nombre) {
      const proveedorExistente = await Proveedor.findOne({ 
        where: { 
          nombre: { [Op.like]: `%${nombre}%` },
          id: { [Op.ne]: id }
        } 
      });
      
      if (proveedorExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro proveedor con este nombre'
        });
      }
    }

    // Actualizar proveedor
    await proveedor.update({
      nombre: nombre || proveedor.nombre,
      contacto: contacto !== undefined ? contacto : proveedor.contacto,
      telefono: telefono !== undefined ? telefono : proveedor.telefono,
      email: email !== undefined ? email : proveedor.email,
      direccion: direccion !== undefined ? direccion : proveedor.direccion,
      activo: activo !== undefined ? activo : proveedor.activo
    });

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: { proveedor }
    });

  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar proveedor
const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar si el proveedor tiene productos asociados
    const productosAsociados = await proveedor.countProductos();
    
    if (productosAsociados > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el proveedor porque tiene ${productosAsociados} producto(s) asociado(s)`
      });
    }

    await proveedor.destroy();

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  obtenerProveedores,
  obtenerProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};
