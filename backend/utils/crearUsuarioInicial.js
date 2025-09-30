const { Usuario } = require('../models');

const crearUsuarioInicial = async () => {
  try {
    // Verificar si ya existe un usuario administrador
    const adminExistente = await Usuario.findOne({
      where: { email: 'admin@tienda.com' }
    });

    if (!adminExistente) {
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@tienda.com',
        password: 'admin123',
        rol: 'admin',
        telefono: '000-000-0000',
        activo: true
      });

      console.log('Usuario administrador creado exitosamente');
      console.log('Email: admin@tienda.com');
      console.log('Contraseña: admin123');
      console.log('IMPORTANTE: Cambiar la contraseña después del primer login');
    } else {
      console.log('Usuario administrador ya existe');
    }
  } catch (error) {
    console.error('Error al crear usuario inicial:', error.message);
  }
};

module.exports = crearUsuarioInicial;