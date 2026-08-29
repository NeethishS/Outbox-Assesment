import { QueueStats } from '../../types';
import { queueService } from '../../services/queueService';
import { Cpu, ExternalLink, RefreshCw } from 'lucide-react';

interface QueueStatusCardProps {
  stats: QueueStats | null;
  loading: boolean;
  onRefresh: () => void;
}

export function QueueStatusCard({ stats, loading, onRefresh }: QueueStatusCardProps) {
  const dashboardUrl = queueService.getBullMQDashboardUrl();

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00B956]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111111]">BullMQ Queue System Status</h3>
            <p className="text-xs text-[#6B7280]">
              Redis-backed asynchronous email job processing and worker status
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-[#F5F7F6]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00B956]' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4">
        <div className="p-3 bg-[#FCFCFC] border border-[#E5E7EB] rounded-xl text-center">
          <span className="block text-[11px] font-semibold text-[#6B7280] uppercase">Waiting</span>
          <span className="text-lg font-extrabold text-[#111111]">{stats ? stats.waiting : 0}</span>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
          <span className="block text-[11px] font-semibold text-blue-600 uppercase">Active</span>
          <span className="text-lg font-extrabold text-blue-700">{stats ? stats.active : 0}</span>
        </div>

        <div className="p-3 bg-[#E8F7EF] border border-[#00B956]/20 rounded-xl text-center">
          <span className="block text-[11px] font-semibold text-[#00B956] uppercase">Completed</span>
          <span className="text-lg font-extrabold text-[#00B956]">{stats ? stats.completed : 0}</span>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
          <span className="block text-[11px] font-semibold text-amber-600 uppercase">Delayed</span>
          <span className="text-lg font-extrabold text-amber-700">{stats ? stats.delayed : 0}</span>
        </div>

        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center col-span-2 sm:col-span-1">
          <span className="block text-[11px] font-semibold text-[#DC2626] uppercase">Failed</span>
          <span className="text-lg font-extrabold text-[#DC2626]">{stats ? stats.failed : 0}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">
          BullMQ Dashboard live admin route available on backend
        </span>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00B956] hover:text-[#009E49]"
        >
          <span>Open BullMQ Live Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
