import React, { useState } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import UploadForm from "@/components/UploadForm";
import FileList from "@/components/FileList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading, error } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Authentication Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                      className="ml-4"
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}



            {/* Upload Form - Row on top */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <UploadForm onUploadSuccess={handleUploadSuccess} />
            </motion.div>

            {/* File List - Below upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <FileList refreshTrigger={refreshTrigger} />
            </motion.div>
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
