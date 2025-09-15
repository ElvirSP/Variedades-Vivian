const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Devolucion = sequelize.define('Devolucion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_devolucion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  venta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ventas',
      key: 'id'
    }
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  motivo: {
    type: DataTypes.ENUM('defectuoso', 'no_solicitado', 'cambio', 'otro'),
    allowNull: false,
    defaultValue: 'otro'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  monto_devolucion: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada', 'procesada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  fecha_devolucion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'devoluciones',
  timestamps: true
});

module.exports = Devolucion;
