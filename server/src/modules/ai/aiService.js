const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');
const Invoice = require('../../models/Invoice');
const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const { formatRetrievedContext, retrieveRelevantContext } = require('./ragService');

let anthropicClient = null;
if (env.AI_FEATURES_ENABLED && env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
  try {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  } catch (err) {
    console.warn('[AI Service] Failed to initialize Anthropic client:', err.message);
  }
}

const queryGemini = async (queryText, retrievedContext) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `You are the NexSub Financial AI Assistant. Answer strictly from the retrieved context below. Never invent metrics or make assumptions. Cite the relevant source in square brackets. If the context does not answer the question, say so clearly.

Retrieved context:
${retrievedContext}`
            }
          ]
        },
        contents: [{ role: 'user', parts: [{ text: queryText }] }],
        generationConfig: { maxOutputTokens: 600 }
      })
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gemini API returned HTTP ${response.status}`);
  }

  const answer = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
  if (!answer) {
    throw new Error('Gemini API returned an empty response');
  }

  return answer;
};

/**
 * Natural language inquiry for financial data.
 */
const queryFinancialAssistant = async (queryText) => {
  // Aggregate real business data for context
  const [totalRevenueResult, activeSubsCount, totalCustomersCount, overdueInvoices] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'Success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Subscription.countDocuments({ status: 'Active' }),
    User.countDocuments({ role: 'Customer' }),
    Invoice.find({
      status: 'Confirmed',
      dueDate: { $lt: new Date() },
      amountDue: { $gt: 0 }
    }).select('invoiceNumber amountDue dueDate')
  ]);

  const totalCollected = totalRevenueResult[0]?.total || 0;
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  const contextData = {
    totalRevenueCollected: `Rs. ${totalCollected.toLocaleString('en-IN')}`,
    activeSubscriptions: activeSubsCount,
    totalRegisteredCustomers: totalCustomersCount,
    overdueInvoicesCount: overdueInvoices.length,
    overdueInvoicesTotal: `Rs. ${overdueTotal.toLocaleString('en-IN')}`,
    date: new Date().toLocaleDateString()
  };
  const retrievedChunks = retrieveRelevantContext(queryText, contextData);
  const retrievedContext = formatRetrievedContext(retrievedChunks);
  const ragMetadata = {
    pipeline: 'live-metrics-retrieval',
    sources: retrievedChunks.map((chunk) => chunk.source),
    chunksRetrieved: retrievedChunks.length
  };

  if (anthropicClient) {
    try {
      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        system: `You are the NexSub Financial AI Assistant. Answer strictly from the retrieved context below. Never invent metrics or make assumptions. Cite the relevant source in square brackets, such as [Live overdue invoice metrics]. If the context does not answer the question, say so clearly.

Retrieved context:
${retrievedContext}`,
        messages: [{ role: 'user', content: queryText }]
      });

      return {
        source: 'Claude 3.5 Sonnet',
        answer: response.content[0].text,
        metricsUsed: contextData,
        rag: ragMetadata
      };
    } catch (err) {
      console.warn('[AI Service] Claude API error, using smart fallback:', err.message);
    }

    if (env.AI_FEATURES_ENABLED && env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
      try {
        const answer = await queryGemini(queryText, retrievedContext);
        return {
          source: `Google Gemini (${env.GEMINI_MODEL})`,
          answer,
          metricsUsed: contextData,
          rag: ragMetadata
        };
      } catch (err) {
        console.warn('[AI Service] Gemini API error, using smart fallback:', err.message);
      }
    }
  }

  // Intelligent local fallback
  const queryLower = queryText.toLowerCase();
  const primarySource = `[${retrievedChunks[0].source}]`;
  let answer = `${primarySource} Based on current NexSub records: Total revenue collected is ${contextData.totalRevenueCollected} across ${contextData.activeSubscriptions} active subscriptions.`;

  if (queryLower.includes('overdue') || queryLower.includes('pending') || queryLower.includes('outstanding')) {
    answer = `${primarySource} There are currently ${contextData.overdueInvoicesCount} overdue invoices totaling ${contextData.overdueInvoicesTotal}. Action is recommended to initiate dunning.`;
  } else if (queryLower.includes('customer') || queryLower.includes('growth')) {
    answer = `${primarySource} NexSub currently manages ${contextData.totalRegisteredCustomers} registered customer accounts with ${contextData.activeSubscriptions} active recurring billing subscriptions.`;
  } else if (queryLower.includes('revenue') || queryLower.includes('collected') || queryLower.includes('money')) {
    answer = `${primarySource} Total collected revenue stands at ${contextData.totalRevenueCollected}. Current outstanding/overdue amount is ${contextData.overdueInvoicesTotal}.`;
  }

  return {
    source: 'NexSub Embedded Intelligence Engine',
    answer,
    metricsUsed: contextData,
    rag: ragMetadata
  };
};

/**
 * Generates an empathetic or firm dunning letter for an overdue invoice.
 */
const generateDunningDraft = async ({ invoiceNumber, customerName, amountDue, daysOverdue, tone = 'firm' }) => {
  if (anthropicClient) {
    try {
      const prompt = `Draft a professional, ${tone} dunning notice email for NexSub Subscription Platform.
Customer Name: ${customerName}
Invoice Number: ${invoiceNumber}
Amount Due: Rs. ${amountDue}
Days Overdue: ${daysOverdue} days
Keep it concise, professional, and clear with payment instructions.`;

      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        source: 'Claude 3.5 Sonnet',
        draft: response.content[0].text
      };
    } catch (err) {
      console.warn('[AI Service] Claude API error, using template draft:', err.message);
    }
  }

  // Fallback intelligent templates
  const drafts = {
    polite: `Subject: Friendly Reminder: Outstanding Invoice ${invoiceNumber}

Dear ${customerName},

We hope you are enjoying your services with NexSub.

This is a gentle reminder that invoice ${invoiceNumber} for Rs. ${amountDue} was due on ${daysOverdue} days ago. 

Please log in to your customer portal or click below to complete your payment at your earliest convenience. If you have already made this payment, please disregard this note.

Best regards,
NexSub Accounts Team`,
    firm: `Subject: Urgent Notice: Payment Required for Invoice ${invoiceNumber}

Dear ${customerName},

Our records indicate that invoice ${invoiceNumber} totaling Rs. ${amountDue} is now ${daysOverdue} days overdue.

To ensure uninterrupted access to your subscription services, please settle this outstanding balance immediately via your NexSub portal.

If you are experiencing any billing issues, please reply to this email so we can assist you.

Sincerely,
NexSub Billing & Finance Operations`,
    final: `Subject: FINAL NOTICE: Immediate Payment Required - Invoice ${invoiceNumber}

Dear ${customerName},

Despite previous notifications, invoice ${invoiceNumber} for Rs. ${amountDue} remains unpaid (${daysOverdue} days overdue).

Your subscription services are scheduled for suspension unless payment is received within 48 hours. Please visit your customer portal immediately to clear the balance.

Regards,
NexSub Collections Department`
  };

  return {
    source: 'NexSub Template Assistant',
    draft: drafts[tone] || drafts.firm
  };
};

module.exports = {
  queryFinancialAssistant,
  generateDunningDraft
};
