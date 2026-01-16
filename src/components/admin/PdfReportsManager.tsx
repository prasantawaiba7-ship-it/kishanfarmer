import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Trash2, Loader2, RefreshCw, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PdfReport {
  id: string;
  farmer_id: string;
  plot_id: string | null;
  report_type: string;
  title: string;
  crop_type: string | null;
  detected_issue: string | null;
  severity: string | null;
  file_url: string | null;
  status: string;
  metadata: any;
  created_at: string;
  farmer_name?: string;
}

export const PdfReportsManager = () => {
  const [reports, setReports] = useState<PdfReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdf_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch farmer names
      const farmerIds = [...new Set((data || []).map(r => r.farmer_id))];
      const { data: profiles } = await supabase
        .from('farmer_profiles')
        .select('id, full_name')
        .in('id', farmerIds);

      const reportsWithNames = (data || []).map(report => ({
        ...report,
        farmer_name: profiles?.find(p => p.id === report.farmer_id)?.full_name || 'Unknown'
      }));

      setReports(reportsWithNames);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (report: PdfReport) => {
    if (!confirm(`Delete report "${report.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('pdf_reports')
        .update({ status: 'deleted' })
        .eq('id', report.id);

      if (error) throw error;
      toast.success('Report deleted');
      fetchReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
      toast.error('Failed to delete report');
    }
  };

  const handleDownload = (report: PdfReport) => {
    if (report.file_url) {
      window.open(report.file_url, '_blank');
    } else {
      toast.error('No file available for download');
    }
  };

  const getSeverityBadge = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge className="bg-amber-500">Medium</Badge>;
      case 'low': return <Badge className="bg-green-500">Low</Badge>;
      default: return <Badge variant="outline">{severity || 'N/A'}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated': return <Badge className="bg-green-500">Generated</Badge>;
      case 'pending': return <Badge className="bg-amber-500">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'deleted': return <Badge variant="secondary">Deleted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.farmer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.detected_issue?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCrop = filterCrop === 'all' || report.crop_type === filterCrop;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesCrop && matchesStatus;
  });

  const uniqueCrops = [...new Set(reports.map(r => r.crop_type).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PDF Reports</h2>
          <p className="text-muted-foreground">View and manage generated crop analysis reports</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Crop Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                {uniqueCrops.map(crop => (
                  <SelectItem key={crop} value={crop!}>{crop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Reports ({filteredReports.length})
          </CardTitle>
          <CardDescription>Crop analysis and disease detection reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className={report.status === 'deleted' ? 'opacity-50' : ''}>
                      <TableCell className="text-sm">
                        {format(new Date(report.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{report.farmer_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{report.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{report.crop_type || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{report.detected_issue || '—'}</TableCell>
                      <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {report.file_url && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleDownload(report)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => window.open(report.file_url!, '_blank')}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {report.status !== 'deleted' && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(report)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
