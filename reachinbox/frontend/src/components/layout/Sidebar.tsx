import { Mail, Clock, Send, Search, Settings, Plus, LogOut, X, Activity } from 'lucide-react';
import { User } from '../../types';

export type TabType = 'scheduled' | 'sent' | 'search' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onComposeClick: () => void;
  user: User;
  onLogout: () => void;
  scheduledCount?: number;
  sentCount?: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onComposeClick,
  user,
  onLogout,
  scheduledCount = 0,
  sentCount = 0,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const navItems = [
    { id: 'scheduled' as TabType, label: 'Scheduled Emails', icon: Clock, count: scheduledCount },
    { id: 'sent' as TabType, label: 'Sent Emails', icon: Send, count: sentCount },
    { id: 'search' as TabType, label: 'Search Messages', icon: Search },
    { id: 'settings' as TabType, label: 'Settings & Integrations', icon: Settings },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#E8F7EF] text-[#00B956] border border-[#00B956]/20 font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#111111] leading-tight">ReachInbox<span className="text-[#00B956]">.ai</span></h1>
              <span className="text-xs text-[#6B7280]">Email Job Scheduler</span>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              onComposeClick();
              onMobileClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#00B956] hover:bg-[#009E49] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00B956]"
          >
            <Plus className="w-4 h-4" />
            <span>Compose New Email</span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onMobileClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E8F7EF] text-[#00B956] font-semibold'
                    : 'text-[#111111] hover:bg-[#F5F7F6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00B956]' : 'text-[#6B7280]'}`} />
                  <span>{item.label}</span>
                </div>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-[#00B956] text-white' : 'bg-gray-100 text-[#6B7280]'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#FCFCFC]">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#111111] truncate">{user.name}</p>
              <p className="text-[11px] text-[#6B7280] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#DC2626] bg-red-50 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
