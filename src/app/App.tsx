import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, ClipboardCheck, FileEdit, FolderOpen, ShieldCheck, Users,
  CheckCircle2, Clock, XCircle, ChevronRight, Activity, CalendarDays,
  UserCheck, Award, Briefcase, FileText, Sun, Moon,
  User, Mail, Phone, Compass, Globe, MessageSquare, GraduationCap,
  Lock, Eye, EyeOff, LogOut, Megaphone, AlertCircle, HelpCircle,
  Download, Share2, ExternalLink, ShieldAlert, ListChecks, Undo2,
  Sparkles, BookOpen, Info, Check, ArrowRight, UserPlus,
  Send, Save, Edit3, Trash2, Plus, RefreshCw, AlertTriangle, MailCheck, Loader2, X
} from 'lucide-react';

// === Constants & Authorized Role Categories ===
const ELECTION_POSITIONS = [
  "President",
  "Vice President",
  "Secretary",
  "Joint Secretary",
  "Treasurer",
  "Joint Treasurer"
];

// Authorized Additional Responsibility categories per bylaws:
const RESPONSIBILITY_CATEGORIES = [
  {
    id: "Office Bearer",
    label: "Office Bearer",
    description: "Served as an Office Bearer (President, VP, Secretary, etc.) — Mandatory in preceding 5 yrs for President candidate"
  },
  {
    id: "Chapter Coordinator",
    label: "Chapter Coordinator",
    description: "Regional or International Alumni Chapter coordinator / lead"
  },
  {
    id: "Alumni Association Club Coordinator",
    label: "Alumni Association Club Coordinator",
    description: "Coordinator of designated Alumni student/alumni clubs (IT, AI&DS, IEEE, CSE, etc.)"
  },
  {
    id: "Mentorship or Placement Coordinator",
    label: "Mentorship or Placement Coordinator",
    description: "Alumni mentorship initiatives, career mentoring, placement driver"
  },
  {
    id: "Data Management Team Coordinator",
    label: "Data Management Team Coordinator",
    description: "Alumni database, portal records, directory and data management team lead"
  }
];

const CLUBS = [
  "IT Club", "AI&DS Club", "IEEE Club", "CSE Club", "CSI Club", "NewGen Club", "Robotics Club", "Entrepreneurship Club"
];

// === Shared Visual Components ===

const BackgroundBlobs = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-500 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 dark:from-indigo-950 dark:via-slate-950 dark:to-blue-950">
    <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[150px]" />
    <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[100px]" />
  </div>
);

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt((value || 0).toString());
    if (start === end) {
      setCount(end);
      return;
    }

    let totalMilSecDur = 800;
    let incrementTime = Math.max(10, Math.floor(totalMilSecDur / Math.max(end, 1)));

    let timer = setInterval(() => {
      start += Math.ceil(end / 40) || 1;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
};

const MultiSelectDropdown = ({ options, selected, onChange, placeholder, className }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={className || "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white cursor-pointer flex justify-between items-center transition-all focus:ring-2 focus:ring-purple-500/50"}
      >
        <span className={selected.length === 0 ? "text-slate-400 dark:text-slate-500" : "truncate pr-4 font-medium"}>
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <ChevronRight className={`text-slate-400 pointer-events-none transition-transform ${isOpen ? 'rotate-[270deg]' : 'rotate-90'}`} size={18} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1"
          >
            {options.map((opt: string) => (
              <div 
                key={opt}
                onClick={() => {
                  if (selected.includes(opt)) onChange(selected.filter((o: string) => o !== opt));
                  else onChange([...selected, opt]);
                }}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selected.includes(opt) && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-200">{opt}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FormFieldLabel = ({ icon: Icon, label, required = true }: { icon: any, label: string, required?: boolean }) => (
  <div className="flex items-center space-x-2 mb-2">
    <div className="w-1 h-3.5 bg-indigo-600 rounded-full"></div>
    <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
      {label} {required && <span className="text-indigo-500">*</span>}
    </span>
  </div>
);

// === Phase 1: Announcement & Official Notification Screen ===

const AnnouncementScreen = ({ onProceedToEligibility, onProceedToApply, isAdmin, token, userProfile }: any) => {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGazetteModal, setShowGazetteModal] = useState(false);
  const [adminMode, setAdminMode] = useState<'manage' | 'preview'>('manage');
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTargetMode, setEmailTargetMode] = useState<'all' | 'single'>('all');
  const [singleRecipientEmail, setSingleRecipientEmail] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  const handleLoadEmailPreview = async (formOverride?: any) => {
    setLoadingPreview(true);
    try {
      const authToken = token || localStorage.getItem('ems_token');
      const payload = formOverride || editForm;
      const res = await fetch('http://localhost:5000/api/elections/announcement/email-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.html) {
        setPreviewHtmlContent(data.html);
        setShowLivePreviewModal(true);
      } else {
        alert("Failed to load email preview: " + (data.error || "Unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error generating email preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const [editForm, setEditForm] = useState<any>({
    title: "Official Notification: Alumni Association Office Bearer Elections 2026",
    notificationNumber: "AA/ELEC/2026/01",
    description: "Nominations are hereby called for the positions of Office Bearers for the term 2026–2028. Published via the official Alumni portal at least one month prior to the AGM.",
    publishedVia: "Official Alumni Website Portal",
    status: "published",
    electionYear: "2026",
    electionDate: "2026-10-25",
    electionStartTime: "10:00 AM",
    electionEndTime: "04:00 PM",
    agmDate: "2026-10-25T10:00:00.000Z",
    nominationStartDate: "2026-09-12T00:00:00.000Z",
    nominationDeadline: "2026-09-30T23:59:59.000Z",
    scrutinyMeetingDate: "2026-10-05T14:00:00.000Z",
    withdrawalDeadline: "2026-10-14T17:00:00.000Z",
    finalListDate: "2026-10-18T10:00:00.000Z",
    votingDateTime: "2026-10-25T10:00:00.000Z",
    contactInfo: "",
    emailSubject: "OFFICIAL NOTIFICATION: Alumni Association Office Bearer Elections 2026 – Call for Nominations [Ref: AA/ELEC/2026/01]",
    emailIntro: "Notice is hereby formally given to all registered alumni members regarding the Alumni Association General Election for Executive Office Bearers for the 2026–2028 tenure.",
    emailBody: "Nominations are hereby called for the positions of Office Bearers for the term 2026–2028. Published via the official Alumni portal at least one month prior to the AGM.",
    emailCustomNotes: "",
    emailSignOffAuthorized: "Alumni Election Commission",
    emailSignOffApproved: "Patron & Principal"
  });

  const fetchAnnouncement = () => {
    setLoading(true);
    const authToken = token || localStorage.getItem('ems_token');
    fetch('http://localhost:5000/api/elections/announcement', {
      headers: {
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        const ann = data.announcement || data;
        setAnnouncement(ann);
        if (ann && typeof ann === 'object') {
          const yr = ann.electionYear || "2026";
          const notif = ann.notificationNumber || "AA/ELEC/2026/01";
          const title = ann.title || "Alumni Association General Election 2026";
          setEditForm({
            title: ann.title || "",
            notificationNumber: notif,
            description: ann.description || "",
            publishedVia: ann.publishedVia || "Official Alumni Website Portal",
            status: ann.status || "published",
            electionYear: yr,
            electionDate: ann.electionDate || "2026-10-25",
            electionStartTime: ann.electionStartTime || "10:00 AM",
            electionEndTime: ann.electionEndTime || "04:00 PM",
            agmDate: ann.agmDate || "2026-10-25T10:00:00.000Z",
            nominationStartDate: ann.nominationStartDate || "2026-09-12T00:00:00.000Z",
            nominationDeadline: ann.nominationDeadline || "2026-09-30T23:59:59.000Z",
            scrutinyMeetingDate: ann.scrutinyMeetingDate || "2026-10-05T14:00:00.000Z",
            withdrawalDeadline: ann.withdrawalDeadline || "2026-10-14T17:00:00.000Z",
            finalListDate: ann.finalListDate || "2026-10-18T10:00:00.000Z",
            votingDateTime: ann.votingDateTime || "2026-10-25T10:00:00.000Z",
            contactInfo: ann.contactInfo || "",
            emailSubject: ann.emailSubject || `OFFICIAL NOTIFICATION: ${title} – Call for Nominations [Ref: ${notif}]`,
            emailIntro: ann.emailIntro || `Notice is hereby formally given to all registered alumni members regarding the Alumni Association General Election for Executive Office Bearers for the ${yr}–${Number(yr) + 2} tenure.`,
            emailBody: ann.emailBody || ann.description || "Nominations are hereby called for the positions of Office Bearers for the term 2026–2028. Published via the official Alumni portal at least one month prior to the AGM.",
            emailCustomNotes: ann.emailCustomNotes || "",
            emailSignOffAuthorized: ann.emailSignOffAuthorized || "Alumni Election Commission",
            emailSignOffApproved: ann.emailSignOffApproved || "Patron & Principal"
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchSmtpStatus = () => {
    const authToken = token || localStorage.getItem('ems_token');
    if (!authToken) return;
    fetch('http://localhost:5000/api/elections/smtp-status', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.configured === 'boolean') {
          setSmtpConfigured(data.configured);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAnnouncement();
    fetchSmtpStatus();
  }, [token]);

  const handleSaveAnnouncement = async (overrideStatus?: 'published' | 'draft') => {
    setIsSaving(true);
    const authToken = token || localStorage.getItem('ems_token');
    const payload = {
      ...editForm,
      ...(overrideStatus ? { status: overrideStatus } : {})
    };

    try {
      const res = await fetch('http://localhost:5000/api/elections/announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncement(payload);
        setEditForm(payload);
        alert(overrideStatus === 'published' ? 'Announcement successfully published live to all alumni!' : overrideStatus === 'draft' ? 'Announcement set to draft mode (hidden from alumni).' : 'Announcement details saved successfully.');
      } else {
        alert(data.error || 'Failed to save announcement');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving announcement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!confirm("Are you sure you want to delete and reset the current election announcement?")) return;
    const authToken = token || localStorage.getItem('ems_token');
    try {
      const res = await fetch('http://localhost:5000/api/elections/announcement', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        alert("Announcement reset.");
        fetchAnnouncement();
      } else {
        alert("Failed to delete announcement.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  const handleSendBroadcast = async () => {
    if (emailTargetMode === 'single') {
      const email = singleRecipientEmail.trim();
      if (!email || !email.includes('@') || !email.includes('.')) {
        alert("Please enter a valid recipient email address.");
        return;
      }
    }

    if (!smtpConfigured && !smtpPass.trim()) {
      alert("Please enter your 16-character Gmail App Password to send live emails from muralisubbu11@gmail.com.");
      return;
    }

    setIsBroadcasting(true);
    const authToken = token || localStorage.getItem('ems_token');
    try {
      const bodyPayload: any = {
        emailSubject: editForm.emailSubject,
        emailIntro: editForm.emailIntro,
        emailBody: editForm.emailBody,
        emailCustomNotes: editForm.emailCustomNotes,
        emailSignOffAuthorized: editForm.emailSignOffAuthorized,
        emailSignOffApproved: editForm.emailSignOffApproved
      };
      if (emailTargetMode === 'single') {
        bodyPayload.recipientEmail = singleRecipientEmail.trim();
      }
      if (smtpPass.trim()) {
        bodyPayload.smtpPass = smtpPass.trim();
      }

      const res = await fetch('http://localhost:5000/api/elections/announcement/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastResult(data);
        setSmtpConfigured(true);
      } else {
        alert(data.error || 'Failed to send announcement.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error while dispatching announcement email: ' + (err.message || ''));
    } finally {
      setIsBroadcasting(false);
    }
  };

  const isPublished = announcement && announcement.status === 'published';

  // Format date helper
  const formatDateDisplay = (dateStr: string, fallback: string) => {
    if (!dateStr) return fallback;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return fallback;
    }
  };

  // If alumni and not published, display clean read-only pending screen
  if (!loading && !isAdmin && (!isPublished || !announcement)) {
    return (
      <div className="space-y-6 relative z-10 pb-20 max-w-3xl mx-auto text-center pt-8">
        <div className="clay-card p-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Megaphone size={32} />
          </div>
          <span className="px-3.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800">
            OFFICIAL STATUS • PENDING PUBLICATION
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Election Announcement Pending Publication
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            The Alumni Election Commission has not yet formally published the official gazette notification for the forthcoming elections.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Once certified and published, the complete election schedule, nomination deadline, and AGM date will appear here and will be broadcast to your registered email.
          </div>
          <div className="pt-2">
            <button
              onClick={onProceedToEligibility}
              className="clay-btn px-6 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2"
            >
              <ClipboardCheck size={16} /> Evaluate Nominee Eligibility Meanwhile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10 pb-20">
      {/* Admin Management Toolbar (Admin Only) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 border-l-4 border-purple-600 shadow-md space-y-4"
        >
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/25 flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Announcement Management & Broadcast Console</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border ${
                    editForm.status === 'published' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300' 
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300'
                  }`}>
                    {editForm.status === 'published' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {editForm.status === 'published' ? 'Live: Visible to Alumni' : 'Draft: Hidden from Alumni'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage election parameters, publish statutory notifications, or send broadcast emails to all alumni.
                </p>
              </div>
            </div>

            {/* Mode switcher & primary actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAdminMode('manage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    adminMode === 'manage' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Edit3 size={14} /> Edit & Manage
                </button>
                <button
                  type="button"
                  onClick={() => setAdminMode('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    adminMode === 'preview' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Eye size={14} /> Alumni View
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEmailTargetMode('all');
                  setBroadcastResult(null);
                  setShowEmailModal(true);
                }}
                className="clay-btn px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                title="Send official election announcement to all registered alumni members"
              >
                <Users size={14} /> Send to All Alumni
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailTargetMode('single');
                  setBroadcastResult(null);
                  setShowEmailModal(true);
                }}
                className="clay-btn px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                title="Send official call for announcement to one single person"
              >
                <Send size={14} /> Send to Single Person
              </button>

              <button
                type="button"
                onClick={() => handleSaveAnnouncement(editForm.status === 'published' ? 'draft' : 'published')}
                disabled={isSaving}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                  editForm.status === 'published' 
                    ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                {editForm.status === 'published' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                {editForm.status === 'published' ? 'Unpublish' : 'Publish Live'}
              </button>

              <button
                type="button"
                onClick={() => handleSaveAnnouncement()}
                disabled={isSaving}
                className="clay-btn px-4 py-2 bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleDeleteAnnouncement}
                className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                title="Reset to default announcement"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Admin Mode: Management Form */}
      {isAdmin && adminMode === 'manage' ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="clay-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Election Announcement Editor</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Modify complete statutory information, dates, rules, and publication status</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Ref: {editForm.notificationNumber}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Official Election Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Notification Reference Number *</label>
                <input
                  type="text"
                  value={editForm.notificationNumber}
                  onChange={(e) => setEditForm({ ...editForm, notificationNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Election Year *</label>
                <input
                  type="text"
                  value={editForm.electionYear}
                  onChange={(e) => setEditForm({ ...editForm, electionYear: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Published Via *</label>
                <input
                  type="text"
                  value={editForm.publishedVia}
                  onChange={(e) => setEditForm({ ...editForm, publishedVia: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Publication Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white font-bold"
                >
                  <option value="published">Published (Visible to all alumni)</option>
                  <option value="draft">Draft (Restricted to Admin)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                <CalendarDays size={16} className="text-indigo-600" /> Statutory Milestone Schedule & Deadlines
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">AGM Date</label>
                  <input
                    type="date"
                    value={(editForm.agmDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, agmDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nomination Start Date</label>
                  <input
                    type="date"
                    value={(editForm.nominationStartDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, nominationStartDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nomination Deadline</label>
                  <input
                    type="date"
                    value={(editForm.nominationDeadline || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, nominationDeadline: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Scrutiny Conclave Date</label>
                  <input
                    type="date"
                    value={(editForm.scrutinyMeetingDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, scrutinyMeetingDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Candidate Withdrawal Deadline</label>
                  <input
                    type="date"
                    value={(editForm.withdrawalDeadline || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, withdrawalDeadline: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Final Candidate List Publication</label>
                  <input
                    type="date"
                    value={(editForm.finalListDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, finalListDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Voting Schedule / Hours</label>
                  <input
                    type="text"
                    value={editForm.electionStartTime + " - " + editForm.electionEndTime}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      setEditForm({ ...editForm, electionStartTime: parts[0]?.trim() || '', electionEndTime: parts[1]?.trim() || '' });
                    }}
                    placeholder="10:00 AM - 04:00 PM"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">Official Constitutional Preamble / Notice Text *</label>
              <textarea
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminMode('preview')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Eye size={14} /> Preview Live Gazette
              </button>
              <button
                type="button"
                onClick={() => handleSaveAnnouncement()}
                disabled={isSaving}
                className="clay-btn px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <Save size={15} /> {isSaving ? 'Saving Changes...' : 'Save Announcement Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Gazette View (Shown to Alumni OR Admin in Preview Mode) */}
      {(!isAdmin || adminMode === 'preview') && (
        <div className="space-y-8">
          {/* Official Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 md:p-10 border-l-8 border-indigo-600 relative overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3.5 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold rounded-full tracking-wider border border-indigo-200 dark:border-indigo-700/50">
                    OFFICIAL NOTIFICATION • REF: {announcement?.notificationNumber || "AA/ELEC/2026/01"}
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1.5 border border-green-200 dark:border-green-800">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> Call For Nominations Open
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                    Strict: No Self-Nomination
                  </span>
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-bold rounded-full border border-purple-300">
                      Admin Preview Mode
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {announcement?.title || "Alumni Association Office Bearer Elections 2026"}
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {announcement?.description || "Nominations are hereby called for the positions of Office Bearers for the term 2026–2028. Published via the official Alumni portal at least one month prior to the forthcoming Annual General Meeting (AGM)."}
                </p>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
                  <Info size={16} className="text-amber-600 flex-shrink-0" />
                  <span><strong>Constitutional Rule:</strong> There is <strong>no self-nomination</strong>. A candidate can only be nominated when proposed by an eligible registered alumni member and seconded.</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5"><CalendarDays size={15} className="text-indigo-600" /> AGM Date: <strong>{formatDateDisplay(announcement?.agmDate, 'October 25, 2026')}</strong></span>
                  <span className="flex items-center gap-1.5"><CalendarDays size={15} className="text-indigo-600" /> Nomination Starts: <strong>{formatDateDisplay(announcement?.nominationStartDate, 'September 12, 2026')}</strong></span>
                  <span className="flex items-center gap-1.5"><Clock size={15} className="text-indigo-600" /> Nomination Deadline: <strong>{formatDateDisplay(announcement?.nominationDeadline, 'September 30, 2026')}</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowGazetteModal(true)}
                  className="clay-btn px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50"
                >
                  <FileText size={18} className="text-indigo-600" /> View Gazette Notice
                </button>
                <button
                  onClick={onProceedToApply}
                  className="clay-btn px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                >
                  <UserPlus size={18} /> Propose a Candidate
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mandatory Statutory Rules Notice Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="clay-card p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="clay-icon w-12 h-12 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Statutory Election Framework</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Adopted as per the Alumni Association Bylaws</p>
                </div>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Proposal-Driven Only:</strong> There is NO self-nomination. An alumni member must be proposed by an eligible member and seconded.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span><strong>1-Month Announcement Window:</strong> Call for nominations announced at least 30 days prior to the AGM.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span><strong>President Qualifying Requirement:</strong> Candidate must have served as an Office Bearer in the immediate preceding 5 years (2021–2026).</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Universal 1-Year Continuous Service:</strong> Nominee must have actively served for ≥ 1 year continuously without gap in past 5 years in an authorized role.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="clay-card p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="clay-icon w-12 h-12 text-purple-600 dark:text-purple-400">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Roles Open for Nominations</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Executive Office Bearers (Tenure 2026–2028)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  { title: "1. President", posts: "1 Post", desc: "Requires Preceding 5-Yr Office Bearer Service" },
                  { title: "2. Vice President", posts: "1 Post", desc: "Demonstrated Alumni Leadership & Active Standing" },
                  { title: "3. Secretary", posts: "1 Post", desc: "Chapter or Club Coordination Experience" },
                  { title: "4. Joint Secretary", posts: "1 Post", desc: "Active Standing with Coordinator Experience" },
                  { title: "5. Treasurer", posts: "1 Post", desc: "Financial / Secretarial Verified Record" },
                  { title: "6. Joint Treasurer", posts: "1 Post", desc: "Continuous Active Alumni Standing" }
                ].map((pos, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-white">{pos.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                        {pos.posts}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {pos.desc}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Interactive 5-Stage Election Process Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="clay-card p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Official 5-Phase Election Lifecycle</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Step-by-step progression from announcement to final contestant publication</p>
              </div>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 w-fit">
                Phase 1 & 2 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { stage: "Stage 1", title: "Call for Nominations", desc: "Portal opens for candidate nominations", date: formatDateDisplay(announcement?.nominationStartDate, 'Sep 12, 2026'), status: "Active / Published", active: true },
                { stage: "Stage 2", title: "Nomination Proposals", desc: "Eligible members submit proposals (No self-nomination)", date: formatDateDisplay(announcement?.nominationDeadline, 'Sep 30, 2026'), status: "In Progress", active: true },
                { stage: "Stage 3", title: "Scrutiny Conclave", desc: "Formal verification of all filed proposals", date: formatDateDisplay(announcement?.scrutinyMeetingDate, 'Oct 05, 2026'), status: "Scheduled", active: false },
                { stage: "Stage 4", title: "Candidate Withdrawal", desc: "Withdrawal window provided before final roll", date: formatDateDisplay(announcement?.withdrawalDeadline, 'Oct 14, 2026'), status: "Scheduled", active: false },
                { stage: "Stage 5", title: "Final List & AGM", desc: "Certified ballot published; AGM voting", date: formatDateDisplay(announcement?.agmDate, 'Oct 25, 2026'), status: "AGM Conclave", active: false }
              ].map((step, idx) => (
                <div key={idx} className="relative flex flex-col justify-between p-5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      {step.stage}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{step.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{step.date}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.active ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Announcement Delivery Modal: Broadcast to All or Send to Single Person */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-7 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              {!broadcastResult ? (
                <>
                  <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      emailTargetMode === 'single' 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' 
                        : 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300'
                    }`}>
                      {emailTargetMode === 'single' ? <Mail size={20} /> : <Send size={20} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {emailTargetMode === 'single' ? 'Send Call for Announcement to Individual' : 'Broadcast Election Announcement'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {emailTargetMode === 'single' ? 'Deliver official election notification directly to a specific person' : 'Official notification delivery to all registered alumni'}
                      </p>
                    </div>
                  </div>

                  {/* Segmented Mode Selector */}
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEmailTargetMode('all')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        emailTargetMode === 'all' 
                          ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-white shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Users size={14} /> Send to All Alumni
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailTargetMode('single')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        emailTargetMode === 'single' 
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Mail size={14} /> Send to Single Person
                    </button>
                  </div>

                  {/* Live Sender Identity Banner */}
                  <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-blue-950 dark:text-blue-200">
                      <span className="flex items-center gap-1.5"><Mail size={14} className="text-blue-600" /> Sender: <strong>muralisubbu11@gmail.com</strong></span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-200/70 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold uppercase tracking-wider">
                        {smtpConfigured ? '✓ Live Connected' : 'Google Auth Required'}
                      </span>
                    </div>

                    {!smtpConfigured && (
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Gmail 16-Character App Password <span className="text-red-500">*</span>
                          </label>
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:underline font-semibold"
                          >
                            Generate from Google &rarr;
                          </a>
                        </div>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="e.g. abcd efgh ijkl mnop"
                          className="w-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Google requires an App Password to dispatch live emails via Gmail. Turn ON 2-Step Verification on your Google account, generate an App Password for Mail, and paste it here.
                        </p>
                      </div>
                    )}
                  </div>

                  {emailTargetMode === 'single' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Recipient Member Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={singleRecipientEmail}
                            onChange={(e) => setSingleRecipientEmail(e.target.value)}
                            placeholder="Enter recipient member's real email address"
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            required
                          />
                          <Mail size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                              Broadcast Subject Line:
                            </label>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Editable</span>
                          </div>
                          <input
                            type="text"
                            value={editForm.emailSubject}
                            onChange={(e) => setEditForm({ ...editForm, emailSubject: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
                          />
                        </div>
                        <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-indigo-600" />
                            Live Email Delivers Complete Official Information:
                          </p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li><strong>Sender:</strong> muralisubbu11@gmail.com (Official Alumni Election Commission)</li>
                            <li><strong>All 6 Contested Roles:</strong> President, Vice President, Secretary, Joint Secretary, Treasurer, Joint Treasurer</li>
                            <li><strong>Statutory Schedule:</strong> Nomination opening, deadline, scrutiny conclave, withdrawal, and voting hours</li>
                            <li><strong>Nomination Rules:</strong> Strictly no self-nomination, proposer & seconder required, 5-yr President rule</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p>
                        You are about to broadcast live official election announcement emails from <strong>muralisubbu11@gmail.com</strong> to all registered alumni members (<code className="text-purple-600 dark:text-purple-400 font-bold">role = alumni</code>).
                      </p>
                      <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                            Broadcast Subject Line:
                          </label>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Editable</span>
                        </div>
                        <input
                          type="text"
                          value={editForm.emailSubject}
                          onChange={(e) => setEditForm({ ...editForm, emailSubject: e.target.value })}
                          className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                        <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-purple-600" />
                          Complete Election Details Delivered to Every Member:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Personalized to each alumnus's registered name, department, and class</li>
                          <li>All 6 Executive Posts open for contest with candidate qualifications</li>
                          <li>Complete statutory schedule from nomination opening to AGM results declaration</li>
                          <li>Mandatory proposal rules (Strictly no self-nomination)</li>
                          <li>Direct action button to access the Alumni Election Portal</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleLoadEmailPreview}
                      disabled={loadingPreview || isBroadcasting}
                      className="px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                    >
                      {loadingPreview ? <RefreshCw size={13} className="animate-spin" /> : <Eye size={13} />}
                      Preview Full Gazette Email
                    </button>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowEmailModal(false)}
                        disabled={isBroadcasting}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSendBroadcast}
                        disabled={isBroadcasting}
                        className="clay-btn px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25"
                      >
                        {isBroadcasting ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Dispatching...
                          </>
                        ) : emailTargetMode === 'single' ? (
                          <>
                            <Send size={14} /> Send Official Gazette to Person
                          </>
                        ) : (
                          <>
                            <Users size={14} /> Confirm & Broadcast to All Alumni
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-3 py-2">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                      <MailCheck size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {broadcastResult.stats?.targetType === 'single' ? 'Announcement Successfully Dispatched!' : 'Broadcast Successfully Dispatched!'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {broadcastResult.message}
                    </p>
                  </div>

                  {broadcastResult.stats?.targetType === 'single' ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">From (Your Gmail):</span>
                        <span className="font-bold text-slate-800 dark:text-white">muralisubbu11@gmail.com</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Recipient Member:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{broadcastResult.stats?.recipientEmail}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-emerald-600">✓ Delivered to Real Mailbox</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Transport:</span>
                        <span className="font-bold text-emerald-600 uppercase">Live Gmail SMTP</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Alumni</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{broadcastResult.stats?.totalAlumni || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Real Emails Sent</span>
                        <span className="text-lg font-bold text-emerald-600">{broadcastResult.stats?.sentCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sender</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 block">muralisubbu11@gmail.com</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailModal(false);
                        setBroadcastResult(null);
                        setSingleRecipientEmail('');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Email Gazette Preview Modal */}
      <AnimatePresence>
        {showLivePreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      Live Gazette Email Preview
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        100% Client Compatible
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Exact rendering delivered to alumni inboxes • Includes full schedule, 6 posts & rules
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLivePreviewModal(false)}
                  className="clay-icon w-8 h-8 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-2 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-2xl mx-auto">
                  <iframe
                    title="Email Preview"
                    srcDoc={previewHtmlContent}
                    className="w-full h-[650px] border-0"
                    sandbox="allow-same-origin allow-popups"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Validated: Full letterhead, 6 contested positions, 9 timetable stages & security seals.
                </div>
                <button
                  type="button"
                  onClick={() => setShowLivePreviewModal(false)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gazette Notice Modal */}
      <AnimatePresence>
        {showGazetteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Official Gazette Letterhead */}
              <div className="border-b-2 border-amber-500/80 pb-4 text-center space-y-1">
                <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-extrabold tracking-widest uppercase rounded-full">
                  Official Gazette Extraordinary
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wide uppercase">
                  National Engineering College (Autonomous)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Approved by AICTE • Affiliated to Anna University • K.R. Nagar, Kovilpatti - 628 503
                </p>
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Alumni Association (NECAA) • Election Commission
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Ref: {announcement?.notificationNumber || announcement?.referenceNumber || "NEC/ELEC/2026/001"} • Term 2026–2028
                  </p>
                </div>
              </div>

              <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {/* Convocation Clause */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
                  <p className="font-serif">
                    <strong>FORMAL CONVOCATION:</strong> Notice is hereby officially promulgated to all registered alumni members that the Biennial General Elections for Executive Office Bearers for the <strong>2026–2028 tenure</strong> will take place in conjunction with the Annual General Meeting (AGM) on <strong>{formatDateDisplay(announcement?.agmDate, 'Sunday, October 25, 2026')}</strong>.
                  </p>
                </div>

                {/* Statutory Rule Banner */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs rounded-xl text-amber-900 dark:text-amber-300 font-medium space-y-1">
                  <div className="font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-amber-600" />
                    Statutory Rule: Strict Proposal Workflow (No Self-Nomination)
                  </div>
                  <p className="opacity-95 leading-relaxed">
                    Self-nominations are strictly invalid. Every nominee must be proposed and seconded by verified alumni members with a formal written Purpose Statement detailing leadership credentials.
                  </p>
                </div>

                {/* Section 1: Positions Open */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
                    <span>1. Executive Positions Contested</span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">Tenure: 2026–2028</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">1. President (1 Post)</div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-semibold">★ Mandatory: Must have served as Office Bearer in preceding 5 yrs (2021–2026)</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">2. Vice President (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with verified coordinator service</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">3. Secretary (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with chapter/club coordination</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">4. Joint Secretary (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with coordinator experience</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">5. Treasurer (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with financial/secretarial records</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white">6. Joint Treasurer (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with verified alumni service</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Complete 9-Stage Master Timetable */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    2. Master Election Timetable & Deadlines
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2.5">Stage</th>
                          <th className="p-2.5">Event</th>
                          <th className="p-2.5 text-right">Prescribed Schedule (IST)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-400">1</td>
                          <td className="p-2.5 font-medium">Opening of Nominations Portal</td>
                          <td className="p-2.5 text-right font-semibold text-blue-600 dark:text-blue-400">{formatDateDisplay(announcement?.nominationStartDate, 'September 12, 2026')} • 09:00 AM</td>
                        </tr>
                        <tr className="bg-red-50/50 dark:bg-red-950/20">
                          <td className="p-2.5 font-bold text-red-600">2</td>
                          <td className="p-2.5 font-bold text-red-600">Last Date for Submitting Nominations</td>
                          <td className="p-2.5 text-right font-bold text-red-600">{formatDateDisplay(announcement?.nominationDeadline, 'September 30, 2026')} • 05:00 PM</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-400">3</td>
                          <td className="p-2.5 font-medium">Scrutiny Conclave Date</td>
                          <td className="p-2.5 text-right font-semibold">{formatDateDisplay(announcement?.scrutinyMeetingDate, 'October 05, 2026')} • 02:00 PM</td>
                        </tr>
                        <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                          <td className="p-2.5 font-bold text-amber-600">4</td>
                          <td className="p-2.5 font-bold text-amber-700 dark:text-amber-400">Last Date for Candidature Withdrawal</td>
                          <td className="p-2.5 text-right font-bold text-amber-700 dark:text-amber-400">{formatDateDisplay(announcement?.withdrawalDeadline, 'October 14, 2026')} • 05:00 PM</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-400">5</td>
                          <td className="p-2.5 font-medium">Final List of Contesting Candidates</td>
                          <td className="p-2.5 text-right font-semibold">{formatDateDisplay(announcement?.finalListDate, 'October 18, 2026')} • 10:00 AM</td>
                        </tr>
                        <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                          <td className="p-2.5 font-bold text-emerald-600">6</td>
                          <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">Electronic Polling (Secret Ballot)</td>
                          <td className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">{formatDateDisplay(announcement?.electionDate, 'Sunday, October 25, 2026')} • 10:00 AM – 04:00 PM</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-400">7</td>
                          <td className="p-2.5 font-medium">AGM & Results Declaration</td>
                          <td className="p-2.5 text-right font-bold">{formatDateDisplay(announcement?.agmDate, 'Sunday, October 25, 2026')} • 05:00 PM</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Signatures & Authority */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white">Alumni Election Commission</div>
                    <div className="text-[11px] opacity-75">National Engineering College Alumni Association (NECAA)</div>
                  </div>
                  <div className="sm:text-right">
                    <div className="font-bold text-slate-800 dark:text-white">Principal & Patron</div>
                    <div className="text-[11px] opacity-75">National Engineering College (Autonomous)</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-center text-[11px] text-slate-500 dark:text-slate-400">
                  National Engineering College, K.R. Nagar, Kovilpatti - 628 503
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowGazetteModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <Download size={16} /> Print / Save Gazette
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// === Phase 2: Eligibility Criteria Checker Screen ===

const EligibilityScreen = ({ onProceedToApply }: any) => {
  const [targetPosition, setTargetPosition] = useState(ELECTION_POSITIONS[0]);
  const [roleCategory, setRoleCategory] = useState(RESPONSIBILITY_CATEGORIES[0].id);
  const [wasOfficeBearerInPast5Years, setWasOfficeBearerInPast5Years] = useState("yes");
  const [continuousDuration, setContinuousDuration] = useState("2");
  const [hasNoGapInPast5Years, setHasNoGapInPast5Years] = useState(true);
  const [isRegisteredAlumni, setIsRegisteredAlumni] = useState(true);
  
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const runEvaluation = () => {
    const isPresident = targetPosition === "President";
    const durationNum = parseFloat(continuousDuration) || 0;
    
    // 1. Registered Alumni in portal
    const passRegistered = isRegisteredAlumni;
    
    // 2. 1-year continuous service without gap in past 5 years
    const passContinuousService = durationNum >= 1 && hasNoGapInPast5Years;
    
    // 3. Held additional responsibilities in approved categories
    const passRoleCategory = RESPONSIBILITY_CATEGORIES.some(c => c.id === roleCategory);
    
    // 4. President rule: Must have served as Office Bearer during the immediate preceding 5 years
    const passPresidentRule = !isPresident || (roleCategory === "Office Bearer" && wasOfficeBearerInPast5Years === "yes");

    const isEligible = passRegistered && passContinuousService && passRoleCategory && passPresidentRule;

    let reasons: string[] = [];
    if (!passRegistered) reasons.push("Candidate must be a registered alumni member on the official portal.");
    if (!passContinuousService) reasons.push("Candidate must have actively served for at least 1 year continuously without gap in the past 5 years.");
    if (isPresident && !passPresidentRule) reasons.push("Candidate for President must have served as an Office Bearer of the Alumni Association during the immediate preceding 5 years (2021–2026).");

    setEvaluationResult({
      isEligible,
      passRegistered,
      passContinuousService,
      passRoleCategory,
      passPresidentRule,
      reasons,
      targetPosition
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto glass-panel p-8 md:p-10 relative z-10 space-y-8"
    >
      <div className="flex items-center space-x-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="clay-icon w-14 h-14 text-indigo-600 dark:text-indigo-400">
          <ClipboardCheck size={28} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Nominee Eligibility Evaluator</h2>
          <p className="text-sm text-indigo-600 dark:text-indigo-300">
            Use this tool to evaluate whether the alumni member you plan to propose satisfies constitutional criteria
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Controls */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Office Bearer Position to Propose For
            </label>
            <div className="relative">
              <select
                value={targetPosition}
                onChange={(e) => {
                  setTargetPosition(e.target.value);
                  setEvaluationResult(null);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ELECTION_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos} {pos === "President" ? "(Requires Preceding 5-Yr Office Bearer Experience)" : ""}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-3.5 text-slate-400 rotate-90 pointer-events-none" size={18} />
            </div>
            {targetPosition === "President" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={13} /> Strict Rule: Nominee must have served as an Office Bearer in past 5 years.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Nominee's Held Responsibility Category
            </label>
            <div className="space-y-2">
              {RESPONSIBILITY_CATEGORIES.map(cat => (
                <label 
                  key={cat.id} 
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                    roleCategory === cat.id 
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleCategory"
                    checked={roleCategory === cat.id}
                    onChange={() => {
                      setRoleCategory(cat.id);
                      setEvaluationResult(null);
                    }}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{cat.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {targetPosition === "President" && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
                Did nominee serve as Office Bearer in immediate preceding 5 years (2021–2026)?
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="past5yrs"
                    checked={wasOfficeBearerInPast5Years === "yes"}
                    onChange={() => {
                      setWasOfficeBearerInPast5Years("yes");
                      setEvaluationResult(null);
                    }}
                    className="text-indigo-600"
                  />
                  Yes, served as Office Bearer
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="past5yrs"
                    checked={wasOfficeBearerInPast5Years === "no"}
                    onChange={() => {
                      setWasOfficeBearerInPast5Years("no");
                      setEvaluationResult(null);
                    }}
                    className="text-indigo-600"
                  />
                  No
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Nominee's Continuous Active Service (Years in past 5 yrs)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={continuousDuration}
              onChange={(e) => {
                setContinuousDuration(e.target.value);
                setEvaluationResult(null);
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white"
              placeholder="e.g. 1.5"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasNoGapInPast5Years}
                onChange={(e) => {
                  setHasNoGapInPast5Years(e.target.checked);
                  setEvaluationResult(null);
                }}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nominee's service was continuous <strong>without gap</strong> in the immediate past 5 years
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isRegisteredAlumni}
                onChange={(e) => {
                  setIsRegisteredAlumni(e.target.checked);
                  setEvaluationResult(null);
                }}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nominee is registered on the official Alumni website portal
              </span>
            </label>
          </div>

          <button
            onClick={runEvaluation}
            className="w-full clay-btn py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <ShieldCheck size={20} /> Verify Nominee's Eligibility
          </button>
        </div>

        {/* Evaluation Output Matrix */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="clay-card p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Official Criteria Checklist Matrix
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">1. Registered Alumni Member</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${isRegisteredAlumni ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isRegisteredAlumni ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">2. Active Service ≥ 1 Yr without gap</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  parseFloat(continuousDuration) >= 1 && hasNoGapInPast5Years ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {parseFloat(continuousDuration) >= 1 && hasNoGapInPast5Years ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">3. Approved Responsibility Role</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                  {roleCategory}
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">4. President 5-Yr Bearer Rule</span>
                {targetPosition === "President" ? (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    roleCategory === "Office Bearer" && wasOfficeBearerInPast5Years === "yes" ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {roleCategory === "Office Bearer" && wasOfficeBearerInPast5Years === "yes" ? 'VERIFIED' : 'INELIGIBLE'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    Bylaw Norms Apply
                  </span>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {evaluationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-2xl border ${
                  evaluationResult.isEligible 
                    ? 'bg-green-50/80 dark:bg-green-950/20 border-green-300 dark:border-green-800' 
                    : 'bg-red-50/80 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {evaluationResult.isEligible ? (
                    <CheckCircle2 size={24} className="text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={24} className="text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-2">
                    <h4 className={`text-lg font-bold ${evaluationResult.isEligible ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                      {evaluationResult.isEligible ? 'Nominee is Constitutionally Eligible!' : 'Nominee Ineligible for Office'}
                    </h4>
                    <p className={`text-xs ${evaluationResult.isEligible ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {evaluationResult.isEligible 
                        ? `The nominee satisfies all bylaws and tenure requirements for the position of ${evaluationResult.targetPosition}. You may proceed to submit their nomination proposal.`
                        : evaluationResult.reasons.join(" ")}
                    </p>
                    {evaluationResult.isEligible && (
                      <button
                        onClick={onProceedToApply}
                        className="mt-3 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                      >
                        Proceed to Propose This Candidate <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// === Phase 3: Proposal-Driven Nomination Form (NO SELF-NOMINATION) ===

const ApplyScreen = ({ userProfile, onNominationSuccess }: any) => {
  // Proposer is the logged-in user
  const proposer = {
    name: userProfile?.name || "Tharun G",
    email: userProfile?.email || "tarun.ganapathi2007@gmail.com",
    department: userProfile?.department || "CSE",
    graduationYear: userProfile?.graduationYear || "2015",
    phone: userProfile?.phone || "+91-8056300117",
    alumniId: "ALUM-2015-PROPOSER"
  };

  // Nominee Details
  const [nominee, setNominee] = useState({
    name: "Chockalingam D",
    email: "chocka.nec@gmail.com",
    department: "CSE",
    graduationYear: "2012",
    phone: "+91-8778663589",
    alumniId: "ALUM-2012-NEC"
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [targetPositions, setTargetPositions] = useState<string[]>(["President"]);
  const [roleCategory, setRoleCategory] = useState("Office Bearer");
  const [continuousDuration, setContinuousDuration] = useState("2.5");
  const [continuousDetails, setContinuousDetails] = useState("Served as Treasurer and Joint Secretary 2022-2026 without interruption.");

  // Seconder Details (Distinct eligible member)
  const [seconder, setSeconder] = useState({
    name: "Priya Sridharan",
    alumniId: "ALUM-2014-118",
    email: "priya.sridharan@alumni.org",
    phone: "+91 97890 65432",
    batch: "2014",
    department: "ECE"
  });

  // Alumni database lookup states
  const [isFetchingNominee, setIsFetchingNominee] = useState(false);
  const [nomineeLookupStatus, setNomineeLookupStatus] = useState<{
    found: boolean;
    name?: string;
    label?: string;
    message?: string;
  } | null>(null);

  const [isFetchingSeconder, setIsFetchingSeconder] = useState(false);
  const [seconderLookupStatus, setSeconderLookupStatus] = useState<{
    found: boolean;
    name?: string;
    message?: string;
  } | null>(null);

  const fetchNomineeByEmail = async (emailToFetch: string) => {
    const cleanEmail = (emailToFetch || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return;
    }
    setIsFetchingNominee(true);
    try {
      const res = await fetch(`http://localhost:5000/api/alumni/lookup?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();
      if (res.ok && data.found && data.alumni) {
        setNominee(prev => ({
          ...prev,
          name: data.alumni.name || prev.name,
          phone: data.alumni.phone || prev.phone,
          department: data.alumni.department || prev.department,
          graduationYear: data.alumni.graduationYear || prev.graduationYear,
          alumniId: data.alumni.alumniId || prev.alumniId
        }));
        setNomineeLookupStatus({
          found: true,
          name: data.alumni.name,
          label: `${data.alumni.department ? data.alumni.department + ', ' : ''}${data.alumni.graduationYear ? 'Class of ' + data.alumni.graduationYear : ''}`
        });
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next.email;
          delete next.name;
          delete next.phone;
          delete next.department;
          delete next.graduationYear;
          return next;
        });
      } else {
        setNomineeLookupStatus({
          found: false,
          message: 'Alumni data not found.'
        });
        setFieldErrors(prev => ({
          ...prev,
          email: 'Alumni data not found.'
        }));
      }
    } catch (err) {
      console.error("Nominee lookup error:", err);
    } finally {
      setIsFetchingNominee(false);
    }
  };

  const fetchSeconderByEmail = async (emailToFetch: string) => {
    const cleanEmail = (emailToFetch || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return;
    }
    setIsFetchingSeconder(true);
    try {
      const res = await fetch(`http://localhost:5000/api/alumni/lookup?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();
      if (res.ok && data.found && data.alumni) {
        setSeconder(prev => ({
          ...prev,
          name: data.alumni.name || prev.name,
          email: data.alumni.email || cleanEmail,
          alumniId: data.alumni.alumniId || prev.alumniId,
          department: data.alumni.department || prev.department,
          batch: data.alumni.graduationYear || prev.batch,
          phone: data.alumni.phone || prev.phone
        }));
        setSeconderLookupStatus({
          found: true,
          name: data.alumni.name
        });
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next.seconderEmail;
          return next;
        });
      } else {
        setSeconderLookupStatus({
          found: false,
          message: 'Alumni data not found.'
        });
        setFieldErrors(prev => ({
          ...prev,
          seconderEmail: 'Alumni data not found.'
        }));
      }
    } catch (err) {
      console.error("Seconder lookup error:", err);
    } finally {
      setIsFetchingSeconder(false);
    }
  };

  // Debounced auto-fetch for nominee email
  useEffect(() => {
    if (!nominee.email) {
      setNomineeLookupStatus(null);
      return;
    }
    const timer = setTimeout(() => {
      if (nominee.email.includes('@') && nominee.email.includes('.')) {
        fetchNomineeByEmail(nominee.email);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [nominee.email]);

  // Debounced auto-fetch for seconder email
  useEffect(() => {
    if (!seconder.email) {
      setSeconderLookupStatus(null);
      return;
    }
    const timer = setTimeout(() => {
      if (seconder.email.includes('@') && seconder.email.includes('.')) {
        fetchSeconderByEmail(seconder.email);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [seconder.email]);

  const [purposeStatement, setPurposeStatement] = useState(
    "I propose this candidate for election based on their verified service as an Office Bearer over the past four years. They have spearheaded alumni initiatives, mobilized student placement programs, and demonstrated outstanding commitment to our association."
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasEndorsementDeclaration, setHasEndorsementDeclaration] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const wordCount = purposeStatement.trim() ? purposeStatement.trim().split(/\s+/).length : 0;
  const isPurposeStatementSufficient = wordCount >= 15;

  // Real-time Self-Nomination Check
  const isSelfNomination = proposer.email.toLowerCase().trim() === nominee.email.toLowerCase().trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    if (isSelfNomination) {
      setErrorMsg("Self-nomination is strictly prohibited. You cannot propose yourself as a candidate.");
      return;
    }

    if (!isPurposeStatementSufficient) {
      setErrorMsg("Purpose and citation statement must include sufficient detail relevant to the position being sought (at least 15 words).");
      return;
    }

    if (!hasEndorsementDeclaration) {
      setErrorMsg("You must affirm that this proposal is made with the nominee's consent and adheres to bylaws.");
      return;
    }

    const isPresidentCandidate = targetPositions.includes("President");
    if (isPresidentCandidate && roleCategory !== "Office Bearer") {
      const errMsg = "Ineligible for President";
      setErrorMsg(errMsg);
      setFieldErrors(prev => ({
        ...prev,
        roleCategory: errMsg
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposer,
          nominee,
          targetPositions,
          roleCategory,
          continuousService: {
            years: parseFloat(continuousDuration) || 1,
            withoutGap: true,
            details: continuousDetails
          },
          seconder,
          purposeStatement,
          motivation: purposeStatement
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsSubmitted(true);
        if (onNominationSuccess) onNominationSuccess();
      } else {
        const err = data.error || "Failed to submit nomination proposal";
        setErrorMsg(err);
        const errLower = err.toLowerCase();
        if (errLower.includes("seconder")) {
          setFieldErrors({ seconderEmail: err });
        } else if (errLower.includes("alumni data not found") || errLower.includes("no alumni found") || errLower.includes("alumni not found") || errLower.includes("email")) {
          setFieldErrors({ email: err });
        } else if (errLower.includes("name")) {
          setFieldErrors({ name: err });
        } else if (errLower.includes("phone")) {
          setFieldErrors({ phone: err });
        } else if (errLower.includes("department")) {
          setFieldErrors({ department: err });
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error communicating with server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6 relative z-10 pb-20"
    >
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
          <UserPlus size={32} className="text-white" />
        </div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          OFFICIAL NOMINATION PROCEDURE
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Nomination Proposal Form
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mt-1">
          <strong>Strict Policy: No Self-Nomination.</strong> Every candidate must be proposed by an eligible registered alumni member, seconded, and accompanied by a purpose statement.
        </p>
      </div>

      <div className="clay-card p-8 md:p-10">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center text-center py-10 space-y-5">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Mail size={34} />
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Awaiting Seconder Consent
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white pt-2">
                Nomination Proposal Initiated!
              </h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 max-w-lg text-sm leading-relaxed">
              You have initiated a nomination for <strong>{nominee.name}</strong> for the office of <strong>{targetPositions.join(", ")}</strong>.
            </p>

            {/* Explanatory Callout Box */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 max-w-lg text-left space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">
                    Constitutional Seconding Notice Dispatched:
                  </p>
                  <p>
                    An official email from the Election Commission has been dispatched to <strong>{seconder.name}</strong> at <code className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-600 dark:text-indigo-300">{seconder.email}</code> asking for their willingness to be the seconding member.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold pt-1">
                    ⚠️ Strict Rule: The nomination will only be formally submitted to the Scrutiny Committee once they click "Accept". If they decline, the proposal will not be submitted.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-mono border border-slate-200 dark:border-slate-700">
              Candidate: <strong>{nominee.name}</strong> • Proposer: <strong>{proposer.name}</strong> • Seconder: <strong>{seconder.name}</strong>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-xs"
              >
                Propose Another Candidate
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-8" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-2xl text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-3 shadow-md">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="font-semibold text-sm">{errorMsg}</p>
              </div>
            )}

            {/* Section 1: Proposer Details (Logged-in Alumni) */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-6 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/50 space-y-4">
              <div className="flex justify-between items-center border-b border-indigo-200/60 dark:border-indigo-800/60 pb-2">
                <div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                    1. Proposer Record (You)
                  </span>
                  <p className="text-[11px] text-slate-500">You are initiating this nomination as an eligible alumni member</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                  Verified Proposer
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <FormFieldLabel icon={User} label="Proposer Full Name" required={false} />
                  <input type="text" value={proposer.name} disabled className="w-full bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <FormFieldLabel icon={Mail} label="Proposer Email" required={false} />
                  <input type="email" value={proposer.email} disabled className="w-full bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <FormFieldLabel icon={Compass} label="Department & Batch" required={false} />
                  <input type="text" value={`${proposer.department} (Class of ${proposer.graduationYear})`} disabled className="w-full bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <FormFieldLabel icon={Phone} label="Proposer Phone" required={false} />
                  <input type="tel" value={proposer.phone} disabled className="w-full bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* Section 2: Nominee / Candidate Being Proposed */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                    2. Nominee / Candidate Being Proposed
                  </span>
                  <p className="text-[11px] text-slate-500">Provide the details of the alumni member you are nominating (No self-nomination)</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                  Target Candidate
                </span>
              </div>

              {isSelfNomination && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle size={16} /> Self-nomination is strictly prohibited. You cannot propose your own email as the nominee!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <FormFieldLabel icon={Mail} label="Nominee Alumni Email" />
                    {isFetchingNominee && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Fetching...
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={nominee.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNominee({ ...nominee, email: val });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                      onBlur={() => {
                        if (nominee.email && nominee.email.includes('@')) {
                          fetchNomineeByEmail(nominee.email);
                        }
                      }}
                      required
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 pr-9 text-slate-800 dark:text-white ${
                        isSelfNomination || fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="nominee@alumni.org"
                    />
                    {isFetchingNominee && (
                      <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-indigo-500" />
                    )}
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold mt-1">
                      ⚠️ {fieldErrors.email}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Type candidate's email to automatically pull their name, contact, department & batch from alumni registry.
                  </p>
                </div>

                <div>
                  <FormFieldLabel icon={User} label="Nominee Full Name" />
                  <input
                    type="text"
                    value={nominee.name}
                    onChange={(e) => {
                      setNominee({ ...nominee, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    required
                    className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-slate-800 dark:text-white ${
                      fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                    placeholder="Candidate's legal name"
                  />
                  {fieldErrors.name && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold mt-1">
                      ⚠️ {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <FormFieldLabel icon={Phone} label="Nominee Contact Number" />
                  <input
                    type="tel"
                    value={nominee.phone}
                    onChange={(e) => {
                      setNominee({ ...nominee, phone: e.target.value });
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                    required
                    className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-slate-800 dark:text-white ${
                      fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                    placeholder="+91..."
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold mt-1">
                      ⚠️ {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FormFieldLabel icon={Compass} label="Department" />
                    <input
                      type="text"
                      value={nominee.department}
                      onChange={(e) => {
                        setNominee({ ...nominee, department: e.target.value });
                        if (fieldErrors.department) setFieldErrors({ ...fieldErrors, department: '' });
                      }}
                      required
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-slate-800 dark:text-white ${
                        fieldErrors.department ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="e.g. CSE"
                    />
                    {fieldErrors.department && (
                      <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold mt-1">
                        ⚠️ {fieldErrors.department}
                      </p>
                    )}
                  </div>
                  <div>
                    <FormFieldLabel icon={CalendarDays} label="Graduation Year" />
                    <input
                      type="text"
                      value={nominee.graduationYear}
                      onChange={(e) => {
                        setNominee({ ...nominee, graduationYear: e.target.value });
                        if (fieldErrors.graduationYear) setFieldErrors({ ...fieldErrors, graduationYear: '' });
                      }}
                      required
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-slate-800 dark:text-white ${
                        fieldErrors.graduationYear ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="e.g. 2012"
                    />
                    {fieldErrors.graduationYear && (
                      <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold mt-1">
                        ⚠️ {fieldErrors.graduationYear}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Office Bearer Position & Nominee's Experience */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                3. Office Bearer Position & Nominee's Qualifying Experience
              </span>
              
              <div>
                <FormFieldLabel icon={Award} label="Position Proposing For" />
                <MultiSelectDropdown
                  options={ELECTION_POSITIONS}
                  selected={targetPositions}
                  onChange={(newPositions) => {
                    setTargetPositions(newPositions);
                    if (newPositions.includes("President") && roleCategory !== "Office Bearer") {
                      setFieldErrors(prev => ({
                        ...prev,
                        roleCategory: "Ineligible for President"
                      }));
                    } else if (!newPositions.includes("President")) {
                      setFieldErrors(prev => {
                        const next = { ...prev };
                        delete next.roleCategory;
                        return next;
                      });
                    }
                  }}
                  placeholder="Select position(s)..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormFieldLabel icon={Briefcase} label="Nominee's Qualifying Responsibility Role" />
                  <select
                    value={roleCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRoleCategory(val);
                      if (targetPositions.includes("President") && val !== "Office Bearer") {
                        setFieldErrors(prev => ({
                          ...prev,
                          roleCategory: "Ineligible for President"
                        }));
                      } else {
                        setFieldErrors(prev => {
                          const next = { ...prev };
                          delete next.roleCategory;
                          return next;
                        });
                      }
                    }}
                    className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 text-slate-800 dark:text-white ${
                      targetPositions.includes("President") && roleCategory !== "Office Bearer"
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {RESPONSIBILITY_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {targetPositions.includes("President") && roleCategory !== "Office Bearer" && (
                    <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs flex items-center gap-1.5 font-semibold">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>Ineligible for President</span>
                    </div>
                  )}
                </div>
                <div>
                  <FormFieldLabel icon={CalendarDays} label="Nominee's Unbroken Service (Years in past 5 yrs)" />
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={continuousDuration}
                    onChange={(e) => setContinuousDuration(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <div>
                <FormFieldLabel icon={Briefcase} label="Summary of Nominee's Unbroken Service Without Gap" />
                <textarea
                  rows={2}
                  value={continuousDetails}
                  onChange={(e) => setContinuousDetails(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white resize-none"
                  placeholder="Specify committees, chapter, clubs, or bearer posts served continuously..."
                />
              </div>
            </div>

            {/* Section 4: Seconder Details */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                    4. Seconded by Eligible Member
                  </span>
                  <p className="text-[11px] text-slate-500">Provide the details of the seconding alumni member (Cannot be proposer or nominee)</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Seconding Member
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <FormFieldLabel icon={Mail} label="Seconder Alumni Email" />
                    {isFetchingSeconder && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Fetching...
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={seconder.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSeconder({ ...seconder, email: val });
                        if (fieldErrors.seconderEmail) setFieldErrors({ ...fieldErrors, seconderEmail: '' });
                      }}
                      onBlur={() => {
                        if (seconder.email && seconder.email.includes('@')) {
                          fetchSeconderByEmail(seconder.email);
                        }
                      }}
                      required
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 pr-9 text-slate-800 dark:text-white ${
                        fieldErrors.seconderEmail ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="seconder@alumni.org"
                    />
                    {isFetchingSeconder && (
                      <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-indigo-500" />
                    )}
                  </div>
                  {fieldErrors.seconderEmail && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold mt-1">
                      ⚠️ {fieldErrors.seconderEmail}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Type seconder's email to automatically pull their name, contact, department & batch from alumni registry.
                  </p>
                </div>

                <div>
                  <FormFieldLabel icon={User} label="Seconder Full Name" />
                  <input
                    type="text"
                    value={seconder.name}
                    onChange={(e) => setSeconder({ ...seconder, name: e.target.value })}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white"
                    placeholder="Seconder's legal name"
                  />
                </div>

                <div>
                  <FormFieldLabel icon={Phone} label="Seconder Contact Number" />
                  <input
                    type="tel"
                    value={seconder.phone}
                    onChange={(e) => setSeconder({ ...seconder, phone: e.target.value })}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white"
                    placeholder="+91..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FormFieldLabel icon={Compass} label="Department" />
                    <input
                      type="text"
                      value={seconder.department}
                      onChange={(e) => setSeconder({ ...seconder, department: e.target.value })}
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white"
                      placeholder="e.g. ECE"
                    />
                  </div>
                  <div>
                    <FormFieldLabel icon={CalendarDays} label="Graduation Year / Batch" />
                    <input
                      type="text"
                      value={seconder.batch}
                      onChange={(e) => setSeconder({ ...seconder, batch: e.target.value })}
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white"
                      placeholder="e.g. 2014"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Purpose Statement & Citation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <FormFieldLabel icon={MessageSquare} label="Purpose Statement & Proposer's Citation (Why you are proposing this candidate)" />
                <span className={`text-xs font-bold ${wordCount >= 15 ? 'text-green-600' : 'text-amber-600'}`}>
                  {wordCount} words {wordCount < 15 && '(Min 15 required)'}
                </span>
              </div>
              <textarea
                rows={5}
                value={purposeStatement}
                onChange={(e) => setPurposeStatement(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                placeholder="Detail why this member is being proposed for office: Their meaningful contributions to the alumni association, track record, vision, and leadership integrity..."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This purpose statement is evaluated to ensure candidates demonstrate meaningful contributions and uphold highest integrity.
              </p>
            </div>

            {/* Section 6: Affirmation */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEndorsementDeclaration}
                  onChange={(e) => setHasEndorsementDeclaration(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  I solemnly affirm as an eligible registered alumni member that I am formally proposing <strong>{nominee.name || "the candidate"}</strong> with their consent, that all service records are unbroken without gap, and that we accept the official election decision as <strong>final and binding</strong>.
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <XCircle size={16} /> {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isSelfNomination || !hasEndorsementDeclaration || targetPositions.length === 0}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg ${
                !isSubmitting && !isSelfNomination && hasEndorsementDeclaration && targetPositions.length > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 shadow-indigo-500/25'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? "Filing Nomination Proposal..." : "Submit Nomination Proposal"}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

// === Phase 4: Scrutiny Committee & Selection Process Screen ===

const ScrutinyCommitteeScreen = ({ token }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [committeeRemarks, setCommitteeRemarks] = useState('');
  const [integrityScore, setIntegrityScore] = useState(10);
  const [verifiedCriteria, setVerifiedCriteria] = useState<string[]>([
    "Proposal Authenticity Verified (No Self-Nomination)",
    "Nominee Registered Alumni Verified",
    "Continuous 1-Yr Service Verified",
    "Role Category Validated",
    "Proposer & Seconder Eligible"
  ]);

  const fetchApplications = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/applications?status=${filter}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            console.warn("Unauthorized scrutiny access");
          }
        }
        return res.json();
      })
      .then(data => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const [isDeletingNonApproved, setIsDeletingNonApproved] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const handleClearRejectedAndWithdrawn = async () => {
    setIsDeletingNonApproved(true);
    try {
      const res = await fetch('http://localhost:5000/api/applications/rejected-withdrawn', {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmDeleteModal(false);
        fetchApplications();
      } else {
        alert(data.error || "Failed to clear rejected and withdrawn logs");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while clearing logs");
    } finally {
      setIsDeletingNonApproved(false);
    }
  };

  const handleScrutinyDecision = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`http://localhost:5000/api/applications/${id}/scrutiny`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status,
          verifiedCriteria,
          committeeRemarks: committeeRemarks || (status === 'approved' ? 'Verified by Scrutiny Committee; criteria fully met.' : 'Did not meet bylaw requirements.'),
          integrityScore,
          evaluatedBy: "Alumni Election Scrutiny Committee (Principal, Alumni Coordinator & Office Bearers)"
        })
      });
      if (res.ok) {
        setSelectedApp(null);
        setCommitteeRemarks('');
        fetchApplications();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to record committee decision: Admin authorization required");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-20"
    >
      {/* Committee Charter Header */}
      <div className="glass-panel p-8 border-l-8 border-purple-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-full uppercase tracking-wider">
              SCRUTINY COMMITTEE CONCLAVE
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Constituted by Principal, Alumni Coordinator & Office Bearers
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Scrutiny Committee Evaluation Panel
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The Scrutiny Committee verifies each proposal against statutory eligibility standards, confirms proposer authenticity (strictly ensuring no self-nomination), and upholds highest integrity. <strong>The decision by the committee is final and binding.</strong>
          </p>
        </div>

        <div className="clay-icon w-14 h-14 text-purple-600 dark:text-purple-400 flex-shrink-0">
          <ShieldAlert size={28} />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="clay-card overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Filed Nomination Proposals for Scrutiny</h3>
            <p className="text-xs text-slate-500">Examine nominee credentials, proposer/seconder authenticity, and integrity</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { id: 'all', label: 'All Proposals' },
              { id: 'pending', label: 'Pending Scrutiny' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'withdrawn', label: 'Withdrawn' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={() => setConfirmDeleteModal(true)}
              disabled={isDeletingNonApproved}
              className="ml-auto sm:ml-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Clear rejected and withdrawn logs (keeps pending and approved)"
            >
              <Trash2 size={13} />
              Clear Rejected & Withdrawn Logs
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="clay-icon w-14 h-14 text-slate-400 mb-3">
              <UserCheck size={28} />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-semibold text-base">No proposals found under this filter.</p>
            <p className="text-xs text-slate-500 mt-1">Submitted nomination proposals will appear here for scrutiny.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.map((app) => (
              <div key={app._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Candidate / Nominee</span>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{app.name}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        app.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800' :
                        app.status === 'withdrawn' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}>
                        {app.status === 'approved' ? '✓ Scrutiny Passed' : app.status}
                      </span>
                      {app.targetPositions?.map((pos: string) => (
                        <span key={pos} className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {pos}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><Mail size={13} /> {app.nomineeEmail || app.applicantEmail}</span>
                      <span className="flex items-center gap-1.5"><Compass size={13} /> {app.department} • Batch of {app.graduationYear}</span>
                    </div>

                    {/* Qualifications & Proposer Box */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        <span><strong>Service Category:</strong> {app.roleCategory || 'Office Bearer'}</span>
                        <span><strong>Continuous Service:</strong> {app.continuousService?.years || 1}+ yrs (unbroken)</span>
                      </div>
                      
                      {/* Explicit Proposer & Seconder Distinction */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                        <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold block text-[11px] uppercase">Proposed By:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.proposer?.name || "N/A"}</span>
                          <span className="text-slate-400 text-[11px] block">{app.proposer?.email || app.proposerEmail}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                          <span className="text-purple-600 dark:text-purple-400 font-bold block text-[11px] uppercase">Seconded By:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.seconder?.name || "N/A"}</span>
                          <span className="text-slate-400 text-[11px] block">{app.seconder?.email || "N/A"}</span>
                        </div>
                      </div>

                      {app.purposeStatement && (
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">Proposer's Citation & Purpose Statement:</span>
                          <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700">
                            "{app.purposeStatement}"
                          </p>
                        </div>
                      )}

                      {app.scrutinyDetails && (
                        <div className="mt-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-300">
                          <span className="font-bold block">Scrutiny Committee Endorsement (Final & Binding):</span>
                          <p className="mt-0.5">{app.scrutinyDetails.committeeRemarks}</p>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1">
                            Evaluated by: {app.scrutinyDetails.evaluatedBy}
                          </span>
                        </div>
                      )}

                      {app.withdrawn && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400">
                          <strong>Withdrawn:</strong> {app.withdrawalReason || "Withdrawn prior to publication of final roll."}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center gap-2 min-w-[170px]">
                    {app.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setCommitteeRemarks('');
                        }}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
                      >
                        <ListChecks size={16} /> Scrutinize Proposal
                      </button>
                    )}

                    {app.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setCommitteeRemarks(app.scrutinyDetails?.committeeRemarks || '');
                        }}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-950/60 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 transition-colors shadow-sm"
                        title="Re-evaluate and reject this approved proposal"
                      >
                        <XCircle size={16} /> Reject Approved Proposal
                      </button>
                    )}

                    {app.status === 'rejected' && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setCommitteeRemarks(app.scrutinyDetails?.committeeRemarks || '');
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <RefreshCw size={14} /> Re-scrutinize
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrutiny Decision Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div
            onClick={() => setSelectedApp(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl relative my-auto overflow-hidden"
            >
              {/* Sticky Header with prominent 'X' close button */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm sticky top-0 z-20 flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">OFFICIAL SCRUTINY PROCEEDING</span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Nominee: {selectedApp.name}</h3>
                  <p className="text-xs text-slate-500">Proposed by: {selectedApp.proposer?.name} • Position: {selectedApp.targetPositions?.join(", ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex-shrink-0"
                  title="Close"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Scrutiny Committee Checklist
                  </label>
                  {[
                    "No Self-Nomination: Proposer is distinct and authenticated",
                    "Nominee is Registered Alumni on Official Portal",
                    "Nominee ≥ 1 Year Continuous Active Service Without Gap Verified",
                    "Approved Additional Responsibility Role Verified",
                    "President 5-Yr Bearer Rule Verified (if President)",
                    "Proposer and Seconder Membership Authenticated",
                    "Purpose Statement & Citation Confirms Meaningful Contributions"
                  ].map((crit, idx) => (
                    <label key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span>{crit}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                    Committee Remarks / Observations
                  </label>
                  <textarea
                    rows={3}
                    value={committeeRemarks}
                    onChange={(e) => setCommitteeRemarks(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-white resize-none"
                    placeholder="Official finding of the Scrutiny Committee (decision is final and binding)..."
                  />
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl text-[11px] text-purple-800 dark:text-purple-300">
                  <strong>Notice:</strong> As stipulated by the election code, the decision of this Committee is final and binding on all candidates.
                </div>
              </div>

              {/* Footer with Close / Cancel, Reject, and Approve buttons */}
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col sm:flex-row gap-3 justify-end items-center">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="w-full sm:w-auto py-2.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleScrutinyDecision(selectedApp._id, 'rejected')}
                  className="w-full sm:w-auto py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  {selectedApp.status === 'approved' ? 'Revoke & Reject Proposal' : 'Reject Proposal'}
                </button>
                <button
                  type="button"
                  onClick={() => handleScrutinyDecision(selectedApp._id, 'approved')}
                  className="w-full sm:w-auto py-2.5 px-5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-green-600/20 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {selectedApp.status === 'approved' ? 'Keep Approved' : 'Pass Scrutiny & Approve'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Rejected & Withdrawn Logs Modal */}
      <AnimatePresence>
        {confirmDeleteModal && (
          <div
            onClick={() => setConfirmDeleteModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Clear Rejected & Withdrawn Logs</h3>
                    <p className="text-xs text-slate-500">Only removes rejected & withdrawn records</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This action will permanently delete all <strong>rejected</strong> and <strong>withdrawn</strong> nomination proposal records from the database. <strong>Pending proposals and approved candidates will be safely retained.</strong>
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearRejectedAndWithdrawn}
                  disabled={isDeletingNonApproved}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-colors flex items-center justify-center gap-2"
                >
                  {isDeletingNonApproved ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Clearing...
                    </>
                  ) : (
                    "Confirm & Clear"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// === Phase 5a: My Nominations & Candidate Withdrawal Option ===

const MyApplicationsScreen = ({ userProfile, onProceedToApply }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawTarget, setWithdrawTarget] = useState<any>(null);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [nominationView, setNominationView] = useState<'proposed_by_me' | 'nominated_me' | 'seconded_by_me'>('proposed_by_me');
  const [isProcessingConsent, setIsProcessingConsent] = useState<string | null>(null);

  const fetchMyApplications = () => {
    if (userProfile?.email) {
      setLoading(true);
      fetch(`http://localhost:5000/api/applications?email=${encodeURIComponent(userProfile.email)}&roleType=${nominationView}`)
        .then(res => res.json())
        .then(data => {
          setApplications(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [userProfile, nominationView]);

  const handleSecondingConsent = async (applicationId: string, decision: 'accept' | 'decline') => {
    setIsProcessingConsent(applicationId);
    try {
      const res = await fetch('http://localhost:5000/api/nominations/seconding-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, decision })
      });
      if (res.ok) {
        fetchMyApplications();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update seconding consent");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating seconding consent");
    } finally {
      setIsProcessingConsent(null);
    }
  };

  const confirmWithdrawal = async () => {
    if (!withdrawTarget) return;
    setIsWithdrawing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/applications/${withdrawTarget._id}/withdraw`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalReason })
      });
      if (res.ok) {
        setWithdrawTarget(null);
        setWithdrawalReason('');
        fetchMyApplications();
      } else {
        alert("Failed to process withdrawal");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-20 max-w-4xl mx-auto"
    >
      <div className="glass-panel p-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">My Election Nominations</h2>
          <p className="text-sm text-indigo-600 dark:text-indigo-300">
            Track proposals you filed, nominations where you are the candidate, and incoming seconding requests.
          </p>
        </div>
        <button 
          onClick={onProceedToApply}
          className="clay-btn bg-indigo-600 text-white font-semibold py-2.5 px-6 text-xs hover:bg-indigo-700 w-fit flex items-center gap-2"
        >
          <UserPlus size={16} /> Propose a Candidate
        </button>
      </div>

      {/* Toggle View: Proposed by Me vs Where I am Nominated vs Seconding Requests */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setNominationView('proposed_by_me')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            nominationView === 'proposed_by_me'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Nominations I Proposed
        </button>
        <button
          onClick={() => setNominationView('nominated_me')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            nominationView === 'nominated_me'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          Nominations Where I am the Candidate
        </button>
        <button
          onClick={() => setNominationView('seconded_by_me')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            nominationView === 'seconded_by_me'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <ShieldCheck size={14} /> Seconding Requests & Consents
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
          <div className="clay-icon w-16 h-16 text-slate-400 mb-4">
            <FileText size={32} />
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-semibold">
            {nominationView === 'proposed_by_me' 
              ? "You haven't proposed any candidates yet." 
              : nominationView === 'nominated_me'
              ? "No nominations proposing you have been filed yet."
              : "No seconding requests have been sent to you."}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {nominationView === 'proposed_by_me'
              ? "Click 'Propose a Candidate' to submit an eligible member's nomination."
              : nominationView === 'nominated_me'
              ? "When an eligible alumni member proposes you, the nomination record will appear here."
              : "When an alumni member designates you as a seconder, the request will appear here for your consent."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const isPendingSeconding = app.status === 'pending_seconding' || app.seconderConsentStatus === 'pending';
            const isSecondingDeclined = app.status === 'seconding_declined' || app.seconderConsentStatus === 'declined';
            const isSecondingAccepted = app.seconderConsentStatus === 'accepted';

            return (
              <div key={app._id} className="clay-card p-6 md:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      NOMINATION ENTRY • {app.targetPositions?.join(', ')}
                    </span>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                      Nominee: {app.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <Clock size={14} /> Filed on {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800' : 
                        app.status === 'withdrawn' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800' : 
                        isPendingSeconding ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                        isSecondingDeclined ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800' :
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'}`}
                    >
                      {app.status === 'approved' ? '✓ Scrutiny Passed' : 
                       isPendingSeconding ? '⏳ Seconder Consent Pending' :
                       isSecondingDeclined ? '✕ Seconding Declined' :
                       isSecondingAccepted && app.status === 'pending' ? '✓ Seconded • In Scrutiny' :
                       app.status}
                    </span>
                  </div>
                </div>

                {/* Proposer & Seconder Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">Proposed By:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{app.proposer?.name || "N/A"}</p>
                    <p className="text-slate-500 text-[11px]">{app.proposer?.email || app.proposerEmail}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                    <span className="font-bold text-purple-600 dark:text-purple-400 block mb-0.5">Seconded By:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{app.seconder?.name || "N/A"}</p>
                    <p className="text-slate-500 text-[11px]">{app.seconder?.email || app.seconderEmail || "N/A"}</p>
                  </div>
                </div>

                {/* Seconder In-App Action Callout */}
                {nominationView === 'seconded_by_me' && isPendingSeconding && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                    <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 font-semibold">
                      <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Your Affirmative Consent as Seconding Member is Required:</p>
                        <p className="text-[11px] font-normal text-amber-800 dark:text-amber-300 mt-0.5">
                          Under association election bylaws, this nomination proposal will only be submitted to the Scrutiny Committee once you confirm your willingness to second it.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        disabled={isProcessingConsent === app._id}
                        onClick={() => handleSecondingConsent(app._id, 'accept')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-600/20 flex items-center gap-1.5"
                      >
                        ✓ I Accept & Second Nomination
                      </button>
                      <button
                        disabled={isProcessingConsent === app._id}
                        onClick={() => handleSecondingConsent(app._id, 'decline')}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}

                {nominationView === 'seconded_by_me' && isSecondingAccepted && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl text-xs text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span>You have accepted and seconded this nomination. It has been officially submitted to the Scrutiny Committee.</span>
                  </div>
                )}

                {nominationView === 'seconded_by_me' && isSecondingDeclined && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl text-xs text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <XCircle size={16} className="text-red-600" />
                    <span>You declined to second this nomination. In accordance with bylaws, the proposal was not submitted.</span>
                  </div>
                )}

                {/* Proposer Status Notice */}
                {nominationView === 'proposed_by_me' && isPendingSeconding && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <Clock size={16} className="text-amber-600 flex-shrink-0" />
                    <span>
                      An official statutory email was dispatched to <strong>{app.seconder?.name}</strong> ({app.seconder?.email || app.seconderEmail}). Waiting for their seconding consent before submission to Scrutiny Committee.
                    </span>
                  </div>
                )}

                {nominationView === 'proposed_by_me' && isSecondingDeclined && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl text-xs text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <XCircle size={16} className="text-red-600 flex-shrink-0" />
                    <span>
                      The designated seconder (<strong>{app.seconder?.name}</strong>) declined to second this nomination. The proposal was not submitted.
                    </span>
                  </div>
                )}

                {app.purposeStatement && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-400 block mb-1">Filed Purpose Statement / Citation:</span>
                    <p className="italic">"{app.purposeStatement}"</p>
                  </div>
                )}

                {app.scrutinyDetails && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl text-xs text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <span className="font-bold block">Scrutiny Committee Finding:</span>
                    <p>{app.scrutinyDetails.committeeRemarks}</p>
                  </div>
                )}

                {/* Withdrawal Option Section */}
                {app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'pending_seconding' && app.status !== 'seconding_declined' && (
                  <div className="pt-2 flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      Candidate withdrawal window is open until <strong>October 14, 2026</strong>.
                    </span>
                    <button
                      onClick={() => setWithdrawTarget(app)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800 transition-colors flex items-center gap-1.5 w-fit"
                    >
                      <Undo2 size={14} /> Withdraw Nomination
                    </button>
                  </div>
                )}

                {app.status === 'withdrawn' && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                    <strong>Status:</strong> This nomination was withdrawn on {new Date(app.updatedAt || Date.now()).toLocaleDateString()}. Reason: {app.withdrawalReason || "Voluntary withdrawal"}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Withdrawal Confirmation Modal */}
      <AnimatePresence>
        {withdrawTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Withdraw Nomination</h3>
                  <p className="text-xs text-slate-500">Nominee: {withdrawTarget.name} ({withdrawTarget.targetPositions?.join(", ")})</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-red-50/50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200/60 dark:border-red-800/40">
                In accordance with election bylaws, a withdrawal option is provided prior to the publication of the final contestant list. Once confirmed, the candidate's name will be permanently struck from the ballot.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  Reason for Withdrawal <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white resize-none"
                  placeholder="e.g. Nominee declined nomination, Personal commitments, Endorsement of another candidate..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setWithdrawTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmWithdrawal}
                  disabled={isWithdrawing}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {isWithdrawing ? "Processing..." : "Confirm Formal Withdrawal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// === Phase 5b: Official Publication of Final List Screen ===

const FinalCandidateListScreen = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [positionFilter, setPositionFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchFinalList = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/elections/final-list?position=${encodeURIComponent(positionFilter)}`)
      .then(res => res.json())
      .then(data => {
        setCandidates(data.candidates || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFinalList();
  }, [positionFilter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative z-10 pb-20"
    >
      {/* Official Certified Seal Banner */}
      <div className="glass-panel p-8 md:p-10 border-l-8 border-emerald-600 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                OFFICIAL PUBLICATION • PHASE 5
              </span>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold rounded-full">
                Final & Binding Roll
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Official Final List of Candidates
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Published in accordance with the election guidelines following formal verification of all proposals and completion of the withdrawal window. <strong>Decisions are final and binding.</strong>
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span>Certified by: <strong>Alumni Election Commission</strong></span>
            </div>
          </div>

          <div className="clay-icon w-16 h-16 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Award size={32} />
          </div>
        </div>
      </div>

      {/* Filter by Office Bearer Position */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['All', ...ELECTION_POSITIONS].map(pos => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                positionFilter === pos
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          Showing {candidates.length} Certified Candidate(s)
        </span>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="clay-card p-16 flex flex-col items-center justify-center text-center">
          <div className="clay-icon w-16 h-16 text-slate-400 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">No Final Candidates Published Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Nomination proposals are currently being verified. The certified final contestant list will appear here once approved.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((cand) => (
            <motion.div
              key={cand._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="clay-card p-6 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:scale-[1.01] transition-transform"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold rounded-full border border-emerald-200 dark:border-emerald-800">
                    {cand.targetPositions?.[0] || 'Office Bearer'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    ✓ Verified
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cand.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Compass size={13} /> {cand.department} • Class of {cand.graduationYear}
                  </p>
                </div>

                <div className="p-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Responsibility:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cand.roleCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service Tenure:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cand.continuousService?.years || 1}+ Years</span>
                  </div>
                  {cand.proposer?.name && (
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-400">Proposed by:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cand.proposer.name}</span>
                    </div>
                  )}
                </div>

                {cand.purposeStatement && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="font-bold not-italic text-slate-400 block mb-0.5 text-[10px] uppercase">Purpose & Citation:</span>
                    "{cand.purposeStatement.length > 120 ? cand.purposeStatement.slice(0, 120) + "..." : cand.purposeStatement}"
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Certified Candidate</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">AGM Ballot #2026</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// === Dashboard Screen ===

const DashboardScreen = ({ onNavigate, isAdmin, userProfile, token }: any) => {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    withdrawn: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetch('http://localhost:5000/api/applications/stats', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) setStats(data);
        })
        .catch(err => console.error("Failed to fetch stats from backend", err));
    }
  }, [isAdmin, token]);

  return (
    <div className="space-y-8 relative z-10">
      {/* Official Notice Alert Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <Megaphone size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Active Gazette Notification: AGM 2026 (No Self-Nomination)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Call for nominations announced at least 1 month prior to AGM (Oct 25, 2026). Candidates can only be nominated by being proposed by an eligible member.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('announcements')}
          className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 w-fit"
        >
          {isAdmin ? 'Manage Gazette Notice' : 'View Notice & Schedule'} <ChevronRight size={14} />
        </button>
      </motion.div>

      {/* Hero Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-10"
      >
        {isAdmin ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Admin Election Management Portal 👋
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-600 text-white shadow-sm">
                  ADMINISTRATOR
                </span>
              </div>
              <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">
                Authenticated as {userProfile?.name || 'Murali Subbiah M'} ({userProfile?.email || 'muralisubbu11@gmail.com'}) • Full Election Governance & Scrutiny Panel Control
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onNavigate('announcements')}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 flex items-center gap-2"
              >
                <Megaphone size={15} /> Manage Gazette
              </button>
              <button
                onClick={() => onNavigate('scrutiny')}
                className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 flex items-center gap-2"
              >
                <ShieldAlert size={15} /> Scrutiny Panel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Alumni Election Portal 👋
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-sm">
                  ALUMNI MEMBER
                </span>
              </div>
              <p className="text-indigo-600 dark:text-indigo-300 text-sm">
                Welcome, {userProfile?.name || 'Alumni Member'} • Review published announcements, evaluate nominee eligibility, and propose candidates.
              </p>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 flex-shrink-0 w-fit"
            >
              <Megaphone size={15} /> Official Announcements
            </button>
          </div>
        )}
      </motion.div>

      {/* Metrics Row - Only visible to Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Filed Proposals', value: stats.total, icon: Users, color: 'text-blue-500 dark:text-blue-400', glow: '' },
            { label: 'Scrutiny Passed / Approved', value: stats.approved, icon: CheckCircle2, color: 'text-green-500 dark:text-green-400', glow: 'glow-green' },
            { label: 'Pending Committee Review', value: stats.pending, icon: Clock, color: 'text-amber-500 dark:text-amber-400', glow: 'glow-amber' },
            { label: 'Withdrawn / Rejected', value: (stats.rejected || 0) + (stats.withdrawn || 0), icon: XCircle, color: 'text-rose-500 dark:text-rose-400', glow: 'glow-red' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
              className={`clay-card p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform ${stat.glow}`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                  <AnimatedCounter value={stat.value} />
                </h3>
              </div>
              <div className={`clay-icon w-12 h-12 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Role-Specific Quick Links */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => onNavigate('announcements')}
            className="clay-card p-6 cursor-pointer hover:border-purple-500/50 transition-all group"
          >
            <div className="clay-icon w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <Megaphone size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Manage Announcements & Broadcast</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create, edit, publish official gazettes, and broadcast announcements to all registered alumni via email.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('scrutiny')}
            className="clay-card p-6 cursor-pointer hover:border-indigo-500/50 transition-all group"
          >
            <div className="clay-icon w-12 h-12 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Scrutiny Panel Committee</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect filed nomination proposals, evaluate candidate bylaws adherence, and certify official approvals.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('finalList')}
            className="clay-card p-6 cursor-pointer hover:border-emerald-500/50 transition-all group"
          >
            <div className="clay-icon w-12 h-12 text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <Award size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Published Final Candidate Roll</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review and manage certified election contestant list following formal scrutiny conclaves.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => onNavigate('announcements')}
            className="clay-card p-6 cursor-pointer hover:border-indigo-500/50 transition-all group"
          >
            <div className="clay-icon w-12 h-12 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <Megaphone size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Official Announcements</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Read certified election gazette notices, key statutory dates, rules, and election committee contacts.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('eligibility')}
            className="clay-card p-6 cursor-pointer hover:border-indigo-500/50 transition-all group"
          >
            <div className="clay-icon w-12 h-12 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <ClipboardCheck size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Evaluate Nominee Eligibility</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check whether the alumni member you plan to propose satisfies the President 5-yr rule or 1-yr continuous service.
            </p>
          </div>

          <div 
            onClick={() => onNavigate('apply')}
            className="clay-card p-6 cursor-pointer hover:border-purple-500/50 transition-all group"
          >
            <div className="clay-icon w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <UserPlus size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Propose a Candidate</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No self-nomination: Propose an eligible alumni candidate, specify the seconder, and provide the purpose statement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// === EC Screen ===

const ECScreen = ({ onNavigate }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-20"
    >
      <div className="glass-panel p-8 border-l-8 border-purple-600 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Executive Committee Panel</h2>
          <p className="text-sm text-purple-600 dark:text-purple-300">
            Official election timetable, scrutiny governance, and election commission dashboard.
          </p>
        </div>
        <div className="clay-icon w-14 h-14 text-purple-600 hidden sm:flex">
          <ShieldCheck size={28} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clay-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays size={20} className="text-indigo-600" /> Election Timelines & Milestones
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">AGM Conclave Date:</span>
              <span className="font-bold text-slate-800 dark:text-white">October 25, 2026 (10:00 AM)</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">1-Month Notice Published:</span>
              <span className="font-bold text-green-600">September 10, 2026 (Compliant)</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Nomination Proposals Close:</span>
              <span className="font-bold text-amber-600">September 30, 2026</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Withdrawal Window:</span>
              <span className="font-bold text-slate-800 dark:text-white">Oct 07 – Oct 14, 2026</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Final List Certified:</span>
              <span className="font-bold text-purple-600">October 18, 2026</span>
            </div>
          </div>
        </div>

        <div className="clay-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-600" /> Administrative Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button 
              onClick={() => onNavigate('scrutiny')}
              className="p-4 glass-panel flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-center"
            >
              <ShieldAlert size={22} className="text-purple-600 mb-2" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Scrutiny Panel</span>
            </button>
            <button 
              onClick={() => onNavigate('finalList')}
              className="p-4 glass-panel flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-center"
            >
              <Award size={22} className="text-emerald-600 mb-2" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Final Candidate Roll</span>
            </button>
            <button 
              onClick={() => onNavigate('announcements')}
              className="p-4 glass-panel flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-center col-span-2"
            >
              <Megaphone size={22} className="text-indigo-600 mb-2" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Official Announcements & Gazette</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// === Auth Components ===

const AuthContainer = ({ children, title, subtitle }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="min-h-screen flex items-center justify-center p-6 relative z-10"
  >
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
          <Award size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center text-xs">{subtitle}</p>
      </div>
      {children}
    </div>
  </motion.div>
);

const BadRequestScreen = ({ onBack }: any) => (
  <AuthContainer title="400 Bad Request" subtitle="Something went wrong with your request.">
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center">
        <XCircle size={48} />
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-center">
        The server could not understand the request due to invalid syntax or missing data.
      </p>
      <button onClick={onBack} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
        Back to Home
      </button>
    </div>
  </AuthContainer>
);

const NotFoundScreen = ({ onBack }: any) => (
  <AuthContainer title="404 Not Found" subtitle="We couldn't find what you're looking for.">
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center">
        <Compass size={48} />
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-center">
        The page or resource you are looking for does not exist.
      </p>
      <button onClick={onBack} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
        Back to Home
      </button>
    </div>
  </AuthContainer>
);

const ForgotPasswordScreen = ({ onBackToSignIn }: any) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dob = formData.get('dob');
    const graduationYear = formData.get('graduationYear');
    const inputEmail = formData.get('email') as string;
    
    try {
      const res = await fetch('http://localhost:5000/api/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail, dob, graduationYear })
      });
      const data = await res.json();
      if (res.ok) {
        setEmail(inputEmail);
        setStep(2);
        setErrorMsg("");
      } else {
        setErrorMsg(data.error || 'Verification failed.');
      }
    } catch(err) {
      setErrorMsg('Network error.');
    }
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password reset successfully! You can now log in.');
        onBackToSignIn();
      } else {
        setErrorMsg(data.error || 'Failed to reset password.');
      }
    } catch(err) {
      setErrorMsg('Network error.');
    }
  };

  return (
    <AuthContainer title="Forgot Password" subtitle={step === 1 ? "Verify your identity" : "Create a new password"}>
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-200 dark:border-red-800">
          {errorMsg}
        </div>
      )}
      
      {step === 1 ? (
        <form className="space-y-4" onSubmit={handleVerify}>
          <div>
            <FormFieldLabel icon={Mail} label="Email Address" />
            <input name="email" type="email" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <FormFieldLabel icon={CalendarDays} label="Date of Birth" />
            <input name="dob" type="date" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <FormFieldLabel icon={GraduationCap} label="Graduation Year (Passout Date)" />
            <input name="graduationYear" type="number" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-4">
            Verify Identity
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleReset}>
          <div>
            <FormFieldLabel icon={Lock} label="New Password" />
            <div className="relative">
              <input name="newPassword" type={showPassword ? "text" : "password"} required minLength={8} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <FormFieldLabel icon={Lock} label="Confirm Password" />
            <input name="confirmPassword" type="password" required minLength={8} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-4">
            Reset Password
          </button>
        </form>
      )}
      
      <div className="mt-6 text-center">
        <button onClick={onBackToSignIn} className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium transition-colors">
          Back to Login
        </button>
      </div>
    </AuthContainer>
  );
};

const SignInScreen = ({ onSignIn, onSwitchToSignUp, onSwitchToForgotPassword }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <AuthContainer title="Alumni Sign In" subtitle="Sign in with your registered alumni credentials">
      <form className="space-y-4" onSubmit={async (e) => { 
        e.preventDefault(); 
        const email = (e.currentTarget as any).email.value;
        const password = (e.currentTarget as any).password.value;
        try {
          const res = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (res.ok) {
            const user = data.user || data;
            const token = data.token || '';
            onSignIn(user, token);
          } else {
            alert(data.error || 'Login failed');
          }
        } catch(err) {
          alert('Network error');
        }
      }}>
        <div>
          <FormFieldLabel icon={Mail} label="Alumni Email" />
          <input name="email" type="email" required defaultValue="tarun.ganapathi2007@gmail.com" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white" placeholder="you@alumni.org" />
        </div>
        <div>
          <FormFieldLabel icon={Lock} label="Password" />
          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} required defaultValue="Password@123" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-slate-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button type="button" onClick={onSwitchToForgotPassword} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Forgot Password?
          </button>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/30 tracking-wide mt-2">
          Sign In
        </button>
      </form>
      <div className="mt-6 text-center text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          New Alumni? <button onClick={onSwitchToSignUp} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Register account</button>
        </p>
      </div>
    </AuthContainer>
  );
};

const SignUpScreen = ({ onSignUp, onSwitchToSignIn }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isSecure = hasMinLen && hasUpper && hasNumber;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <AuthContainer title="Alumni Registration" subtitle="Join the Alumni Association Election Portal">
      <form className="space-y-3" onSubmit={async (e) => { 
        e.preventDefault(); 
        const formData = new FormData(e.currentTarget);
        if(isSecure && passwordsMatch) {
          try {
            const res = await fetch('http://localhost:5000/api/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.get('fullName'),
                phone: formData.get('phone'),
                department: formData.get('department'),
                graduationYear: formData.get('graduationYear'),
                dob: formData.get('dob'),
                gender: formData.get('gender'),
                email: formData.get('email'),
                password: password
              })
            });
            const data = await res.json();
            if (res.ok) {
              const user = data.user || data;
              const token = data.token || '';
              onSignUp(user, token);
            } else {
              alert(data.error || 'Signup failed');
            }
          } catch(err) {
            alert('Network error');
          }
        }
      }}>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <FormFieldLabel icon={User} label="Full Name" />
            <input name="fullName" type="text" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white" placeholder="John Doe" />
          </div>
          <div>
            <FormFieldLabel icon={Phone} label="Contact No" />
            <input name="phone" type="tel" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white" placeholder="+91..." />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <FormFieldLabel icon={Compass} label="Department" />
            <input name="department" type="text" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white" placeholder="CSE" />
          </div>
          <div>
            <FormFieldLabel icon={CalendarDays} label="Grad Year" />
            <input name="graduationYear" type="text" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white" placeholder="2015" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <FormFieldLabel icon={CalendarDays} label="Date of Birth" />
            <input name="dob" type="date" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white" />
          </div>
          <div>
            <FormFieldLabel icon={User} label="Gender" />
            <select name="gender" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <FormFieldLabel icon={Mail} label="Email Address" />
          <input name="email" type="email" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-white" placeholder="you@alumni.org" />
        </div>

        <div>
          <FormFieldLabel icon={Lock} label="Password" />
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-white" placeholder="••••••••" />
        </div>

        <div>
          <FormFieldLabel icon={Lock} label="Confirm Password" />
          <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-white" placeholder="••••••••" />
        </div>

        <button type="submit" disabled={!isSecure || !passwordsMatch} className={`w-full font-bold py-3 rounded-xl transition-all shadow-md text-xs mt-2 ${isSecure && passwordsMatch ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>
          Register Member
        </button>
      </form>
      <div className="mt-4 text-center text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          Already registered? <button onClick={onSwitchToSignIn} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign in</button>
        </p>
      </div>
    </AuthContainer>
  );
};

// === Main Application Controller ===

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('ems_token') || '');
  const [userProfile, setUserProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('ems_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgotPassword' | '400' | '404' | 'app'>(() => {
    const saved = localStorage.getItem('ems_user');
    return saved ? 'app' : 'signin';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle URL paths for 404/400 and protect /admin
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      if (!userProfile) {
        setAuthView('signin');
      } else if (!isAdmin) {
        alert("403 Forbidden: Administrator role required to access /admin. Redirecting to your Alumni Dashboard.");
        window.history.replaceState(null, '', '/');
        setActiveTab('dashboard');
        setAuthView('app');
      } else {
        window.history.replaceState(null, '', '/');
        setActiveTab('dashboard');
        setAuthView('app');
      }
    } else if (path === '/400') {
      setAuthView('400');
    } else if (path === '/404' || (path !== '/' && !path.startsWith('/api'))) {
      setAuthView('404');
    }
  }, [userProfile, isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    setToken('');
    setUserProfile(null);
    setActiveTab('dashboard');
    setAuthView('signin');
  };

  const handleAuthSuccess = (user: any, authToken: string) => {
    setUserProfile(user);
    setToken(authToken || '');
    if (authToken) localStorage.setItem('ems_token', authToken);
    if (user) localStorage.setItem('ems_user', JSON.stringify(user));
    setActiveTab('dashboard');
    setAuthView('app');
  };

  // Strictly segregated navigation tabs
  const ALUMNI_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'eligibility', label: 'Eligibility Evaluator', icon: ClipboardCheck },
    { id: 'apply', label: 'Propose Nominee', icon: UserPlus },
  ];

  const ADMIN_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, badge: 'Gazette' },
    { id: 'eligibility', label: 'Eligibility Evaluator', icon: ClipboardCheck },
    { id: 'apply', label: 'Propose Nominee', icon: UserPlus },
    { id: 'scrutiny', label: 'Scrutiny Panel', icon: ShieldAlert, badge: 'Admin' },
    { id: 'finalList', label: 'Final List', icon: Award },
    { id: 'applications', label: 'My Nominations', icon: FolderOpen },
    { id: 'ec', label: 'EC Timelines', icon: Users, badge: 'Admin' }
  ];

  const currentTabs = isAdmin ? ADMIN_TABS : ALUMNI_TABS;

  const handleTabChange = (tabId: string) => {
    if (!isAdmin && ['scrutiny', 'finalList', 'applications', 'ec'].includes(tabId)) {
      alert("403 Forbidden: Administrative permission required.");
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tabId);
  };

  const renderContent = () => {
    if (!isAdmin && ['scrutiny', 'finalList', 'applications', 'ec'].includes(activeTab)) {
      return (
        <div className="glass-panel p-8 text-center space-y-4 max-w-xl mx-auto my-12 border-red-200 dark:border-red-900/40">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">403 Forbidden: Administrator Privilege Required</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your account is assigned the role of <strong>Alumni</strong>. Administrative sections such as Scrutiny Conclave, Final Candidate Certification, and EC Oversight are restricted strictly to designated election administrators.
          </p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Return to Alumni Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': 
        return (
          <DashboardScreen 
            isAdmin={isAdmin}
            token={token}
            userProfile={userProfile}
            onNavigate={(tab: string) => handleTabChange(tab)} 
          />
        );
      case 'announcements': 
        return (
          <AnnouncementScreen 
            isAdmin={isAdmin}
            token={token}
            userProfile={userProfile}
            onProceedToEligibility={() => handleTabChange('eligibility')} 
            onProceedToApply={() => handleTabChange('apply')} 
          />
        );
      case 'eligibility': 
        return (
          <EligibilityScreen 
            onProceedToApply={() => handleTabChange('apply')} 
          />
        );
      case 'apply': 
        return (
          <ApplyScreen 
            userProfile={userProfile} 
            onNominationSuccess={() => {
              if (isAdmin) {
                handleTabChange('applications');
              } else {
                handleTabChange('dashboard');
              }
            }} 
          />
        );
      case 'scrutiny': 
        return <ScrutinyCommitteeScreen token={token} />;
      case 'finalList': 
        return <FinalCandidateListScreen />;
      case 'applications': 
        return (
          <MyApplicationsScreen 
            userProfile={userProfile} 
            onProceedToApply={() => handleTabChange('apply')} 
          />
        );
      case 'ec': 
        return <ECScreen onNavigate={(tab: string) => handleTabChange(tab)} />;
      default: 
        return (
          <DashboardScreen 
            isAdmin={isAdmin}
            token={token}
            userProfile={userProfile}
            onNavigate={(tab: string) => handleTabChange(tab)} 
          />
        );
    }
  };

  if (authView === 'signin') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <SignInScreen 
          onSignIn={(userData: any, authToken: string) => handleAuthSuccess(userData, authToken)} 
          onSwitchToSignUp={() => setAuthView('signup')} 
          onSwitchToForgotPassword={() => setAuthView('forgotPassword')} 
        />
      </div>
    );
  }

  if (authView === 'signup') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <SignUpScreen 
          onSignUp={(profileData: any, authToken: string) => handleAuthSuccess(profileData, authToken)} 
          onSwitchToSignIn={() => setAuthView('signin')} 
        />
      </div>
    );
  }

  if (authView === 'forgotPassword') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <ForgotPasswordScreen onBackToSignIn={() => setAuthView('signin')} />
      </div>
    );
  }

  if (authView === '400') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <BadRequestScreen onBack={() => setAuthView('signin')} />
      </div>
    );
  }

  if (authView === '404') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <NotFoundScreen onBack={() => setAuthView('signin')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
      <BackgroundBlobs />
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabChange('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Award className="text-white" size={20} />
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              EMS<span className="text-indigo-600 dark:text-indigo-400">.Alumni</span>
            </span>
            <p className="text-[10px] font-semibold text-slate-400 -mt-1 hidden sm:block">Alumni Association Elections</p>
          </div>
        </div>
        
        {/* Desktop Nav Items */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md">
          {currentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 z-10 ${
                activeTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={15} className={activeTab === tab.id ? (isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-indigo-600 dark:text-indigo-400') : ''} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                  tab.badge === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm rounded-full border border-slate-200/80 dark:border-slate-700 -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* User Status & Actions */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="clay-icon w-9 h-9 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          
          <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
            <div className={`w-8 h-8 rounded-full ${isAdmin ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/50' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'} font-bold flex items-center justify-center`}>
              {userProfile?.name?.[0] || (isAdmin ? 'M' : 'A')}
            </div>
            <div className="text-left leading-tight hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 dark:text-white block max-w-[140px] truncate">{userProfile?.name || (isAdmin ? 'Murali Subbiah M' : 'Alumni Member')}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${isAdmin ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  {isAdmin ? 'ADMIN' : 'ALUMNI'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block max-w-[150px] truncate">{userProfile?.email}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="clay-icon w-9 h-9 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" 
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Mobile nav */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 glass-panel !rounded-none !border-x-0 !border-b-0 px-2 py-2 flex justify-around z-50 overflow-x-auto">
        {currentTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-center p-2 rounded-xl text-center min-w-[50px] transition-all ${
              activeTab === tab.id ? (isAdmin ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-indigo-600 dark:text-indigo-400 font-bold') : 'text-slate-500'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-[9px] mt-0.5 whitespace-nowrap">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center p-2 rounded-xl text-center min-w-[50px] transition-all text-red-500 hover:text-red-600"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="text-[9px] mt-0.5 whitespace-nowrap">Logout</span>
        </button>
      </div>
    </div>
  );
}
