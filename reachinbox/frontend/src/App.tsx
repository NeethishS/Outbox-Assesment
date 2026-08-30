import { useEffect, useState, useCallback } from 'react';
import { User, ScheduledEmail, SentEmail, QueueStats, SlackConnection, SearchResult, ScheduleEmailPayload } from './types';
import { authService } from './services/authService';
import { emailService } from './services/emailService';
import { searchService } from './services/searchService';
import { slackService } from './services/slackService';
import { queueService } from './services/queueService';
import { useDebounce } from './hooks/useDebounce';

import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ScheduledEmailsTable } from './components/emails/ScheduledEmailsTable';
import { SentEmailsTable } from './components/emails/SentEmailsTable';
import { SearchResults } from './components/emails/SearchResults';
import { ComposeModal } from './components/emails/ComposeModal';
import { SettingsView } from './components/settings/SettingsView';
import { ToastContainer, ToastMessage, ToastType } from './components/ui/Toast';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('scheduled');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Emails & Queue state
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledError, setScheduledError] = useState<string | null>(null);

  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentError, setSentError] = useState<string | null>(null);

  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);

  const [slackState, setSlackState] = useState<SlackConnection>({ connected: false });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, text, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Initial Auth Check
  useEffect(() => {
    if (window.location.search.includes('auth_success=true')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (window.location.search.includes('slack_connected=true')) {
      window.history.replaceState({}, document.title, window.location.pathname);
      addToast('Successfully connected Slack workspace for rate-limit notifications!', 'success');
    }
    authService.getCurrentUser().then(u => {
      setUser(u);
      setAuthChecking(false);
    });
  }, [addToast]);

  // Fetch Data
  const loadScheduledEmails = useCallback(async () => {
    setScheduledLoading(true);
    setScheduledError(null);
    try {
      const data = await emailService.getScheduledEmails();
      setScheduledEmails(data);
    } catch (err) {
      setScheduledError(err instanceof Error ? err.message : 'Failed to fetch scheduled emails');
    } finally {
      setScheduledLoading(false);
    }
  }, []);

  const loadSentEmails = useCallback(async () => {
    setSentLoading(true);
    setSentError(null);
    try {
      const data = await emailService.getSentEmails();
      setSentEmails(data);
    } catch (err) {
      setSentError(err instanceof Error ? err.message : 'Failed to fetch sent emails');
    } finally {
      setSentLoading(false);
    }
  }, []);

  const loadQueueStats = useCallback(async () => {
    setQueueLoading(true);
    try {
      const stats = await queueService.getQueueStats();
      setQueueStats(stats);
    } catch {
      // Ignore fallback queue error
    } finally {
      setQueueLoading(false);
    }
  }, []);

  const loadSlackStatus = useCallback(async () => {
    try {
      const state = await slackService.getStatus();
      setSlackState(state);
    } catch {
      // Ignore slack status error
    }
  }, []);

  const loadAllData = useCallback(() => {
    loadScheduledEmails();
    loadSentEmails();
    loadQueueStats();
    loadSlackStatus();
  }, [loadScheduledEmails, loadSentEmails, loadQueueStats, loadSlackStatus]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // Handle Search Execution
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    setSearchLoading(true);
    setSearchError(null);

    searchService.searchEmails(debouncedSearchQuery)
      .then(results => {
        if (isMounted) {
          setSearchResults(results);
        }
      })
      .catch(err => {
        if (isMounted) {
          setSearchError(err instanceof Error ? err.message : 'Search failed');
        }
      })
      .finally(() => {
        if (isMounted) {
          setSearchLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchQuery]);

  const handleSearchInputChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && activeTab !== 'search') {
      setActiveTab('search');
    }
  };

  const handleScheduleSubmit = async (payload: ScheduleEmailPayload) => {
    try {
      const result = await emailService.scheduleEmails(payload);
      addToast(`Successfully scheduled ${result.count} email job${result.count === 1 ? '' : 's'}.`, 'success');
      loadScheduledEmails();
      loadQueueStats();
    } catch (err: any) {
      addToast(err?.message || 'Failed to schedule emails', 'error');
    }
  };

  const handleCancelEmail = async (id: string) => {
    await emailService.cancelScheduledEmail(id);
    addToast('Scheduled email job cancelled.', 'info');
    loadScheduledEmails();
    loadQueueStats();
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    addToast('Signed out of ReachInbox workspace.', 'info');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FCFCFC] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#00B956] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#6B7280]">Loading ReachInbox workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#FCFCFC] font-sans antialiased text-[#111111] flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onComposeClick={() => setIsComposeOpen(true)}
        user={user}
        onLogout={handleLogout}
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Header
          user={user}
          searchQuery={searchQuery}
          onSearchChange={handleSearchInputChange}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRefresh={loadAllData}
          isRefreshing={scheduledLoading || sentLoading || queueLoading}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#111111] tracking-tight">
                    Scheduled Emails
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Manage upcoming email dispatches, check processing status, and adjust limits
                  </p>
                </div>
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#00B956] hover:bg-[#009E49] transition-all shadow-sm self-start sm:self-auto"
                >
                  + Compose New Email
                </button>
              </div>

              <ScheduledEmailsTable
                emails={scheduledEmails}
                loading={scheduledLoading}
                error={scheduledError}
                onRefresh={loadScheduledEmails}
                onCompose={() => setIsComposeOpen(true)}
                onCancel={handleCancelEmail}
              />
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#111111] tracking-tight">
                  Sent Emails
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Historical log of delivered outreach emails and failed recipient notifications
                </p>
              </div>

              <SentEmailsTable
                emails={sentEmails}
                loading={sentLoading}
                error={sentError}
                onRefresh={loadSentEmails}
                onCompose={() => setIsComposeOpen(true)}
              />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#111111] tracking-tight">
                  Elasticsearch Email Search
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  Perform full-text search across recipients, subjects, body text, and email status
                </p>
              </div>

              <SearchResults
                query={debouncedSearchQuery}
                results={searchResults}
                loading={searchLoading}
                error={searchError}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              slackState={slackState}
              onSlackStateChange={setSlackState}
              queueStats={queueStats}
              queueLoading={queueLoading}
              onQueueRefresh={loadQueueStats}
              onToast={addToast}
            />
          )}
        </main>
      </div>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSchedule={handleScheduleSubmit}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
