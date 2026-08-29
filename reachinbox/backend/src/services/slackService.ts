import { prisma } from '../config/prisma';
import { redisConnection } from '../config/redis';

export async function sendRateLimitSlackNotification(userId: string | null, senderEmail: string, hourKey: string): Promise<void> {
  if (!userId) return;

  const redisKey = `slack_notified:${userId}:${senderEmail}:${hourKey}`;
  try {
    const alreadyNotified = await redisConnection.get(redisKey);
    if (alreadyNotified) {
      return;
    }

    const slackConn = await prisma.slackConnection.findUnique({
      where: { userId }
    });

    if (!slackConn || !slackConn.accessToken) {
      return;
    }

    const messageText = `⚠️ *Rate Limit Reached*: Rate limit reached for \`${senderEmail}\`. Maximum limit was sent during the current hourly window (${hourKey}). Remaining scheduled emails have been safely rescheduled into the next hour window.`;
    const targetChannel = slackConn.channelId || slackConn.channel || '#general';

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${slackConn.accessToken}`
      },
      body: JSON.stringify({
        channel: targetChannel,
        text: messageText
      })
    });

    const data = await response.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      await redisConnection.set(redisKey, '1', 'EX', 7200);
      console.log(`[Slack] Rate limit alert posted for sender ${senderEmail}`);
    } else {
      console.warn(`[Slack Warning] API error sending message: ${data.error}`);
    }
  } catch (err: any) {
    console.warn(`[Slack Exception] Unable to send notification: ${err.message}`);
  }
}
