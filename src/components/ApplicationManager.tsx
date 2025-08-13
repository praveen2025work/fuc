import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Building2, 
  FolderPlus, 
  Folder, 
  ChevronDown, 
  ChevronRight, 
  Settings2,
  MapPin,
  Calendar,
  User,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
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

  // View states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    if (!user) return;
    
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
      
      await fetchLocationsForApp(appId);
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

  const handleViewApplication = async (app: Application) => {
    setSelectedApp(app);
    await fetchLocationsForApp(app.id);
    setIsSheetOpen(true);
  };

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Settings2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Authentication Required</h3>
              <p className="text-muted-foreground">Please authenticate to manage applications and locations.</p>
            </div>
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
      className="w-full"
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Application Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage applications and their file locations
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create & Manage
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              {/* Create Application Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border border-primary/20 bg-primary/5">
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
                          className="mt-1 bg-background"
                          disabled={isCreatingApp}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={!newAppName.trim() || isCreatingApp}
                        className="bg-primary hover:bg-primary/90 px-6"
                      >
                        {isCreatingApp ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create
                          </div>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Create Location Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border border-secondary/50">
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
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {app.name}
                                  </div>
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
                          className="bg-primary hover:bg-primary/90 px-6"
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
              </motion.div>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              {/* Search and View Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Applications Grid/List */}
              {isLoadingApps ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading applications...</p>
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No Applications Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No applications match your search.' : 'Create your first application to get started.'}
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "space-y-3"
                  }
                >
                  {filteredApplications.map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {viewMode === 'grid' ? (
                        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleViewApplication(app)}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Building2 className="h-6 w-6 text-primary" />
                              </div>
                              <Badge variant="outline" className="text-xs">
                                ID: {app.id}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                {app.name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Created {new Date(app.created_at).toLocaleDateString()}
                              </div>
                              {app.updated_by && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  Updated by {app.updated_by}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewApplication(app)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">{app.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Created {new Date(app.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  ID: {app.id}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Application Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">{selectedApp?.name}</SheetTitle>
                <SheetDescription>
                  Application details and file locations
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Application Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Application Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Application ID:</span>
                    <Badge variant="outline">{selectedApp.id}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Created:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedApp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedApp.updated_by && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Updated by:</span>
                      <span className="text-sm text-muted-foreground">{selectedApp.updated_by}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Locations */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      File Locations
                    </CardTitle>
                    <Badge variant="secondary">
                      {selectedAppLocations[selectedApp.id]?.length || 0} Locations
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingLocations.has(selectedApp.id) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground">Loading locations...</p>
                      </div>
                    </div>
                  ) : selectedAppLocations[selectedApp.id]?.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Folder className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">No locations configured</p>
                        <p className="text-xs text-muted-foreground">Add file locations using the form above</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedAppLocations[selectedApp.id]?.map((location) => (
                        <motion.div
                          key={location.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-background rounded-md flex items-center justify-center mt-0.5">
                            <Folder className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{location.location_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                ID: {location.id}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="font-mono break-all">{location.path}</span>
                            </div>
                            {location.updated_by && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <User className="h-3 w-3" />
                                <span>Updated by {location.updated_by}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};