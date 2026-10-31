import api from '../api/client';

/**
 * Robust, authenticated PDF downloader.
 * Sends Authorization Bearer token via Axios and triggers a clean browser file download.
 */
export const downloadInvoicePdf = async (invoiceId, invoiceNumber) => {
  try {
    const res = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `Invoice-${invoiceNumber || invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('Axios PDF blob download failed, trying direct link fallback:', err);
    const token = localStorage.getItem('nexsub_token') || '';
    window.open(`/api/invoices/${invoiceId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
  }
};

/**
 * Robust, authenticated Quotation PDF downloader.
 */
export const downloadQuotationPdf = async (quotationId, quotationNumber) => {
  try {
    const res = await api.get(`/quotations/${quotationId}/pdf`, {
      responseType: 'blob'
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `Quotation-${quotationNumber || quotationId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('Axios Quotation PDF blob download failed, trying direct link fallback:', err);
    const token = localStorage.getItem('nexsub_token') || '';
    window.open(`/api/quotations/${quotationId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
  }
};
