import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, ClipboardCheck, FileEdit, FolderOpen, ShieldCheck, Users,
  CheckCircle2, Clock, XCircle, ChevronRight, Activity, CalendarDays,
  UserCheck, Award, Briefcase, FileText, Sun, Moon,
  User, Mail, Phone, Compass, Globe, MessageSquare, GraduationCap,
  Lock, Eye, EyeOff, LogOut, Megaphone, AlertCircle, HelpCircle,
  Download, Share2, ExternalLink, ShieldAlert, ListChecks, Undo2,
  Sparkles, BookOpen, Info, Check, ArrowRight, UserPlus,
  Send, Save, Edit3, Trash2, Plus, RefreshCw, AlertTriangle, MailCheck, Loader2, X, Vote, Menu
} from 'lucide-react';
import necLogo from '../imports/nec-logo.png';


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
  <div className="fixed inset-0 z-0 pointer-events-none bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-slate-50/80 to-purple-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/80" />
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

    let totalMilSecDur = 600;
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
        className={className || "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 dark:text-white cursor-pointer flex justify-between items-center transition-all focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"}
      >
        <span className={selected.length === 0 ? "text-slate-400 dark:text-slate-500" : "truncate pr-4 font-medium"}>
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <ChevronRight className={`text-slate-400 pointer-events-none transition-transform ${isOpen ? 'rotate-[270deg]' : 'rotate-90'}`} size={16} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto p-1"
          >
            {options.map((opt: string) => (
              <div
                key={opt}
                onClick={() => {
                  if (selected.includes(opt)) onChange(selected.filter((o: string) => o !== opt));
                  else onChange([...selected, opt]);
                }}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-md hover:bg-purple-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt) ? 'bg-purple-600 border-purple-600' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selected.includes(opt) && <Check size={12} className="text-white" />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{opt}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FormFieldLabel = ({ icon: Icon, label, required = true }: { icon?: any, label: string, required?: boolean }) => {
  const displayLabel = label && label === label.toUpperCase() && label.length > 3
    ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase().replace(/_/g, ' ')
    : label;

  return (
    <div className="flex items-center space-x-1.5 mb-1.5">
      <span className="w-1 h-3 rounded-full bg-purple-600 flex-shrink-0" />
      {Icon && <Icon size={13} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />}
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
        {displayLabel} {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
    </div>
  );
};

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
      .catch(() => { });
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
      <div className="space-y-6 relative z-10 pb-20 max-w-2xl mx-auto text-center pt-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/60">
            <Megaphone size={22} />
          </div>
          <span className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800">
            Official Status • Pending Publication
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Election Announcement Pending Publication
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            The Alumni Election Commission has not yet formally published the official gazette notification for the forthcoming elections.
          </p>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Once certified and published, the complete election schedule, nomination deadline, and AGM date will appear here and will be broadcast to your registered email.
          </div>
          <div className="pt-2">
            <button
              onClick={onProceedToEligibility}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <ClipboardCheck size={15} /> Evaluate Nominee Eligibility Meanwhile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10 pb-16">
      {/* Admin Management Toolbar (Admin Only) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Announcements & Broadcast</h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border ${editForm.status === 'published'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }`}>
                  {editForm.status === 'published' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {editForm.status === 'published' ? 'Live: Visible to Alumni' : 'Draft: Hidden'}
                </span>
              </div>
            </div>

            {/* Mode switcher & primary actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setAdminMode('manage')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${adminMode === 'manage' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setAdminMode('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${adminMode === 'preview' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Eye size={13} /> Alumni View
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEmailTargetMode('all');
                  setBroadcastResult(null);
                  setShowEmailModal(true);
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                title="Send official election announcement to all registered alumni members"
              >
                <Users size={13} /> Send to All Alumni
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailTargetMode('single');
                  setBroadcastResult(null);
                  setShowEmailModal(true);
                }}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                title="Send official call for announcement to one single person"
              >
                <Send size={13} /> Send to Person
              </button>

              <button
                type="button"
                onClick={() => handleSaveAnnouncement(editForm.status === 'published' ? 'draft' : 'published')}
                disabled={isSaving}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 border transition-all ${editForm.status === 'published'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
              >
                {editForm.status === 'published' ? <Clock size={13} /> : <CheckCircle2 size={13} />}
                {editForm.status === 'published' ? 'Unpublish' : 'Publish Live'}
              </button>

              <button
                type="button"
                onClick={() => handleSaveAnnouncement()}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Save size={13} /> {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleDeleteAnnouncement}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Reset to default announcement"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Admin Mode: Management Form */}
      {isAdmin && adminMode === 'manage' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 md:p-8 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Election Announcement Editor</h3>
              <p className="text-xs text-slate-500 mt-1">Configure statutory timetable, notification parameters, and official text.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Official Election Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Notification Reference Number *</label>
                <input
                  type="text"
                  value={editForm.notificationNumber}
                  onChange={(e) => setEditForm({ ...editForm, notificationNumber: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Election Year *</label>
                <input
                  type="text"
                  value={editForm.electionYear}
                  onChange={(e) => setEditForm({ ...editForm, electionYear: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Published Via *</label>
                <input
                  type="text"
                  value={editForm.publishedVia}
                  onChange={(e) => setEditForm({ ...editForm, publishedVia: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Publication Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  <option value="published">Published (Visible to all alumni)</option>
                  <option value="draft">Draft (Restricted to Admin)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                <CalendarDays size={15} className="text-purple-600" /> Statutory Milestone Schedule & Deadlines
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">AGM Date</label>
                  <input
                    type="date"
                    value={(editForm.agmDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, agmDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Nomination Start Date</label>
                  <input
                    type="date"
                    value={(editForm.nominationStartDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, nominationStartDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Nomination Deadline</label>
                  <input
                    type="date"
                    value={(editForm.nominationDeadline || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, nominationDeadline: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Scrutiny Conclave Date</label>
                  <input
                    type="date"
                    value={(editForm.scrutinyMeetingDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, scrutinyMeetingDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Candidate Withdrawal Deadline</label>
                  <input
                    type="date"
                    value={(editForm.withdrawalDeadline || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, withdrawalDeadline: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Final Candidate List Publication</label>
                  <input
                    type="date"
                    value={(editForm.finalListDate || '').substring(0, 10)}
                    onChange={(e) => setEditForm({ ...editForm, finalListDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Voting Schedule / Hours</label>
                  <input
                    type="text"
                    value={editForm.electionStartTime + " - " + editForm.electionEndTime}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      setEditForm({ ...editForm, electionStartTime: parts[0]?.trim() || '', electionEndTime: parts[1]?.trim() || '' });
                    }}
                    placeholder="10:00 AM - 04:00 PM"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs">Official Constitutional Preamble / Notice Text *</label>
              <textarea
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-800 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminMode('preview')}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Eye size={13} /> Preview Live Gazette
              </button>
              <button
                type="button"
                onClick={() => handleSaveAnnouncement()}
                disabled={isSaving}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-colors shadow-xs"
              >
                <Save size={14} /> {isSaving ? 'Saving Changes...' : 'Save Announcement Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Gazette View (Shown to Alumni OR Admin in Preview Mode) */}
      {(!isAdmin || adminMode === 'preview') && (
        <div className="space-y-6">
          {/* Official Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700">
                    Ref: {announcement?.notificationNumber || "AA/ELEC/2026/01"}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-md flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Call for Nominations Open
                  </span>
                  {isAdmin && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 text-xs font-medium rounded-md border border-purple-200 dark:border-purple-800">
                      Admin Preview Mode
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {announcement?.title || "Alumni Association Office Bearer Elections 2026"}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {announcement?.description || "Nominations are hereby called for the positions of Office Bearers for the term 2026–2028. Published via the official Alumni portal at least one month prior to the forthcoming Annual General Meeting (AGM)."}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-purple-600" /> AGM Date: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatDateDisplay(announcement?.agmDate, 'October 25, 2026')}</strong></span>
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-purple-600" /> Nomination Starts: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatDateDisplay(announcement?.nominationStartDate, 'September 12, 2026')}</strong></span>
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-purple-600" /> Deadline: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatDateDisplay(announcement?.nominationDeadline, 'September 30, 2026')}</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 flex-shrink-0">
                <button
                  onClick={() => setShowGazetteModal(true)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText size={15} className="text-purple-600" /> View Gazette Notice
                </button>
                <button
                  onClick={onProceedToApply}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <UserPlus size={15} /> Propose a Candidate
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mandatory Statutory Rules Notice Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Statutory Election Framework</h3>
                  <p className="text-xs text-slate-500">Adopted per Alumni Association Bylaws</p>
                </div>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Proposal-Driven Only:</strong> There is no self-nomination. An alumni member must be proposed and seconded by eligible members.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>1-Month Announcement Window:</strong> Call for nominations announced at least 30 days prior to the AGM.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>President Requirement:</strong> Candidate must have served as an Office Bearer in the preceding 5 years (2021–2026).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>1-Year Continuous Service:</strong> Nominee must have actively served for ≥ 1 year continuously in an authorized role.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Roles Open for Nominations</h3>
                  <p className="text-xs text-slate-500">Executive Office Bearers (Tenure 2026–2028)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { title: "1. President", posts: "1 Post", desc: "Requires Preceding 5-Yr Office Bearer Service" },
                  { title: "2. Vice President", posts: "1 Post", desc: "Demonstrated Leadership & Active Standing" },
                  { title: "3. Secretary", posts: "1 Post", desc: "Chapter or Club Coordination Experience" },
                  { title: "4. Joint Secretary", posts: "1 Post", desc: "Active Standing with Coordinator Experience" },
                  { title: "5. Treasurer", posts: "1 Post", desc: "Financial / Secretarial Verified Record" },
                  { title: "6. Joint Treasurer", posts: "1 Post", desc: "Continuous Active Alumni Standing" }
                ].map((pos, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-white text-xs">{pos.title}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {pos.posts}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {pos.desc}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 5-Stage Election Process Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official 5-Phase Election Lifecycle</h3>
                <p className="text-xs text-slate-500 mt-0.5">Progression from announcement to final candidate publication</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 w-fit">
                Phase 1 & 2 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { stage: "Stage 1", title: "Call for Nominations", desc: "Portal opens for candidate nominations", date: formatDateDisplay(announcement?.nominationStartDate, 'Sep 12, 2026'), status: "Active", active: true },
                { stage: "Stage 2", title: "Nomination Proposals", desc: "Eligible members submit proposals", date: formatDateDisplay(announcement?.nominationDeadline, 'Sep 30, 2026'), status: "In Progress", active: true },
                { stage: "Stage 3", title: "Scrutiny Conclave", desc: "Formal verification of all filed proposals", date: formatDateDisplay(announcement?.scrutinyMeetingDate, 'Oct 05, 2026'), status: "Scheduled", active: false },
                { stage: "Stage 4", title: "Candidate Withdrawal", desc: "Withdrawal window provided before final roll", date: formatDateDisplay(announcement?.withdrawalDeadline, 'Oct 14, 2026'), status: "Scheduled", active: false },
                { stage: "Stage 5", title: "Final List & AGM", desc: "Certified ballot published; AGM voting", date: formatDateDisplay(announcement?.agmDate, 'Oct 25, 2026'), status: "AGM Conclave", active: false }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-colors">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {step.stage}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">{step.desc}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{step.date}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${step.active ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
            >
              {!broadcastResult ? (
                <>
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${emailTargetMode === 'single'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300'
                      }`}>
                      {emailTargetMode === 'single' ? <Mail size={18} /> : <Send size={18} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {emailTargetMode === 'single' ? 'Send Announcement to Individual' : 'Broadcast Election Announcement'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {emailTargetMode === 'single' ? 'Deliver official election notification directly to a specific person' : 'Official notification delivery to all registered alumni'}
                      </p>
                    </div>
                  </div>

                  {/* Segmented Mode Selector */}
                  <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEmailTargetMode('all')}
                      className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${emailTargetMode === 'all'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <Users size={13} /> Send to All Alumni
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailTargetMode('single')}
                      className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${emailTargetMode === 'single'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <Mail size={13} /> Send to Single Person
                    </button>
                  </div>

                  {/* Sender Identity Banner */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5"><Mail size={13} className="text-purple-600" /> Sender: <strong>muralisubbu11@gmail.com</strong></span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                        {smtpConfigured ? '✓ Live Connected' : 'Google Auth Required'}
                      </span>
                    </div>

                    {!smtpConfigured && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Gmail 16-Character App Password <span className="text-red-500">*</span>
                          </label>
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-purple-600 hover:underline font-semibold"
                          >
                            Generate from Google &rarr;
                          </a>
                        </div>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="e.g. abcd efgh ijkl mnop"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                        />
                        <p className="text-[10px] text-slate-500">
                          Google requires an App Password to dispatch emails via Gmail. Turn ON 2-Step Verification and generate an App Password.
                        </p>
                      </div>
                    )}
                  </div>

                  {emailTargetMode === 'single' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Recipient Member Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={singleRecipientEmail}
                            onChange={(e) => setSingleRecipientEmail(e.target.value)}
                            placeholder="Enter recipient member's email address"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                            required
                          />
                          <Mail size={15} className="absolute right-3 top-2.5 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              Subject Line:
                            </label>
                            <span className="text-[10px] text-slate-400">Editable</span>
                          </div>
                          <input
                            type="text"
                            value={editForm.emailSubject}
                            onChange={(e) => setEditForm({ ...editForm, emailSubject: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 pt-1">
                          <li>Sender: muralisubbu11@gmail.com (Official Commission)</li>
                          <li>All 6 Executive Posts open for contest</li>
                          <li>Includes official statutory timeline and guidelines</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <p>
                        You are about to broadcast election announcement emails to all registered alumni members (<code className="text-purple-600 dark:text-purple-400 font-semibold">role = alumni</code>).
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Subject Line:
                          </label>
                          <span className="text-[10px] text-slate-400">Editable</span>
                        </div>
                        <input
                          type="text"
                          value={editForm.emailSubject}
                          onChange={(e) => setEditForm({ ...editForm, emailSubject: e.target.value })}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 pt-1">
                        <li>Personalized to each member name, batch and department</li>
                        <li>Complete statutory schedule from nomination to voting</li>
                        <li>Direct link to the Alumni Election Portal</li>
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleLoadEmailPreview()}
                      disabled={loadingPreview || isBroadcasting}
                      className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/80 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium text-xs flex items-center gap-1.5 hover:bg-purple-100 transition-colors"
                    >
                      {loadingPreview ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
                      Preview Email
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEmailModal(false)}
                        disabled={isBroadcasting}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSendBroadcast}
                        disabled={isBroadcasting}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        {isBroadcasting ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" /> Dispatching...
                          </>
                        ) : emailTargetMode === 'single' ? (
                          <>
                            <Send size={13} /> Send Email
                          </>
                        ) : (
                          <>
                            <Users size={13} /> Confirm & Broadcast
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-2 py-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <MailCheck size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {broadcastResult.stats?.targetType === 'single' ? 'Announcement Successfully Dispatched' : 'Broadcast Successfully Dispatched'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {broadcastResult.message}
                    </p>
                  </div>

                  {broadcastResult.stats?.targetType === 'single' ? (
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Sender:</span>
                        <span className="font-medium text-slate-800 dark:text-white">muralisubbu11@gmail.com</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Recipient:</span>
                        <span className="font-medium text-slate-800 dark:text-white">{broadcastResult.stats?.recipientEmail}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-semibold text-emerald-600">✓ Delivered</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Alumni</span>
                        <span className="text-base font-bold text-slate-800 dark:text-white">{broadcastResult.stats?.totalAlumni || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sent</span>
                        <span className="text-base font-bold text-emerald-600">{broadcastResult.stats?.sentCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sender</span>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5 block truncate">muralisubbu11@gmail.com</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailModal(false);
                        setBroadcastResult(null);
                        setSingleRecipientEmail('');
                      }}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Live Gazette Email Preview
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        Compatible
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Exact rendering delivered to alumni inboxes
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLivePreviewModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 sm:p-5 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 max-w-2xl mx-auto overflow-hidden">
                  <iframe
                    title="Email Preview"
                    srcDoc={previewHtmlContent}
                    className="w-full h-[600px] border-0"
                    sandbox="allow-same-origin allow-popups"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Validated: Full letterhead, 6 contested positions & schedule
                </div>
                <button
                  type="button"
                  onClick={() => setShowLivePreviewModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Official Gazette Letterhead */}
              <div className="border-b-2 border-purple-500/80 pb-4 text-center space-y-2">
                <div className="flex justify-center mb-1">
                  <img src={necLogo} alt="NEC Alumni Association Logo" className="h-16 w-auto object-contain drop-shadow-xs" />
                </div>
                <div className="inline-block px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold tracking-wider uppercase rounded-md mb-1">
                  Official Gazette Notification
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  National Engineering College (Autonomous)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Approved by AICTE • Affiliated to Anna University • K.R. Nagar, Kovilpatti - 628 503
                </p>
                <div className="pt-1.5">
                  <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Alumni Association (NECAA) • Election Commission
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Ref: {announcement?.notificationNumber || announcement?.referenceNumber || "NEC/ELEC/2026/001"} • Term 2026–2028
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {/* Convocation Clause */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <p>
                    <strong>Formal Convocation:</strong> Notice is hereby officially promulgated to all registered alumni members that the Biennial General Elections for Executive Office Bearers for the <strong>2026–2028 tenure</strong> will take place in conjunction with the Annual General Meeting (AGM) on <strong>{formatDateDisplay(announcement?.agmDate, 'Sunday, October 25, 2026')}</strong>.
                  </p>
                </div>

                {/* Statutory Rule Banner */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs rounded-lg text-amber-900 dark:text-amber-300 space-y-0.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" />
                    Statutory Rule: Strict Proposal Workflow (No Self-Nomination)
                  </div>
                  <p className="text-[11px] opacity-90">
                    Self-nominations are strictly invalid. Every nominee must be proposed and seconded by verified alumni members with a formal written Purpose Statement detailing leadership credentials.
                  </p>
                </div>

                {/* Section 1: Positions Open */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
                    <span>1. Executive Positions Contested</span>
                    <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">Tenure: 2026–2028</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-900 dark:text-white">1. President (1 Post)</div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">★ Mandatory: Must have served as Office Bearer in preceding 5 yrs (2021–2026)</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-900 dark:text-white">2. Vice President (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with verified coordinator service</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-900 dark:text-white">3. Secretary (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with chapter/club coordination</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-900 dark:text-white">4. Joint Secretary (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with coordinator experience</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-900 dark:text-white">5. Treasurer (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with financial/secretarial records</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-900 dark:text-white">6. Joint Treasurer (1 Post)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Active standing with verified alumni service</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Complete 9-Stage Master Timetable */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    2. Master Election Timetable & Deadlines
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2 text-center w-12">#</th>
                          <th className="p-2">Event</th>
                          <th className="p-2 text-right">Prescribed Schedule (IST)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr>
                          <td className="p-2 text-center font-medium text-slate-400">1</td>
                          <td className="p-2 font-medium">Opening of Nominations Portal</td>
                          <td className="p-2 text-right font-medium text-purple-600 dark:text-purple-400">{formatDateDisplay(announcement?.nominationStartDate, 'September 12, 2026')} • 09:00 AM</td>
                        </tr>
                        <tr className="bg-rose-50/50 dark:bg-rose-950/20">
                          <td className="p-2 text-center font-semibold text-rose-600">2</td>
                          <td className="p-2 font-semibold text-rose-600">Last Date for Submitting Nominations</td>
                          <td className="p-2 text-right font-semibold text-rose-600">{formatDateDisplay(announcement?.nominationDeadline, 'September 30, 2026')} • 05:00 PM</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-medium text-slate-400">3</td>
                          <td className="p-2 font-medium">Scrutiny Conclave Date</td>
                          <td className="p-2 text-right font-medium">{formatDateDisplay(announcement?.scrutinyMeetingDate, 'October 05, 2026')} • 02:00 PM</td>
                        </tr>
                        <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                          <td className="p-2 text-center font-semibold text-amber-600">4</td>
                          <td className="p-2 font-semibold text-amber-700 dark:text-amber-400">Last Date for Candidature Withdrawal</td>
                          <td className="p-2 text-right font-semibold text-amber-700 dark:text-amber-400">{formatDateDisplay(announcement?.withdrawalDeadline, 'October 14, 2026')} • 05:00 PM</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-medium text-slate-400">5</td>
                          <td className="p-2 font-medium">Final List of Contesting Candidates</td>
                          <td className="p-2 text-right font-medium">{formatDateDisplay(announcement?.finalListDate, 'October 18, 2026')} • 10:00 AM</td>
                        </tr>
                        <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                          <td className="p-2 text-center font-semibold text-emerald-600">6</td>
                          <td className="p-2 font-semibold text-emerald-700 dark:text-emerald-400">Electronic Polling (Secret Ballot)</td>
                          <td className="p-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">{formatDateDisplay(announcement?.electionDate, 'Sunday, October 25, 2026')} • 10:00 AM – 04:00 PM</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-medium text-slate-400">7</td>
                          <td className="p-2 font-medium">AGM & Results Declaration</td>
                          <td className="p-2 text-right font-medium">{formatDateDisplay(announcement?.agmDate, 'Sunday, October 25, 2026')} • 05:00 PM</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Signatures & Authority */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-white">Alumni Election Commission</div>
                    <div className="text-[11px] opacity-75">National Engineering College Alumni Association (NECAA)</div>
                  </div>
                  <div className="sm:text-right">
                    <div className="font-semibold text-slate-800 dark:text-white">Principal & Patron</div>
                    <div className="text-[11px] opacity-75">National Engineering College (Autonomous)</div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-center text-[11px] text-slate-500">
                  National Engineering College, K.R. Nagar, Kovilpatti - 628 503
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowGazetteModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download size={14} /> Print Gazette
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
  const [isRegisteredAlumni, setIsRegisteredAlumni] = useState(false);

  const [targetEmail, setTargetEmail] = useState("");
  const [isFetchingTarget, setIsFetchingTarget] = useState(false);
  const [targetLookupStatus, setTargetLookupStatus] = useState<any>(null);

  const fetchTargetByEmail = async (emailToFetch: string) => {
    const cleanEmail = (emailToFetch || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return;
    setIsFetchingTarget(true);
    try {
      const res = await fetch(`http://localhost:5000/api/alumni/lookup?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();
      if (res.ok && data.found && data.alumni) {
        setTargetLookupStatus({
          found: true,
          name: data.alumni.name,
          department: data.alumni.department,
          graduationYear: data.alumni.graduationYear,
          phone: data.alumni.phone
        });
        setIsRegisteredAlumni(true);
      } else {
        setTargetLookupStatus({ found: false, message: 'Alumni data not found.' });
        setIsRegisteredAlumni(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingTarget(false);
    }
  };

  useEffect(() => {
    if (!targetEmail) {
      setTargetLookupStatus(null);
      setIsRegisteredAlumni(false);
      return;
    }
    const timer = setTimeout(() => {
      if (targetEmail.includes('@') && targetEmail.includes('.')) {
        fetchTargetByEmail(targetEmail);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [targetEmail]);
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
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto glass-panel p-6 sm:p-8 relative z-10 space-y-6"
    >
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Nominee Eligibility Evaluator
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Verify the nominee against the official eligibility criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between items-center">
              <span>Nominee alumni email</span>
              {isFetchingTarget && <span className="text-[10px] text-purple-600 normal-case flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Verifying email...</span>}
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => {
                setTargetEmail(e.target.value);
                setEvaluationResult(null);
              }}
              placeholder="e.g. member@alumni.org"
              className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${targetLookupStatus?.found === false ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'}`}
            />
            {targetLookupStatus?.found === true && (
              <div className="mt-2.5 p-3 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <Check size={14} /> Registered alumni record found
                </p>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 grid grid-cols-2 gap-1">
                  <span><strong className="text-slate-700 dark:text-slate-300">Name:</strong> {targetLookupStatus.name}</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">Dept:</strong> {targetLookupStatus.department}</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">Batch:</strong> {targetLookupStatus.graduationYear}</span>
                  <span><strong className="text-slate-700 dark:text-slate-300">Phone:</strong> {targetLookupStatus.phone}</span>
                </div>
              </div>
            )}
            {targetLookupStatus?.found === false && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                <XCircle size={13} /> Alumni not found in registry. Must be a registered member.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Office bearer position
            </label>
            <div className="relative">
              <select
                value={targetPosition}
                onChange={(e) => {
                  setTargetPosition(e.target.value);
                  setEvaluationResult(null);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                {ELECTION_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos} {pos === "President" ? "(Requires Preceding 5-Yr Office Bearer Experience)" : ""}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3.5 top-3 text-slate-400 rotate-90 pointer-events-none" size={16} />
            </div>
            {targetPosition === "President" && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 dark:border-amber-800/60">
                <AlertCircle size={13} className="flex-shrink-0" />
                <span>⚠ Nominee must have served as an Office Bearer within the past 5 years.</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nominee's previous responsibility
            </label>
            <div className="space-y-1.5">
              {RESPONSIBILITY_CATEGORIES.map(cat => (
                <label
                  key={cat.id}
                  className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition-colors ${roleCategory === cat.id
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
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
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-2.5 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{cat.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{cat.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {targetPosition === "President" && (
            <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200">
                Did nominee serve as Office Bearer in immediate preceding 5 years (2021–2026)?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="past5yrs"
                    checked={wasOfficeBearerInPast5Years === "yes"}
                    onChange={() => {
                      setWasOfficeBearerInPast5Years("yes");
                      setEvaluationResult(null);
                    }}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  Yes, served as Office Bearer
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="past5yrs"
                    checked={wasOfficeBearerInPast5Years === "no"}
                    onChange={() => {
                      setWasOfficeBearerInPast5Years("no");
                      setEvaluationResult(null);
                    }}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  No
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Continuous active service (Years in past 5 yrs)
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
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              placeholder="e.g. 1.5"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={hasNoGapInPast5Years}
                onChange={(e) => {
                  setHasNoGapInPast5Years(e.target.checked);
                  setEvaluationResult(null);
                }}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span>Nominee's service was continuous <strong>without gap</strong> in past 5 years</span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={isRegisteredAlumni}
                onChange={(e) => {
                  setIsRegisteredAlumni(e.target.checked);
                  setEvaluationResult(null);
                }}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span>Nominee is registered on the official Alumni portal</span>
            </label>
          </div>

          <button
            onClick={runEvaluation}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <ShieldCheck size={16} /> Verify Nominee's Eligibility
          </button>
        </div>

        {/* Evaluation Output Matrix */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5">
              Eligibility Criteria
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Registered Alumni Member</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${isRegisteredAlumni ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
                  {isRegisteredAlumni ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Active Service ≥ 1 Year</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${parseFloat(continuousDuration) >= 1 && hasNoGapInPast5Years ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  }`}>
                  {parseFloat(continuousDuration) >= 1 && hasNoGapInPast5Years ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">Responsibility Role</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {roleCategory}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">President 5-Year Rule</span>
                {targetPosition === "President" ? (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${roleCategory === "Office Bearer" && wasOfficeBearerInPast5Years === "yes" ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}>
                    {roleCategory === "Office Bearer" && wasOfficeBearerInPast5Years === "yes" ? 'VERIFIED' : 'FAILED'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Bylaw Norms Apply
                  </span>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {evaluationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-4 rounded-xl border ${evaluationResult.isEligible
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {evaluationResult.isEligible ? (
                    <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-rose-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className={`text-sm font-bold ${evaluationResult.isEligible ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
                      {evaluationResult.isEligible ? 'Nominee is Constitutionally Eligible' : 'Nominee Ineligible for Office'}
                    </h4>
                    <p className={`text-xs ${evaluationResult.isEligible ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'} leading-relaxed`}>
                      {evaluationResult.isEligible
                        ? `The nominee satisfies all bylaws and tenure requirements for the position of ${evaluationResult.targetPosition}. You may proceed to submit their nomination proposal.`
                        : evaluationResult.reasons.join(" ")}
                    </p>
                    {evaluationResult.isEligible && (
                      <button
                        onClick={onProceedToApply}
                        className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                      >
                        Proceed to Propose This Candidate <ArrowRight size={13} />
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
  const [nomineePhoto, setNomineePhoto] = useState<string>(''); // base64 data URL

  const wordCount = purposeStatement.trim() ? purposeStatement.trim().split(/\s+/).length : 0;
  const isPurposeStatementSufficient = wordCount >= 15;

  // Real-time Participant Conflict Checks
  const isSelfNomination = proposer.email.toLowerCase().trim() === nominee.email.toLowerCase().trim();
  const isProposerSeconded = proposer.email.toLowerCase().trim() === seconder.email.toLowerCase().trim() && seconder.email.trim() !== '';
  const isNomineeSeconded = nominee.email.toLowerCase().trim() === seconder.email.toLowerCase().trim() && seconder.email.trim() !== '';
  const hasParticipantConflict = isSelfNomination || isProposerSeconded || isNomineeSeconded;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    if (isSelfNomination) {
      setErrorMsg("Self-nomination is strictly prohibited. You cannot propose yourself as a candidate.");
      return;
    }
    if (isProposerSeconded) {
      setErrorMsg("The Proposer cannot also act as the Seconder. You must provide a distinct eligible member as a Seconder.");
      return;
    }
    if (isNomineeSeconded) {
      setErrorMsg("The Nominee cannot second their own nomination. You must provide a distinct eligible member as a Seconder.");
      return;
    }

    if (!nomineePhoto || !nomineePhoto.trim()) {
      setErrorMsg("A recent passport-size photograph of the nominee is strictly required to submit this nomination proposal.");
      setFieldErrors(prev => ({
        ...prev,
        nomineePhoto: "Passport-size photograph of the nominee is required."
      }));
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
          nomineePhoto: nomineePhoto || null,
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
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6 relative z-10 pb-16"
    >
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Nominate an Alumni
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Submit a nomination for an eligible alumni candidate.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Mail size={24} />
            </div>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Awaiting Seconder Consent
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-1">
                Nomination Proposal Initiated
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 max-w-lg text-xs sm:text-sm leading-relaxed">
              You have initiated a nomination for <strong>{nominee.name}</strong> for the office of <strong>{targetPositions.join(", ")}</strong>.
            </p>

            {/* Explanatory Callout Box */}
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/50 max-w-lg text-left space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-semibold text-purple-950 dark:text-purple-200">
                    Seconding Notice Dispatched
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    An official email has been dispatched to <strong>{seconder.name}</strong> at <code className="bg-white/80 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-purple-700 dark:text-purple-300">{seconder.email}</code> asking for their willingness to be the seconding member.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-0.5">
                    ⚠ Note: The proposal is formally submitted to the Scrutiny Committee once the seconder accepts.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Candidate: <strong>{nominee.name}</strong> • Proposer: <strong>{proposer.name}</strong> • Seconder: <strong>{seconder.name}</strong>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-xs shadow-xs"
              >
                Propose Another Candidate
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2.5 shadow-xs">
                <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Section 1: Proposer Details */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  1. Proposer Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <FormFieldLabel label="Proposer full name" required={false} />
                  <input type="text" value={proposer.name} disabled className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed text-xs" />
                </div>
                <div>
                  <FormFieldLabel label="Proposer email" required={false} />
                  <input type="email" value={proposer.email} disabled className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed text-xs" />
                </div>
                <div>
                  <FormFieldLabel label="Department & batch" required={false} />
                  <input type="text" value={`${proposer.department} (Class of ${proposer.graduationYear})`} disabled className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed text-xs" />
                </div>
                <div>
                  <FormFieldLabel label="Proposer contact number" required={false} />
                  <input type="tel" value={proposer.phone} disabled className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed text-xs" />
                </div>
              </div>
            </div>

            {/* Section 2: Nominee Details */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  2. Nominee Information
                </h3>
              </div>

              {isSelfNomination && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} /> Self-nomination is strictly prohibited. You cannot propose your own email as nominee.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <FormFieldLabel label="Nominee alumni email" />
                    {isFetchingNominee && (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Verifying...
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
                      className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 pr-8 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${isSelfNomination || fieldErrors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      placeholder="nominee@alumni.org"
                    />
                    {isFetchingNominee && (
                      <Loader2 size={14} className="absolute right-2.5 top-3 animate-spin text-purple-600" />
                    )}
                  </div>
                  {nomineeLookupStatus?.found && (
                    <p className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium mt-1 flex items-center gap-1">
                      ✓ Alumni record found
                    </p>
                  )}
                  {fieldErrors.email && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <FormFieldLabel label="Nominee full name" />
                  <input
                    type="text"
                    value={nominee.name}
                    onChange={(e) => {
                      setNominee({ ...nominee, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    required
                    className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${fieldErrors.name ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    placeholder="Candidate's legal name"
                  />
                  {fieldErrors.name && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <FormFieldLabel label="Nominee contact number" />
                  <input
                    type="tel"
                    value={nominee.phone}
                    onChange={(e) => {
                      setNominee({ ...nominee, phone: e.target.value });
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                    required
                    className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${fieldErrors.phone ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    placeholder="+91..."
                  />
                  {fieldErrors.phone && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FormFieldLabel label="Department" />
                    <input
                      type="text"
                      value={nominee.department}
                      onChange={(e) => {
                        setNominee({ ...nominee, department: e.target.value });
                        if (fieldErrors.department) setFieldErrors({ ...fieldErrors, department: '' });
                      }}
                      required
                      className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${fieldErrors.department ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      placeholder="e.g. CSE"
                    />
                    {fieldErrors.department && (
                      <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1">
                        {fieldErrors.department}
                      </p>
                    )}
                  </div>
                  <div>
                    <FormFieldLabel label="Graduation year" />
                    <input
                      type="text"
                      value={nominee.graduationYear}
                      onChange={(e) => {
                        setNominee({ ...nominee, graduationYear: e.target.value });
                        if (fieldErrors.graduationYear) setFieldErrors({ ...fieldErrors, graduationYear: '' });
                      }}
                      required
                      className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${fieldErrors.graduationYear ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      placeholder="e.g. 2012"
                    />
                    {fieldErrors.graduationYear && (
                      <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1">
                        {fieldErrors.graduationYear}
                      </p>
                    )}
                  </div>
                </div>

                {/* Passport Photo Upload */}
                <div className="col-span-1 md:col-span-2 pt-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nominee passport photograph</span>
                    <span className="text-rose-500 text-xs">*</span>
                  </div>
                  <div className={`p-4 border-2 border-dashed rounded-xl transition-colors ${nomineePhoto
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10'
                      : fieldErrors.nomineePhoto
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/10'
                        : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}>
                    {nomineePhoto ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={nomineePhoto}
                          alt="Nominee passport photo"
                          className="w-16 h-20 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-xs flex-shrink-0"
                        />
                        <div className="flex flex-col justify-between">
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            ✓ Photo uploaded successfully
                          </p>
                          <button
                            type="button"
                            onClick={() => setNomineePhoto('')}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium mt-2 flex items-center gap-1 w-fit"
                          >
                            Remove & replace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full cursor-pointer text-center py-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5">
                          <User size={20} />
                        </div>
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Click to upload passport photo</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WebP • Max 2MB</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Photo must be under 2MB. Please compress and retry.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setNomineePhoto(ev.target?.result as string);
                              setFieldErrors(prev => {
                                const next = { ...prev };
                                delete next.nomineePhoto;
                                return next;
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {fieldErrors.nomineePhoto && (
                    <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {fieldErrors.nomineePhoto}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Office Bearer Position & Nominee's Qualifying Experience */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  3. Office Bearer Position & Qualifying Experience
                </h3>
              </div>

              <div>
                <FormFieldLabel label="Position proposing for" />
                <MultiSelectDropdown
                  options={ELECTION_POSITIONS}
                  selected={targetPositions}
                  onChange={(newPositions: string[]) => {
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <FormFieldLabel label="Nominee's qualifying responsibility role" />
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
                    className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${targetPositions.includes("President") && roleCategory !== "Office Bearer"
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-300 dark:border-slate-700"
                      }`}
                  >
                    {RESPONSIBILITY_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {targetPositions.includes("President") && roleCategory !== "Office Bearer" && (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1.5 font-medium">
                      <AlertCircle size={13} className="flex-shrink-0" />
                      <span>Ineligible for President (Requires Office Bearer experience)</span>
                    </div>
                  )}
                </div>
                <div>
                  <FormFieldLabel label="Nominee's unbroken service (Years in past 5 yrs)" />
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={continuousDuration}
                    onChange={(e) => setContinuousDuration(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <div>
                <FormFieldLabel label="Summary of nominee's continuous service" />
                <textarea
                  rows={2}
                  value={continuousDetails}
                  onChange={(e) => setContinuousDetails(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  placeholder="Specify committees, chapter, clubs, or bearer posts served continuously..."
                />
              </div>
            </div>

            {/* Section 4: Seconder Details */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  4. Seconder Information
                </h3>
              </div>

              {(isProposerSeconded || isNomineeSeconded) && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} /> 
                  {isProposerSeconded 
                    ? "The Proposer cannot second the nomination. Please provide a distinct eligible member." 
                    : "The Nominee cannot second their own nomination. Please provide a distinct eligible member."}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <FormFieldLabel label="Seconder alumni email" />
                    {isFetchingSeconder && (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Verifying...
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
                      className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3.5 py-2.5 pr-8 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 ${fieldErrors.seconderEmail || isProposerSeconded || isNomineeSeconded ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      placeholder="seconder@alumni.org"
                    />
                    {isFetchingSeconder && (
                      <Loader2 size={14} className="absolute right-2.5 top-3 animate-spin text-purple-600" />
                    )}
                  </div>
                  {seconderLookupStatus?.found && (
                    <p className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium mt-1 flex items-center gap-1">
                      ✓ Seconder record found
                    </p>
                  )}
                  {fieldErrors.seconderEmail && (
                    <p className="text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1">
                      {fieldErrors.seconderEmail}
                    </p>
                  )}
                </div>

                <div>
                  <FormFieldLabel label="Seconder full name" />
                  <input
                    type="text"
                    value={seconder.name}
                    onChange={(e) => setSeconder({ ...seconder, name: e.target.value })}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    placeholder="Seconder's legal name"
                  />
                </div>

                <div>
                  <FormFieldLabel label="Seconder contact number" />
                  <input
                    type="tel"
                    value={seconder.phone}
                    onChange={(e) => setSeconder({ ...seconder, phone: e.target.value })}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    placeholder="+91..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FormFieldLabel label="Department" />
                    <input
                      type="text"
                      value={seconder.department}
                      onChange={(e) => setSeconder({ ...seconder, department: e.target.value })}
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      placeholder="e.g. ECE"
                    />
                  </div>
                  <div>
                    <FormFieldLabel label="Graduation year" />
                    <input
                      type="text"
                      value={seconder.batch}
                      onChange={(e) => setSeconder({ ...seconder, batch: e.target.value })}
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      placeholder="e.g. 2014"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Purpose Statement */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <FormFieldLabel label="Purpose statement & citation" />
                <span className={`text-xs font-semibold ${wordCount >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {wordCount} words {wordCount < 15 && '(Min 15 required)'}
                </span>
              </div>
              <textarea
                rows={3}
                value={purposeStatement}
                onChange={(e) => setPurposeStatement(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                placeholder="Detail why this member is being proposed for office: Their meaningful contributions to the alumni association, track record, vision, and leadership..."
              />
            </div>

            {/* Section 6: Affirmation */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEndorsementDeclaration}
                  onChange={(e) => setHasEndorsementDeclaration(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  I solemnly affirm as an eligible registered alumni member that I am formally proposing <strong>{nominee.name || "the candidate"}</strong> with their consent, that all service records are unbroken without gap, and that we accept the official election decision as final and binding.
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <XCircle size={15} /> {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || hasParticipantConflict || !hasEndorsementDeclaration || targetPositions.length === 0 || !nomineePhoto}
              className={`w-full py-2.5 rounded-lg font-medium text-xs transition-colors shadow-xs ${!isSubmitting && !hasParticipantConflict && hasEndorsementDeclaration && targetPositions.length > 0 && !!nomineePhoto
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              {isSubmitting ? "Filing Nomination Proposal..." : "Submit Nomination Proposal"}
            </button>
            {!nomineePhoto && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium text-center mt-1 flex items-center justify-center gap-1">
                <AlertCircle size={13} /> Please upload the nominee's passport photograph above to submit this proposal.
              </p>
            )}
          </form>
        )}
      </div>
    </motion.div>
  );
};

// === Phase 4: Scrutiny Committee & Selection Process Screen ===

const ScrutinyCommitteeScreen = ({ token }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
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
    fetch(`http://localhost:5000/api/applications?status=${filter}&source=scrutiny`, {
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

  // Strict filter: only nominations with affirmative seconding and nominee willingness consent move to Scrutiny
  const validScrutinyApplications = applications.filter(app => {
    const isPreConsent =
      app.status === 'pending_seconding' ||
      app.status === 'seconding_declined' ||
      app.status === 'pending_nominee_consent' ||
      app.status === 'nominee_declined' ||
      app.seconderConsentStatus !== 'accepted' ||
      app.nomineeConsentStatus !== 'accepted';
    return !isPreConsent;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-16"
    >
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Scrutiny Panel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and verify submitted candidate proposals against official eligibility criteria.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 w-fit">
            Statutory Committee
          </span>
        </div>
      </div>

      {/* Filter Toolbar & Submissions Table/List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex flex-wrap gap-1.5 items-center">
            {[
              { id: 'pending', label: 'Pending Scrutiny' },
              { id: 'all', label: 'All Submissions' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'withdrawn', label: 'Withdrawn' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === tab.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setConfirmDeleteModal(true)}
            disabled={isDeletingNonApproved}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            title="Clear rejected and withdrawn logs (keeps pending and approved)"
          >
            <Trash2 size={13} />
            Clear Inactive Logs
          </button>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600"></div>
          </div>
        ) : validScrutinyApplications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <UserCheck size={24} />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">No proposals found under this filter</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Submitted nomination proposals will appear here for scrutiny once both seconder and nominee have accepted.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {validScrutinyApplications.map((app) => (
              <div key={app._id} className="p-5 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-5">
                  <div className="space-y-3.5 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {app.nomineePhoto ? (
                        <img
                          src={app.nomineePhoto}
                          alt={app.name}
                          className="w-12 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                          <User size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">{app.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${app.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                              app.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                app.status === 'withdrawn' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                                  'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                            {app.status === 'approved' ? '✓ Scrutiny Passed' : app.status === 'pending' ? 'Pending Review' : app.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {app.targetPositions?.map((pos: string) => (
                            <span key={pos} className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                              {pos}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Mail size={13} className="text-purple-600" /> {app.nomineeEmail || app.applicantEmail}</span>
                      <span className="flex items-center gap-1.5"><Compass size={13} className="text-purple-600" /> {app.department} • Batch of {app.graduationYear}</span>
                    </div>

                    {/* Qualifications & Proposer Box */}
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                        <span><strong>Service Category:</strong> {app.roleCategory || 'Office Bearer'}</span>
                        <span><strong>Continuous Service:</strong> {app.continuousService?.years || 1}+ yrs (unbroken)</span>
                      </div>

                      {/* Explicit Proposer & Seconder Distinction */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="p-2.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Proposed By:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{app.proposer?.name || "N/A"}</span>
                          <span className="text-slate-400 text-[11px] block">{app.proposer?.email || app.proposerEmail}</span>
                        </div>
                        <div className="p-2.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Seconded By:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{app.seconder?.name || "N/A"}</span>
                          <span className="text-slate-400 text-[11px] block">{app.seconder?.email || "N/A"}</span>
                        </div>
                      </div>

                      {app.purposeStatement && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 font-medium block mb-1 text-[11px]">Proposer's Citation & Purpose Statement:</span>
                          <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
                            "{app.purposeStatement}"
                          </p>
                        </div>
                      )}

                      {app.scrutinyDetails && (
                        <div className="mt-2 p-2.5 rounded-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-300 text-xs">
                          <span className="font-semibold block">Committee Endorsement:</span>
                          <p className="mt-0.5">{app.scrutinyDetails.committeeRemarks}</p>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1">
                            Evaluated by: {app.scrutinyDetails.evaluatedBy}
                          </span>
                        </div>
                      )}

                      {app.withdrawn && (
                        <div className="mt-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-xs">
                          <strong>Withdrawn:</strong> {app.withdrawalReason || "Withdrawn prior to publication of final roll."}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                    {app.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setCommitteeRemarks('');
                        }}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ListChecks size={14} /> Scrutinize
                      </button>
                    )}

                    {app.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setCommitteeRemarks(app.scrutinyDetails?.committeeRemarks || '');
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-300 font-medium text-xs rounded-lg border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1.5 transition-colors"
                        title="Re-evaluate and reject this approved proposal"
                      >
                        <XCircle size={14} /> Reject Proposal
                      </button>
                    )}

                    {app.status === 'rejected' && (
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setCommitteeRemarks(app.scrutinyDetails?.committeeRemarks || '');
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RefreshCw size={13} /> Re-scrutinize
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl relative my-auto overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {selectedApp.nomineePhoto ? (
                    <img
                      src={selectedApp.nomineePhoto}
                      alt={selectedApp.name}
                      className="w-11 h-13 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-13 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-slate-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Official Scrutiny</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedApp.name}</h3>
                    <p className="text-xs text-slate-500">Proposed by: {selectedApp.proposer?.name} • Position: {selectedApp.targetPositions?.join(", ")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="Close"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Eligibility Checklist
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
                    <label key={idx} className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                      />
                      <span>{crit}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Committee Remarks / Observations
                  </label>
                  <textarea
                    rows={3}
                    value={committeeRemarks}
                    onChange={(e) => setCommitteeRemarks(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    placeholder="Official finding of the Scrutiny Committee..."
                  />
                </div>

                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] text-purple-800 dark:text-purple-300">
                  <strong>Notice:</strong> The decision of this Committee is final and binding on all candidates per bylaws.
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row gap-2 justify-end items-center">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="w-full sm:w-auto py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleScrutinyDecision(selectedApp._id, 'rejected')}
                  className="w-full sm:w-auto py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <XCircle size={14} />
                  {selectedApp.status === 'approved' ? 'Revoke & Reject' : 'Reject Proposal'}
                </button>
                <button
                  type="button"
                  onClick={() => handleScrutinyDecision(selectedApp._id, 'approved')}
                  className="w-full sm:w-auto py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 size={14} />
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clear Inactive Logs</h3>
                    <p className="text-xs text-slate-500">Only removes rejected & withdrawn records</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This action will delete all <strong>rejected</strong> and <strong>withdrawn</strong> nomination proposal records. <strong>Pending proposals and approved candidates will be retained.</strong>
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteModal(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearRejectedAndWithdrawn}
                  disabled={isDeletingNonApproved}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isDeletingNonApproved ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Clearing...
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

  const handleNomineeConsent = async (applicationId: string, decision: 'accept' | 'decline') => {
    setIsProcessingConsent(applicationId);
    try {
      const res = await fetch('http://localhost:5000/api/nominations/nominee-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, decision })
      });
      if (res.ok) {
        fetchMyApplications();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update nominee consent");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating nominee consent");
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-16 max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Nominations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track candidate proposals, nominations, and seconding requests.
          </p>
        </div>
        <button
          onClick={onProceedToApply}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus size={14} /> Propose Candidate
        </button>
      </div>

      {/* Toggle View: Proposed by Me vs Where I am Nominated vs Seconding Requests */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setNominationView('proposed_by_me')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${nominationView === 'proposed_by_me'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
        >
          Nominations I Proposed
        </button>
        <button
          onClick={() => setNominationView('nominated_me')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${nominationView === 'nominated_me'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
        >
          Nominations Where I am the Candidate
        </button>
        <button
          onClick={() => setNominationView('seconded_by_me')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${nominationView === 'seconded_by_me'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
            }`}
        >
          <ShieldCheck size={13} /> Seconding Requests & Consents
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-16 flex items-center justify-center shadow-xs">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <FileText size={24} />
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
            {nominationView === 'proposed_by_me'
              ? "You haven't proposed any candidates yet."
              : nominationView === 'nominated_me'
                ? "No nominations proposing you have been filed yet."
                : "No seconding requests have been sent to you."}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {nominationView === 'proposed_by_me'
              ? "Click 'Propose Candidate' to submit an eligible member's nomination."
              : nominationView === 'nominated_me'
                ? "When an eligible alumni member proposes you, the nomination record will appear here."
                : "When an alumni member designates you as a seconder, the request will appear here for your consent."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const isPendingSeconding = app.status === 'pending_seconding' || (app.seconderConsentStatus === 'pending' && app.status === 'pending_seconding');
            const isSecondingDeclined = app.status === 'seconding_declined' || (app.seconderConsentStatus === 'declined' && app.status === 'seconding_declined');
            const isSecondingAccepted = app.seconderConsentStatus === 'accepted';
            const isPendingNomineeConsent = app.status === 'pending_nominee_consent';
            const isNomineeDeclined = app.status === 'nominee_declined';
            const isNomineeAccepted = app.nomineeConsentStatus === 'accepted';

            return (
              <div key={app._id} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3.5">
                    {app.nomineePhoto ? (
                      <img
                        src={app.nomineePhoto}
                        alt={app.name}
                        className="w-12 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {app.targetPositions?.join(', ')}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        Nominee: {app.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Clock size={12} /> Filed on {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold
                      ${app.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                        app.status === 'withdrawn' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                          app.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                            isPendingSeconding ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                              isSecondingDeclined ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                                isPendingNomineeConsent ? 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                                  isNomineeDeclined ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                                    'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'}`}
                    >
                      {app.status === 'approved' ? '✓ Scrutiny Passed' :
                        isPendingSeconding ? '⏳ Seconder Pending' :
                          isSecondingDeclined ? '✕ Seconding Declined' :
                            isPendingNomineeConsent ? '⏳ Nominee Consent Pending' :
                              isNomineeDeclined ? '✕ Nominee Declined' :
                                isNomineeAccepted && app.status === 'pending' ? '✓ In Scrutiny' :
                                  app.status}
                    </span>
                  </div>
                </div>

                {/* Proposer & Seconder Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <span className="font-semibold text-slate-500 block mb-0.5 text-[10px] uppercase tracking-wider">Proposed By:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{app.proposer?.name || "N/A"}</p>
                    <p className="text-slate-500 text-[11px]">{app.proposer?.email || app.proposerEmail}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <span className="font-semibold text-slate-500 block mb-0.5 text-[10px] uppercase tracking-wider">Seconded By:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{app.seconder?.name || "N/A"}</p>
                    <p className="text-slate-500 text-[11px]">{app.seconder?.email || app.seconderEmail || "N/A"}</p>
                  </div>
                </div>

                {/* Nominee In-App Action Callout */}
                {nominationView === 'nominated_me' && isPendingNomineeConsent && (
                  <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2.5">
                    <div className="flex items-start gap-2 text-xs text-purple-900 dark:text-purple-200 font-medium">
                      <AlertCircle size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Your Consent is Required to Stand as Candidate:</p>
                        <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                          You have been proposed and seconded. The nomination will be submitted for scrutiny once you confirm your willingness.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-xs space-y-1 border border-purple-100 dark:border-purple-900/40">
                      <p><span className="text-slate-500">Position:</span> <span className="font-semibold text-purple-700 dark:text-purple-300">{app.targetPositions?.join(', ')}</span></p>
                      <p><span className="text-slate-500">Proposed By:</span> <span className="font-semibold">{app.proposer?.name}</span> ({app.proposer?.email || app.proposerEmail})</p>
                      <p><span className="text-slate-500">Seconded By:</span> <span className="font-semibold">{app.seconder?.name}</span> ({app.seconder?.email || app.seconderEmail}) <span className="text-emerald-600 font-semibold ml-1">✓ Consented</span></p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        disabled={isProcessingConsent === app._id}
                        onClick={() => handleNomineeConsent(app._id, 'accept')}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                      >
                        ✓ Accept Nomination
                      </button>
                      <button
                        disabled={isProcessingConsent === app._id}
                        onClick={() => handleNomineeConsent(app._id, 'decline')}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}

                {nominationView === 'nominated_me' && isNomineeAccepted && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>You have accepted this nomination. It has been formally submitted to the Election Scrutiny Committee.</span>
                  </div>
                )}

                {nominationView === 'nominated_me' && isNomineeDeclined && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                    <XCircle size={15} className="text-rose-600" />
                    <span>You declined this nomination. The proposal was not submitted per election bylaws.</span>
                  </div>
                )}

                {/* Seconder In-App Action Callout */}
                {nominationView === 'seconded_by_me' && isPendingSeconding && (
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2.5">
                    <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
                      <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Your Consent as Seconding Member is Required:</p>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                          Under association election bylaws, this nomination proposal will only be submitted to the Scrutiny Committee once you confirm your willingness to second it.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        disabled={isProcessingConsent === app._id}
                        onClick={() => handleSecondingConsent(app._id, 'accept')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                      >
                        ✓ Accept & Second Nomination
                      </button>
                      <button
                        disabled={isProcessingConsent === app._id}
                        onClick={() => handleSecondingConsent(app._id, 'decline')}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}

                {nominationView === 'seconded_by_me' && isSecondingAccepted && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>You accepted and seconded this nomination. {isPendingNomineeConsent ? 'Awaiting the nominee\'s consent before submission.' : isNomineeAccepted ? 'The nominee also accepted — submitted to Scrutiny Committee.' : ''}</span>
                  </div>
                )}

                {nominationView === 'seconded_by_me' && isSecondingDeclined && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                    <XCircle size={15} className="text-rose-600" />
                    <span>You declined to second this nomination. In accordance with bylaws, the proposal was not submitted.</span>
                  </div>
                )}

                {/* Proposer Status Notice */}
                {nominationView === 'proposed_by_me' && isPendingSeconding && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <Clock size={15} className="text-amber-600 flex-shrink-0" />
                    <span>
                      Awaiting seconding consent from <strong>{app.seconder?.name}</strong> ({app.seconder?.email || app.seconderEmail}).
                    </span>
                  </div>
                )}

                {nominationView === 'proposed_by_me' && isPendingNomineeConsent && (
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-lg text-xs text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                    <Clock size={15} className="text-purple-600 flex-shrink-0" />
                    <span>
                      Seconding confirmed by <strong>{app.seconder?.name}</strong>. Now awaiting <strong>{app.nominee?.name || app.name}</strong>'s consent.
                    </span>
                  </div>
                )}

                {nominationView === 'proposed_by_me' && isSecondingDeclined && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg text-xs text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                    <XCircle size={15} className="text-rose-600 flex-shrink-0" />
                    <span>
                      The designated seconder (<strong>{app.seconder?.name}</strong>) declined to second this nomination.
                    </span>
                  </div>
                )}

                {app.purposeStatement && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-semibold text-slate-500 block mb-1 text-[11px]">Purpose Statement:</span>
                    <p className="italic">"{app.purposeStatement}"</p>
                  </div>
                )}

                {app.scrutinyDetails && (
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-lg text-xs text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <span className="font-semibold block">Scrutiny Committee Finding:</span>
                    <p>{app.scrutinyDetails.committeeRemarks}</p>
                  </div>
                )}

                {/* Withdrawal Option Section */}
                {app.status !== 'withdrawn' && app.status !== 'rejected' && app.status !== 'pending_seconding' && app.status !== 'seconding_declined' && app.status !== 'pending_nominee_consent' && app.status !== 'nominee_declined' && (
                  <div className="pt-2 flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      Candidate withdrawal window is open until <strong>October 14, 2026</strong>.
                    </span>
                    <button
                      onClick={() => setWithdrawTarget(app)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 w-fit"
                    >
                      <Undo2 size={13} /> Withdraw Nomination
                    </button>
                  </div>
                )}

                {app.status === 'withdrawn' && (
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Withdraw Nomination</h3>
                  <p className="text-xs text-slate-500">Nominee: {withdrawTarget.name} ({withdrawTarget.targetPositions?.join(", ")})</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-200/60 dark:border-rose-800/40">
                In accordance with election bylaws, a withdrawal option is provided prior to the publication of the final contestant list. Once confirmed, the candidate's name will be permanently struck from the ballot.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Withdrawal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  placeholder="e.g. Nominee personal commitments, endorsement of another candidate..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setWithdrawTarget(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmWithdrawal}
                  disabled={isWithdrawing}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
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

const FinalCandidateListScreen = ({ isAdmin, token }: { isAdmin: boolean; token: string }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [positionFilter, setPositionFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const fetchFinalList = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/elections/final-list?position=${encodeURIComponent(positionFilter)}`)
      .then(res => res.json())
      .then(data => {
        setCandidates(data.candidates || []);
        setIsPublished(data.isPublished || false);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handlePublish = async () => {
    if (!window.confirm("Are you sure you want to publish the final candidate list?")) return;
    setPublishing(true);
    try {
      const res = await fetch('http://localhost:5000/api/elections/publish-final-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ electionYear: '2026', appUrl: window.location.origin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPublished(true);
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 5000);
      } else {
        alert("Failed to publish: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while publishing.");
    } finally {
      setPublishing(false);
    }
  };

  const handleNotifyAlumni = async () => {
    if (!window.confirm("Are you sure you want to notify all alumni?")) return;
    setNotifying(true);
    try {
      const res = await fetch('http://localhost:5000/api/elections/notify-final-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ electionYear: '2026', appUrl: window.location.origin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifySuccess(true);
        setTimeout(() => setNotifySuccess(false), 5000);
      } else {
        alert("Failed to notify alumni: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending notifications.");
    } finally {
      setNotifying(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm("Are you sure you want to hide the final list from alumni?")) return;
    try {
      const res = await fetch('http://localhost:5000/api/elections/unpublish-final-list', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setIsPublished(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFinalList();
  }, [positionFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-16"
    >
      {/* Official Certified Seal Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Final Candidate List
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Certified list of eligible candidates for the upcoming election.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 w-fit">
            Certified Roll
          </span>
        </div>

        {/* Publish Action for Admin */}
        {isAdmin && !isPublished && (
          <div className="mt-5 p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-xs text-amber-900 dark:text-amber-200">Action Required: Publish Final List</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">The final list is currently hidden from alumni members.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {publishing ? <><Loader2 size={13} className="animate-spin" /> Publishing...</> : <><Globe size={13} /> Publish Final List</>}
              </button>
              <button
                onClick={handleNotifyAlumni}
                disabled={notifying}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {notifying ? <><Loader2 size={13} className="animate-spin" /> Notifying...</> : <><Send size={13} /> Notify Alumni</>}
              </button>
            </div>
          </div>
        )}

        {isAdmin && isPublished && (
          <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200">Final List is Public</h3>
              <p className="text-xs text-slate-500 mt-0.5">All registered alumni members can view this candidate roll.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleNotifyAlumni}
                disabled={notifying}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {notifying ? <><Loader2 size={13} className="animate-spin" /> Notifying...</> : <><Send size={13} /> Notify Alumni</>}
              </button>
              <button
                onClick={handleUnpublish}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <EyeOff size={13} /> Lock Page View
              </button>
            </div>
          </div>
        )}

        {publishSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <Check size={16} /> Final list successfully published!
          </div>
        )}

        {notifySuccess && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <Check size={16} /> Alumni notified successfully!
          </div>
        )}
      </div>

      {/* Filter by Office Bearer Position */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['All', ...ELECTION_POSITIONS].map(pos => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${positionFilter === pos
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium self-end sm:self-auto">
          Showing {candidates.length} Certified Candidate{candidates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-16 flex items-center justify-center shadow-xs">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600"></div>
        </div>
      ) : (!isPublished && !isAdmin) ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <EyeOff size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Final List Not Yet Published</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            The Scrutiny Committee is finalizing the candidates list. Please check back later or await the official broadcast.
          </p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Final Candidates Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Nomination proposals are currently being verified or there are no candidates under this position.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((cand) => (
            <motion.div
              key={cand._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-3">
                {/* Photo + position header */}
                <div className="flex items-center gap-3.5">
                  {cand.nomineePhoto ? (
                    <img
                      src={cand.nomineePhoto}
                      alt={cand.name}
                      className="w-13 h-15 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-13 h-15 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <User size={22} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded border border-purple-200/60 dark:border-purple-800/60">
                        {cand.targetPositions?.[0] || 'Office Bearer'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        ✓ Verified
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{cand.name}</h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Compass size={12} className="text-purple-600" /> {cand.department} • Class of {cand.graduationYear}
                      </p>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Responsibility:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cand.roleCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service Tenure:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cand.continuousService?.years || 1}+ Years</span>
                      </div>
                      {cand.proposer?.name && (
                        <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500">Proposed by:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{cand.proposer.name}</span>
                        </div>
                      )}
                    </div>

                    {cand.purposeStatement && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                        <span className="font-semibold not-italic text-slate-400 block mb-0.5 text-[10px] uppercase">Purpose & Citation:</span>
                        "{cand.purposeStatement.length > 120 ? cand.purposeStatement.slice(0, 120) + "..." : cand.purposeStatement}"
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Certified Candidate</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Ballot #2026</span>
                    </div>
                  </>
                )}
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
    <div className="space-y-6 relative z-10">
      {/* Header Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-7"
      >
        {isAdmin ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Election Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monitor proposals, scrutiny, candidates and election activities.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => onNavigate('announcements')}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Megaphone size={14} /> Announcements
              </button>
              <button
                onClick={() => onNavigate('scrutiny')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ShieldAlert size={14} /> Scrutiny Panel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome, {userProfile?.name?.split(' ')[0] || 'Alumni Member'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Access election notices, verify eligibility, propose nominees, and view certified candidate rolls.
              </p>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs w-fit"
            >
              <Megaphone size={14} /> Announcements
            </button>
          </div>
        )}
      </motion.div>

      {/* Metrics Row - Only visible to Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Filed Proposals', value: stats.total, icon: Users, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-950/50' },
            { label: 'Scrutiny Passed / Approved', value: stats.approved, icon: CheckCircle2, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-950/50' },
            { label: 'Pending Committee Review', value: stats.pending, icon: Clock, iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-950/50' },
            { label: 'Withdrawn / Rejected', value: (stats.rejected || 0) + (stats.withdrawn || 0), icon: XCircle, iconColor: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-50 dark:bg-rose-950/50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * (i + 1) }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  <AnimatedCounter value={stat.value} />
                </h3>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} ${stat.iconColor} flex items-center justify-center flex-shrink-0`}>
                <stat.icon size={20} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Role-Specific Quick Access Modules */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('announcements')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Megaphone size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Announcements & Broadcast</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Manage official election notifications and gazette broadcasts.
            </p>
          </div>

          <div
            onClick={() => onNavigate('scrutiny')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Scrutiny Panel</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Review and verify submitted candidate proposals against bylaws.
            </p>
          </div>

          <div
            onClick={() => onNavigate('finalList')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Award size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Final Candidate Roll</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              View certified election candidates and publish to portal.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('announcements')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Megaphone size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Official Announcements</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Read certified election gazette notices and schedules.
            </p>
          </div>

          <div
            onClick={() => onNavigate('eligibility')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <ClipboardCheck size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Eligibility Evaluator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Verify nominee eligibility criteria before proposing.
            </p>
          </div>

          <div
            onClick={() => onNavigate('apply')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <UserPlus size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Propose a Candidate</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Submit a nomination proposal and assign an eligible seconder.
            </p>
          </div>

          <div
            onClick={() => onNavigate('applications')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <FolderOpen size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">My Nominations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track your proposals, candidate consents, and seconding requests.
            </p>
          </div>

          <div
            onClick={() => onNavigate('finalList')}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-xs transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <Award size={20} />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Final Candidate Roll</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              View the certified list of eligible candidates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// === EC Screen ===

const ECScreen = ({ onNavigate }: any) => {
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/announcements/latest')
      .then(res => res.json())
      .then(data => {
        if (data && data.title) {
          setAnnouncement(data);
        }
      })
      .catch(err => console.error("Error fetching announcement:", err));
  }, []);

  const formatDateDisplay = (dateStr: string, fallback: string) => {
    if (!dateStr) return fallback;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-20"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Executive Committee Panel</h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Official election timetable, milestones and administrative controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays size={18} className="text-purple-600" /> Election Timelines & Milestones
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">AGM Conclave Date:</span>
              <span className="font-semibold text-slate-800 dark:text-white">{formatDateDisplay(announcement?.agmDate, 'October 25, 2026')} (10:00 AM)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">1-Month Notice Published:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatDateDisplay(announcement?.nominationStartDate, 'September 10, 2026')} (Compliant)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Nomination Proposals Close:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{formatDateDisplay(announcement?.nominationDeadline, 'September 30, 2026')}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Withdrawal Window:</span>
              <span className="font-semibold text-slate-800 dark:text-white">Ends {formatDateDisplay(announcement?.withdrawalDeadline, 'October 14, 2026')}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Final List Certified:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">{formatDateDisplay(announcement?.finalListDate, 'October 18, 2026')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase size={18} className="text-purple-600" /> Administrative Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => onNavigate('scrutiny')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-800/50 transition-colors flex flex-col items-center justify-center text-center group"
            >
              <ShieldAlert size={20} className="text-purple-600 mb-2 group-hover:scale-105 transition-transform" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Scrutiny Panel</span>
            </button>
            <button
              onClick={() => onNavigate('finalList')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors flex flex-col items-center justify-center text-center group"
            >
              <Award size={20} className="text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Final Candidate Roll</span>
            </button>
            <button
              onClick={() => onNavigate('announcements')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-800/50 transition-colors flex flex-col items-center justify-center text-center col-span-2 group"
            >
              <Megaphone size={20} className="text-purple-600 mb-2 group-hover:scale-105 transition-transform" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Official Announcements & Gazette</span>
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
    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
    className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10"
  >
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/90 dark:border-slate-800 relative">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 shadow-xs">
          <img src={necLogo} alt="NEC Alumni Association Logo" className="w-full h-full object-contain" />
        </div>
        <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
          National Engineering College
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Alumni Association Elections
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{subtitle}</p>}
      </div>
      {children}
    </div>
  </motion.div>
);


// ============================================================
// VOTING SCREEN — Admin Control Panel + Alumni Ballot
// ============================================================
const VotingScreen = ({ isAdmin, token, userProfile }: any) => {
  const [votingStatus, setVotingStatus] = useState<string>('not_started');
  const [announcement, setAnnouncement] = useState<any>(null);
  const [ballot, setBallot] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<any>({ votes: [], votedPositions: [], allVoted: false, ballotSealed: false });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [castingPosition, setCastingPosition] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const API = 'http://localhost:5000/api';

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, ballotRes, myVotesRes, announcementRes] = await Promise.all([
        fetch(`${API}/elections/voting/status`, { headers }).then(r => r.json()),
        token ? fetch(`${API}/elections/voting/ballot`, { headers }).then(r => r.json()).catch(() => ({ ballot: [] })) : Promise.resolve({ ballot: [] }),
        token && !isAdmin ? fetch(`${API}/elections/voting/my-votes`, { headers }).then(r => r.json()).catch(() => ({ votes: [], votedPositions: [], allVoted: false })) : Promise.resolve({ votes: [], votedPositions: [], allVoted: false }),
        fetch(`${API}/announcements`).then(r => r.json()).catch(() => ({}))
      ]);
      setVotingStatus(statusRes.status || 'not_started');
      setStatusInfo(statusRes);
      setBallot(ballotRes.ballot || []);
      setMyVotes(myVotesRes);
      setAnnouncement(announcementRes.announcement || null);
      if (isAdmin) {
        try {
          const resRes = await fetch(`${API}/elections/voting/results`, { headers });
          if (resRes.ok) setResults(await resRes.json());
        } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [token, isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openVoting = async () => {
    if (!confirm('Open voting? This will enable live ballots for alumni to cast their votes. Continue?')) return;
    setActionLoading('open');
    try {
      const res = await fetch(`${API}/elections/voting/open`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ skipBroadcast: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`✅ ${data.message}\n\nYou can broadcast announcement emails to alumni anytime using the "Notify Alumni" button.`);
      fetchAll();
    } catch (err: any) { alert('❌ ' + err.message); }
    finally { setActionLoading(null); }
  };

  const notifyAlumni = async () => {
    if (!confirm('Broadcast "Voting is Live" announcement email to ALL registered alumni members? Continue?')) return;
    setActionLoading('notify');
    try {
      const res = await fetch(`${API}/elections/voting/notify-alumni`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`✅ ${data.message}`);
      fetchAll();
    } catch (err: any) { alert('❌ ' + err.message); }
    finally { setActionLoading(null); }
  };

  const closeVoting = async () => {
    if (!confirm('Close voting? This action will end the voting period. No more votes can be cast.')) return;
    setActionLoading('close');
    try {
      const res = await fetch(`${API}/elections/voting/close`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('✅ ' + data.message);
      fetchAll();
    } catch (err: any) { alert('❌ ' + err.message); }
    finally { setActionLoading(null); }
  };

  const sendReminder = async () => {
    if (!confirm('Send 2-day election reminder email to ALL alumni members?')) return;
    setActionLoading('reminder');
    try {
      const res = await fetch(`${API}/elections/voting/send-reminder`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`✅ ${data.message}`);
      fetchAll();
    } catch (err: any) { alert('❌ ' + err.message); }
    finally { setActionLoading(null); }
  };

  const clearAllVotes = async () => {
    if (!window.confirm("WARNING (TEST MODE): Are you absolutely sure you want to clear ALL votes from the database? This cannot be undone!")) return;
    setActionLoading('clear');
    try {
      const res = await fetch(`${API}/elections/voting/clear-all-votes`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`✅ ${data.message}`);
      fetchAll();
    } catch (err: any) { alert('❌ ' + err.message); }
    finally { setActionLoading(null); }
  };

  const castVote = async (position: string, candidateId: string) => {
    if (!confirm(`Cast your vote for this candidate in the ${position} position? This action is FINAL and cannot be undone.`)) return;
    setCastingPosition(position);
    try {
      const res = await fetch(`${API}/elections/voting/cast`, {
        method: 'POST', headers,
        body: JSON.stringify({ position, candidateId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.ballotSealed) {
        alert('🎉 All votes cast! Your ballot is now sealed. A confirmation email has been sent to your registered email address.');
      }
      fetchAll();
    } catch (err: any) { alert('❌ ' + err.message); }
    finally { setCastingPosition(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-3 text-sm text-slate-500">Loading voting system...</span>
      </div>
    );
  }

  // ALUMNI: Ballot Sealed / Locked Screen
  if (!isAdmin && myVotes.ballotSealed) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-7 md:p-8 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/60">
            <Lock size={26} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Ballot Successfully Sealed</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            You have cast your votes across all <strong>6 Executive Office Bearer positions</strong>.
            Your ballot has been securely sealed and registered. A confirmation receipt has been dispatched to your registered alumni email address.
          </p>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {myVotes.votes?.map((v: any) => (
                <div key={v.position} className="flex items-center space-x-2 bg-white dark:bg-slate-800/80 rounded-lg p-2.5 shadow-xs border border-emerald-100/80 dark:border-emerald-900/40">
                  <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{v.position}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">For constitutional ballot secrecy, individual candidate selections are strictly protected.</p>
        </div>
      </motion.div>
    );
  }

  // ADMIN: Control Panel + Results
  if (isAdmin) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Voting Control Panel
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live ballot controls, voter turnout metrics, and certified election tallies.
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide inline-flex items-center gap-1.5 ${
            votingStatus === 'live'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : votingStatus === 'closed'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              votingStatus === 'live' ? 'bg-emerald-500 animate-pulse' : votingStatus === 'closed' ? 'bg-rose-500' : 'bg-slate-400'
            }`} />
            {votingStatus === 'live' ? 'Voting Live' : votingStatus === 'closed' ? 'Voting Closed' : 'Not Started'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Administrative Actions</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            {votingStatus !== 'live' && (
              <button onClick={openVoting} disabled={!!actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                {actionLoading === 'open' ? <Loader2 size={13} className="animate-spin" /> : <Activity size={13} />}
                <span>{votingStatus === 'closed' ? 'Reopen Voting' : 'Open Voting'}</span>
              </button>
            )}
            {votingStatus === 'live' && (
              <button onClick={closeVoting} disabled={!!actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2">
                {actionLoading === 'close' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                <span>Close Voting</span>
              </button>
            )}
            <button onClick={notifyAlumni} disabled={!!actionLoading || votingStatus !== 'live'}
              title={votingStatus !== 'live' ? 'Open voting first before notifying alumni' : 'Broadcast "Voting is Live" announcement to all alumni'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {actionLoading === 'notify' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>Notify Alumni</span>
            </button>
            <button onClick={sendReminder} disabled={!!actionLoading || votingStatus !== 'live'}
              title={votingStatus !== 'live' ? 'Voting must be live to send reminder' : 'Send 2-day reminder email to all alumni'}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              {actionLoading === 'reminder' ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
              <span>Send 2-Day Reminder</span>
            </button>
            <button onClick={fetchAll} disabled={!!actionLoading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2 border border-slate-200/80 dark:border-slate-700">
              <RefreshCw size={13} /><span>Refresh</span>
            </button>
            <button onClick={clearAllVotes} disabled={!!actionLoading}
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2 border border-rose-200 dark:border-rose-800/60 ml-auto">
              {actionLoading === 'clear' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              <span>Reset Votes (Test Mode)</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[11px] text-slate-400">
            {statusInfo?.notifyLiveSentAt && (
              <span>Last broadcast: {new Date(statusInfo.notifyLiveSentAt).toLocaleString()}</span>
            )}
            {statusInfo?.reminderSentAt && (
              <span>Last reminder: {new Date(statusInfo.reminderSentAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Votes', value: results.totalVotesCast, icon: Activity, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
                { label: 'Unique Voters', value: results.uniqueVoters, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
                { label: 'Total Alumni', value: results.totalAlumni, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
                { label: 'Turnout', value: `${results.turnoutPercent}%`, icon: Award, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}><s.icon size={17} /></div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 font-medium truncate">{s.label}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.results?.map((pos: any) => (
                <div key={pos.position} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{pos.position}</h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">{pos.totalVotes} vote{pos.totalVotes !== 1 ? 's' : ''}</span>
                  </div>
                  {pos.candidates?.length > 0 ? pos.candidates.map((c: any, i: number) => {
                    const pct = pos.totalVotes > 0 ? Math.round((c.votes / pos.totalVotes) * 100) : 0;
                    const isWinner = pos.winner && pos.winner.candidateId === c.candidateId;
                    return (
                      <div key={c.candidateId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold ${isWinner ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {isWinner && '🏆 '}{c.candidateName}
                          </span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">{c.votes} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${isWinner ? 'bg-emerald-500' : i === 1 ? 'bg-purple-500' : 'bg-slate-400'}`}
                          />
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-slate-400 italic">No votes yet</p>
                  )}
                  {pos.isTied && (
                    <div className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      <AlertTriangle size={12} /><span>Tied — Manual Resolution Required</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ALUMNI: Voting Not Live
  if (votingStatus === 'not_started') {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <Clock size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Voting Has Not Started</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The online voting portal will be activated by the Election Commission on <strong>{announcement?.electionDate ? new Date(announcement.electionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'election day'}</strong>. You will receive an official notification when voting opens.
          </p>
        </div>
      </motion.div>
    );
  }

  if (votingStatus === 'closed') {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
            <XCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Voting Has Ended</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">The voting period for this election cycle has officially concluded. Certified results will be published by the Election Commission.</p>
        </div>
      </motion.div>
    );
  }

  // ALUMNI: Active Ballot
  const votedPositions = myVotes.votedPositions || [];
  const totalVoted = votedPositions.length;
  const totalPositions = 6;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Cast Your Vote</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Select one candidate for each position. Once submitted, selections are final and cannot be altered.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Voting Progress</span>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{totalVoted} of {totalPositions} positions completed</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalVoted / totalPositions) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-purple-600 rounded-full"
          />
        </div>
      </div>

      {ballot.map((posGroup: any) => {
        const hasVoted = votedPositions.includes(posGroup.position);
        const myVote = myVotes.votes?.find((v: any) => v.position === posGroup.position);

        return (
          <div key={posGroup.position} className={`bg-white dark:bg-slate-900 border ${hasVoted ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-slate-200/90 dark:border-slate-800'} rounded-xl p-5 space-y-4 shadow-xs`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award size={18} className={hasVoted ? 'text-emerald-600' : 'text-purple-600'} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{posGroup.position}</h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">1 Post</span>
              </div>
              {hasVoted && (
                <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span className="text-xs font-semibold">Vote Recorded</span>
                </div>
              )}
            </div>

            {hasVoted && myVote ? (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-200/70 dark:border-emerald-800/30 flex items-center space-x-2">
                <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  You voted for: <strong>{myVote.candidateName}</strong>
                </span>
              </div>
            ) : posGroup.candidates?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No candidates standing for this position</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {posGroup.candidates?.map((candidate: any) => (
                  <div key={candidate._id} className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3 shadow-xs hover:border-purple-300 dark:hover:border-purple-700/60 transition-colors">
                    <div className="flex items-start space-x-3">
                      {candidate.photo ? (
                        <img src={candidate.photo} alt={candidate.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
                          <User size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">{candidate.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{candidate.department} • {candidate.graduationYear}</p>
                        {candidate.roleCategory && (
                          <span className="inline-block text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-medium mt-1">{candidate.roleCategory}</span>
                        )}
                      </div>
                    </div>
                    {candidate.purposeStatement && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">&quot;{candidate.purposeStatement}&quot;</p>
                    )}
                    <button
                      onClick={() => castVote(posGroup.position, candidate._id)}
                      disabled={castingPosition === posGroup.position}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center space-x-1.5"
                    >
                      {castingPosition === posGroup.position ? (
                        <><Loader2 size={13} className="animate-spin" /><span>Casting...</span></>
                      ) : (
                        <><Check size={13} /><span>Vote for {candidate.name.split(' ')[0]}</span></>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

const BadRequestScreen = ({ onBack }: any) => (
  <AuthContainer title="400 Bad Request" subtitle="Something went wrong with your request.">
    <div className="flex flex-col items-center justify-center space-y-5 text-center">
      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
        <XCircle size={32} />
      </div>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        The server could not understand the request due to invalid syntax or missing data.
      </p>
      <button onClick={onBack} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors shadow-xs">
        Back to Login
      </button>
    </div>
  </AuthContainer>
);

const NotFoundScreen = ({ onBack }: any) => (
  <AuthContainer title="404 Not Found" subtitle="We couldn't find the requested page.">
    <div className="flex flex-col items-center justify-center space-y-5 text-center">
      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200 dark:border-amber-900/50">
        <Compass size={32} />
      </div>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        The page or resource you are looking for does not exist or has been relocated.
      </p>
      <button onClick={onBack} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors shadow-xs">
        Back to Login
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
    } catch (err) {
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
    } catch (err) {
      setErrorMsg('Network error.');
    }
  };

  return (
    <AuthContainer title="Forgot Password" subtitle={step === 1 ? "Verify your registered identity" : "Create a new secure password"}>
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs mb-4 border border-rose-200 dark:border-rose-900/50">
          {errorMsg}
        </div>
      )}

      {step === 1 ? (
        <form className="space-y-3.5" onSubmit={handleVerify}>
          <div>
            <FormFieldLabel icon={Mail} label="Alumni email" />
            <input name="email" type="email" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="you@alumni.org" />
          </div>
          <div>
            <FormFieldLabel icon={CalendarDays} label="Date of birth" />
            <input name="dob" type="date" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" />
          </div>
          <div>
            <FormFieldLabel icon={GraduationCap} label="Graduation year" />
            <input name="graduationYear" type="number" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="e.g. 2018" />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors shadow-xs mt-3">
            Verify Identity
          </button>
        </form>
      ) : (
        <form className="space-y-3.5" onSubmit={handleReset}>
          <div>
            <FormFieldLabel icon={Lock} label="New password" />
            <div className="relative">
              <input name="newPassword" type={showPassword ? "text" : "password"} required minLength={8} className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <FormFieldLabel icon={Lock} label="Confirm password" />
            <input name="confirmPassword" type="password" required minLength={8} className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors shadow-xs mt-3">
            Reset Password
          </button>
        </form>
      )}

      <div className="mt-5 text-center">
        <button onClick={onBackToSignIn} className="text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-medium transition-colors">
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
      <form className="space-y-3.5" onSubmit={async (e) => {
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
        } catch (err) {
          alert('Network error');
        }
      }}>
        <div>
          <FormFieldLabel icon={Mail} label="Alumni email" />
          <input name="email" type="email" required defaultValue="tarun.ganapathi2007@gmail.com" className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="you@alumni.org" />
        </div>
        <div>
          <FormFieldLabel icon={Lock} label="Password" />
          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} required defaultValue="Password@123" className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end pt-0.5">
          <button type="button" onClick={onSwitchToForgotPassword} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            Forgot password?
          </button>
        </div>
        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors shadow-xs mt-2">
          Sign In
        </button>
      </form>
      <div className="mt-5 text-center text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          New Alumni? <button onClick={onSwitchToSignUp} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Register account</button>
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
    <AuthContainer title="Alumni Registration" subtitle="Register for the Alumni Association Election Portal">
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (isSecure && passwordsMatch) {
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
          } catch (err) {
            alert('Network error');
          }
        }
      }}>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <FormFieldLabel icon={User} label="Full name" />
            <input name="fullName" type="text" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="John Doe" />
          </div>
          <div>
            <FormFieldLabel icon={Phone} label="Contact number" />
            <input name="phone" type="tel" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="+91..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <FormFieldLabel icon={Compass} label="Department" />
            <input name="department" type="text" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="CSE" />
          </div>
          <div>
            <FormFieldLabel icon={CalendarDays} label="Graduation year" />
            <input name="graduationYear" type="text" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="2015" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <FormFieldLabel icon={CalendarDays} label="Date of birth" />
            <input name="dob" type="date" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" />
          </div>
          <div>
            <FormFieldLabel icon={User} label="Gender" />
            <select name="gender" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <FormFieldLabel icon={Mail} label="Alumni email" />
          <input name="email" type="email" required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="you@alumni.org" />
        </div>

        <div>
          <FormFieldLabel icon={Lock} label="Password" />
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="••••••••" />
        </div>

        <div>
          <FormFieldLabel icon={Lock} label="Confirm password" />
          <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="••••••••" />
        </div>

        <button type="submit" disabled={!isSecure || !passwordsMatch} className={`w-full font-semibold py-2.5 rounded-lg transition-colors text-xs mt-3 ${isSecure && passwordsMatch ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'}`}>
          Register Member
        </button>
      </form>
      <div className="mt-4 text-center text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          Already registered? <button onClick={onSwitchToSignIn} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Sign in</button>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // Navigation tabs
  const ALUMNI_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'eligibility', label: 'Eligibility Evaluator', icon: ClipboardCheck },
    { id: 'apply', label: 'Propose Nominee', icon: UserPlus },
    { id: 'applications', label: 'My Nominations', icon: FolderOpen },
    { id: 'finalList', label: 'Final List', icon: Award },
    { id: 'voting', label: 'Cast Vote', icon: Vote },
  ];

  const ADMIN_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'eligibility', label: 'Eligibility Evaluator', icon: ClipboardCheck },
    { id: 'apply', label: 'Propose Nominee', icon: UserPlus },
    { id: 'scrutiny', label: 'Scrutiny Panel', icon: ShieldAlert },
    { id: 'finalList', label: 'Final List', icon: Award },
    { id: 'applications', label: 'My Nominations', icon: FolderOpen },
    { id: 'ec', label: 'EC Timelines', icon: Users },
    { id: 'voting', label: 'Voting Panel', icon: Vote }
  ];

  const currentTabs = isAdmin ? ADMIN_TABS : ALUMNI_TABS;

  const handleTabChange = (tabId: string) => {
    if (!isAdmin && ['scrutiny', 'ec'].includes(tabId)) {
      alert("403 Forbidden: Administrative permission required.");
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tabId);
  };

  const renderContent = () => {
    if (!isAdmin && ['scrutiny', 'ec'].includes(activeTab)) {
      return (
        <div className="glass-panel p-8 text-center space-y-4 max-w-xl mx-auto my-12 border-red-200 dark:border-red-900/40">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">403 Forbidden: Administrator Privilege Required</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your account is assigned the role of <strong>Alumni</strong>. Administrative sections such as Scrutiny Conclave and EC Oversight are restricted strictly to designated election administrators.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
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
              handleTabChange('applications');
            }}
          />
        );
      case 'scrutiny':
        return <ScrutinyCommitteeScreen token={token} />;
      case 'finalList':
        return <FinalCandidateListScreen isAdmin={isAdmin} token={token} />;
      case 'applications':
        return (
          <MyApplicationsScreen
            userProfile={userProfile}
            onProceedToApply={() => handleTabChange('apply')}
          />
        );
      case 'ec':
        return <ECScreen onNavigate={(tab: string) => handleTabChange(tab)} />;
      case 'voting':
        return (
          <VotingScreen
            isAdmin={isAdmin}
            token={token}
            userProfile={userProfile}
          />
        );
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
      <div className="min-h-screen overflow-x-hidden font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
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
      <div className="min-h-screen overflow-x-hidden font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
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
      <div className="min-h-screen overflow-x-hidden font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <ForgotPasswordScreen onBackToSignIn={() => setAuthView('signin')} />
      </div>
    );
  }

  if (authView === '400') {
    return (
      <div className="min-h-screen overflow-x-hidden font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <BadRequestScreen onBack={() => setAuthView('signin')} />
      </div>
    );
  }

  if (authView === '404') {
    return (
      <div className="min-h-screen overflow-x-hidden font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <NotFoundScreen onBack={() => setAuthView('signin')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500 flex flex-col lg:flex-row">
      <BackgroundBlobs />

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:static lg:h-screen lg:sticky lg:top-0 flex flex-col justify-between transition-transform duration-300 ease-in-out p-3 lg:p-3.5 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl h-full flex flex-col justify-between overflow-hidden shadow-xs border border-slate-200/90 dark:border-slate-800">
          {/* Sidebar Top: Institutional Branding */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div
                className="cursor-pointer group flex items-start gap-3"
                onClick={() => {
                  handleTabChange('dashboard');
                  setMobileNavOpen(false);
                }}
              >
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  <img src={necLogo} alt="NEC Alumni Association Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    National Engineering College
                  </h1>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Alumni Association, Kovilpatti
                  </p>
                  <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mt-0.5">
                    Elections
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Items (Clean List) */}
          <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 nav-scroll-container">
            {currentTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabChange(tab.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors duration-150 ${
                    isActive
                      ? 'bg-purple-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <tab.icon
                      size={16}
                      className={`flex-shrink-0 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                      }`}
                    />
                    <span className="truncate">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Bottom: Profile & Controls (Unified Area) */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center space-x-2.5 px-1 py-1">
              <div
                className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-purple-200/50 dark:border-purple-800/50"
              >
                {userProfile?.name?.[0] || (isAdmin ? 'M' : 'A')}
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate">
                  {userProfile?.name || (isAdmin ? 'Murali Subbiah M' : 'Alumni Member')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {isAdmin ? 'Administrator' : 'Alumni Member'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                onClick={() => setIsDark(!isDark)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 transition-colors shadow-xs"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-slate-500" />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200/70 dark:border-slate-700/60 transition-colors shadow-xs"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar for Main Content Area */}
        <header className="sticky top-0 z-30 bg-purple-600 text-white shadow-xs px-4 sm:px-8 py-3 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-white hover:bg-white/15 transition-colors"
              aria-label="Open sidebar navigation"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base tracking-wider uppercase">
                {currentTabs.find((t) => t.id === activeTab)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={15} className="text-amber-300" /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Content Screens */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
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
      </div>
    </div>
  );
}
