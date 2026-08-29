import { Client } from '@elastic/elasticsearch';

const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const apiKey = process.env.ELASTICSEARCH_API_KEY;

export const esClient = new Client({
  node,
  auth: apiKey ? { apiKey } : undefined,
  tls: { rejectUnauthorized: false }
});

export const INDEX_NAME = 'reachinbox-emails';

export async function initElasticsearch(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            subject: { type: 'text' },
            body: { type: 'text' },
            senderId: { type: 'keyword' },
            senderEmail: { type: 'keyword' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            userId: { type: 'keyword' },
            createdAt: { type: 'date' }
          }
        }
      });
      console.log(`[Elasticsearch] Index '${INDEX_NAME}' created successfully.`);
    }
  } catch (err: any) {
    console.warn('[Elasticsearch] Init warning (continuing gracefully):', err.message);
  }
}
