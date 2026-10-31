const STOP_WORDS = new Set([
  'a',
  'about',
  'and',
  'are',
  'for',
  'how',
  'is',
  'me',
  'of',
  'our',
  'show',
  'the',
  'what',
  'with'
]);

const tokenize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

/**
 * Creates small, human-readable documents from the live business snapshot.
 * Keeping these documents structured makes the retrieval step deterministic
 * when an embedding provider is not configured.
 */
const buildKnowledgeChunks = (contextData) => [
  {
    id: 'revenue',
    source: 'Live revenue metrics',
    content: `Total revenue collected is ${contextData.totalRevenueCollected}.`
  },
  {
    id: 'subscriptions',
    source: 'Live subscription metrics',
    content: `There are ${contextData.activeSubscriptions} active subscriptions.`
  },
  {
    id: 'customers',
    source: 'Live customer metrics',
    content: `There are ${contextData.totalRegisteredCustomers} registered customers.`
  },
  {
    id: 'overdue',
    source: 'Live overdue invoice metrics',
    content: `${contextData.overdueInvoicesCount} overdue invoices total ${contextData.overdueInvoicesTotal}.`
  },
  {
    id: 'billing-glossary',
    source: 'NexSub billing knowledge',
    content:
      'Overdue invoices are confirmed invoices past their due date with an outstanding balance. Active subscriptions are currently recurring subscriptions.'
  }
];

const retrieveRelevantContext = (query, contextData, topK = 4) => {
  const queryTokens = new Set(tokenize(query));
  const chunks = buildKnowledgeChunks(contextData);

  const rankedChunks = chunks
    .map((chunk) => {
      const chunkTokens = tokenize(chunk.content);
      const overlap = chunkTokens.reduce((score, token) => score + (queryTokens.has(token) ? 1 : 0), 0);
      return { ...chunk, score: overlap };
    })
    .sort((left, right) => {
      const scoreDifference = right.score - left.score;
      if (scoreDifference !== 0) return scoreDifference;

      // Prefer live facts over glossary text when both match equally.
      const liveFactDifference =
        Number(right.source.startsWith('Live')) - Number(left.source.startsWith('Live'));
      return liveFactDifference || left.id.localeCompare(right.id);
    });

  // Always ground a response in at least one current fact, even for a vague
  // prompt whose terms do not match a particular metric.
  const selected = rankedChunks.filter((chunk) => chunk.score > 0).slice(0, topK);
  if (selected.length === 0) {
    selected.push(rankedChunks.find((chunk) => chunk.id === 'revenue'));
  }

  return selected.map(({ score, ...chunk }) => chunk);
};

const formatRetrievedContext = (chunks) =>
  chunks.map((chunk, index) => `[${index + 1}] ${chunk.source}: ${chunk.content}`).join('\n');

module.exports = {
  buildKnowledgeChunks,
  formatRetrievedContext,
  retrieveRelevantContext
};
