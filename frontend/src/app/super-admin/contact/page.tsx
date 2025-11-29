'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Mail, Building2, User, Phone, FileText, Calendar, Search, Filter, CheckCircle2, Clock, XCircle, Archive, Loader2, RefreshCw } from 'lucide-react';
import { api, ContactRequest } from '@/lib/api';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SuperAdminContactPage() {
  const { isDark, mounted, themeClasses, accentGradientClass } = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ContactRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);

  useEffect(() => {
    fetchContactRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [contactRequests, searchTerm, statusFilter]);

  const fetchContactRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching contact requests...');
      const requests = await api.getContactRequests();
      console.log('Received contact requests:', requests);
      // Ensure we have an array
      if (Array.isArray(requests)) {
        setContactRequests(requests);
        console.log(`Loaded ${requests.length} contact requests`);
      } else {
        console.error('Unexpected response format:', requests);
        setContactRequests([]);
      }
    } catch (err: any) {
      console.error('Error fetching contact requests:', err);
      setError(err.message || 'Failed to load contact requests');
      setContactRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (!Array.isArray(contactRequests)) {
      setFilteredRequests([]);
      return;
    }
    let filtered = [...contactRequests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.institution_name.toLowerCase().includes(searchLower) ||
        req.contact_name.toLowerCase().includes(searchLower) ||
        req.contact_email.toLowerCase().includes(searchLower) ||
        (req.message && req.message.toLowerCase().includes(searchLower))
      );
    }

    setFilteredRequests(filtered);
  };

  const updateRequestStatus = async (id: number, status: string) => {
    try {
      await api.updateContactRequest(id, { status: status as any });
      await fetchContactRequests();
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, status: status as any });
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      contacted: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Mail },
      demo_scheduled: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Calendar },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
      archived: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Archive },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const backgroundClass = themeClasses.background;
  const textColorClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextColorClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBgClass = themeClasses.card;

  if (loading) {
    return (
      <div className={`min-h-screen ${backgroundClass} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className={textColorClass}>Loading contact requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${backgroundClass} flex items-center justify-center p-4`}>
        <div className={`${cardBgClass} rounded-2xl p-8 max-w-md w-full text-center`}>
          <p className={`text-red-500 mb-4 ${textColorClass}`}>{error}</p>
          <button
            onClick={fetchContactRequests}
            className={`px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r ${accentGradientClass} text-white hover:opacity-90`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${backgroundClass} transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${textColorClass}`}>Contact Requests</h1>
            <p className={mutedTextColorClass}>Manage institutional contact and demo requests</p>
          </div>
          <button
            onClick={fetchContactRequests}
            className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} ${textColorClass}`}
            title="Yenile"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardBgClass} rounded-2xl p-6 mb-6 backdrop-blur-xl shadow-xl`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedTextColorClass}`} />
              <input
                type="text"
                placeholder="Search by institution, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all ${
                  isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${mutedTextColorClass}`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl appearance-none focus:outline-none transition-all ${
                  isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {['all', 'pending', 'contacted', 'demo_scheduled', 'completed'].map((status) => {
            const count = !Array.isArray(contactRequests) ? 0 : status === 'all'
              ? contactRequests.length
              : contactRequests.filter(r => r.status === status).length;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`${cardBgClass} rounded-xl p-4 backdrop-blur-xl shadow-lg text-center`}
              >
                <p className={`text-2xl font-bold ${textColorClass}`}>{count}</p>
                <p className={`text-sm ${mutedTextColorClass} capitalize`}>
                  {status === 'all' ? 'Total' : status.replace('_', ' ')}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Requests List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} rounded-2xl p-12 text-center backdrop-blur-xl shadow-xl`}
              >
                <Mail className={`w-16 h-16 mx-auto mb-4 ${mutedTextColorClass}`} />
                <p className={`text-xl font-semibold mb-2 ${textColorClass}`}>No contact requests found</p>
                <p className={mutedTextColorClass}>
                  {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No requests have been submitted yet'}
                </p>
              </motion.div>
            ) : (
              filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedRequest(request)}
                  className={`${cardBgClass} rounded-2xl p-6 cursor-pointer backdrop-blur-xl shadow-xl border transition-all ${
                    selectedRequest?.id === request.id
                      ? isDark ? 'border-red-500/50 bg-red-500/10' : 'border-red-500 bg-red-50'
                      : isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 ${textColorClass}`}>{request.institution_name}</h3>
                      <p className={`text-sm ${mutedTextColorClass}`}>{request.institution_type_display || request.institution_type}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${mutedTextColorClass}`} />
                      <span className={`text-sm ${textColorClass}`}>{request.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className={`w-4 h-4 ${mutedTextColorClass}`} />
                      <span className={`text-sm ${textColorClass}`}>{request.contact_email}</span>
                    </div>
                    {request.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className={`w-4 h-4 ${mutedTextColorClass}`} />
                        <span className={`text-sm ${textColorClass}`}>{request.contact_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 ${mutedTextColorClass}`} />
                      <span className={`text-sm ${textColorClass}`}>
                        {request.request_type_display || request.request_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${mutedTextColorClass}`} />
                      <span className={`text-sm ${mutedTextColorClass}`}>
                        {new Date(request.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl sticky top-6`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${textColorClass}`}>Request Details</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${textColorClass}`}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Institution
                    </label>
                    <p className={textColorClass}>{selectedRequest.institution_name}</p>
                    <p className={`text-sm ${mutedTextColorClass}`}>
                      {selectedRequest.institution_type_display || selectedRequest.institution_type}
                    </p>
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Contact Person
                    </label>
                    <p className={textColorClass}>{selectedRequest.contact_name}</p>
                    <p className={`text-sm ${mutedTextColorClass}`}>{selectedRequest.contact_email}</p>
                    {selectedRequest.contact_phone && (
                      <p className={`text-sm ${mutedTextColorClass}`}>{selectedRequest.contact_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Request Type
                    </label>
                    <p className={textColorClass}>
                      {selectedRequest.request_type_display || selectedRequest.request_type}
                    </p>
                  </div>

                  {selectedRequest.message && (
                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                        Message
                      </label>
                      <p className={`text-sm ${textColorClass} whitespace-pre-wrap`}>{selectedRequest.message}</p>
                    </div>
                  )}

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Status
                    </label>
                    <div className="mb-3">{getStatusBadge(selectedRequest.status)}</div>
                    <select
                      value={selectedRequest.status}
                      onChange={(e) => updateRequestStatus(selectedRequest.id, e.target.value)}
                      className={`w-full p-2 rounded-lg focus:outline-none transition-all ${
                        isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="demo_scheduled">Demo Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wide ${mutedTextColorClass} mb-1 block`}>
                      Submitted
                    </label>
                    <p className={`text-sm ${mutedTextColorClass}`}>
                      {new Date(selectedRequest.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBgClass} rounded-2xl p-6 backdrop-blur-xl shadow-xl text-center`}
              >
                <FileText className={`w-12 h-12 mx-auto mb-4 ${mutedTextColorClass}`} />
                <p className={mutedTextColorClass}>Select a request to view details</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

