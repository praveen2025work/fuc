import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, LogOut, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { HealthData } from '@/types/api';
import UserProfile from '@/components/UserProfile';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setHealthStatus('checking');
    try {
      const response = await apiService.checkHealth();
      if (response.status === 'success' && response.data) {
        setHealthData(response.data);
        setHealthStatus(response.data.server === 'running' ? 'online' : 'offline');
        setLastChecked(new Date());
      } else {
        setHealthStatus('error');
      }
    } catch (error) {
      setHealthStatus('error');
      setHealthData(null);
    }
  };

  useEffect(() => {
    // Check health on component mount
    checkHealth();
    
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'checking':
        return <Activity className="w-4 h-4 animate-pulse text-muted-foreground" />;
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getHealthTooltip = () => {
    switch (healthStatus) {
      case 'checking':
        return 'Checking server status...';
      case 'online':
        return `Server is online${lastChecked ? ` (Last checked: ${lastChecked.toLocaleTimeString()})` : ''}`;
      case 'offline':
        return `Server is offline${lastChecked ? ` (Last checked: ${lastChecked.toLocaleTimeString()})` : ''}`;
      case 'error':
        return 'Unable to check server status';
      default:
        return 'Unknown server status';
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50"
    >
      <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-primary">File Upload Center</h1>
        </div>

        {/* Health Status and User Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4"
        >
          {/* Health Status Icon */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkHealth}
                  className="p-2 hover:bg-muted/50 transition-colors"
                >
                  {getHealthIcon()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{getHealthTooltip()}</p>
                {healthData && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div>Debug Mode: {healthData.debug_mode ? 'Enabled' : 'Disabled'}</div>
                    <div>Click to refresh status</div>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {user ? (
            <>
              <div className="hidden sm:block">
                <UserProfile />
              </div>
              
              <div className="sm:hidden">
                <Badge variant="secondary" className="text-xs">
                  {user.displayName}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Not Authenticated
            </Badge>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;