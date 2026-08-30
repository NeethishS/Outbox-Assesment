import { ScheduledEmail } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { TableSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Trash2, RefreshCw, Calendar, AlertCircle } from 'lucide-react';

interface ScheduledEmailsTableProps {
  emails: ScheduledEmail[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCompose: () => void;
  onCancel: (id: string) => void;
}

export function ScheduledEmailsTable({
  emails,
  loading,
  error,
  onRefresh,
  onCompose,
  onCancel,
}: ScheduledEmailsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#DC2626]">Failed to load scheduled emails</h3>
        <p className="text-xs text-red-600 mt-1 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white border border-red-200 text-xs font-semibold text-[#DC2626] rounded-lg hover:bg-red-100"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        title="No scheduled emails yet"
        description="Schedule email outreach campaigns with rate limits and custom delay parameters."
        actionText="Compose New Email"
        onAction={onCompose}
        icon={<Calendar className="w-10 h-10 text-[#00B956]" />}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCFCFC]">
        <div>
          <h3 className="text-sm font-bold text-[#111111]">Scheduled Email Queue</h3>
          <p className="text-xs text-[#6B7280]">Emails waiting to be processed by workers</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111111] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7F6]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#111111]">
          <thead className="bg-[#F5F7F6] text-[#6B7280] font-semibold border-b border-[#E5E7EB] uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Recipient</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Scheduled Time</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {emails.map(email => {
              const timeStr = email.scheduledTime || email.scheduledAt || '';
              let displayDate = 'Pending';
              if (timeStr) {
                try {
                  const d = new Date(timeStr);
                  if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                  }
                } catch {
                  displayDate = 'Pending';
                }
              }

              return (
                <tr key={email.id} className="hover:bg-[#FCFCFC] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#111111]">
                    {email.recipient}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-[#6B7280]">
                    {email.subject}
                  </td>
                  <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">
                    {displayDate}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={email.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onCancel(email.id)}
                      title="Cancel scheduled job"
                      className="p-1.5 text-gray-400 hover:text-[#DC2626] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
