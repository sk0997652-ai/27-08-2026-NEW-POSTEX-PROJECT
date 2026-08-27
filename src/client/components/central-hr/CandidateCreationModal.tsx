import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  Sparkles,
  Building2,
  GitBranch,
  Calendar,
  Layers,
  Phone,
  Mail,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Bell,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';
import { CandidateTrack, UserRole } from '../../../types';

interface CandidateCreationModalProps {
  onClose: () => void;
  onSuccess: (candidate: any) => void;
  currentUserRole: UserRole;
}

export const CandidateCreationModal: React.FC<CandidateCreationModalProps> = ({
  onClose,
  onSuccess,
  currentUserRole
}) => {
  const [zones, setZones] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState('');
  const [mobile, setMobile] = useState('+92-3');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1998-05-15');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [maritalStatus, setMaritalStatus] = useState<'SINGLE' | 'MARRIED' | 'OTHER'>('SINGLE');
  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDesigId, setSelectedDesigId] = useState('');
  const [expectedJoiningDate, setExpectedJoiningDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [track, setTrack] = useState<CandidateTrack>('NON_EXECUTIVE');

  // Preview generated joining ID
  const [previewJoiningId] = useState(`PX-JOIN-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        const [zRes, bRes, dRes, dgRes] = await Promise.all([
          fetch('/api/organization/zones'),
          fetch('/api/organization/branches'),
          fetch('/api/organization/departments'),
          fetch('/api/organization/designations')
        ]);

        const [zData, bData, dData, dgData] = await Promise.all([
          zRes.json(),
          bRes.json(),
          dRes.json(),
          dgRes.json()
        ]);

        setZones(zData || []);
        setBranches(bData || []);
        setDepartments(dData || []);
        setDesignations(dgData || []);

        if (zData && zData.length > 0) {
          setSelectedZoneId(zData[0].id);
        }
        if (dData && dData.length > 0) {
          setSelectedDeptId(dData[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load organizational hierarchy options');
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, []);

  // Filter branches when selected zone changes
  const filteredBranches = branches.filter(b => !selectedZoneId || b.zoneId === selectedZoneId);

  useEffect(() => {
    if (filteredBranches.length > 0) {
      setSelectedBranchId(filteredBranches[0].id);
    } else {
      setSelectedBranchId('');
    }
  }, [selectedZoneId, branches]);

  // Filter designations by department
  const filteredDesignations = designations.filter(
    dg => !selectedDeptId || dg.departmentId === selectedDeptId
  );

  useEffect(() => {
    if (filteredDesignations.length > 0) {
      setSelectedDesigId(filteredDesignations[0].id);
    } else {
      setSelectedDesigId('');
    }
  }, [selectedDeptId, designations]);

  // CNIC Auto-Formatter
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.substring(0, 13);
    
    // Format: 12345-1234567-1
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5, 12)}-${val.substring(12, 13)}`;
    }
    setCnic(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName.trim() || !lastName.trim() || !fatherName.trim()) {
      setError('Please fill in candidate full name and father name');
      return;
    }

    if (!cnic || cnic.length < 15) {
      setError('Valid 13-digit CNIC is required (e.g. 35201-1234567-1)');
      return;
    }

    if (!selectedZoneId || !selectedBranchId || !selectedDeptId || !selectedDesigId) {
      setError('Please select complete Zone, Branch, Department, and Designation');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/central-hr/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          fatherName,
          cnic,
          mobile,
          email: email || `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@postex-onboard.pk`,
          dateOfBirth,
          gender,
          maritalStatus,
          currentAddress: currentAddress || 'House 24, Street 8, Lahore',
          permanentAddress: permanentAddress || currentAddress || 'House 24, Street 8, Lahore',
          zoneId: selectedZoneId,
          branchId: selectedBranchId,
          departmentId: selectedDeptId,
          designationId: selectedDesigId,
          expectedJoiningDate,
          track
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create candidate');
      }

      onSuccess(data.candidate);
    } catch (err: any) {
      setError(err.message || 'An error occurred during candidate registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Register New PostEx Candidate</h2>
              <p className="text-xs text-slate-400">Central HR Candidate Onboarding & Track Assignment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Joining ID Preview Card */}
          <div className="bg-gradient-to-r from-rose-50 to-indigo-50 border border-rose-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900">Auto-Generated Joining ID</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">A unique identifier will be issued upon form submission.</p>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-lg border border-rose-200 shadow-xs font-mono font-bold text-sm text-slate-900">
              {previewJoiningId}
            </div>
          </div>

          {/* Track Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Employment Track *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTrack('NON_EXECUTIVE')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  track === 'NON_EXECUTIVE'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase">Non-Executive Track</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-sm uppercase">Operations</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Couriers, Last-Mile Riders, Sorters, Warehouse Staff, Security Guards.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTrack('EXECUTIVE')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  track === 'EXECUTIVE'
                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase">Executive Track</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-sm uppercase">Corporate</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Branch Managers, Zonal Officers, Team Leads, Software Engineers, Finance.
                </p>
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
              <User className="w-3.5 h-3.5 text-rose-600" />
              <span>1. Personal & Identity Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asim"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Munir"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Father's Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Munir Ahmed"
                  value={fatherName}
                  onChange={e => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">CNIC Number (13-Digit) *</label>
                <input
                  type="text"
                  required
                  placeholder="35201-1234567-1"
                  value={cnic}
                  onChange={handleCnicChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+92-300-1234567"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Marital Status</label>
                <select
                  value={maritalStatus}
                  onChange={e => setMaritalStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Residential Address *</label>
              <input
                type="text"
                placeholder="House / Street / City"
                value={currentAddress}
                onChange={e => setCurrentAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Organizational Mapping */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Organizational Deployment & Hierarchy</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Operational Zone *</label>
                <select
                  value={selectedZoneId}
                  onChange={e => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Branch Facility *</label>
                <select
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  {filteredBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department *</label>
                <select
                  value={selectedDeptId}
                  onChange={e => setSelectedDeptId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Designation Title *</label>
                <select
                  value={selectedDesigId}
                  onChange={e => setSelectedDesigId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  {filteredDesignations.map(dg => (
                    <option key={dg.id} value={dg.id}>{dg.title} ({dg.grade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expected Joining Date</label>
                <input
                  type="date"
                  value={expectedJoiningDate}
                  onChange={e => setExpectedJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Notification Placeholders Preview Banner */}
          <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Automated Notification Dispatch Triggers</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span>SMS Welcome</span>
                </div>
                <p className="text-slate-500 text-[10px]">Sends OTP & Joining ID to candidate mobile.</p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-indigo-600" />
                  <span>Formal Offer Email</span>
                </div>
                <p className="text-slate-500 text-[10px]">Sends onboarding guidelines and checklist.</p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <GitBranch className="w-3 h-3 text-rose-600" />
                  <span>BM Physical Verification Alert</span>
                </div>
                <p className="text-slate-500 text-[10px]">Alerts BM inbox to conduct physical verification.</p>
              </div>
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loadingLookups}
            className="inline-flex items-center space-x-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Candidate...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enrol & Issue Joining ID</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
