import { esClient, INDEX_NAME } from '../config/elasticsearch';
import { prisma } from '../config/prisma';
import { EmailJob } from '@prisma/client';

export async function indexEmailInElasticsearch(email: {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  senderId: string;
  senderEmail?: string;
  status: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  userId?: string | null;
}): Promise<void> {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: email.id,
      document: {
        id: email.id,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        senderId: email.senderId,
        senderEmail: email.senderEmail || '',
        status: email.status,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: email.sentAt ? email.sentAt.toISOString() : null,
        userId: email.userId || null,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.warn('[Elasticsearch Index Warning] Failed to index email (non-blocking):', err.message);
  }
}

export async function searchEmailsInElasticsearch(query: string, userId?: string) {
  if (!query || !query.trim()) {
    return [];
  }

  try {
    const searchResult = await esClient.search({
      index: INDEX_NAME,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query.trim(),
                fields: ['recipient', 'subject^2', 'body', 'senderEmail'],
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: userId ? [{ term: { userId } }] : []
        }
      }
    });

    const hits = searchResult.hits.hits;
    return hits.map((hit: any) => ({
      id: hit._source.id,
      recipient: hit._source.recipient,
      subject: hit._source.subject,
      body: hit._source.body,
      status: hit._source.status,
      timestamp: hit._source.sentAt || hit._source.scheduledAt,
      type: hit._source.sentAt ? 'sent' : 'scheduled'
    }));
  } catch (err: any) {
    console.warn('[Elasticsearch Search Warning] ES query failed, falling back to database search:', err.message);
    
    // Fallback to PostgreSQL search
    const dbResults = await prisma.emailJob.findMany({
      where: {
        AND: [
          userId ? { userId } : {},
          {
            OR: [
              { recipient: { contains: query, mode: 'insensitive' } },
              { subject: { contains: query, mode: 'insensitive' } },
              { body: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return dbResults.map((item: EmailJob) => ({
      id: item.id,
      recipient: item.recipient,
      subject: item.subject,
      body: item.body,
      status: item.status,
      timestamp: item.sentAt ? item.sentAt.toISOString() : item.scheduledAt.toISOString(),
      type: item.sentAt ? 'sent' : 'scheduled'
    }));
  }
}
