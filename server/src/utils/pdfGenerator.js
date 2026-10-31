const PDFDocument = require('pdfkit');

const generateInvoicePDF = (invoice, customer, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`
  );

  doc.pipe(res);

  // Header
  doc
    .fillColor('#0f172a')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('NexSub', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Intelligent Subscription & Billing Platform', 50, 75)
    .text('billing@nexsub.com | +91 98765 43210', 50, 90);

  // Invoice Title & Meta (Right aligned)
  doc
    .fillColor('#0f172a')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('TAX INVOICE', 350, 50, { align: 'right' })
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 75, { align: 'right' })
    .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 350, 90, { align: 'right' })
    .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, 105, { align: 'right' })
    .text(`Status: ${invoice.status.toUpperCase()}`, 350, 120, { align: 'right' });

  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 140).lineTo(550, 140).stroke();

  // Billed To
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('Billed To:', 50, 155)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#334155')
    .text(customer?.name || 'Valued Customer', 50, 170)
    .text(customer?.companyName || '', 50, 185)
    .text(customer?.email || '', 50, 200)
    .text(customer?.phone || '', 50, 215)
    .text(customer?.taxId ? `Tax ID: ${customer.taxId}` : '', 50, 230);

  // Period
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('Billing Period:', 350, 155)
    .font('Helvetica')
    .fillColor('#475569')
    .text(
      `${new Date(invoice.periodStart).toLocaleDateString()} to ${new Date(invoice.periodEnd).toLocaleDateString()}`,
      350,
      170
    );

  // Table Header
  const tableTop = 260;
  doc.rect(50, tableTop, 500, 24).fill('#f1f5f9');
  doc
    .fillColor('#0f172a')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Item Description', 60, tableTop + 7)
    .text('Qty', 260, tableTop + 7, { width: 40, align: 'center' })
    .text('Unit Price', 310, tableTop + 7, { width: 70, align: 'right' })
    .text('Discount', 390, tableTop + 7, { width: 60, align: 'right' })
    .text('Tax', 460, tableTop + 7, { width: 40, align: 'right' })
    .text('Total', 505, tableTop + 7, { width: 40, align: 'right' });

  let y = tableTop + 30;
  invoice.lines.forEach((line) => {
    const desc = line.variantName ? `${line.productName} (${line.variantName})` : line.productName;
    doc
      .fillColor('#334155')
      .fontSize(9)
      .font('Helvetica')
      .text(desc, 60, y, { width: 190 })
      .text(line.quantity.toString(), 260, y, { width: 40, align: 'center' })
      .text(`Rs. ${line.unitPrice.toFixed(2)}`, 310, y, { width: 70, align: 'right' })
      .text(`Rs. ${line.lineDiscountAmount.toFixed(2)}`, 390, y, { width: 60, align: 'right' })
      .text(`Rs. ${line.taxAmount.toFixed(2)}`, 460, y, { width: 40, align: 'right' })
      .text(`Rs. ${line.totalAmount.toFixed(2)}`, 495, y, { width: 50, align: 'right' });

    y += 24;
  });

  doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
  y += 15;

  // Summary Table
  const summaryLeft = 350;
  doc.font('Helvetica').fontSize(9).fillColor('#475569');

  doc.text('Subtotal:', summaryLeft, y).text(`Rs. ${invoice.subtotal.toFixed(2)}`, 480, y, { align: 'right' });
  y += 16;

  if (invoice.totalDiscount > 0) {
    doc.text('Total Discounts:', summaryLeft, y).text(`- Rs. ${invoice.totalDiscount.toFixed(2)}`, 480, y, { align: 'right' });
    y += 16;
  }

  doc.text('Taxes:', summaryLeft, y).text(`Rs. ${invoice.totalTax.toFixed(2)}`, 480, y, { align: 'right' });
  y += 16;

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(summaryLeft, y).lineTo(550, y).stroke();
  y += 8;

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0f172a')
    .text('Grand Total:', summaryLeft, y)
    .text(`Rs. ${invoice.totalAmount.toFixed(2)}`, 480, y, { align: 'right' });
  y += 20;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#16a34a')
    .text('Amount Paid:', summaryLeft, y)
    .text(`Rs. ${invoice.amountPaid.toFixed(2)}`, 480, y, { align: 'right' });
  y += 16;

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(invoice.amountDue > 0 ? '#dc2626' : '#16a34a')
    .text('Balance Due:', summaryLeft, y)
    .text(`Rs. ${invoice.amountDue.toFixed(2)}`, 480, y, { align: 'right' });

  // Footer notes
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      'Thank you for your business. Please ensure timely payment to avoid service interruption.',
      50,
      720,
      { align: 'center', width: 500 }
    )
    .text('Generated electronically by NexSub Intelligent Billing Engine', 50, 735, {
      align: 'center',
      width: 500
    });

  doc.end();
};

const generateQuotationPDF = (quotation, customer, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Quotation-${quotation.quotationNumber}.pdf"`
  );

  doc.pipe(res);

  // Header
  doc
    .fillColor('#0f172a')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('NexSub', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Intelligent Subscription & Billing Platform', 50, 75);

  // Meta
  doc
    .fillColor('#0f172a')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('QUOTATION', 350, 50, { align: 'right' })
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Quote #: ${quotation.quotationNumber}`, 350, 75, { align: 'right' })
    .text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, 350, 90, { align: 'right' })
    .text(`Valid Until: ${new Date(quotation.validityDate).toLocaleDateString()}`, 350, 105, { align: 'right' })
    .text(`Status: ${quotation.status.toUpperCase()}`, 350, 120, { align: 'right' });

  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 140).lineTo(550, 140).stroke();

  // Customer
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('Prepared For:', 50, 155)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#334155')
    .text(customer?.name || 'Prospective Customer', 50, 170)
    .text(customer?.companyName || '', 50, 185)
    .text(customer?.email || '', 50, 200);

  // Table
  const tableTop = 240;
  doc.rect(50, tableTop, 500, 24).fill('#f8fafc');
  doc
    .fillColor('#0f172a')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Product / Service', 60, tableTop + 7)
    .text('Qty', 260, tableTop + 7, { width: 40, align: 'center' })
    .text('Unit Price', 310, tableTop + 7, { width: 70, align: 'right' })
    .text('Discount', 390, tableTop + 7, { width: 60, align: 'right' })
    .text('Tax', 460, tableTop + 7, { width: 40, align: 'right' })
    .text('Total', 505, tableTop + 7, { width: 40, align: 'right' });

  let y = tableTop + 30;
  quotation.lines.forEach((line) => {
    const desc = line.variantName ? `${line.productName} (${line.variantName})` : line.productName;
    doc
      .fillColor('#334155')
      .fontSize(9)
      .font('Helvetica')
      .text(desc, 60, y, { width: 190 })
      .text(line.quantity.toString(), 260, y, { width: 40, align: 'center' })
      .text(`Rs. ${line.unitPrice.toFixed(2)}`, 310, y, { width: 70, align: 'right' })
      .text(`Rs. ${line.lineDiscountAmount.toFixed(2)}`, 390, y, { width: 60, align: 'right' })
      .text(`Rs. ${line.taxAmount.toFixed(2)}`, 460, y, { width: 40, align: 'right' })
      .text(`Rs. ${line.totalAmount.toFixed(2)}`, 495, y, { width: 50, align: 'right' });
    y += 24;
  });

  doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, y).lineTo(550, y).stroke();
  y += 15;

  const summaryLeft = 350;
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  doc.text('Subtotal:', summaryLeft, y).text(`Rs. ${quotation.subtotal.toFixed(2)}`, 480, y, { align: 'right' });
  y += 16;
  if (quotation.totalDiscount > 0) {
    doc.text('Total Discount:', summaryLeft, y).text(`- Rs. ${quotation.totalDiscount.toFixed(2)}`, 480, y, { align: 'right' });
    y += 16;
  }
  doc.text('Taxes:', summaryLeft, y).text(`Rs. ${quotation.totalTax.toFixed(2)}`, 480, y, { align: 'right' });
  y += 16;
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(summaryLeft, y).lineTo(550, y).stroke();
  y += 8;
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0f172a')
    .text('Estimated Total:', summaryLeft, y)
    .text(`Rs. ${quotation.grandTotal.toFixed(2)}`, 480, y, { align: 'right' });

  // Terms
  if (quotation.termsAndConditions) {
    y += 35;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('Terms & Conditions:', 50, y)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(quotation.termsAndConditions, 50, y + 14, { width: 500 });
  }

  doc.end();
};

module.exports = {
  generateInvoicePDF,
  generateQuotationPDF
};
