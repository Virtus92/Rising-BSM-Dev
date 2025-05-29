'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlugin } from '../hooks/usePlugin';
import { usePluginLicenses } from '../hooks/usePluginLicenses';
import { usePluginInstallations } from '../hooks/usePluginInstallations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { 
  Package, Download, Shield, Key, CheckCircle, 
  XCircle, AlertTriangle, Info, Loader2, 
  HardDrive, Cpu, Users, DollarSign 
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface PluginInstallationWizardProps {
  pluginId: number | string;
}

export const PluginInstallation = ({ pluginId }: PluginInstallationWizardProps) => {
  const router = useRouter();
  const [step, setStep] = useState<'license' | 'requirements' | 'install' | 'complete'>('license');
  const [licenseKey, setLicenseKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [installProgress, setInstallProgress] = useState(0);
  
  const { plugin, isLoading: isLoadingPlugin } = usePlugin(pluginId);
  const { licenses, verifyLicense, isVerifyingLicense } = usePluginLicenses();
  const { installPlugin, isInstallingPlugin } = usePluginInstallations();
  
  // Generate hardware ID on mount
  useEffect(() => {
    // In a real implementation, this would generate a unique hardware fingerprint
    const generateHardwareId = () => {
      const userAgent = navigator.userAgent;
      const screenResolution = `${screen.width}x${screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      
      // Simple hash function for demo
      const simpleHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };
      
      const combined = `${userAgent}-${screenResolution}-${timezone}-${language}`;
      return simpleHash(combined);
    };
    
    setHardwareId(generateHardwareId());
  }, []);
  
  // Check if user already has a license for this plugin
  useEffect(() => {
    if (licenses && plugin) {
      const existingLicense = licenses.find(
        l => l.pluginId === plugin.id && l.status === 'active'
      );
      if (existingLicense) {
        setLicenseKey(existingLicense.licenseKey);
      }
    }
  }, [licenses, plugin]);
  
  if (isLoadingPlugin || !plugin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }
  
  const handleVerifyLicense = async () => {
    if (!licenseKey.trim()) {
      setVerificationError('Please enter a license key');
      return;
    }
    
    setIsVerifying(true);
    setVerificationError('');
    
    try {
      await verifyLicense({
        licenseKey: licenseKey.trim(),
        hardwareId,
        pluginId: Number(pluginId)
      });
      
      // If verification succeeds, move to requirements check
      setStep('requirements');
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : 'License verification failed'
      );
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleInstall = async () => {
    setStep('install');
    setInstallProgress(0);
    
    // Simulate installation progress
    const progressInterval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      await installPlugin({
        pluginId: Number(pluginId),
        licenseKey: licenseKey.trim(),
        hardwareId
      });
      
      clearInterval(progressInterval);
      setInstallProgress(100);
      setStep('complete');
    } catch (error) {
      clearInterval(progressInterval);
      setStep('requirements');
      // Error will be shown by toast from the hook
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 'license':
        return (
          <Card>
            <CardHeader>
              <CardTitle>License Verification</CardTitle>
              <CardDescription>
                Enter your license key to install {plugin.displayName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="license-key">License Key</Label>
                <Input
                  id="license-key"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="font-mono"
                />
                {verificationError && (
                  <p className="text-sm text-red-600">{verificationError}</p>
                )}
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Don't have a license?</AlertTitle>
                <AlertDescription>
                  You can purchase a license from the plugin page or start with a free trial.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/plugins/${pluginId}`)}
                >
                  Back to Plugin
                </Button>
                <Button
                  onClick={handleVerifyLicense}
                  disabled={isVerifying || isVerifyingLicense}
                >
                  {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify License
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'requirements':
        const meetsRequirements = true; // In real app, check actual requirements
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
              <CardDescription>
                Checking if your system meets the plugin requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span>App Version</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Required: v{plugin.minAppVersion}+
                    </span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span>Storage Space</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">10MB available</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span>Permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {plugin.permissions.length} required
                    </span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                
                {plugin.dependencies.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-muted-foreground" />
                      <span>Dependencies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {plugin.dependencies.length} plugins
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                )}
              </div>
              
              {plugin.permissions.length > 0 && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Required Permissions</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 space-y-1">
                      {plugin.permissions
                        .filter(p => p.required)
                        .map((perm, index) => (
                          <li key={index} className="text-sm">
                            • {perm.description}
                          </li>
                        ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('license')}
                >
                  Back
                </Button>
                <Button
                  onClick={handleInstall}
                  disabled={!meetsRequirements || isInstallingPlugin}
                >
                  Install Plugin
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'install':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Installing Plugin</CardTitle>
              <CardDescription>
                Please wait while we install {plugin.displayName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Installation Progress</span>
                    <span>{installProgress}%</span>
                  </div>
                  <Progress value={installProgress} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className={cn(
                    "flex items-center gap-2",
                    installProgress >= 20 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {installProgress >= 20 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span className="text-sm">Downloading plugin files</span>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-2",
                    installProgress >= 50 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {installProgress >= 50 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : installProgress >= 20 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="text-sm">Verifying plugin integrity</span>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-2",
                    installProgress >= 80 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {installProgress >= 80 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : installProgress >= 50 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="text-sm">Configuring plugin</span>
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-2",
                    installProgress >= 100 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {installProgress >= 100 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : installProgress >= 80 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="text-sm">Finalizing installation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'complete':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Installation Complete!</CardTitle>
              <CardDescription>
                {plugin.displayName} has been successfully installed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>What's Next?</AlertTitle>
                <AlertDescription>
                  The plugin is now active and ready to use. You can manage it from your 
                  installed plugins page or start using its features right away.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/plugins')}
                >
                  Back to Marketplace
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/plugins/installed')}
                >
                  View Installed Plugins
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { key: 'license', label: 'License', icon: Key },
          { key: 'requirements', label: 'Requirements', icon: Shield },
          { key: 'install', label: 'Install', icon: Download },
          { key: 'complete', label: 'Complete', icon: CheckCircle }
        ].map((s, index) => {
          const isActive = step === s.key;
          const isPast = ['license', 'requirements', 'install', 'complete'].indexOf(step) > 
                        ['license', 'requirements', 'install', 'complete'].indexOf(s.key);
          const Icon = s.icon;
          
          return (
            <div key={s.key} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full border-2",
                isActive ? "border-purple-600 bg-purple-600 text-white" :
                isPast ? "border-green-600 bg-green-600 text-white" :
                "border-gray-300 bg-white text-gray-500"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              {index < 3 && (
                <div className={cn(
                  "h-0.5 w-full mx-2",
                  isPast ? "bg-green-600" : "bg-gray-300"
                )} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
};