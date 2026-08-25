import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, ClipboardCheck, FileEdit, FolderOpen, ShieldCheck, Users,
  CheckCircle2, Clock, XCircle, ChevronRight, Activity, CalendarDays,
  UserCheck, Award, Briefcase, FileText, Sun, Moon,
  User, Mail, Phone, Compass, Globe, MessageSquare, GraduationCap,
  Lock, Eye, EyeOff, LogOut
} from 'lucide-react';

// === Constants ===
const ELECTION_POSITIONS = [
  "President", "Vice President", "Secretary", "Joint Secretary", "Treasurer", "Joint Treasurer"
];

const PREVIOUS_ROLES = [
  ...ELECTION_POSITIONS,
  "Chapter Coordinator", "College Coordinator", "Chapter Warden"
];

const CLUBS = [
  "IT Club", "AI&DS Club", "IEEE Club", "CSE Club", "CSI Club", "NewGen Club"
];

// === Components ===

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
    const end = parseInt(value.toString());
    if (start === end) return;

    let totalMilSecDur = 1000;
    let incrementTime = (totalMilSecDur / end) * 2;
    if (incrementTime < 10) incrementTime = 10; // Prevent too fast intervals

    let timer = setInterval(() => {
      start += Math.ceil(end / 100); // Increment proportionally so it finishes in time
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}</span>;
};

// --- Screens ---

const MultiSelectDropdown = ({ options, selected, onChange, placeholder, className }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={className || "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-800 dark:text-white cursor-pointer flex justify-between items-center transition-all focus:ring-2 focus:ring-purple-500/50"}
      >
        <span className={selected.length === 0 ? "text-slate-400 dark:text-slate-500" : "truncate pr-4"}>
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <ChevronRight className={`text-slate-400 pointer-events-none transition-transform ${isOpen ? 'rotate-[270deg]' : 'rotate-90'}`} size={20} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto"
          >
            {options.map((opt: string) => (
              <div 
                key={opt}
                onClick={() => {
                  if (selected.includes(opt)) onChange(selected.filter((o: string) => o !== opt));
                  else onChange([...selected, opt]);
                }}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selected.includes(opt) && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <span className="text-slate-700 dark:text-slate-200">{opt}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardScreen = () => {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    // Fetch stats from our new backend API
    fetch('http://localhost:5000/api/applications/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats(data);
        }
      })
      .catch(err => console.error("Failed to fetch stats from backend", err));
  }, []);

  return (
    <div className="space-y-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Welcome 👋</h1>
        <p className="text-indigo-600 dark:text-indigo-200">Here's what's happening with the alumni elections.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Applicants', value: stats.total, icon: Users, color: 'text-blue-500 dark:text-blue-400', glow: '' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-green-500 dark:text-green-400', glow: 'glow-green' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-500 dark:text-amber-400', glow: 'glow-amber' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500 dark:text-red-400', glow: 'glow-red' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className={`clay-card p-6 flex items-center justify-between group hover:scale-[1.02] transition-transform ${stat.glow}`}
          >
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                <AnimatedCounter value={stat.value} />
              </h3>
            </div>
            <div className={`clay-icon w-12 h-12 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Active Elections</h2>
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <div className="clay-icon w-16 h-16 text-slate-400 dark:text-slate-500 mb-4">
            <CalendarDays size={32} />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No elections scheduled yet.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Elections will appear here once created by the EC.</p>
        </div>
      </motion.div>
    </div>
  );
};

const EligibilityScreen = ({ userProfile }: any) => {
  const [targetPosition, setTargetPosition] = useState(ELECTION_POSITIONS[0]);
  const [status, setStatus] = useState<'idle' | 'eligible' | 'ineligible'>('idle');
  const [feedback, setFeedback] = useState("");
  const [neededRoles, setNeededRoles] = useState<string[]>([]);

  const currentRoles = userProfile?.previousRole || [];
  
  const checkEligibility = () => {
    const ecRoles = ELECTION_POSITIONS.filter(p => p !== "President");
    const entryRoles = ["Chapter Coordinator", "College Coordinator", "Chapter Warden"];
    
    let hasRequiredRole = false;
    let missingRoles: string[] = [];
    let feedbackMsg = "";
    
    const hasOtherRole = currentRoles.some((r: string) => !entryRoles.includes(r));
    const hasEntryRole = currentRoles.some((r: string) => entryRoles.includes(r));
    
    if (hasOtherRole) {
      hasRequiredRole = true;
      setStatus('eligible');
      setFeedback("Awesome! You meet all the requirements to run for this position with your prior experience.");
      setNeededRoles([]);
    } else if (hasEntryRole) {
      hasRequiredRole = true;
      setStatus('eligible');
      setFeedback("You are eligible, provided you have served in your Coordinator/Warden role for a minimum of 1 year.");
      setNeededRoles([]);
    } else {
      setStatus('ineligible');
      setFeedback("To apply for this position, you must have previously served in any position OR as a Coordinator/Warden for at least 1 year.");
      setNeededRoles(entryRoles);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto glass-panel p-8 relative z-10"
    >
      <div className="flex items-center space-x-4 mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
        <div className="clay-icon w-12 h-12 text-indigo-500 dark:text-indigo-400">
          <UserCheck size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Eligibility Checker</h2>
          <p className="text-indigo-600 dark:text-indigo-200">Verify your eligibility to run for office.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="clay-card p-6 border-l-4 border-l-indigo-500">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Membership Criteria</h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li className="flex items-center"><CheckCircle2 size={18} className="text-green-500 dark:text-green-400 mr-3" /> Prior EC experience OR &ge; 1 year as Coordinator/Warden.</li>
          </ul>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Your Current Roles</h3>
          {currentRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentRoles.map((role: string) => (
                <span key={role} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-lg">{role}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No previous roles on record.</p>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Select Target Position</label>
          <div className="relative">
            <select 
              value={targetPosition}
              onChange={(e) => {
                setTargetPosition(e.target.value);
                setStatus('idle');
              }}
              className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              {ELECTION_POSITIONS.map(pos => <option key={pos} value={pos} className="dark:bg-slate-900">{pos}</option>)}
            </select>
            <ChevronRight className="absolute right-4 top-3.5 text-slate-400 rotate-90 pointer-events-none" size={20} />
          </div>
        </div>

        <button 
          onClick={checkEligibility}
          className="clay-btn w-full bg-indigo-600 text-white font-semibold py-4 mt-4 flex items-center justify-center hover:bg-indigo-700"
        >
          <ShieldCheck className="mr-2" size={20} /> Check My Status
        </button>
        
        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-4 p-6 rounded-xl border ${status === 'eligible' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'}`}>
                <div className="flex items-start space-x-3 mb-2">
                  {status === 'eligible' ? (
                    <CheckCircle2 className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                  ) : (
                    <XCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                  )}
                  <div>
                    <h4 className={`font-bold ${status === 'eligible' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                      {status === 'eligible' ? 'Eligible!' : 'Not Eligible'}
                    </h4>
                    <p className={`text-sm mt-1 ${status === 'eligible' ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-400'}`}>
                      {feedback}
                    </p>
                  </div>
                </div>
                
                {status === 'ineligible' && neededRoles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800/30">
                    <p className="text-xs font-bold text-red-800/70 dark:text-red-400/70 uppercase tracking-wider mb-2">You need at least one of these roles first:</p>
                    <div className="flex flex-wrap gap-2">
                      {neededRoles.map(role => (
                        <span key={role} className="px-2 py-1 bg-white/50 dark:bg-slate-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 text-xs font-semibold rounded shadow-sm">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const FormFieldLabel = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center space-x-2 mb-2">
    <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
    <Icon size={18} className="text-purple-600" />
    <span className="text-xs font-bold text-purple-600 tracking-wider uppercase">{label} <span className="text-purple-500">*</span></span>
  </div>
);

const ApplyScreen = ({ userProfile }: any) => {
  const [hasPreviousRole, setHasPreviousRole] = useState("no");
  const [selectedPreviousRoles, setSelectedPreviousRoles] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [roleDurations, setRoleDurations] = useState<Record<string, string>>({});
  const [motivation, setMotivation] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (userProfile?.previousRole && userProfile.previousRole.length > 0) {
      setHasPreviousRole("yes");
      setSelectedPreviousRoles(userProfile.previousRole);
    }
  }, [userProfile]);

  const entryRoles = ["Chapter Coordinator", "College Coordinator", "Chapter Warden"];
  const allPastRoles = [...new Set([...(userProfile?.previousRole || []), ...selectedPreviousRoles])];
  
  let hasRequiredRole = false;
  let eligibilityError = "";
  
  const hasOtherRole = allPastRoles.some(r => !entryRoles.includes(r));
  
  if (hasOtherRole) {
    hasRequiredRole = true;
  } else {
    // Check if they have an entry role with >= 1 year duration
    const hasValidEntryRole = selectedPreviousRoles.some(r => {
      if (entryRoles.includes(r)) {
        const duration = parseFloat(roleDurations[r] || "0");
        return duration >= 1;
      }
      return false;
    });
    
    if (hasValidEntryRole) {
      hasRequiredRole = true;
    } else if (allPastRoles.some(r => entryRoles.includes(r))) {
      eligibilityError = "Ineligible: You must have served in a Coordinator or Warden role for a minimum of 1 year.";
    } else {
      eligibilityError = "Ineligible: To apply, you must have previously served in any position OR as a Coordinator/Warden for at least 1 year.";
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 relative z-10 pb-20"
    >
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
          <Award size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-purple-600 mb-4 text-center">Nomination Form</h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center">Alumni Elections</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Application Submitted!</h3>
            <p className="text-slate-600 dark:text-slate-400">Your nomination has been successfully submitted and is pending review by the Admin.</p>
            <button onClick={() => setIsSubmitted(false)} className="mt-8 px-6 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
              Submit Another
            </button>
          </div>
        ) : (
        <form className="space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await fetch('http://localhost:5000/api/applications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                applicantEmail: userProfile.email,
                name: userProfile.name,
                department: userProfile.department,
                graduationYear: userProfile.graduationYear,
                phone: userProfile.phone,
                targetPositions: selectedPositions,
                previousRoles: selectedPreviousRoles,
                roleDurations: roleDurations,
                motivation: motivation
              })
            });
            if (res.ok) {
              setIsSubmitted(true);
            } else {
              alert("Failed to submit application");
            }
          } catch(err) {
            console.error(err);
            alert("Network error");
          }
        }}>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-4 mb-8">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Autofilled Profile Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormFieldLabel icon={User} label="Name" />
                <input type="text" value={userProfile.name} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <FormFieldLabel icon={Mail} label="Email" />
                <input type="email" value={userProfile.email} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <FormFieldLabel icon={Phone} label="Phone" />
                <input type="tel" value={userProfile.phone} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <FormFieldLabel icon={Compass} label="Department" />
                <input type="text" value={userProfile.department} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <FormFieldLabel icon={CalendarDays} label="Graduation Year" />
                <input type="text" value={userProfile?.graduationYear || ''} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <FormFieldLabel icon={CalendarDays} label="Date of Birth" />
                <input type="date" value={userProfile?.dob || ''} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
              <div className="md:col-span-2">
                <FormFieldLabel icon={User} label="Gender" />
                <input type="text" value={userProfile?.gender || ''} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div>
            <FormFieldLabel icon={UserCheck} label="Position Applying For" />
            <MultiSelectDropdown 
              options={ELECTION_POSITIONS} 
              selected={selectedPositions} 
              onChange={setSelectedPositions} 
              placeholder="Select positions..." 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-800 dark:text-white cursor-pointer flex justify-between items-center transition-all focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <FormFieldLabel icon={MessageSquare} label="Why do you want to apply for this position?" />
            <textarea 
              rows={4} 
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500" 
              placeholder="Explain your motivation for this role..."
            ></textarea>
          </div>

          <div>
            <FormFieldLabel icon={Briefcase} label="Have you previously held a Bearer Officer or other role?" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 -mt-1 ml-6">Note: To apply for a position, you must have previously served in any position OR as a Coordinator/Warden for at least 1 year.</p>
            <div className="flex space-x-6 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="previousRole" value="yes" checked={hasPreviousRole === "yes"} onChange={() => setHasPreviousRole("yes")} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Yes</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="previousRole" value="no" checked={hasPreviousRole === "no"} onChange={() => setHasPreviousRole("no")} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">No</span>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {hasPreviousRole === "yes" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-6 p-1 -m-1"
              >
                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormFieldLabel icon={Briefcase} label="Previous Roles Held" />
                    <MultiSelectDropdown 
                      options={PREVIOUS_ROLES} 
                      selected={selectedPreviousRoles} 
                      onChange={(newRoles: string[]) => {
                        setSelectedPreviousRoles(newRoles);
                        const newDurations = { ...roleDurations };
                        Object.keys(newDurations).forEach(role => {
                          if (!newRoles.includes(role)) delete newDurations[role];
                        });
                        setRoleDurations(newDurations);
                      }} 
                      placeholder="Select previous roles..." 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-800 dark:text-white cursor-pointer flex justify-between items-center transition-all focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  
                  {selectedPreviousRoles.length > 0 && (
                    <div className="md:col-span-2 space-y-3 mt-2">
                      <FormFieldLabel icon={CalendarDays} label="Duration in Roles (Years)" />
                      <div className="grid grid-cols-1 gap-3">
                        {selectedPreviousRoles.map(role => (
                          <div key={role} className="flex items-center space-x-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium w-1/2 md:w-1/3 truncate">{role}</span>
                            <input 
                              type="number"
                              min="0"
                              step="0.5"
                              value={roleDurations[role] || ''}
                              onChange={(e) => setRoleDurations({ ...roleDurations, [role]: e.target.value })}
                              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                              placeholder={`Years served`} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <FormFieldLabel icon={MessageSquare} label="Previous Contributions" />
                  <textarea 
                    rows={4} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                    placeholder="Describe your contributions in this role..."
                  ></textarea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4">
            {!hasRequiredRole && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                <XCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                <p className="text-sm text-red-700 dark:text-red-400">
                  <strong>{eligibilityError}</strong>
                </p>
              </div>
            )}
            <button 
              disabled={!hasRequiredRole || selectedPositions.length === 0}
              className={`w-full font-bold py-4 rounded-xl transition-colors shadow-lg text-[15px] tracking-wider uppercase ${
                hasRequiredRole && selectedPositions.length > 0
                  ? 'bg-[#8b5cf6] text-white hover:bg-purple-600 shadow-purple-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              Submit Application
            </button>
          </div>
        </form>
        )}
      </div>
    </motion.div>
  );
};

const MyApplicationsScreen = ({ userProfile }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.email) {
      fetch(`http://localhost:5000/api/applications?email=${encodeURIComponent(userProfile.email)}`)
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
  }, [userProfile]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10"
    >
      <div className="glass-panel p-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">My Applications</h2>
          <p className="text-indigo-600 dark:text-indigo-200">Track the status of your submitted nominations.</p>
        </div>
        <button className="clay-btn bg-indigo-600 text-white font-semibold py-2 px-6 text-sm hover:bg-indigo-700 w-fit">
          New Application
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <div className="clay-icon w-16 h-16 text-slate-400 dark:text-slate-500 mb-4">
            <FileText size={32} />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No applications submitted yet.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your nomination submissions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <div key={app._id} className="glass-panel p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">
                  Positions: {app.targetPositions.join(', ')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2">
                  <Clock size={14} /> Submitted on {new Date(app.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize
                  ${app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50' : 
                    app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50' : 
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50'}`}
                >
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const AdminReviewScreen = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  const fetchApplications = () => {
    fetch(`http://localhost:5000/api/applications?status=${filter}`)
      .then(res => res.json())
      .then(data => setApplications(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchApplications();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10 pb-20"
    >
       <div className="glass-panel p-8 border-l-4 border-indigo-500">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Admin Review Panel</h2>
        <p className="text-indigo-600 dark:text-indigo-200">Process and verify incoming candidate applications.</p>
      </div>

      <div className="clay-card overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Recent Applications</h3>
          <div className="flex space-x-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === 'all' ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'}`}>All</button>
            <button onClick={() => setFilter('pending')} className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === 'pending' ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'}`}>Pending</button>
            <button onClick={() => setFilter('approved')} className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === 'approved' ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'}`}>Approved</button>
          </div>
        </div>
        
        {applications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="clay-icon w-16 h-16 text-slate-400 dark:text-slate-500 mb-4">
              <UserCheck size={32} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No applications to review.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Submitted applications will appear here for processing.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.map(app => (
              <div key={app._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">{app.name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          app.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-4">
                        <span className="flex items-center"><Mail size={14} className="mr-1" /> {app.applicantEmail}</span>
                        <span className="flex items-center"><Compass size={14} className="mr-1" /> {app.department} '{app.graduationYear}</span>
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Positions</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {app.targetPositions?.map((pos: string) => <span key={pos} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-lg">{pos}</span>)}
                      </div>
                      
                      {app.previousRoles && app.previousRoles.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Previous Roles & Experience</p>
                          <div className="flex flex-wrap gap-2">
                            {app.previousRoles.map((role: string) => (
                              <span key={role} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded">
                                {role} ({app.roleDurations?.[role] || 0} yrs)
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {app.motivation && (
                        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-400 mb-1">Motivation:</p>
                          {app.motivation}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {app.status === 'pending' && (
                    <div className="flex flex-row lg:flex-col justify-end gap-3 min-w-[140px]">
                      <button onClick={() => updateStatus(app._id, 'approved')} className="flex-1 flex items-center justify-center px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-green-500/20">
                        <CheckCircle2 size={18} className="mr-2" /> Approve
                      </button>
                      <button onClick={() => updateStatus(app._id, 'rejected')} className="flex-1 flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl border border-red-200 dark:border-red-800/50 transition-colors">
                        <XCircle size={18} className="mr-2" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ECScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10"
    >
      <div className="glass-panel p-8 border-l-4 border-purple-500 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Executive Committee Panel</h2>
          <p className="text-purple-600 dark:text-purple-200">Final approvals, election setup, and result management.</p>
        </div>
        <div className="clay-icon w-14 h-14 text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 hidden sm:flex">
          <ShieldCheck size={28} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clay-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
            <CalendarDays className="mr-2 text-indigo-500 dark:text-indigo-400" size={20} /> Election Timelines
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="clay-icon w-12 h-12 text-slate-400 dark:text-slate-500 mb-3">
              <CalendarDays size={24} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">No election timeline set.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Configure phases once an election is created.</p>
          </div>
        </div>

        <div className="clay-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
            <Briefcase className="mr-2 text-indigo-500 dark:text-indigo-400" size={20} /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 glass-panel flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-center shadow-sm">
              <FileEdit size={24} className="mb-2 text-indigo-500 dark:text-indigo-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Edit Election</span>
            </button>
            <button className="p-4 glass-panel flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-center shadow-sm">
              <Users size={24} className="mb-2 text-blue-500 dark:text-blue-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Voter List</span>
            </button>
            <button className="p-4 glass-panel flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-center col-span-2 shadow-sm">
              <Activity size={24} className="mb-2 text-purple-500 dark:text-purple-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Generate Final Ballot</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


// === Main App Component ===
const AuthContainer = ({ children, title, subtitle }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="min-h-screen flex items-center justify-center p-6 relative z-10"
  >
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-500/10 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
          <Award size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center">{subtitle}</p>
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
    <AuthContainer title="Welcome Back" subtitle="Sign in to EMS.Alumni to continue">
      <form className="space-y-5" onSubmit={async (e) => { 
        e.preventDefault(); 
        const email = e.currentTarget.email.value;
        const password = e.currentTarget.password.value;
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
          <FormFieldLabel icon={Mail} label="Email Address" />
          <input name="email" type="email" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="you@example.com" />
        </div>
        <div>
          <FormFieldLabel icon={Lock} label="Password" />
          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
      <div className="mt-6 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Don't have an account? <button onClick={onSwitchToSignUp} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign up</button>
        </p>
      </div>
    </AuthContainer>
  );
};

const SignUpScreen = ({ onSignUp, onSwitchToSignIn }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Password requirements
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isSecure = hasMinLen && hasUpper && hasNumber && hasSpecial;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <AuthContainer title="Create Account" subtitle="Join EMS.Alumni to participate in elections">
      <form className="space-y-4" onSubmit={async (e) => { 
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
                previousRole: selectedRoles,
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel icon={User} label="Full Name" />
            <input name="fullName" type="text" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="John Doe" />
          </div>
          <div>
            <FormFieldLabel icon={Phone} label="Contact No" />
            <input name="phone" type="tel" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="+91..." />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel icon={Compass} label="Department" />
            <input name="department" type="text" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="CSE" />
          </div>
          <div>
            <FormFieldLabel icon={CalendarDays} label="Grad Year" />
            <input name="graduationYear" type="text" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="2015" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormFieldLabel icon={CalendarDays} label="Date of Birth" />
            <input name="dob" type="date" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" />
          </div>
          <div>
            <FormFieldLabel icon={User} label="Gender" />
            <div className="relative">
              <select name="gender" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                <option value="" disabled selected>Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <ChevronRight className="absolute right-4 top-3.5 text-slate-400 rotate-90 pointer-events-none" size={20} />
            </div>
          </div>
        </div>

        <div>
          <FormFieldLabel icon={Briefcase} label="Previous Role (if any)" />
          <MultiSelectDropdown 
            options={PREVIOUS_ROLES} 
            selected={selectedRoles} 
            onChange={setSelectedRoles} 
            placeholder="Select roles..." 
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white cursor-pointer flex justify-between items-center transition-all focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <FormFieldLabel icon={Mail} label="Email Address" />
          <input name="email" type="email" required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="you@example.com" />
        </div>

        <div>
          <FormFieldLabel icon={Lock} label="Password" />
          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Password Requirements */}
          {password.length > 0 && (
            <div className="mt-3 text-xs space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
              <div className={`flex items-center space-x-2 ${hasMinLen ? 'text-green-500' : 'text-slate-500'}`}>
                {hasMinLen ? <CheckCircle2 size={12} /> : <XCircle size={12} />}<span>At least 8 characters</span>
              </div>
              <div className={`flex items-center space-x-2 ${hasUpper ? 'text-green-500' : 'text-slate-500'}`}>
                {hasUpper ? <CheckCircle2 size={12} /> : <XCircle size={12} />}<span>At least 1 uppercase letter</span>
              </div>
              <div className={`flex items-center space-x-2 ${hasNumber ? 'text-green-500' : 'text-slate-500'}`}>
                {hasNumber ? <CheckCircle2 size={12} /> : <XCircle size={12} />}<span>At least 1 number</span>
              </div>
              <div className={`flex items-center space-x-2 ${hasSpecial ? 'text-green-500' : 'text-slate-500'}`}>
                {hasSpecial ? <CheckCircle2 size={12} /> : <XCircle size={12} />}<span>At least 1 special character</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <FormFieldLabel icon={Lock} label="Confirm Password" />
          <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" placeholder="••••••••" />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center space-x-1"><XCircle size={12} /><span>Passwords do not match</span></p>
          )}
        </div>

        <button type="submit" disabled={!isSecure || !passwordsMatch} className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg mt-2 tracking-wide ${isSecure && passwordsMatch ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}`}>
          Create Account
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Already have an account? <button onClick={onSwitchToSignIn} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign in</button>
        </p>
      </div>
    </AuthContainer>
  );
};

export default function App() {
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgotPassword' | '400' | '404' | 'app'>('signin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({
    name: "Tharun G",
    email: "tarun.ganapathi2007@gmail.com",
    phone: "+91-8056300117",
    department: "CSE",
    graduationYear: "2015"
  });

  // Sync dark mode to the HTML document element so Tailwind's dark: classes work globally
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle URL paths for 404/400
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/400') {
      setAuthView('400');
    } else if (path === '/404' || (path !== '/' && !path.startsWith('/api'))) {
      setAuthView('404');
    }
  }, []);

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'eligibility', label: 'Eligibility', icon: ClipboardCheck },
    { id: 'apply', label: 'Apply', icon: FileEdit },
    { id: 'applications', label: 'My Apps', icon: FolderOpen },
    { id: 'admin', label: 'Admin Review', icon: ShieldCheck },
    { id: 'ec', label: 'EC Panel', icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'eligibility': return <EligibilityScreen userProfile={userProfile} />;
      case 'apply': return <ApplyScreen userProfile={userProfile} />;
      case 'applications': return <MyApplicationsScreen userProfile={userProfile} />;
      case 'admin': return <AdminReviewScreen />;
      case 'ec': return <ECScreen />;
      default: return <DashboardScreen />;
    }
  };

  if (authView === 'signin') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <SignInScreen onSignIn={(userData: any) => {
          setUserProfile(userData);
          setAuthView('app');
        }} onSwitchToSignUp={() => setAuthView('signup')} onSwitchToForgotPassword={() => setAuthView('forgotPassword')} />
      </div>
    );
  }

  if (authView === 'signup') {
    return (
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        <SignUpScreen onSignUp={(profileData: any) => {
          setUserProfile(profileData);
          setAuthView('app');
        }} onSwitchToSignIn={() => setAuthView('signin')} />
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
    <>
      <div className="min-h-screen font-sans selection:bg-indigo-500/30 text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-500">
        <BackgroundBlobs />
        
        {/* Top Navigation */}
        <nav className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Award className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight hidden sm:block">EMS<span className="text-indigo-500 dark:text-indigo-400">.Alumni</span></span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-2 bg-white/50 dark:bg-slate-900/40 p-1.5 rounded-full border border-slate-200 dark:border-white/5 shadow-inner">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 z-10 ${
                  activeTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-300' : ''} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-full border border-slate-200 dark:border-white/10 -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="clay-icon w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-10 h-10 clay-icon border-2 border-indigo-500/50 text-indigo-600 dark:text-indigo-400">
              <UserCheck size={18} />
            </div>
            <button onClick={() => setAuthView('signin')} className="clay-icon w-10 h-10 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label="Log Out">
              <LogOut size={18} />
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-6 py-10 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Mobile nav fallback */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-panel !rounded-none !border-x-0 !border-b-0 p-4 flex justify-between z-50">
           {TABS.slice(0, 5).map((tab) => (
               <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                 activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-white/10 shadow-sm' : 'text-slate-500 dark:text-slate-400'
               }`}
             >
               <tab.icon size={20} className="mb-1" />
               <span className="text-[10px] font-medium">{tab.label.split(' ')[0]}</span>
             </button>
           ))}
        </div>
      </div>
    </>
  );
}
