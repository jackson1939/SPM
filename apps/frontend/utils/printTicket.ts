// utils/printTicket.ts — genera e imprime un ticket de venta en formato recibo

export interface TicketItem {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface TicketData {
  items: TicketItem[];
  total: number;
  pago: number;
  vuelto: number;
  notas?: string;
  fecha: Date;
  ticketNum?: number;
}

export function printTicket(data: TicketData) {
  const fecha = data.fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = data.fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:2px 4px">${item.nombre}</td>
        <td style="padding:2px 4px;text-align:center">${item.cantidad}</td>
        <td style="padding:2px 4px;text-align:right">$${item.precio.toFixed(2)}</td>
        <td style="padding:2px 4px;text-align:right">$${(item.precio * item.cantidad).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket de Venta${data.ticketNum ? " #" + data.ticketNum : ""}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      margin: 0 auto;
      padding: 8px;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 8px; }
    .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
    .header p { font-size: 11px; color: #555; }
    .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
    .info { font-size: 11px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead th {
      border-bottom: 1px dashed #000;
      padding: 2px 4px;
      text-align: left;
    }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    .totals { margin-top: 8px; }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 12px;
    }
    .totals .row.total-row {
      font-weight: bold;
      font-size: 14px;
      border-top: 1px solid #000;
      padding-top: 4px;
      margin-top: 4px;
    }
    .totals .row.vuelto-row { font-weight: bold; color: #2563eb; }
    .notas {
      margin-top: 8px;
      padding: 4px;
      border: 1px dashed #888;
      font-size: 11px;
    }
    .footer { text-align: center; margin-top: 10px; font-size: 11px; color: #555; }
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { width: 80mm; }
    }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <h1>VEROKAI POS</h1>
    <p>Sistema de Punto de Venta</p>
  </div>
  <hr class="divider">
  <div class="info">
    <div>Fecha: ${fecha} ${hora}</div>
    ${data.ticketNum ? `<div>Ticket #: ${data.ticketNum}</div>` : ""}
  </div>
  <hr class="divider">
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cant.</th>
        <th>P.Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
  <hr class="divider">
  <div class="totals">
    <div class="row total-row">
      <span>TOTAL</span>
      <span>$${data.total.toFixed(2)}</span>
    </div>
    <div class="row">
      <span>Efectivo</span>
      <span>$${data.pago.toFixed(2)}</span>
    </div>
    <div class="row vuelto-row">
      <span>Vuelto</span>
      <span>$${data.vuelto.toFixed(2)}</span>
    </div>
  </div>
  ${
    data.notas
      ? `<div class="notas"><strong>Notas:</strong> ${data.notas}</div>`
      : ""
  }
  <hr class="divider">
  <div class="footer">
    <p>¡Gracias por su compra!</p>
    <p>Vuelva pronto</p>
  </div>
</body>
</html>`;

  const ventana = window.open("", "_blank", "width=420,height=640,scrollbars=no");
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
}
