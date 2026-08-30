import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

const frontendUrl = process.env.FRONTEND_URL || 'https://outbox-assesment.vercel.app';

const getGoogleRedirectUri = (): string => {
  if (process.env.NODE_ENV === 'development' && !process.env.RENDER && (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost'))) {
    return process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback';
  }
  return 'https://reachinbox-backend-api-tceq.onrender.com/auth/google/callback';
};

export const initiateGoogleOAuth = async (_req: Request, res: Response): Promise<void> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getGoogleRedirectUri();

  console.log(`[Google OAuth Initiate] ClientID=${clientId} | RedirectURI=${redirectUri}`);

  if (!clientId || clientId === 'your_google_client_id') {
    console.log('[Google OAuth] Credentials unconfigured. Redirecting with auth_error.');
    res.redirect(`${frontendUrl}?auth_error=unconfigured_credentials`);
    return;
  }

  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent`;
  res.redirect(googleAuthUrl);
};

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getGoogleRedirectUri();

  if (!code || typeof code !== 'string' || !clientId || !clientSecret) {
    res.redirect(`${frontendUrl}?auth_error=missing_code`);
    return;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json() as { access_token?: string; id_token?: string; error?: string };

    if (!tokenData.access_token) {
      console.error('[Google OAuth Token Error]', tokenData);
      res.redirect(`${frontendUrl}?auth_error=token_exchange_failed`);
      return;
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileRes.json() as { id: string; email: string; name?: string; picture?: string };

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: profile.id },
          { email: profile.email.toLowerCase() }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.email.toLowerCase(),
          name: profile.name || profile.email.split('@')[0],
          avatarUrl: profile.picture
        }
      });
    } else if (!user.googleId || !user.avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          name: profile.name || user.name,
          avatarUrl: profile.picture || user.avatarUrl
        }
      });
    }

    (req.session as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl
    };

    req.session.save(err => {
      if (err) {
        console.error('[Session Save Error]', err);
      }
      res.redirect(`${frontendUrl}?auth_success=true`);
    });
  } catch (err: any) {
    console.error('[Google OAuth Exception]', err.message);
    res.redirect(`${frontendUrl}?auth_error=exception`);
  }
};

export const handleDemoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    let demoUser = await prisma.user.findFirst({
      where: { email: 'demo@reachinbox.ai' }
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@reachinbox.ai',
          name: 'ReachInbox Demo User',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          googleId: 'demo_google_id_123'
        }
      });
    }

    (req.session as any).user = {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      avatarUrl: demoUser.avatarUrl
    };

    req.session.save(err => {
      if (err) console.error('[Demo Session Save Error]', err);
      res.redirect(`${frontendUrl}?auth_success=true`);
    });
  } catch (err: any) {
    console.error('[Demo Auth Error]', err.message);
    res.redirect(`${frontendUrl}?auth_error=demo_failed`);
  }
};

export const getCurrentUser = (req: Request, res: Response): void => {
  const sessionUser = (req.session as any)?.user;
  if (sessionUser) {
    res.json({ success: true, user: sessionUser });
  } else {
    res.status(401).json({ success: false, user: null, message: 'Unauthenticated' });
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
};
