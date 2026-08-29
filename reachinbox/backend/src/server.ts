import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`⚡️ [ReachInbox Server]: Running at http://localhost:${PORT}`);
  console.log(`📊 [BullMQ Dashboard]: Live at http://localhost:${PORT}/admin/queues`);
});
