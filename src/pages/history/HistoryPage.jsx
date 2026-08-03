import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { scannerService } from '../../services/scanner.service';
import { formatDate, formatRelativeTime, getScoreColor, getScoreVariant } from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

const HistoryPage = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        const res = await scannerService.getUserScans(user?.id);
        const list = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
        setScans(list);
      } catch (error) {
        console.error('Error fetching scan history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [user?.id]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scan report?')) {
      await scannerService.deleteScan(id);
      setScans(scans.filter(scan => scan.id !== id));
    }
  };

  const filteredAndSortedScans = scans
    .filter(scan => {
      const urlStr = scan.url || '';
      const scoreNum = typeof scan.score === 'number' ? scan.score : (scan.overallScore || 0);
      const matchesSearch = urlStr.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || 
                           (statusFilter === 'Completed' && scoreNum > 0) ||
                           (statusFilter === 'Failed' && scoreNum === 0);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || Date.now());
      const dateB = new Date(b.date || b.createdAt || Date.now());
      const scoreA = typeof a.score === 'number' ? a.score : (a.overallScore || 0);
      const scoreB = typeof b.score === 'number' ? b.score : (b.overallScore || 0);

      if (sortBy === 'Newest') return dateB - dateA;
      if (sortBy === 'Oldest') return dateA - dateB;
      if (sortBy === 'Score') return scoreB - scoreA;
      return 0;
    });

  const stats = {
    total: scans.length,
    average: scans.length ? Math.round(scans.reduce((acc, curr) => acc + (typeof curr.score === 'number' ? curr.score : (curr.overallScore || 0)), 0) / scans.length) : 0,
    latest: scans.length ? Math.max(...scans.map(s => new Date(s.date || s.createdAt || Date.now()).getTime())) : null
  };

  return (
    <div className="container p-6 flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scan History</h1>
          <p className="text-secondary mt-1">Review all your previous website analysis reports.</p>
        </div>
        <Link to="/#scan">
          <Button variant="primary">New Scan</Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-sm text-secondary">Total Scans</span>
          <span className="text-2xl font-bold mt-1">{stats.total}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-sm text-secondary">Average Score</span>
          <span className={`text-2xl font-bold mt-1 ${getScoreColor(stats.average)}`}>
            {stats.average}/100
          </span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-sm text-secondary">Last Scan</span>
          <span className="text-2xl font-bold mt-1 text-base">
            {stats.latest ? formatRelativeTime(new Date(stats.latest)) : 'Never'}
          </span>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <select 
            className="flex-1 md:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
          
          <select 
            className="flex-1 md:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary transition-colors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
            <option value="Score">Highest Score</option>
          </select>
        </div>
      </Card>

      {/* Scans List */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : filteredAndSortedScans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium text-sm text-secondary">Website</th>
                  <th className="p-4 font-medium text-sm text-secondary">Date</th>
                  <th className="p-4 font-medium text-sm text-secondary">Score</th>
                  <th className="p-4 font-medium text-sm text-secondary">Status</th>
                  <th className="p-4 font-medium text-sm text-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredAndSortedScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                          {scan.url.replace(/^https?:\/\/(www\.)?/, '').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px] md:max-w-[300px]">{scan.url}</span>
                          <a href={scan.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Visit site <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDate(scan.date)}</span>
                        <span className="text-xs text-secondary">{formatRelativeTime(scan.date)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {scan.score > 0 ? (
                        <Badge variant={getScoreVariant(scan.score)} className="px-2 py-1">
                          {scan.score}/100
                        </Badge>
                      ) : (
                        <span className="text-secondary text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={scan.score > 0 ? 'success' : 'danger'}>
                        {scan.score > 0 ? 'Completed' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/report/${scan.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        <button 
                          onClick={() => handleDelete(scan.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12">
            <EmptyState 
              title="No scans found"
              description={searchTerm ? "Try adjusting your filters or search term." : "You haven't run any website scans yet."}
              action={!searchTerm && <Link to="/#scan"><Button variant="primary">Start Analysis</Button></Link>}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
