import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileLocation, setFileLocation] = useState(API_CONFIG.defaultFileLocation);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!API_CONFIG.allowedFileTypes.includes(fileExtension)) {
      toast.error(`Invalid file type. Allowed types: ${API_CONFIG.allowedFileTypes.join(', ')}`);
      return false;
    }
    if (file.size > API_CONFIG.maxFileSize) {
      toast.error(`File size exceeds ${API_CONFIG.maxFileSize / (1024 * 1024)}MB limit`);
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
    if (!selectedFile || !fileLocation.trim()) {
      toast.error('Please select a file and specify a location');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiService.uploadFile(selectedFile, fileLocation.trim());
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.status === 'success' && response.data) {
        toast.success(
          `File uploaded successfully! Upload ID: ${response.data.upload_id}`,
          {
            description: `Filename: ${response.data.filename}`,
          }
        );
        setSelectedFile(null);
        setFileLocation(API_CONFIG.defaultFileLocation);
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

          {/* Compact Upload Row */}
          <div className="flex gap-3 items-start">
            {/* File Drop Zone - Compact */}
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
                accept={API_CONFIG.allowedFileTypes.join(',')}
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
                      {API_CONFIG.allowedFileTypes.join(', ')} (max {API_CONFIG.maxFileSize / (1024 * 1024)}MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* File Location Input - Compact */}
            <div className="w-64">
              <Input
                type="text"
                value={fileLocation}
                onChange={(e) => setFileLocation(e.target.value)}
                placeholder="File location path"
                disabled={!isAuthenticated}
                className="h-[80px] text-sm"
              />
            </div>

            {/* Upload Button - Compact */}
            <Button
              onClick={handleUpload}
              disabled={!isAuthenticated || !selectedFile || !fileLocation.trim() || isUploading}
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