import { SearchResult } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { TableSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Search } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}

export function SearchResults({ query, results, loading, error }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden p-6 space-y-4">
        <div className="text-xs font-semibold text-[#6B7280]">Querying Elasticsearch index...</div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <h3 className="text-sm font-bold text-[#DC2626]">Search Error</h3>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <EmptyState
        title="Search Outreach Messages"
        description="Type a recipient email address, subject, or status keyword in the top search bar to search using Elasticsearch."
        icon={<Search className="w-10 h-10 text-[#00B956]" />}
      />
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        title={`No results found for "${query}"`}
        description="Try searching with a different email address, subject line, or status."
        icon={<Search className="w-10 h-10 text-gray-400" />}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#E5E7EB] bg-[#FCFCFC]">
        <h3 className="text-sm font-bold text-[#111111]">
          Elasticsearch Search Results
        </h3>
        <p className="text-xs text-[#6B7280]">
          Found {results.length} matching email record{results.length === 1 ? '' : 's'} for &quot;{query}&quot;
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#111111]">
          <thead className="bg-[#F5F7F6] text-[#6B7280] font-semibold border-b border-[#E5E7EB] uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Recipient</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {results.map(item => {
              const timeStr = item.timestamp || item.sentAt || item.scheduledAt || '';
              const displayDate = timeStr ? new Date(timeStr).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short'
              }) : 'N/A';
              const resultType = item.type || (item.status === 'SENT' || item.status === 'Sent' ? 'sent' : 'scheduled');

              return (
                <tr key={item.id} className="hover:bg-[#FCFCFC] transition-colors">
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        resultType === 'scheduled'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {resultType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#111111]">
                    {item.recipient}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-[#6B7280]">
                    {item.subject}
                  </td>
                  <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">
                    {displayDate}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
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
