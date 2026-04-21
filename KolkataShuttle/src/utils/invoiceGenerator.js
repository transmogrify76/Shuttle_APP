import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateInvoicePDF = async (invoiceData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoiceData.invoice_number}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; }
        .subtitle { color: #666; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .label { font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Kolkata Shuttle</div>
        <div class="subtitle">Tax Invoice</div>
      </div>

      <div class="section">
        <div class="section-title">Invoice Details</div>
        <div class="row"><span class="label">Invoice Number:</span><span>${invoiceData.invoice_number}</span></div>
        <div class="row"><span class="label">Date:</span><span>${new Date(invoiceData.invoice_generated_at).toLocaleString()}</span></div>
        <div class="row"><span class="label">Booking ID:</span><span>${invoiceData.booking_id}</span></div>
        <div class="row"><span class="label">Status:</span><span>${invoiceData.invoice_status}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Passenger</div>
        <div class="row"><span class="label">Name:</span><span>${invoiceData.passenger.full_name}</span></div>
        <div class="row"><span class="label">Email:</span><span>${invoiceData.passenger.email}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Trip Details</div>
        <div class="row"><span class="label">Route:</span><span>${invoiceData.trip.route_name} (${invoiceData.trip.route_code})</span></div>
        <div class="row"><span class="label">AC:</span><span>${invoiceData.trip.is_ac ? 'Yes' : 'No'}</span></div>
        <div class="row"><span class="label">Pickup:</span><span>${invoiceData.trip.pickup_stop.name}</span></div>
        <div class="row"><span class="label">Dropoff:</span><span>${invoiceData.trip.dropoff_stop.name}</span></div>
        <div class="row"><span class="label">Planned Start:</span><span>${new Date(invoiceData.trip.planned_start_at).toLocaleString()}</span></div>
        <div class="row"><span class="label">Planned End:</span><span>${new Date(invoiceData.trip.planned_end_at).toLocaleString()}</span></div>
        ${invoiceData.trip.actual_start_at ? `<div class="row"><span class="label">Actual Start:</span><span>${new Date(invoiceData.trip.actual_start_at).toLocaleString()}</span></div>` : ''}
        ${invoiceData.trip.actual_end_at ? `<div class="row"><span class="label">Actual End:</span><span>${new Date(invoiceData.trip.actual_end_at).toLocaleString()}</span></div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Fare Breakdown</div>
        <div class="row"><span class="label">Total Booking Amount:</span><span>₹${invoiceData.breakdown.total_booking_amount}</span></div>
        <div class="row"><span class="label">Taxable Value:</span><span>₹${invoiceData.breakdown.taxable_value}</span></div>
        <div class="row"><span class="label">CGST (${invoiceData.breakdown.cgst_rate_percent}%):</span><span>₹${invoiceData.breakdown.cgst_amount}</span></div>
        <div class="row"><span class="label">SGST (${invoiceData.breakdown.sgst_rate_percent}%):</span><span>₹${invoiceData.breakdown.sgst_amount}</span></div>
        <div class="row total"><span class="label">Total Tax:</span><span>₹${invoiceData.breakdown.total_tax_amount}</span></div>
        <div class="row total"><span class="label">Total Paid:</span><span>₹${invoiceData.breakdown.recomputed_total_amount}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Payment</div>
        <div class="row"><span class="label">Transaction ID:</span><span>${invoiceData.payment.razorpay_payment_id}</span></div>
        <div class="row"><span class="label">Order ID:</span><span>${invoiceData.payment.razorpay_order_id}</span></div>
        <div class="row"><span class="label">Status:</span><span>${invoiceData.payment.status}</span></div>
        <div class="row"><span class="label">Paid on:</span><span>${new Date(invoiceData.payment.created_at).toLocaleString()}</span></div>
      </div>

      <div class="footer">
        Thank you for travelling with Kolkata Shuttle
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Invoice' });
    return true;
  } catch (error) {
    console.error('PDF generation failed', error);
    throw new Error('Could not generate PDF');
  }
};
