import { useState, ChangeEvent, FormEvent } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Clock, Shield, Sparkles } from 'lucide-react';
import { ScheduleEmailPayload } from '../../types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (payload: ScheduleEmailPayload) => Promise<void>;
}

export function ComposeModal({ isOpen, onClose, onSchedule }: ComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date(Date.now() + 5 * 60 * 1000);
    return now.toISOString().slice(0, 16);
  });
  const [delaySeconds, setDelaySeconds] = useState<number>(60);
  const [hourlyLimit, setHourlyLimit] = useState<number>(50);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [parseError, setParseError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseEmailFile = (text: string, name: string) => {
    setParseError(null);
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];

    if (matches.length === 0) {
      setParseError('No valid email addresses were found in the uploaded file.');
      setRecipients([]);
      setFileName(name);
      setDuplicateCount(0);
      return;
    }

    const uniqueEmails = Array.from(new Set(matches.map(e => e.toLowerCase())));
    const dupes = matches.length - uniqueEmails.length;

    setRecipients(uniqueEmails);
    setDuplicateCount(dupes);
    setFileName(name);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setParseError('Please upload a valid CSV or TXT file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      parseEmailFile(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Failed to read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (recipients.length === 0) {
      setFormError('Please upload a file containing at least one valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Please provide an email subject.');
      return;
    }
    if (!body.trim()) {
      setFormError('Please provide an email body.');
      return;
    }
    if (!startTime) {
      setFormError('Please select a valid start time.');
      return;
    }

    setSubmitting(true);

    try {
      await onSchedule({
        recipients,
        subject,
        body,
        startTime: new Date(startTime).toISOString(),
        delaySeconds: Number(delaySeconds),
        hourlyLimit: Number(hourlyLimit),
      });

      // Reset form
      setSubject('');
      setBody('');
      setRecipients([]);
      setFileName('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to schedule emails.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCFCFC]">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Compose Scheduled Email</h2>
            <p className="text-xs text-[#6B7280]">Configure outreach campaign recipient queue and timing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-[#F5F7F6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Recipients CSV / TXT File
            </label>
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-4 text-center hover:border-[#00B956] transition-colors bg-[#FCFCFC]">
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                id="csv-upload-input"
                className="hidden"
              />
              <label htmlFor="csv-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                <Upload className="w-6 h-6 text-[#00B956]" />
                <span className="text-xs font-semibold text-[#111111]">
                  {fileName ? `File: ${fileName}` : 'Click to upload CSV or TXT file'}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Supports comma or line-separated list of email addresses
                </span>
              </label>
            </div>

            {parseError && (
              <p className="mt-2 text-xs text-[#DC2626] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {parseError}
              </p>
            )}

            {recipients.length > 0 && (
              <div className="mt-2.5 p-3 bg-[#E8F7EF] border border-[#00B956]/30 rounded-xl text-xs text-[#00B956] font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00B956]" />
                  <span>
                    <strong>{recipients.length} valid email addresses detected</strong>
                    {duplicateCount > 0 && ` (${duplicateCount} duplicate addresses ignored)`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Q3 Partnership Inquiry & Strategic Alignment"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#00B956]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Email Body
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your email content here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#00B956] resize-none"
              required
            />
          </div>

          <div className="pt-3 border-t border-[#E5E7EB]">
            <h3 className="text-xs font-bold text-[#111111] mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#00B956]" />
              Schedule & Rate Limit Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#00B956]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Delay Between Emails (sec)
                </label>
                <input
                  type="number"
                  min={1}
                  value={delaySeconds}
                  onChange={e => setDelaySeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#00B956]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Hourly Sending Limit
                </label>
                <input
                  type="number"
                  min={1}
                  value={hourlyLimit}
                  onChange={e => setHourlyLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#00B956]"
                  required
                />
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FCFCFC] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F5F7F6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || recipients.length === 0}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#00B956] hover:bg-[#009E49] disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Scheduling Jobs...</span>
              </>
            ) : (
              <span>Schedule {recipients.length > 0 ? `${recipients.length} Emails` : 'Emails'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
