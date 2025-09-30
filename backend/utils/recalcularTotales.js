const { Venta, DetalleVenta } = require('../models');

const recalcularTotales = async () => {
  try {
    console.log('Iniciando recálculo de totales de ventas...');
    
    // Obtener todas las ventas con sus detalles
    const ventas = await Venta.findAll({
      include: [
        {
          model: DetalleVenta,
          as: 'detalles'
        }
      ]
    });

    let ventasCorregidas = 0;
    let errores = 0;

    for (const venta of ventas) {
      try {
        // Calcular el subtotal real sumando los subtotales de los detalles
        const subtotalReal = venta.detalles.reduce((sum, detalle) => {
          return sum + parseFloat(detalle.subtotal || 0);
        }, 0);

        // El total debe ser igual al subtotal (sin impuestos por ahora)
        const totalReal = subtotalReal;

        // Verificar si hay diferencia
        const subtotalActual = parseFloat(venta.subtotal || 0);
        const totalActual = parseFloat(venta.total || 0);

        if (Math.abs(subtotalActual - subtotalReal) > 0.01 || Math.abs(totalActual - totalReal) > 0.01) {
          console.log(`Venta ${venta.id}:`);
          console.log(`  Subtotal actual: Q${subtotalActual.toFixed(2)}`);
          console.log(`  Subtotal correcto: Q${subtotalReal.toFixed(2)}`);
          console.log(`  Total actual: Q${totalActual.toFixed(2)}`);
          console.log(`  Total correcto: Q${totalReal.toFixed(2)}`);

          // Actualizar la venta con los totales correctos
          await venta.update({
            subtotal: subtotalReal,
            total: totalReal
          });

          ventasCorregidas++;
          console.log(`  ✅ Venta ${venta.id} corregida`);
        }
      } catch (error) {
        console.error(`Error al procesar venta ${venta.id}:`, error.message);
        errores++;
      }
    }

    console.log('\n=== RESUMEN DEL RECÁLCULO ===');
    console.log(`Total de ventas procesadas: ${ventas.length}`);
    console.log(`Ventas corregidas: ${ventasCorregidas}`);
    console.log(`Errores: ${errores}`);
    console.log('Recálculo completado.');

  } catch (error) {
    console.error('Error durante el recálculo:', error);
  }
};

module.exports = recalcularTotales;
