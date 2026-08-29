import { Search, Menu, RefreshCw, LogOut } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileMenu: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onLogout?: () => void;
}

export function Header({
  user,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing = false,
  onLogout,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-[#F5F7F6] lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search scheduled & sent emails, recipients, subjects..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-[#E5E7EB] bg-[#F5F7F6] text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#00B956] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh queue data"
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-[#F5F7F6] transition-colors border border-[#E5E7EB] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00B956]' : ''}`} />
          </button>
        )}

        <div className="flex items-center gap-3 pl-3 border-l border-[#E5E7EB]">
          <img
            src={user.avatarUrl || user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
          />
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-[#111111]">{user.name}</span>
            <span className="block text-[11px] text-[#6B7280]">{user.email}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-gray-500 hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
