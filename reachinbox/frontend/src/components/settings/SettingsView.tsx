import { SlackConnection, QueueStats } from '../../types';
import { SlackIntegrationCard } from './SlackIntegrationCard';
import { QueueStatusCard } from './QueueStatusCard';

interface SettingsViewProps {
  slackState: SlackConnection;
  onSlackStateChange: (state: SlackConnection) => void;
  queueStats: QueueStats | null;
  queueLoading: boolean;
  onQueueRefresh: () => void;
  onToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export function SettingsView({
  slackState,
  onSlackStateChange,
  queueStats,
  queueLoading,
  onQueueRefresh,
  onToast,
}: SettingsViewProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-[#111111] tracking-tight">
          Settings & Integrations
        </h2>
        <p className="text-xs text-[#6B7280] mt-1">
          Manage Slack notifications, view rate-limit status, and monitor BullMQ queue performance
        </p>
      </div>

      <SlackIntegrationCard
        slackState={slackState}
        onStateChange={onSlackStateChange}
        onToast={onToast}
      />

      <QueueStatusCard
        stats={queueStats}
        loading={queueLoading}
        onRefresh={onQueueRefresh}
      />
    </div>
  );
}
