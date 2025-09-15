// models/index.js
const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Producto = require('./Producto');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');
const Devolucion = require('./Devolucion');

// Definir relaciones entre modelos

// Relaciones de Usuario
Usuario.hasMany(Categoria, { foreignKey: 'usuario_id', as: 'categorias' });
Usuario.hasMany(Proveedor, { foreignKey: 'usuario_id', as: 'proveedores' });
Usuario.hasMany(Producto, { foreignKey: 'usuario_id', as: 'productos' });
Usuario.hasMany(Venta, { foreignKey: 'usuario_id', as: 'ventas' });
Usuario.hasMany(Devolucion, { foreignKey: 'usuario_id', as: 'devoluciones' });

// Relaciones de Categoria
Categoria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

// Relaciones de Proveedor
Proveedor.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos' });

// Relaciones de Producto
Producto.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
Producto.hasMany(DetalleVenta, { foreignKey: 'producto_id', as: 'detallesVenta' });
Producto.hasMany(Devolucion, { foreignKey: 'producto_id', as: 'devoluciones' });

// Relaciones de Venta
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'detalles' });
Venta.hasMany(Devolucion, { foreignKey: 'venta_id', as: 'devoluciones' });

// Relaciones de DetalleVenta
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Relaciones de Devolucion
Devolucion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Devolucion.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });
Devolucion.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

module.exports = {
  Usuario,
  Categoria,
  Proveedor,
  Producto,
  Venta,
  DetalleVenta,
  Devolucion
};