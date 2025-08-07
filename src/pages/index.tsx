import React, { useState } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import UploadForm from "@/components/UploadForm";
import FileList from "@/components/FileList";
import HealthCheck from "@/components/HealthCheck";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showHealth, setShowHealth] = useState(false);

  const handleUploadSuccess = () => {
    // Trigger file list refresh
    setRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>File Upload Center - Loading</title>
          <meta name="description" content="Secure file upload and management system" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Authenticating...</p>
          </motion.div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>File Upload Center - Authentication Error</title>
          <meta name="description" content="Secure file upload and management system" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 max-w-md mx-auto p-6"
          >
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Authentication Failed</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </motion.div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return null; // This shouldn't happen with the new auth flow, but just in case
  }

  return (
    <>
      <Head>
        <title>File Upload Center</title>
        <meta name="description" content="Secure file upload and management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Health Check Toggle */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHealth(!showHealth)}
                className="flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                {showHealth ? 'Hide' : 'Show'} Health Status
              </Button>
            </div>

            {/* Health Check Section */}
            {showHealth && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <HealthCheck />
              </motion.div>
            )}

            {/* Upload and Files Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Upload Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <UploadForm onUploadSuccess={handleUploadSuccess} />
              </motion.div>

              {/* File List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <FileList refreshTrigger={refreshTrigger} />
              </motion.div>
            </div>
          </motion.div>
        </main>

        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </div>
    </>
  );
}
