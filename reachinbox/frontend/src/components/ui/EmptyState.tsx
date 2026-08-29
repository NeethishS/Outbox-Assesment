import { ReactNode } from 'react';
import { Mail, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon = <Mail className="w-10 h-10 text-gray-400" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-gray-200">
      <div className="p-4 mb-4 bg-[#F5F7F6] rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#111111] mb-1">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#00B956] hover:bg-[#009E49] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
}
