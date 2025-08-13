import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Application, Location, ConfigData } from '@/types/api';
import { Upload, File, CheckCircle, AlertCircle, Folder, Building } from 'lucide-react';
import { toast } from 'sonner';

interface UploadFormProps {
  onUploadSuccess?: () => void;
  refreshTrigger?: number;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess, refreshTrigger }) => {
  const { isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [additionalPath, setAdditionalPath] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
      loadApplications();
    }
  }, [isAuthenticated]);

  // Load locations when application changes
  useEffect(() => {
    if (selectedApplication) {
      loadLocations(selectedApplication);
    } else {
      setLocations([]);
      setSelectedLocation(null);
    }
  }, [selectedApplication]);

  // Refresh applications when refreshTrigger changes
  useEffect(() => {
    if (isAuthenticated && refreshTrigger !== undefined) {
      loadApplications();
    }
  }, [refreshTrigger, isAuthenticated]);

  const loadConfig = async () => {
    try {
      const response = await apiService.getConfig();
      if (response.status === 'success' && response.data) {
        setConfig(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load config:', error);
      // Use default config if API fails
      setConfig({ allowed_extensions: [] });
    }
  };

  const loadApplications = async () => {
    setLoadingApplications(true);
    try {
      const response = await apiService.getApplications();
      if (response.status === 'success' && response.data) {
        setApplications(response.data);
      } else {
        throw new Error(response.message || 'Failed to load applications');
      }
    } catch (error: any) {
      console.error('Failed to load applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoadingApplications(false);
    }
  };

  const loadLocations = async (applicationId: number) => {
    setLoadingLocations(true);
    try {
      const response = await apiService.getApplicationLocations(applicationId);
      if (response.status === 'success' && response.data) {
        setLocations(response.data);
      } else {
        throw new Error(response.message || 'Failed to load locations');
      }
    } catch (error: any) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const validateFile = (file: File): boolean => {
    if (config && config.allowed_extensions.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && !config.allowed_extensions.includes(fileExtension)) {
        toast.error(`Invalid file type. Allowed types: ${config.allowed_extensions.join(', ')}`);
        return false;
      }
    }
    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size exceeds 100MB limit`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast.error('Please authenticate to upload files');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!isAuthenticated) {
      toast.error('Please authenticate to upload files');
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedApplication || !selectedLocation) {
      toast.error('Please select a file, application, and location');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiService.uploadFile(
        selectedFile, 
        selectedApplication, 
        selectedLocation, 
        additionalPath.trim() || undefined
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.status === 'success' && response.data) {
        toast.success(
          `File uploaded successfully! Upload ID: ${response.data.upload_id}`,
          {
            description: `Filename: ${response.data.filename}`,
          }
        );
        // Reset form
        setSelectedFile(null);
        setSelectedApplication(null);
        setSelectedLocation(null);
        setAdditionalPath('');
        setLocations([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onUploadSuccess?.();
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const getAcceptedFileTypes = (): string => {
    if (!config || config.allowed_extensions.length === 0) {
      return '*';
    }
    return config.allowed_extensions.map(ext => `.${ext}`).join(',');
  };

  const getFileTypeText = (): string => {
    if (!config || config.allowed_extensions.length === 0) {
      return 'All file types';
    }
    return config.allowed_extensions.join(', ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Authentication Warning */}
          {!isAuthenticated && (
            <div className="mb-3 p-2 bg-muted/50 border border-muted rounded-md">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Authentication required to upload files</span>
              </div>
            </div>
          )}

          {/* Upload Form Row */}
          <div className="flex gap-3 items-start">
            {/* File Drop Zone */}
            <div
              className={`flex-1 min-h-[80px] border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${
                dragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => isAuthenticated && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {selectedFile ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="p-2 bg-primary/10 rounded">
                    <File className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Drop file or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getFileTypeText()} (max 100MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Application Dropdown */}
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Application</Label>
              <Select
                value={selectedApplication?.toString() || ''}
                onValueChange={(value) => setSelectedApplication(parseInt(value))}
                disabled={!isAuthenticated || loadingApplications}
              >
                <SelectTrigger className="h-[60px]">
                  <SelectValue placeholder={loadingApplications ? "Loading..." : "Select application"} />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {app.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Dropdown */}
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1 block">Location</Label>
              <Select
                value={selectedLocation?.toString() || ''}
                onValueChange={(value) => setSelectedLocation(parseInt(value))}
                disabled={!isAuthenticated || !selectedApplication || loadingLocations}
              >
                <SelectTrigger className="h-[60px]">
                  <SelectValue placeholder={loadingLocations ? "Loading..." : "Select location"} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{location.location_name}</div>
                          <div className="text-xs text-muted-foreground">{location.path}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Path Input */}
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Additional Path</Label>
              <Input
                type="text"
                value={additionalPath}
                onChange={(e) => setAdditionalPath(e.target.value)}
                placeholder="Optional path"
                disabled={!isAuthenticated}
                className="h-[60px] text-sm"
              />
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!isAuthenticated || !selectedFile || !selectedApplication || !selectedLocation || isUploading}
              className="h-[80px] px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span className="text-xs">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-4 h-4" />
                  <span className="text-xs">Upload</span>
                </div>
              )}
            </Button>
          </div>

          {/* Upload Progress - Only when uploading */}
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1" />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UploadForm;