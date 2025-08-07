import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { HealthData } from '@/types/api';
import { Activity, Server, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const HealthCheck: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await apiService.checkHealth();
      if (response.status === 'success' && response.data) {
        setHealthData(response.data);
        setLastChecked(new Date());
        toast.success('Server health check completed');
      } else {
        throw new Error(response.message || 'Health check failed');
      }
    } catch (error: any) {
      console.error('Health check error:', error);
      setHealthData(null);
      toast.error(error.response?.data?.message || error.message || 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  const getServerStatus = () => {
    if (!healthData) return null;
    
    const isRunning = healthData.server === 'running';
    return {
      status: isRunning ? 'online' : 'offline',
      color: isRunning ? 'text-green-500' : 'text-red-500',
      icon: isRunning ? CheckCircle : XCircle,
      badge: isRunning ? 'success' : 'destructive',
    };
  };

  const serverStatus = getServerStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Activity className="w-5 h-5" />
            Server Health Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Health Check Button */}
          <Button
            onClick={checkHealth}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Server className="w-4 h-4 mr-2" />
                Check Server Status
              </>
            )}
          </Button>

          {/* Health Status Display */}
          {healthData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 p-4 rounded-lg bg-background/50 border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Server Status</span>
                <div className="flex items-center gap-2">
                  {serverStatus && (
                    <>
                      <serverStatus.icon className={`w-4 h-4 ${serverStatus.color}`} />
                      <Badge 
                        variant={serverStatus.badge as any}
                        className="capitalize"
                      >
                        {serverStatus.status}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Debug Mode</span>
                <Badge 
                  variant={healthData.debug_mode ? "secondary" : "outline"}
                  className="capitalize"
                >
                  {healthData.debug_mode ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {lastChecked && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Last Checked</span>
                  <span className="text-sm text-foreground">
                    {lastChecked.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* API Configuration Info */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
            <h4 className="text-sm font-medium text-foreground">API Configuration</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Base URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</div>
              <div>Client Origin: http://localhost:3001</div>
              <div>Max File Size: 100MB</div>
              <div>Allowed Types: .png, .jpg, .jpeg, .pdf</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HealthCheck;