import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, ClipboardCheck, FileEdit, FolderOpen, ShieldCheck, Users,
  CheckCircle2, Clock, XCircle, ChevronRight, Activity, CalendarDays,
  UserCheck, Award, Briefcase, FileText, Sun, Moon,
  User, Mail, Phone, Compass, Globe, MessageSquare, GraduationCap,
  Lock, Eye, EyeOff, LogOut, Megaphone, AlertCircle, HelpCircle,
  Download, Share2, ExternalLink, ShieldAlert, ListChecks, Undo2,
  Sparkles, BookOpen, Info, Check, ArrowRight, UserPlus
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

const AnnouncementScreen = ({ onProceedToEligibility, onProceedToApply }: any) => {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGazetteModal, setShowGazetteModal] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/elections/announcement')
      .then(res => res.json())
      .then(data => {
        setAnnouncement(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const timelineSteps = [
    {
      stage: "Stage 1",
      title: "Call for Nominations",
      desc: "Announced ≥ 1 Month prior to AGM",
      date: "Sep 10, 2026",
      status: "Active / Published",
      active: true
    },
    {
      stage: "Stage 2",
      title: "Nomination Proposals",
      desc: "Eligible members submit proposals (No self-nomination)",
      date: "Sep 30, 2026",
      status: "In Progress",
      active: true
    },
    {
      stage: "Stage 3",
      title: "Scrutiny Committee Conclave",
      desc: "Verification by Principal, Coordinators & Bearers",
      date: "Oct 05, 2026",
      status: "Scheduled",
      active: false
    },
    {
      stage: "Stage 4",
      title: "Candidate Withdrawal Period",
      desc: "Withdrawal window provided before final roll",
      date: "Oct 07 - Oct 14, 2026",
      status: "Scheduled",
      active: false
    },
    {
      stage: "Stage 5",
      title: "Publication of Final List & AGM",
      desc: "Certified ballot published; AGM election voting",
      date: "Oct 25, 2026",
      status: "AGM Conclave",
      active: false
    }
  ];

  return (
    <div className="space-y-8 relative z-10 pb-20">
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
                OFFICIAL NOTIFICATION • REF: AA/ELEC/2026/01
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1.5 border border-green-200 dark:border-green-800">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> Call For Nominations Open
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                Strict: No Self-Nomination
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Alumni Association Office Bearer Elections 2026
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              In accordance with Article IV of the Alumni Association Constitution, nominations are hereby called for the positions of Office Bearers for the term 2026–2028. Published via the official Alumni portal <strong>at least one month prior to the forthcoming Annual General Meeting (AGM)</strong>.
            </p>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
              <Info size={16} className="text-amber-600 flex-shrink-0" />
              <span><strong>Constitutional Rule:</strong> There is <strong>no self-nomination</strong>. A candidate can only be nominated when proposed by an eligible registered alumni member and seconded.</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5"><CalendarDays size={15} className="text-indigo-600" /> AGM Date: <strong>October 25, 2026 (10:00 AM)</strong></span>
              <span className="flex items-center gap-1.5"><Megaphone size={15} className="text-indigo-600" /> Notification Published: <strong>September 10, 2026</strong></span>
              <span className="flex items-center gap-1.5"><Clock size={15} className="text-indigo-600" /> Nomination Deadline: <strong>September 30, 2026</strong></span>
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
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Constitutional Scrutiny Committee</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Decisions are final and binding on all nominations</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { name: "Dr. K. S. Ramanathan", role: "Principal / Patron", note: "Head of Scrutiny Committee" },
              { name: "Prof. S. Meenakshi", role: "Alumni Coordinator", note: "Convener & Returning Officer" },
              { name: "Er. Ramesh Babu", role: "Incumbent President", note: "Office Bearer Representative" },
              { name: "Er. Anita George", role: "Incumbent Secretary", note: "Office Bearer Representative" }
            ].map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">{member.name}</h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{member.role}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600">
                  {member.note}
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
          {timelineSteps.map((step, idx) => (
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

      {/* Gazette Notice Modal */}
      <AnimatePresence>
        {showGazetteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">OFFICIAL GAZETTE</span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Election Notification 2026</h3>
                  <p className="text-xs text-slate-500">Ref: AA/ELEC/2026/01 • Issued: September 10, 2026</p>
                </div>
                <button
                  onClick={() => setShowGazetteModal(false)}
                  className="clay-icon w-8 h-8 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p>
                  <strong>TO ALL REGISTERED ALUMNI MEMBERS:</strong> Notice is hereby given that the Biennial Elections for the Executive Office Bearers of the Alumni Association will take place during the Annual General Meeting (AGM) scheduled on <strong>Sunday, October 25, 2026 at 10:00 AM IST</strong>.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-sans rounded-xl text-amber-900 dark:text-amber-300 font-semibold">
                  MANDATORY: In accordance with Article IV, Section 2, there is NO self-nomination. Candidates must be proposed and seconded by eligible members of the Alumni Association.
                </div>
                <p>
                  <strong>Positions Open for Nomination:</strong> President, Vice President, Secretary, Joint Secretary, Treasurer, Joint Treasurer.
                </p>
                <div className="border-l-2 border-indigo-500 pl-4 py-1 space-y-1 font-sans text-xs">
                  <p><strong>1. President Eligibility:</strong> Must have served as an Office Bearer during the immediate preceding 5 years (2021–2026).</p>
                  <p><strong>2. General Eligibility:</strong> Registered alumni member with at least 1 year continuous active service without gap in the past 5 years holding additional coordinator responsibilities.</p>
                  <p><strong>3. Nomination:</strong> Must be proposed and seconded by eligible alumni, accompanied by a detailed Purpose Statement.</p>
                  <p><strong>4. Scrutiny & Withdrawal:</strong> Scrutiny committee decision is final and binding. Candidates may withdraw nominations prior to October 14, 2026.</p>
                </div>
                <p className="pt-2 text-xs font-sans text-slate-500">
                  By Order of the Scrutiny Committee & Executive Council.<br />
                  <strong>Prof. S. Meenakshi</strong>, Returning Officer & Alumni Coordinator
                </p>
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
                    alert("Official Gazette notification downloaded.");
                    setShowGazetteModal(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2"
                >
                  <Download size={16} /> Download Signed PDF
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
                <AlertCircle size={13} /> Strict Article II Rule: Nominee must have served as an Office Bearer in past 5 years.
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
        if (errLower.includes("alumni data not found") || errLower.includes("no alumni found") || errLower.includes("alumni not found") || errLower.includes("email")) {
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
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Nomination Proposal Successfully Filed!</h3>
            <p className="text-slate-600 dark:text-slate-300 max-w-md text-sm">
              You have formally proposed <strong>{nominee.name}</strong> for the office of <strong>{targetPositions.join(", ")}</strong>. The application has been verified against the official alumni registry and transmitted to the <strong>Scrutiny Committee</strong>.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-mono border border-slate-200 dark:border-slate-700">
              Nominee: <strong>{nominee.name}</strong> • Proposer: <strong>{proposer.name}</strong> • Seconder: <strong>{seconder.name}</strong>
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Propose Another Candidate
            </button>
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
                  <FormFieldLabel icon={Mail} label="Nominee Alumni Email" />
                  <input
                    type="email"
                    value={nominee.email}
                    onChange={(e) => {
                      setNominee({ ...nominee, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    required
                    className={`w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-slate-800 dark:text-white ${
                      isSelfNomination || fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                    placeholder="nominee@alumni.org"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-semibold mt-1">
                      ⚠️ {fieldErrors.email}
                    </p>
                  )}
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
                  onChange={setTargetPositions}
                  placeholder="Select position(s)..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormFieldLabel icon={Briefcase} label="Nominee's Qualifying Responsibility Role" />
                  <select
                    value={roleCategory}
                    onChange={(e) => setRoleCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white"
                  >
                    {RESPONSIBILITY_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
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
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                4. Seconded by Eligible Member
              </span>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-purple-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Seconder Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Seconder Full Name</label>
                    <input
                      type="text"
                      value={seconder.name}
                      onChange={(e) => setSeconder({ ...seconder, name: e.target.value })}
                      required
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Alumni ID / Reg No</label>
                    <input
                      type="text"
                      value={seconder.alumniId}
                      onChange={(e) => setSeconder({ ...seconder, alumniId: e.target.value })}
                      required
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Email Address</label>
                    <input
                      type="text"
                      value={seconder.email}
                      onChange={(e) => setSeconder({ ...seconder, email: e.target.value })}
                      required
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white"
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
                The Scrutiny Committee evaluates this purpose statement to ensure candidates demonstrate meaningful contributions and uphold highest integrity.
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
                  I solemnly affirm as an eligible registered alumni member that I am formally proposing <strong>{nominee.name || "the candidate"}</strong> with their consent, that all service records are unbroken without gap, and that we accept the decision of the Scrutiny Committee as <strong>final and binding</strong>.
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
              {isSubmitting ? "Filing Nomination Proposal..." : "Submit Nomination Proposal to Scrutiny Committee"}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

// === Phase 4: Scrutiny Committee & Selection Process Screen ===

const ScrutinyCommitteeScreen = () => {
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
    fetch(`http://localhost:5000/api/applications?status=${filter}`)
      .then(res => res.json())
      .then(data => {
        setApplications(data);
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

  const handleScrutinyDecision = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`http://localhost:5000/api/applications/${id}/scrutiny`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        alert("Failed to record committee decision");
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
              ARTICLE IV CONCLAVE
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
          <div className="flex flex-wrap gap-2">
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
                  {app.status === 'pending' && (
                    <div className="flex flex-col justify-center gap-3 min-w-[170px]">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                      >
                        <ListChecks size={16} /> Scrutinize Proposal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scrutiny Decision Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">OFFICIAL SCRUTINY PROCEEDING</span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Nominee: {selectedApp.name}</h3>
                  <p className="text-xs text-slate-500">Proposed by: {selectedApp.proposer?.name} • Position: {selectedApp.targetPositions?.join(", ")}</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="clay-icon w-8 h-8 text-slate-500 hover:text-slate-800">
                  <XCircle size={20} />
                </button>
              </div>

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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleScrutinyDecision(selectedApp._id, 'rejected')}
                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 font-bold text-xs rounded-xl border border-red-200 dark:border-red-800 transition-colors"
                >
                  Reject Proposal
                </button>
                <button
                  onClick={() => handleScrutinyDecision(selectedApp._id, 'approved')}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-green-600/20 transition-colors"
                >
                  Pass Scrutiny & Approve
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
  const [nominationView, setNominationView] = useState<'proposed_by_me' | 'nominated_me'>('proposed_by_me');

  const fetchMyApplications = () => {
    if (userProfile?.email) {
      setLoading(true);
      fetch(`http://localhost:5000/api/applications?email=${encodeURIComponent(userProfile.email)}&roleType=${nominationView}`)
        .then(res => res.json())
        .then(data => {
          setApplications(data);
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
            Track proposals you filed and proposals where you have been nominated for office.
          </p>
        </div>
        <button 
          onClick={onProceedToApply}
          className="clay-btn bg-indigo-600 text-white font-semibold py-2.5 px-6 text-xs hover:bg-indigo-700 w-fit flex items-center gap-2"
        >
          <UserPlus size={16} /> Propose a Candidate
        </button>
      </div>

      {/* Toggle View: Proposed by Me vs Where I am Nominated */}
      <div className="flex gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
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
              : "No nominations proposing you have been filed yet."}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {nominationView === 'proposed_by_me'
              ? "Click 'Propose a Candidate' to submit an eligible member's nomination."
              : "When an eligible alumni member proposes you, the nomination record will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
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
                    <Clock size={14} /> Filed on {new Date(app.submittedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800' : 
                      app.status === 'withdrawn' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800' : 
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}
                  >
                    {app.status === 'approved' ? '✓ Scrutiny Passed' : app.status}
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
                  <p className="text-slate-500 text-[11px]">{app.seconder?.email || "N/A"}</p>
                </div>
              </div>

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
              {app.status !== 'withdrawn' && app.status !== 'rejected' && (
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
          ))}
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
              Published in accordance with the election guidelines following formal scrutiny of all proposals by the Scrutiny Committee and completion of the withdrawal window. <strong>Decisions by the Scrutiny Committee are final and binding.</strong>
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span>Certified by: <strong>Dr. K. S. Ramanathan (Principal) & Scrutiny Committee</strong></span>
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
            Nomination proposals are currently being verified by the Scrutiny Committee. The certified final contestant list will appear here once approved.
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

const DashboardScreen = ({ onNavigate }: any) => {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    withdrawn: 0
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/applications/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(err => console.error("Failed to fetch stats from backend", err));
  }, []);

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
          View Notice & Schedule <ChevronRight size={14} />
        </button>
      </motion.div>

      {/* Hero Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-10"
      >
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
          Alumni Election Management System 👋
        </h1>
        <p className="text-indigo-600 dark:text-indigo-300 text-sm">
          Strict Proposal Workflow: Candidates are proposed by eligible members with seconders • Scrutiny Committee Conclave • Certified Final Ballot.
        </p>
      </motion.div>

      {/* Metrics Row */}
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

      {/* 5-Step Process Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div 
          onClick={() => onNavigate('finalList')}
          className="clay-card p-6 cursor-pointer hover:border-emerald-500/50 transition-all group"
        >
          <div className="clay-icon w-12 h-12 text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <Award size={24} />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Published Final Candidate Roll</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View certified candidates published by the Scrutiny Committee (Decisions final & binding).
          </p>
        </div>
      </div>
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
            Official election timetable, scrutiny governance, and returning officer dashboard.
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

const SignInScreen = ({ onSignIn, onSwitchToSignUp }: any) => {
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
            onSignIn(data);
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
        <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 shadow-lg shadow-indigo-500/30 text-sm mt-2">
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
              onSignUp(data);
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
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'app'>('app');
  const [activeTab, setActiveTab] = useState('apply');
  const [isDark, setIsDark] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({
    name: "Tharun G",
    email: "tarun.ganapathi2007@gmail.com",
    phone: "+91-8056300117",
    department: "CSE",
    graduationYear: "2015"
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, badge: 'Phase 1' },
    { id: 'eligibility', label: 'Eligibility Evaluator', icon: ClipboardCheck, badge: 'Phase 2' },
    { id: 'apply', label: 'Propose Nominee', icon: UserPlus, badge: 'Phase 3' },
    { id: 'scrutiny', label: 'Scrutiny Panel', icon: ShieldAlert, badge: 'Phase 4' },
    { id: 'finalList', label: 'Final List', icon: Award, badge: 'Phase 5' },
    { id: 'applications', label: 'My Nominations', icon: FolderOpen },
    { id: 'ec', label: 'EC Timelines', icon: Users }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <DashboardScreen onNavigate={(tab: string) => setActiveTab(tab)} />;
      case 'announcements': 
        return (
          <AnnouncementScreen 
            onProceedToEligibility={() => setActiveTab('eligibility')} 
            onProceedToApply={() => setActiveTab('apply')} 
          />
        );
      case 'eligibility': 
        return (
          <EligibilityScreen 
            onProceedToApply={() => setActiveTab('apply')} 
          />
        );
      case 'apply': 
        return (
          <ApplyScreen 
            userProfile={userProfile} 
            onNominationSuccess={() => setActiveTab('applications')} 
          />
        );
      case 'scrutiny': 
        return <ScrutinyCommitteeScreen />;
      case 'finalList': 
        return <FinalCandidateListScreen />;
      case 'applications': 
        return (
          <MyApplicationsScreen 
            userProfile={userProfile} 
            onProceedToApply={() => setActiveTab('apply')} 
          />
        );
      case 'ec': 
        return <ECScreen onNavigate={(tab: string) => setActiveTab(tab)} />;
      default: 
        return <DashboardScreen onNavigate={(tab: string) => setActiveTab(tab)} />;
    }
  };

  if (authView === 'signin') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <SignInScreen 
          onSignIn={(userData: any) => {
            setUserProfile(userData);
            setAuthView('app');
          }} 
          onSwitchToSignUp={() => setAuthView('signup')} 
        />
      </div>
    );
  }

  if (authView === 'signup') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <SignUpScreen 
          onSignUp={(profileData: any) => {
            setUserProfile(profileData);
            setAuthView('app');
          }} 
          onSwitchToSignIn={() => setAuthView('signin')} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
      <BackgroundBlobs />
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 z-10 ${
                activeTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={15} className={activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              <span>{tab.label}</span>
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
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center">
              {userProfile.name?.[0] || 'A'}
            </div>
            <div className="text-left leading-tight hidden md:block">
              <span className="font-bold text-slate-800 dark:text-white block">{userProfile.name}</span>
              <span className="text-[10px] text-slate-400 font-medium">Class of {userProfile.graduationYear}</span>
            </div>
          </div>

          <button 
            onClick={() => setAuthView('signin')} 
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
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-xl text-center min-w-[50px] transition-all ${
              activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-[9px] mt-0.5 whitespace-nowrap">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
