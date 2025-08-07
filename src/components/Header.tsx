import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, User, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

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
          <div>
            <h1 className="text-xl font-bold text-primary">File Upload Center</h1>
            <p className="text-xs text-muted-foreground">Secure file management system</p>
          </div>
        </div>

        {/* User Info and Logout */}
        {user && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{user.display_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>ID: {user.user_id}</span>
                <span>•</span>
                <span>Emp: {user.employee_id}</span>
              </div>
            </div>
            
            <div className="sm:hidden">
              <Badge variant="secondary" className="text-xs">
                {user.display_name}
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
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;