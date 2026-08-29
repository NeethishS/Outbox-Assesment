import { EmailStatus } from '../../types';
import { Clock, RefreshCw, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface BadgeProps {
  status: EmailStatus;
}

export function StatusBadge({ status }: BadgeProps) {
  switch (status) {
    case 'Scheduled':
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F7EF] text-[#00B956] border border-[#00B956]/20">
          <Clock className="w-3.5 h-3.5" />
          Scheduled
        </span>
      );
    case 'Processing':
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Processing
        </span>
      );
    case 'Rate Limited':
    case 'RATE_LIMITED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          Rate Limited
        </span>
      );
    case 'Failed':
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    case 'Sent':
    case 'SENT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F7EF] text-[#00B956] border border-[#00B956]/30">
          <CheckCircle className="w-3.5 h-3.5" />
          Sent
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          {status}
        </span>
      );
  }
}
