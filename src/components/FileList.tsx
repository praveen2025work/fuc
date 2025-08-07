import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { FileUpload, UploadFilters } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { Files, Download, Share2, Search, Calendar, RefreshCw, User, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FileListProps {
  refreshTrigger?: number;
}

const FileList: React.FC<FileListProps> = ({ refreshTrigger }) => {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<UploadFilters>({});
  const [shareUserId, setShareUserId] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  const fetchFiles = async (customFilters?: UploadFilters) => {
    if (!isAuthenticated) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const filtersToUse = customFilters !== undefined ? customFilters : filters;
      const response = await apiService.getUploads(filtersToUse);
      if (response.status === 'success' && response.data) {
        setFiles(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch files');
      }
    } catch (error: any) {
      console.error('Fetch files error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger, isAuthenticated]);

  const handleFilterChange = (key: keyof UploadFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleSearch = () => {
    fetchFiles();
  };

  const handleClearFilter = (key: keyof UploadFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    // Automatically trigger search with the new filters
    fetchFiles(newFilters);
  };

  const handleClearAllFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    // Automatically trigger search with empty filters
    fetchFiles(emptyFilters);
  };

  const hasActiveFilters = () => {
    return Object.keys(filters).some(key => filters[key as keyof UploadFilters]);
  };

  const handleDownload = async (file: FileUpload) => {
    try {
      const blob = await apiService.downloadFile(file.filename);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${file.filename}`);
      // Refresh the list to update download count
      fetchFiles();
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || error.message || 'Download failed');
    }
  };

  const handleShare = async () => {
    if (!selectedFileId || !shareUserId.trim()) {
      toast.error('Please enter a user ID to share with');
      return;
    }

    try {
      const response = await apiService.shareFile(selectedFileId, {
        shared_with: shareUserId.trim(),
      });
      if (response.status === 'success') {
        toast.success(response.message || 'File shared successfully');
        setShareDialogOpen(false);
        setShareUserId('');
        setSelectedFileId(null);
      } else {
        throw new Error(response.message || 'Share failed');
      }
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error(error.response?.data?.message || error.message || 'Share failed');
    }
  };

  const openShareDialog = (fileId: number) => {
    setSelectedFileId(fileId);
    setShareDialogOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Files className="w-5 h-5" />
            File List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication Warning */}
          {!isAuthenticated && (
            <div className="p-4 bg-muted/50 border border-muted rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Authentication required to view and manage files</span>
              </div>
            </div>
          )}

          {/* Filters - Single Row Layout */}
          <div className={`${!isAuthenticated ? 'opacity-50' : ''}`}>
            <div className="flex flex-wrap items-end gap-3">
              {/* From Date */}
              <div className="flex flex-col min-w-0">
                <Label htmlFor="fromDate" className="text-xs mb-1 text-muted-foreground">From Date</Label>
                <div className="relative">
                  <Input
                    id="fromDate"
                    type="date"
                    value={filters.from_date || ''}
                    onChange={(e) => handleFilterChange('from_date', e.target.value)}
                    disabled={!isAuthenticated}
                    className="w-36 h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {filters.from_date && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearFilter('from_date')}
                      disabled={!isAuthenticated}
                      className="absolute -right-1 -top-1 h-5 w-5 p-0 text-muted-foreground hover:text-foreground bg-background border border-border rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* To Date */}
              <div className="flex flex-col min-w-0">
                <Label htmlFor="toDate" className="text-xs mb-1 text-muted-foreground">To Date</Label>
                <div className="relative">
                  <Input
                    id="toDate"
                    type="date"
                    value={filters.to_date || ''}
                    onChange={(e) => handleFilterChange('to_date', e.target.value)}
                    disabled={!isAuthenticated}
                    className="w-36 h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {filters.to_date && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearFilter('to_date')}
                      disabled={!isAuthenticated}
                      className="absolute -right-1 -top-1 h-5 w-5 p-0 text-muted-foreground hover:text-foreground bg-background border border-border rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Search Filename */}
              <div className="flex flex-col flex-1 min-w-0">
                <Label htmlFor="search" className="text-xs mb-1 text-muted-foreground">Search Filename</Label>
                <div className="relative">
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search files..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    disabled={!isAuthenticated}
                    className="h-9 text-sm pr-8 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  {filters.search && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearFilter('search')}
                      disabled={!isAuthenticated}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-auto">
                {hasActiveFilters() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllFilters}
                    disabled={!isAuthenticated}
                    className="h-9 hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  onClick={handleSearch}
                  disabled={!isAuthenticated || loading}
                  size="sm"
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-1" />
                  )}
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Files Table */}
          <div className="rounded-lg border bg-background/50 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Upload Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Loading files...
                          </div>
                        ) : (
                          'No files found'
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((file, index) => (
                      <motion.tr
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <Badge variant="outline">{file.id}</Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {file.filename}
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>{formatDate(file.upload_time)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {file.user_id}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs">
                          {file.file_location}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{file.download_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(file)}
                              className="hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openShareDialog(file.id)}
                              className="hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareUserId">Share with User ID</Label>
              <Input
                id="shareUserId"
                type="text"
                placeholder="Enter user ID to share with"
                value={shareUserId}
                onChange={(e) => setShareUserId(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShareDialogOpen(false);
                  setShareUserId('');
                  setSelectedFileId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={!shareUserId.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FileList;