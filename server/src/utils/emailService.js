const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  } else {
    // Ethereal test account or simulated
    const testAccount = await nodemailer.createTestAccount().catch(() => null);
    if (testAccount) {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[EmailService] Ethereal test account created: ${testAccount.user}`);
    } else {
      transporter = {
        sendMail: async (options) => {
          console.log(`[Simulated Email to ${options.to}] Subject: "${options.subject}"`);
          return { messageId: 'simulated-msg-id' };
        }
      };
    }
  }

  return transporter;
};

const sendPasswordResetEmail = async ({ to, resetToken, userName }) => {
  const mailer = await getTransporter();
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const message = {
    from: env.SMTP_FROM,
    to,
    subject: 'NexSub Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Password Reset Request</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>You requested a password reset for your NexSub account. Click the button below to reset your password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you did not request this, please ignore this email or contact support if you suspect unauthorized access.</p>
        <p style="color: #94a3b8; font-size: 11px;">Token: ${resetToken}</p>
      </div>
    `
  };

  const info = await mailer.sendMail(message);
  if (nodemailer.getTestMessageUrl && info?.messageId) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[Email Preview URL]: ${preview}`);
  }
  return info;
};

const sendInvoiceEmail = async ({ to, invoice, customerName }) => {
  const mailer = await getTransporter();
  const message = {
    from: env.SMTP_FROM,
    to,
    subject: `New Invoice ${invoice.invoiceNumber} from NexSub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${customerName || 'Customer'},</p>
        <p>Your subscription invoice for the period <strong>${new Date(invoice.periodStart).toLocaleDateString()} to ${new Date(invoice.periodEnd).toLocaleDateString()}</strong> is ready.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> Rs. ${invoice.totalAmount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${invoice.status}</p>
        </div>
        <p>Log in to your Customer Portal to view details, download your invoice PDF, or make a payment online.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${env.CLIENT_URL}/portal/invoices" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Invoice</a>
        </div>
      </div>
    `
  };

  return await mailer.sendMail(message);
};

const sendPaymentReminderEmail = async ({ to, invoice, customerName, dunningBody = null }) => {
  const mailer = await getTransporter();
  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #dc2626;">Payment Reminder: Invoice ${invoice.invoiceNumber}</h2>
      <p>Dear ${customerName || 'Customer'},</p>
      <p>This is a reminder regarding the outstanding balance of <strong>Rs. ${invoice.amountDue.toFixed(2)}</strong> for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
      <p>Please complete your payment to ensure uninterrupted service.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${env.CLIENT_URL}/portal/invoices" style="background-color: #dc2626; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Outstanding Balance</a>
      </div>
    </div>
  `;

  const message = {
    from: env.SMTP_FROM,
    to,
    subject: `Urgent: Payment Reminder for Invoice ${invoice.invoiceNumber}`,
    html: dunningBody ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">${dunningBody.replace(/\n/g, '<br/>')}</div>` : defaultHtml
  };

  return await mailer.sendMail(message);
};

module.exports = {
  sendPasswordResetEmail,
  sendInvoiceEmail,
  sendPaymentReminderEmail
};
