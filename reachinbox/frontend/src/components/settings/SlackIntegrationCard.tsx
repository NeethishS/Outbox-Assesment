import { useState } from 'react';
import { MessageSquare, CheckCircle2, ExternalLink, Unlink } from 'lucide-react';
import { SlackConnection } from '../../types';
import { slackService } from '../../services/slackService';

interface SlackIntegrationCardProps {
  slackState: SlackConnection;
  onStateChange: (state: SlackConnection) => void;
  onToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export function SlackIntegrationCard({
  slackState,
  onStateChange,
  onToast,
}: SlackIntegrationCardProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await slackService.initiateOAuth();
    } catch {
      onToast('Failed to start Slack OAuth flow.', 'error');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const newState = await slackService.disconnect();
      onStateChange(newState);
      onToast('Slack workspace disconnected successfully.', 'info');
    } catch {
      onToast('Failed to disconnect Slack.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111111]">Slack Notification Alerts</h3>
            <p className="text-xs text-[#6B7280]">
              Receive real-time Slack notifications when email senders reach hourly rate limits
            </p>
          </div>
        </div>

        {slackState.connected ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F7EF] text-[#00B956] border border-[#00B956]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Slack Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-[#6B7280]">
            Disconnected
          </span>
        )}
      </div>

      {slackState.connected ? (
        <div className="mt-4 p-4 rounded-xl bg-[#FCFCFC] border border-[#E5E7EB] space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-[#6B7280]">Workspace:</span>
              <span className="font-semibold text-[#111111]">{slackState.teamName || 'ReachInbox Slack'}</span>
            </div>
            <div>
              <span className="block text-[#6B7280]">Notification Channel:</span>
              <span className="font-semibold text-[#111111]">{slackState.channel || '#email-alerts'}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[11px] text-[#6B7280]">
              Connected on {slackState.connectedAt ? new Date(slackState.connectedAt).toLocaleDateString() : 'Active'}
            </span>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-red-50 transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <p className="text-xs text-[#6B7280] max-w-md">
            Clicking Connect Slack initiates backend OAuth redirect to authorize your workspace for rate limit events.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#00B956] hover:bg-[#009E49] transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Connect Slack</span>
          </button>
        </div>
      )}
    </div>
  );
}
