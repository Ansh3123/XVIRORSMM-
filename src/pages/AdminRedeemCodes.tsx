import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { FALLBACK_REDEEM_CODES } from '../data/raw_redeem_codes_fallback';
import { 
  Key, 
  Check, 
  Copy, 
  Search, 
  Filter, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface RedeemCode {
  code: string;
  amount: number;
  status: 'Available' | 'Redeemed';
  createdAt?: number;
  redeemedAt?: number;
  redeemedBy?: string;
}

const DENOMINATIONS = [10, 20, 30, 50, 100, 200, 500, 1000];

export default function AdminRedeemCodes() {
  const { user, userData, loading: authLoading } = useAuth();
  const isSpecialAdmin = user?.email?.toLowerCase().trim() === 'isanshcool@gmail.com';
  const isAdmin = userData?.role === 'admin' || isSpecialAdmin;

  const { showToast } = useToast();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filters state
  const [selectedDenom, setSelectedDenom] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'Redeemed'>('all');

  const fetchCodes = async (silent = false) => {
    if (!isAdmin) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const q = query(collection(db, 'redeemCodes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedCodes: RedeemCode[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedCodes.push({
          code: doc.id,
          amount: data.amount || 0,
          status: data.status || 'Available',
          createdAt: data.createdAt,
          redeemedAt: data.redeemedAt,
          redeemedBy: data.redeemedBy
        });
      });

      // Sort by denomination first, then status
      fetchedCodes.sort((a, b) => {
        if (a.amount !== b.amount) return a.amount - b.amount;
        return a.status.localeCompare(b.status);
      });

      if (fetchedCodes.length === 0) {
        // Fallback to static codes so they are instantly visible and ready to copy
        const mappedFallback: RedeemCode[] = FALLBACK_REDEEM_CODES.map(c => ({
          code: c.code,
          amount: c.amount,
          status: c.status
        }));
        setCodes(mappedFallback);
      } else {
        setCodes(fetchedCodes);
      }
    } catch (err: any) {
      console.error('Error fetching redeem codes:', err);
      showToast('error', 'Failed to load redeem codes: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCodes();
    }
  }, [isAdmin]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/admin/seed-redeem-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminEmail: user?.email || userData?.email || ''
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        showToast('success', result.message || 'Successfully seeded codes!');
        await fetchCodes();
      } else {
        showToast('error', result.message || 'Failed to seed codes');
      }
    } catch (err: any) {
      console.error('Seeding Error:', err);
      showToast('error', 'Seeding failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('success', 'Code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Grouping and counters calculation
  const totalCount = codes.length;
  const availableCount = codes.filter(c => c.status === 'Available').length;
  const redeemedCount = codes.filter(c => c.status === 'Redeemed').length;
  const redeemedValue = codes.reduce((sum, c) => c.status === 'Redeemed' ? sum + c.amount : sum, 0);

  // Get availability stats per denomination
  const getDenomStats = (denom: number) => {
    const denomCodes = codes.filter(c => c.amount === denom);
    const total = denomCodes.length;
    const available = denomCodes.filter(c => c.status === 'Available').length;
    return { total, available };
  };

  // Filtered list
  const filteredCodes = codes.filter((c) => {
    const matchesDenom = selectedDenom === 'all' || c.amount === selectedDenom;
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.redeemedBy && c.redeemedBy.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesDenom && matchesSearch && matchesStatus;
  });

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-500">Loading redeem codes database...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-semibold">Access Denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Upper header action area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <Key className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Redeem Codes Management</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Generate, track, and monitor secure credits for ₹10 to ₹1000 denominations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchCodes(true)}
            disabled={refreshing || seeding}
            className="flex items-center justify-center bg-white border border-gray-300 rounded-lg p-2.5 text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {totalCount === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding 800 Codes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Seed 800 Codes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {totalCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Redeem Codes</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available Codes</p>
              <h3 className="text-2xl font-bold text-green-600">{availableCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Redeemed/Used</p>
              <h3 className="text-2xl font-bold text-red-600">{redeemedCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Disbursed Value</p>
              <h3 className="text-2xl font-bold text-amber-600">₹{redeemedValue.toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>
      )}

      {/* No codes seeded yet notice */}
      {totalCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12">
          <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Redeem Codes Not Found</h3>
          <p className="text-sm text-gray-600 mb-6">
            The database is currently empty. Click the button below to parse the pre-configured raw CSV containing all 800 codes across 8 denominations (₹10 to ₹1000) and upload them to Firestore.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {seeding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading & Seeding 800 Codes...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Initialize 800 Redeem Codes
              </>
            )}
          </button>
        </div>
      )}

      {totalCount > 0 && (
        <div className="space-y-6">
          {/* Denominations availability selector */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Grouped Denominations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
              <button
                onClick={() => setSelectedDenom('all')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedDenom === 'all' 
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-bold text-gray-800">All Denoms</p>
                <p className="text-xs text-gray-500 mt-1">{availableCount}/{totalCount} left</p>
              </button>

              {DENOMINATIONS.map((denom) => {
                const { total, available } = getDenomStats(denom);
                const isSelected = selectedDenom === denom;
                return (
                  <button
                    key={denom}
                    onClick={() => setSelectedDenom(denom)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-extrabold text-gray-900">₹{denom}</p>
                    <p className={`text-xs mt-1 font-medium ${available === 0 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                      {available}/{total} left
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters & search panel */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="pl-9 relative block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Search by redeem code or user's email/ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <span className="text-xs font-semibold text-gray-400 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1" />
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-gray-200 text-sm px-3 py-1.5 bg-white text-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Codes</option>
                <option value="Available">Available (🟢)</option>
                <option value="Redeemed">Redeemed (🔴)</option>
              </select>
            </div>
          </div>

          {/* Table display */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Redeem Code</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Denomination</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Redemption Info</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        No redeem codes match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((code) => (
                      <tr key={code.code} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-gray-900 font-bold tracking-tight bg-gray-50 border border-gray-200 px-2.5 py-1 rounded">
                              {code.code}
                            </span>
                            <button
                              onClick={() => handleCopy(code.code)}
                              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                              title="Copy code"
                            >
                              {copiedCode === code.code ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="font-semibold text-blue-600 font-mono">₹{code.amount}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {code.status === 'Available' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
                              Used / Redeemed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {code.createdAt ? new Date(code.createdAt).toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {code.status === 'Redeemed' ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center text-xs">
                                <span className="text-gray-400 mr-1.5">User ID:</span>
                                <span className="font-semibold text-gray-800 font-mono bg-gray-100 px-1 rounded truncate max-w-[140px] block" title={code.redeemedBy}>
                                  {code.redeemedBy}
                                </span>
                              </div>
                              <div className="text-xs font-mono text-gray-400">
                                {code.redeemedAt ? new Date(code.redeemedAt).toLocaleString('en-IN') : '-'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic text-xs">Unused</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Code count footer indicator */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Showing <strong>{filteredCodes.length}</strong> of <strong>{codes.length}</strong> codes</span>
              <span>All operations atomic</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
