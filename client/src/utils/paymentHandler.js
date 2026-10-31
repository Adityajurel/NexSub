import api from '../api/client';

/**
 * Initiates Razorpay payment for a given invoice.
 * Works seamlessly with real Razorpay keys (opens official popup)
 * and has a safe demo fallback for local presentation/testing.
 */
export const initiateRazorpayPayment = async ({ invoice, user, onSuccess, onError }) => {
  try {
    // 1. Create order on backend
    const orderRes = await api.post('/payments/razorpay/create-order', {
      invoiceId: invoice._id
    });

    if (!orderRes.data.success) {
      throw new Error(orderRes.data.message || 'Failed to initialize payment order');
    }

    const { id: orderId, amount, currency, key, invoiceNumber, isLiveOrder } = orderRes.data.order;

    const hasRealKey = key && !key.includes('test_nexsub123456');

    // 2. If Razorpay checkout script is loaded and a real key is present
    if (typeof window.Razorpay === 'function' && hasRealKey) {
      const options = {
        key,
        amount,
        currency: currency || 'INR',
        name: 'NexSub Subscription OS',
        description: `Settlement for Invoice #${invoiceNumber}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        order_id: isLiveOrder ? orderId : undefined,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '9999999999'
        },
        theme: {
          color: '#0f172a'
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/razorpay/verify', {
              invoiceId: invoice._id,
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              onSuccess && onSuccess(verifyRes.data);
            } else {
              onError && onError(new Error(verifyRes.data.message || 'Verification failed'));
            }
          } catch (err) {
            onError && onError(err);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal closed by user');
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', (response) => {
        onError && onError(new Error(response.error?.description || 'Payment rejected by gateway'));
      });
      rzpInstance.open();
    } else {
      // Demo / Test Simulation Mode
      const proceed = window.confirm(
        `[Razorpay Checkout Mode]\n\nInvoice: ${invoiceNumber}\nAmount Due: Rs. ${(amount / 100).toFixed(2)}\nGateway Key: ${key || 'Demo Key'}\n\nClick OK to simulate an approved Razorpay payment and mark this invoice Paid!\n(Enter your live/test Razorpay keys in .env to open the real payment window)`
      );

      if (proceed) {
        const mockPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const verifyRes = await api.post('/payments/razorpay/verify', {
          invoiceId: invoice._id,
          razorpay_order_id: orderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: `sim_sig_${Math.random().toString(36).substring(2, 10)}`
        });

        if (verifyRes.data.success) {
          onSuccess && onSuccess(verifyRes.data);
        } else {
          onError && onError(new Error(verifyRes.data.message || 'Payment simulation failed'));
        }
      }
    }
  } catch (err) {
    onError && onError(err);
  }
};
