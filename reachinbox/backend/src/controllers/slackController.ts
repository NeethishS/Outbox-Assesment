import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

const frontendUrl = process.env.FRONTEND_URL || 'https://outbox-assesment.vercel.app';

const getSlackRedirectUri = (): string => {
  if (process.env.SLACK_REDIRECT_URI && process.env.SLACK_REDIRECT_URI.includes('onrender.com')) {
    return process.env.SLACK_REDIRECT_URI;
  }
  if (process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.FRONTEND_URL?.includes('vercel.app')) {
    return 'https://reachinbox-backend-api-tceq.onrender.com/auth/slack/callback';
  }
  return process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/auth/slack/callback';
};

export const initiateSlackOAuth = (_req: Request, res: Response): void => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = getSlackRedirectUri();

  if (!clientId || clientId === 'PASTE_SLACK_CLIENT_ID' || clientId === 'your_slack_client_id') {
    res.json({
      success: false,
      message: 'Slack OAuth credentials are not configured yet on this server. Please configure SLACK_CLIENT_ID in environment.'
    });
    return;
  }

  const scope = encodeURIComponent('chat:write channels:read incoming-webhook');
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(slackAuthUrl);
};

export const handleSlackCallback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = getSlackRedirectUri();
  const userId = (req.session as any)?.user?.id || 'usr_demo_123';

  if (!code || typeof code !== 'string' || !clientId || !clientSecret) {
    res.redirect(`${frontendUrl}?slack_error=missing_credentials`);
    return;
  }

  try {
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });

    const data = await tokenRes.json() as any;

    if (!data.ok) {
      console.error('[Slack OAuth Error]', data);
      res.redirect(`${frontendUrl}?slack_error=${encodeURIComponent(data.error || 'failed')}`);
      return;
    }

    const accessToken = data.access_token || data.authed_user?.access_token;
    const teamName = data.team?.name || 'Slack Team';
    const teamId = data.team?.id;
    const channel = data.incoming_webhook?.channel || '#general';
    const channelId = data.incoming_webhook?.channel_id;

    // Ensure User exists in PostgreSQL
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: 'alex.morgan@reachinbox.ai',
          name: 'Alex Morgan'
        }
      });
    }

    await prisma.slackConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        teamName,
        teamId,
        channel,
        channelId,
        accessToken
      },
      update: {
        teamName,
        teamId,
        channel,
        channelId,
        accessToken
      }
    });

    res.redirect(`${frontendUrl}?slack_connected=true`);
  } catch (err: any) {
    console.error('[Slack Callback Exception]', err.message);
    res.redirect(`${frontendUrl}?slack_error=exception`);
  }
};

export const getSlackStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = (req.session as any)?.user?.id || 'usr_demo_123';
  try {
    const conn = await prisma.slackConnection.findUnique({
      where: { userId }
    });

    if (conn) {
      res.json({
        connected: true,
        teamName: conn.teamName || 'ReachInbox Workspace',
        channel: conn.channel || '#outbound-alerts',
        connectedAt: conn.updatedAt.toISOString()
      });
    } else {
      res.json({ connected: false });
    }
  } catch (err: any) {
    res.json({ connected: false });
  }
};

export const disconnectSlack = async (req: Request, res: Response): Promise<void> => {
  const userId = (req.session as any)?.user?.id || 'usr_demo_123';
  try {
    await prisma.slackConnection.deleteMany({
      where: { userId }
    });
    res.json({ connected: false });
  } catch (err: any) {
    res.json({ connected: false });
  }
};
