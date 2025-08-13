import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Building2, FolderPlus, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { apiService } from '@/services/api';
import { Application, Location } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';

interface ApplicationManagerProps {
  onApplicationCreated?: () => void;
  onLocationCreated?: () => void;
}

export const ApplicationManager: React.FC<ApplicationManagerProps> = ({
  onApplicationCreated,
  onLocationCreated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for applications and locations
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppLocations, setSelectedAppLocations] = useState<{ [key: number]: Location[] }>({});
  const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set());
  
  // Form states
  const [newAppName, setNewAppName] = useState('');
  const [selectedAppForLocation, setSelectedAppForLocation] = useState<string>('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationPath, setNewLocationPath] = useState('');
  
  // Loading states
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState<Set<number>>(new Set());

  // Fetch applications on component mount
  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;
    
    setIsLoadingApps(true);
    try {
      const response = await apiService.getApplications();
      setApplications(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch applications',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingApps(false);
    }
  };

  const fetchLocationsForApp = async (appId: number) => {
    if (!user || selectedAppLocations[appId]) return;
    
    setLoadingLocations(prev => new Set(prev).add(appId));
    try {
      const response = await apiService.getApplicationLocations(appId);
      setSelectedAppLocations(prev => ({
        ...prev,
        [appId]: response.data
      }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch locations',
        variant: 'destructive',
      });
    } finally {
      setLoadingLocations(prev => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAppName.trim()) return;

    setIsCreatingApp(true);
    try {
      const response = await apiService.createApplication({ name: newAppName.trim() });
      
      toast({
        title: 'Success',
        description: `Application "${response.data.name}" created successfully`,
      });
      
      setNewAppName('');
      await fetchApplications();
      onApplicationCreated?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create application',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingApp(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAppForLocation || !newLocationName.trim() || !newLocationPath.trim()) return;

    const appId = parseInt(selectedAppForLocation);
    setIsCreatingLocation(true);
    
    try {
      const response = await apiService.createApplicationLocation(appId, {
        location_name: newLocationName.trim(),
        path: newLocationPath.trim(),
      });
      
      toast({
        title: 'Success',
        description: `Location "${response.data.location_name}" created successfully`,
      });
      
      setNewLocationName('');
      setNewLocationPath('');
      setSelectedAppForLocation('');
      
      // Refresh locations for the specific app
      setSelectedAppLocations(prev => ({
        ...prev,
        [appId]: undefined as any
      }));
      
      if (expandedApps.has(appId)) {
        await fetchLocationsForApp(appId);
      }
      
      onLocationCreated?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create location',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingLocation(false);
    }
  };

  const toggleAppExpansion = async (appId: number) => {
    const newExpanded = new Set(expandedApps);
    
    if (expandedApps.has(appId)) {
      newExpanded.delete(appId);
    } else {
      newExpanded.add(appId);
      await fetchLocationsForApp(appId);
    }
    
    setExpandedApps(newExpanded);
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Please authenticate to manage applications and locations.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Create Application Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Create New Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateApplication} className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="app-name" className="text-sm font-medium">
                Application Name
              </Label>
              <Input
                id="app-name"
                type="text"
                placeholder="Enter application name..."
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="mt-1"
                disabled={isCreatingApp}
              />
            </div>
            <Button
              type="submit"
              disabled={!newAppName.trim() || isCreatingApp}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreatingApp ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create App
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Create Location Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderPlus className="h-5 w-5 text-primary" />
            Add File Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateLocation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="app-select" className="text-sm font-medium">
                  Select Application
                </Label>
                <Select
                  value={selectedAppForLocation}
                  onValueChange={setSelectedAppForLocation}
                  disabled={isCreatingLocation}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location-name" className="text-sm font-medium">
                  Location Name
                </Label>
                <Input
                  id="location-name"
                  type="text"
                  placeholder="e.g., Documents"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="mt-1"
                  disabled={isCreatingLocation}
                />
              </div>
              
              <div>
                <Label htmlFor="location-path" className="text-sm font-medium">
                  File Path
                </Label>
                <Input
                  id="location-path"
                  type="text"
                  placeholder="e.g., C:\shared_dev\documents"
                  value={newLocationPath}
                  onChange={(e) => setNewLocationPath(e.target.value)}
                  className="mt-1"
                  disabled={isCreatingLocation}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!selectedAppForLocation || !newLocationName.trim() || !newLocationPath.trim() || isCreatingLocation}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreatingLocation ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Location
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Applications and Locations Overview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Folder className="h-5 w-5 text-primary" />
            Applications & Locations
            <Badge variant="secondary" className="ml-auto">
              {applications.length} {applications.length === 1 ? 'App' : 'Apps'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingApps ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications found. Create your first application above.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border rounded-lg p-4"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleAppExpansion(app.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedApps.has(app.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{app.name}</span>
                      <Badge variant="outline" className="text-xs">
                        ID: {app.id}
                      </Badge>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedApps.has(app.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pl-7"
                      >
                        <Separator className="mb-3" />
                        {loadingLocations.has(app.id) ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Loading locations...
                          </div>
                        ) : selectedAppLocations[app.id]?.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No locations configured for this application.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedAppLocations[app.id]?.map((location) => (
                              <div
                                key={location.id}
                                className="flex items-center gap-3 p-2 bg-muted/50 rounded text-sm"
                              >
                                <Folder className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">{location.location_name}</div>
                                  <div className="text-xs text-muted-foreground">{location.path}</div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  ID: {location.id}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};