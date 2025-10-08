import React, { useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { X, FileText, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const ReporteConsolidadoModal = ({ isOpen, onClose }) => {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const generarReporte = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Por favor, selecciona ambas fechas para el reporte.');
      return;
    }
    if (new Date(fechaDesde) > new Date(fechaHasta)) {
      toast.error('La fecha "Desde" no puede ser posterior a la fecha "Hasta".');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/dashboard/reporte-consolidado', {
        params: {
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          formato: 'json' // Obtener JSON para construir el HTML
        }
      });

      if (response.data.success) {
        const datos = response.data.data;
        const htmlContent = createReportHtml(datos, fechaDesde, fechaHasta);

            const opt = {
              margin: 0.5,
              filename: `reporte-ventas-netas-${fechaDesde}-${fechaHasta}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

        html2pdf().from(htmlContent).set(opt).save();
        toast.success('Reporte de ventas netas generado exitosamente.');
        onClose();
      } else {
        toast.error(response.data.message || 'Error al generar el reporte.');
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error(error.response?.data?.message || 'Error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const createReportHtml = (datos, fechaDesde, fechaHasta) => {
    const resumen = datos.resumen;
    // Formatear fechas sin conversión de zona horaria
    const formatearFecha = (fecha) => {
      const [año, mes, dia] = fecha.split('-');
      return `${dia}/${mes}/${año}`;
    };
    const periodo = `Desde: ${formatearFecha(fechaDesde)} - Hasta: ${formatearFecha(fechaHasta)}`;

    return `
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 0; font-size: 10px; }
        .report-container { width: 100%; max-width: 7.5in; margin: 0 auto; padding: 0.5in; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 20px; color: #333; }
        .header p { margin: 5px 0 0; font-size: 12px; color: #666; }
        .summary { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; display: flex; justify-content: space-around; flex-wrap: wrap; }
        .summary-item { text-align: center; margin: 5px 10px; }
        .summary-item h4 { margin: 0; font-size: 12px; color: #555; }
        .summary-item p { margin: 2px 0 0; font-size: 14px; font-weight: bold; color: #333; }
        .net-total { background-color: #e8f5e8; border: 2px solid #4caf50; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .net-total h3 { margin: 0; font-size: 18px; color: #2e7d32; }
        .net-total p { margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #1b5e20; }
        h3 { font-size: 14px; color: #333; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f8f8; font-weight: bold; color: #444; }
        .footer { text-align: center; margin-top: 30px; font-size: 9px; color: #888; }
        .estado-completada { color: green; font-weight: bold; }
        .estado-pendiente { color: orange; font-weight: bold; }
        .estado-cancelada { color: red; font-weight: bold; }
        .estado-aprobada { color: green; font-weight: bold; }
        .estado-rechazada { color: red; font-weight: bold; }
        .estado-procesada { color: blue; font-weight: bold; }
        .positive { color: #2e7d32; font-weight: bold; }
        .negative { color: #d32f2f; font-weight: bold; }
      </style>
      <div class="report-container">
        <div class="header">
          <h1>Reporte de Ventas Netas</h1>
          <p>Generado el: ${new Date().toLocaleDateString('es-GT')} ${new Date().toLocaleTimeString('es-GT')}</p>
          <p>Período: ${periodo}</p>
        </div>

        <h3>Resumen Consolidado</h3>
        <div class="summary">
          <div class="summary-item"><h4>Total Ventas</h4><p>${resumen.totalVentas}</p></div>
          <div class="summary-item"><h4>Total Devoluciones</h4><p>${resumen.totalDevoluciones}</p></div>
          <div class="summary-item"><h4>Monto Ventas</h4><p>Q${resumen.montoVentas.toLocaleString()}</p></div>
          <div class="summary-item"><h4>Monto Devoluciones</h4><p>Q${resumen.montoDevoluciones.toLocaleString()}</p></div>
        </div>

        <div class="net-total">
          <h3>Total Neto (Ventas - Devoluciones)</h3>
          <p class="${resumen.totalNeto >= 0 ? 'positive' : 'negative'}">Q${resumen.totalNeto.toLocaleString()}</p>
        </div>

        <h3>Detalle de Ventas</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Categorías</th>
              <th>Observaciones</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${datos.ventas.map(venta => `
              <tr>
                <td>${venta.id}</td>
                <td>${new Date(venta.fecha).toLocaleDateString('es-GT')}</td>
                <td>${venta.productos.map(p => `${p.nombre} (${p.cantidad})`).join(', ')}</td>
                <td>${venta.productos.map(p => p.categoria).join(', ')}</td>
                <td>${venta.observaciones}</td>
                <td>Q${venta.total.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Detalle de Devoluciones</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Monto</th>
              <th>Motivo</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${datos.devoluciones.map(devolucion => `
              <tr>
                <td>${devolucion.id}</td>
                <td>${new Date(devolucion.fecha).toLocaleDateString('es-GT')}</td>
                <td>${devolucion.producto}</td>
                <td>${devolucion.categoria}</td>
                <td>${devolucion.cantidad}</td>
                <td>Q${devolucion.monto.toLocaleString()}</td>
                <td>${devolucion.motivo}</td>
                <td>${devolucion.descripcion}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Reporte generado por Sistema de Gestión Variedades Vivian</p>
        </div>
      </div>
    `;
  };

  return (
    <div id="reporte-consolidado-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Reporte de Ventas Netas</h2>

        <div className="mb-4">
          <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Desde:
          </label>
          <input
            type="date"
            id="fechaDesde"
            className="form-input w-full"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Hasta:
          </label>
          <input
            type="date"
            id="fechaHasta"
            className="form-input w-full"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        <button
          onClick={generarReporte}
          className="btn btn-primary w-full flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <div className="spinner-small mr-2"></div>
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
              {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>
    </div>
  );
};

export default ReporteConsolidadoModal;
