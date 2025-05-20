'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { Users, Calendar, FileText, BarChart2 } from 'lucide-react';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';

/**
 * QuickActionButtons component
 * 
 * Displays quick action buttons on the dashboard with permission checks
 * Buttons are only shown if the user has the required permissions
 */
export function QuickActionButtons() {
  const { hasPermission } = usePermissions();
  const router = useRouter();
  
  // Define quick actions with their permission requirements
  const quickActions = [
    {
      title: 'Customers',
      description: 'Manage your customers',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      path: '/dashboard/customers',
      color: 'border-blue-500/20 bg-blue-50 dark:bg-blue-900/20',
      requiredPermission: API_PERMISSIONS.CUSTOMERS.VIEW
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage appointments',
      icon: <Calendar className="h-5 w-5 text-emerald-500" />,
      path: '/dashboard/appointments',
      color: 'border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/20',
      requiredPermission: API_PERMISSIONS.APPOINTMENTS.VIEW
    },
    {
      title: 'Requests',
      description: 'Handle customer requests',
      icon: <FileText className="h-5 w-5 text-violet-500" />,
      path: '/dashboard/requests',
      color: 'border-violet-500/20 bg-violet-50 dark:bg-violet-900/20',
      requiredPermission: API_PERMISSIONS.REQUESTS.VIEW
    },
    {
      title: 'Statistics',
      description: 'View business analytics',
      icon: <BarChart2 className="h-5 w-5 text-amber-500" />,
      path: '/dashboard/statistics',
      color: 'border-amber-500/20 bg-amber-50 dark:bg-amber-900/20',
      requiredPermission: API_PERMISSIONS.STATISTICS.VIEW
    }
  ];
  
  // Filter actions based on user permissions
  const authorizedActions = quickActions.filter(action => hasPermission(action.requiredPermission));
  
  // If no actions are authorized, don't render the section
  if (authorizedActions.length === 0) {
    return null;
  }
  
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {authorizedActions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`rounded-xl p-6 border ${action.color} hover:shadow-md transition-all duration-300 cursor-pointer`}
          onClick={() => router.push(action.path)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
              {action.icon}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{action.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{action.description}</p>
        </motion.div>
      ))}
    </section>
  );
}

export default QuickActionButtons;