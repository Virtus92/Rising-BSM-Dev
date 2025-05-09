'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Clock, Zap, Users, Calendar, FileText, BarChart2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { UpcomingAppointments } from '@/features/dashboard/components/UpcomingAppointments';
import { NewRequests } from '@/features/dashboard/components/NewRequests';

/**
 * Dashboard Page
 * 
 * Main dashboard showing upcoming appointments, new requests, and system status
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Decorative Header */}
        <div className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
          <div className="absolute inset-0 bg-grid-white/15 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        </div>
        
        <div className="p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 
                <span className="inline-flex ml-2 text-amber-500">
                  <motion.div
                    animate={{ rotate: [0, 15, 0, 15, 0] }}
                    transition={{ duration: 1.5, delay: 1, repeat: 0 }}
                  >
                    👋
                  </motion.div>
                </span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Here's what's happening with your business today.
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-wrap items-start gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Clock className="mr-1.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                {currentTime.toLocaleString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
              <span className="inline-flex items-center rounded-md bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-sm font-medium text-green-700 dark:text-green-300">
                <Zap className="mr-1.5 h-3.5 w-3.5 text-green-500 dark:text-green-400" />
                System Status: Operational
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Customers',
            description: 'Manage your customers',
            icon: <Users className="h-5 w-5 text-blue-500" />,
            path: '/dashboard/customers',
            color: 'border-blue-500/20 bg-blue-50 dark:bg-blue-900/20'
          },
          {
            title: 'Appointments',
            description: 'Schedule and manage appointments',
            icon: <Calendar className="h-5 w-5 text-emerald-500" />,
            path: '/dashboard/appointments',
            color: 'border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/20'
          },
          {
            title: 'Requests',
            description: 'Handle customer requests',
            icon: <FileText className="h-5 w-5 text-violet-500" />,
            path: '/dashboard/requests',
            color: 'border-violet-500/20 bg-violet-50 dark:bg-violet-900/20'
          },
          {
            title: 'Statistics',
            description: 'View business analytics',
            icon: <BarChart2 className="h-5 w-5 text-amber-500" />,
            path: '/dashboard/statistics',
            color: 'border-amber-500/20 bg-amber-50 dark:bg-amber-900/20'
          }
        ].map((action, index) => (
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
      
      {/* Dashboard Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming appointments section */}
        <div>
          <UpcomingAppointments />
        </div>
        
        {/* New requests section */}
        <div>
          <NewRequests />
        </div>
      </div>
    </div>
  );
}
