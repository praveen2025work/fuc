import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Building, MapPin, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

  useEffect(() => {
    if (user?.userName) {
      setIsLoadingPhoto(true);
      apiService.getUserPhoto(user.userName)
        .then(setUserPhoto)
        .catch(() => {
          // Fallback to default avatar
          setUserPhoto(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=2a73b2&color=fff&size=128`);
        })
        .finally(() => setIsLoadingPhoto(false));
    }
  }, [user]);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLocation = (distinguishedName: string) => {
    // Extract location from DN (e.g., "OU=LOC,OU=REGION,OU=ORG")
    const locationMatch = distinguishedName.match(/OU=([^,]+)/g);
    if (locationMatch && locationMatch.length > 0) {
      return locationMatch[0].replace('OU=', '');
    }
    return 'Unknown Location';
  };

  const formatDepartment = (description: string) => {
    // Extract department from description (e.g., "Lastname, Firstname: Department (Location)")
    const departmentMatch = description.match(/:\s*([^(]+)/);
    if (departmentMatch) {
      return departmentMatch[1].trim();
    }
    return 'Unknown Department';
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-accent/50 rounded-md px-2 py-1 transition-colors">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
            {user.displayName}
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" align="end">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="p-4 space-y-4"
        >
          {/* Header with Avatar and Name */}
          <div className="flex items-start gap-3">
            <Avatar className="w-16 h-16">
              <AvatarImage 
                src={userPhoto} 
                alt={user.displayName}
                className={isLoadingPhoto ? 'opacity-50' : ''}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg leading-tight">{user.displayName}</h3>
              <p className="text-sm text-muted-foreground">{formatDepartment(user.description)}</p>
              <Badge variant="secondary" className="text-xs">
                {formatLocation(user.distinguishedName)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{user.emailAddress}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Employee ID:</span>
              <span className="text-foreground font-mono">{user.employeeId}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Username:</span>
              <span className="text-foreground font-mono">{user.userName}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">SAM Account:</span>
              <span className="text-foreground font-mono">{user.samAccountName}</span>
            </div>
          </div>

          {/* Full Name Details */}
          {(user.givenName || user.surname) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Full Name</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {user.givenName && (
                    <div>
                      <span className="text-muted-foreground">First:</span>
                      <span className="ml-1 text-foreground">{user.givenName}</span>
                    </div>
                  )}
                  {user.surname && (
                    <div>
                      <span className="text-muted-foreground">Last:</span>
                      <span className="ml-1 text-foreground">{user.surname}</span>
                    </div>
                  )}
                  {user.middleName && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Middle:</span>
                      <span className="ml-1 text-foreground">{user.middleName}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default UserProfile;