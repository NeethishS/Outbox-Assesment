import { Request, Response } from 'express';
import {
  scheduleEmails as scheduleService,
  getScheduledEmails as getScheduledService,
  getSentEmails as getSentService,
  cancelScheduledEmail as cancelService
} from '../services/emailService';
import { searchEmailsInElasticsearch } from '../services/elasticsearchService';

export const scheduleEmailsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipients, subject, body, startTime, delaySeconds, hourlyLimit, sender } = req.body;
    const userId = (req.session as any)?.user?.id || undefined;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ success: false, message: 'Recipients array is required.' });
      return;
    }

    if (!subject || !body) {
      res.status(400).json({ success: false, message: 'Subject and body are required.' });
      return;
    }

    const result = await scheduleService({
      recipients,
      subject,
      body,
      startTime: startTime || new Date().toISOString(),
      delaySeconds: Number(delaySeconds) || 0,
      hourlyLimit: Number(hourlyLimit) || 200,
      sender: sender || 'default@reachinbox.ai',
      userId
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error('[Schedule Emails Controller Error]', err.message);
    res.status(500).json({ success: false, message: err.message || 'Unable to schedule emails' });
  }
};

export const getScheduledEmailsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any)?.user?.id || undefined;
    const emails = await getScheduledService(userId);
    res.json(emails);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch scheduled emails' });
  }
};

export const getSentEmailsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.session as any)?.user?.id || undefined;
    const emails = await getSentService(userId);
    res.json(emails);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch sent emails' });
  }
};

export const searchEmailsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    const userId = (req.session as any)?.user?.id || undefined;
    const results = await searchEmailsInElasticsearch(query, userId);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to perform email search' });
  }
};

export const cancelScheduledEmailHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.session as any)?.user?.id || undefined;
    const success = await cancelService(id, userId);
    if (success) {
      res.json({ success: true, message: `Scheduled email ${id} cancelled successfully` });
    } else {
      res.status(404).json({ success: false, message: `Scheduled email ${id} not found` });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to cancel email' });
  }
};
