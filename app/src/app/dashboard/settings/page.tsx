'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/shared/hooks/useToast';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Separator } from '@/shared/components/ui/separator';
import { Loader2, RefreshCcw, AlertCircle, Sun, Moon, Monitor, Check, X, Shield, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';

export default function SettingsPage() {
  const { settings, isLoading: settingsLoading, error: settingsError, updateSetting, resetToDefaults, reloadSettings } = useSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'appearance', 'notifications', 'security', 'admin'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Get permissions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewSettings = hasPermission(API_PERMISSIONS.SETTINGS.VIEW);
  const canManageSettings = hasPermission(API_PERMISSIONS.SETTINGS.UPDATE);
  
  // Track if the page is in loading state
  const isLoading = settingsLoading || permissionsLoading;
  const error = settingsError;

  // For immediate UI feedback before the actual setting is updated
  const [themeValue, setThemeValue] = useState(settings.theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications);

  // Handle theme change with improved error handling
  const handleThemeChange = async (value: string) => {
    setThemeValue(value as 'light' | 'dark' | 'system');
    setIsSaving(true);
    try {
      const result = await updateSetting('theme', value as 'light' | 'dark' | 'system');
      if (!result) {
        toast({
          title: 'Fehler',
          description: 'Die Theme-Einstellung konnte nicht gespeichert werden.',
          variant: 'error'
        });
        // Reset to original value on failure
        setThemeValue(settings.theme);
      }
    } catch (error) {
      console.error('Failed to update theme setting:', error as Error);
      toast({
        title: 'Fehler',
        description: 'Die Theme-Einstellung konnte nicht gespeichert werden.',
        variant: 'error'
      });
      // Reset to original value on failure
      setThemeValue(settings.theme);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setIsSaving(true);
    try {
      const result = await updateSetting('notificationsEnabled', enabled);
      if (!result) {
        // Reset to original value on failure
        setNotificationsEnabled(settings.notificationsEnabled);
        toast({
          title: 'Fehler',
          description: 'Die Benachrichtigungseinstellung konnte nicht gespeichert werden.',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to update notification setting:', error as Error);
      // Reset to original value on failure
      setNotificationsEnabled(settings.notificationsEnabled);
      toast({
        title: 'Fehler',
        description: 'Die Benachrichtigungseinstellung konnte nicht gespeichert werden.',
        variant: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmailNotifications = async (enabled: boolean) => {
    setEmailNotifications(enabled);
    setIsSaving(true);
    try {
      const result = await updateSetting('emailNotifications', enabled);
      if (!result) {
        // Reset to original value on failure
        setEmailNotifications(settings.emailNotifications);
        toast({
          title: 'Fehler',
          description: 'Die E-Mail-Benachrichtigungseinstellung konnte nicht gespeichert werden.',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to update email notification setting:', error as Error);
      // Reset to original value on failure
      setEmailNotifications(settings.emailNotifications);
      toast({
        title: 'Fehler',
        description: 'Die E-Mail-Benachrichtigungseinstellung konnte nicht gespeichert werden.',
        variant: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie alle Einstellungen zurücksetzen möchten?')) {
      setIsResetting(true);
      try {
        await resetToDefaults();
        // Update local state to match default settings
        setThemeValue(settings.theme);
        setNotificationsEnabled(settings.notificationsEnabled);
        setEmailNotifications(settings.emailNotifications);
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check for permissions
  if (!permissionsLoading && !canViewSettings) {
    return (
      <NoPermissionView 
        title="Access Denied"
        message="You don't have permission to view settings."
        permissionNeeded={API_PERMISSIONS.SETTINGS.VIEW}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Fehler beim Laden der Einstellungen</h2>
        <p className="text-muted-foreground text-center mb-6">
          {error}
        </p>
        <Button onClick={reloadSettings}>
          Erneut versuchen
        </Button>
      </div>
    );
  }

  // Check if admin tab should be available
  const showAdminTab = canManageSettings;

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        
        {canManageSettings && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={reloadSettings}
              disabled={isSaving || isResetting}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleResetSettings}
              disabled={isSaving || isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Zurücksetzen...
                </>
              ) : (
                <>Zurücksetzen</>
              )}
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-lg" style={{ gridTemplateColumns: showAdminTab ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)' }}>
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="appearance">Erscheinungsbild</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          {showAdminTab && (
            <>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-1" />
                Sicherheit
              </TabsTrigger>
              <TabsTrigger value="admin" className="relative">
                Admin
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Einstellungen</CardTitle>
              <CardDescription>
                Grundlegende Konfiguration des Systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Firmenname</Label>
                <Input 
                  id="companyName" 
                  value={settings.companyName} 
                  onChange={async (e) => {
                    if (!canManageSettings) return; // Prevent changes if no permission
                    setIsSaving(true);
                    try {
                      await updateSetting('companyName', e.target.value);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  placeholder="Firmenname"
                  disabled={isSaving || !canManageSettings}
                  readOnly={!canManageSettings}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="language">Sprache</Label>
                <Select 
                  value={settings.language} 
                  onValueChange={async (value) => {
                    setIsSaving(true);
                    try {
                      await updateSetting('language', value);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Sprache wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dateFormat">Datumsformat</Label>
                <Select 
                  value={settings.dateFormat} 
                  onValueChange={async (value) => {
                    setIsSaving(true);
                    try {
                      await updateSetting('dateFormat', value);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue placeholder="Datumsformat wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd.MM.yyyy">dd.MM.yyyy (31.12.2023)</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/dd/yyyy (12/31/2023)</SelectItem>
                    <SelectItem value="yyyy-MM-dd">yyyy-MM-dd (2023-12-31)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="timeFormat">Zeitformat</Label>
                <Select 
                  value={settings.timeFormat} 
                  onValueChange={async (value) => {
                    setIsSaving(true);
                    try {
                      await updateSetting('timeFormat', value);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger id="timeFormat">
                    <SelectValue placeholder="Zeitformat wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HH:mm">HH:mm (24-Stunden)</SelectItem>
                    <SelectItem value="hh:mm a">hh:mm a (12-Stunden mit AM/PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="currency">Währung</Label>
                <Select 
                  value={settings.currency} 
                  onValueChange={async (value) => {
                    setIsSaving(true);
                    try {
                      await updateSetting('currency', value);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Währung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">US-Dollar ($)</SelectItem>
                    <SelectItem value="GBP">Britisches Pfund (£)</SelectItem>
                    <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Version: {settings.version}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Settings Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erscheinungsbild</CardTitle>
              <CardDescription>
                Passen Sie das Aussehen der Anwendung an
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Farbschema</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={`rounded-md border-2 p-4 flex flex-col items-center justify-center cursor-pointer transition-all
                        ${themeValue === 'light' ? 'border-primary bg-secondary/50' : 'border-border'}
                      `}
                      onClick={() => handleThemeChange('light')}
                    >
                      <Sun className="h-8 w-8 mb-2 text-yellow-500" />
                      <span>Hell</span>
                      {themeValue === 'light' && (
                        <Check className="h-4 w-4 text-primary mt-2" />
                      )}
                    </div>
                    
                    <div 
                      className={`rounded-md border-2 p-4 flex flex-col items-center justify-center cursor-pointer transition-all
                        ${themeValue === 'dark' ? 'border-primary bg-secondary/50' : 'border-border'}
                      `}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <Moon className="h-8 w-8 mb-2 text-purple-500" />
                      <span>Dunkel</span>
                      {themeValue === 'dark' && (
                        <Check className="h-4 w-4 text-primary mt-2" />
                      )}
                    </div>
                    
                    <div 
                      className={`rounded-md border-2 p-4 flex flex-col items-center justify-center cursor-pointer transition-all
                        ${themeValue === 'system' ? 'border-primary bg-secondary/50' : 'border-border'}
                      `}
                      onClick={() => handleThemeChange('system')}
                    >
                      <Monitor className="h-8 w-8 mb-2 text-blue-500" />
                      <span>System</span>
                      {themeValue === 'system' && (
                        <Check className="h-4 w-4 text-primary mt-2" />
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Benutzerdefinierte Einstellungen</h3>
                  <p className="text-muted-foreground mb-4">
                    Weitere Anpassungen des Erscheinungsbilds werden in einer zukünftigen Version verfügbar sein.
                  </p>
                </div>
              </div>
            </CardContent>
            {isSaving && (
              <CardFooter className="border-t pt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Einstellungen werden gespeichert...
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie, wie und wann Sie benachrichtigt werden möchten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Benachrichtigungen aktivieren</Label>
                  <p className="text-sm text-muted-foreground">
                    Aktivieren oder deaktivieren Sie alle Benachrichtigungen
                  </p>
                </div>
                <Switch 
                  checked={notificationsEnabled} 
                  onCheckedChange={handleToggleNotifications}
                  disabled={isSaving}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">E-Mail-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigungen per E-Mail erhalten
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={handleToggleEmailNotifications}
                  disabled={!notificationsEnabled || isSaving}
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Benachrichtigungstypen</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Wählen Sie, welche Arten von Benachrichtigungen Sie erhalten möchten
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Terminbenachrichtigungen</Label>
                    <Switch 
                      checked={notificationsEnabled} 
                      disabled={!notificationsEnabled || isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Neue Anfragen</Label>
                    <Switch 
                      checked={notificationsEnabled} 
                      disabled={!notificationsEnabled || isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Kundenupdates</Label>
                    <Switch 
                      checked={notificationsEnabled} 
                      disabled={!notificationsEnabled || isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Systembenachrichtigungen</Label>
                    <Switch 
                      checked={notificationsEnabled} 
                      disabled={!notificationsEnabled || isSaving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            {isSaving && (
              <CardFooter className="border-t pt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Einstellungen werden gespeichert...
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        {showAdminTab && (
          <TabsContent value="security" className="space-y-4">
            {/* Status */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>System sicher</AlertTitle>
              <AlertDescription>
                Alle grundlegenden Sicherheitsfunktionen sind aktiv.
              </AlertDescription>
            </Alert>

            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle>Aktive Sicherheitsfunktionen</CardTitle>
                <CardDescription>Die folgenden Sicherheitsmaßnahmen sind derzeit aktiv</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">JWT-Authentifizierung</p>
                    <p className="text-sm text-gray-600">Sichere Token-basierte Authentifizierung ist aktiv</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Rollenbasierte Berechtigungen</p>
                    <p className="text-sm text-gray-600">Zugriffskontrolle basierend auf Benutzerrollen</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Sicherheitsheader</p>
                    <p className="text-sm text-gray-600">HTTP-Sicherheitsheader sind konfiguriert</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Passwortverschlüsselung</p>
                    <p className="text-sm text-gray-600">Passwörter werden sicher mit bcrypt gehasht</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Sicherheitseinrichtung</CardTitle>
                <CardDescription>Wichtige Schritte zur Sicherheitskonfiguration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Sichere Umgebungsvariablen generieren</p>
                    <p className="text-sm text-gray-600">
                      Ausführen: <code className="bg-gray-100 px-2 py-1 rounded text-xs">node scripts/generate-secure-env.mjs</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Datenbankpasswort aktualisieren</p>
                    <p className="text-sm text-gray-600">
                      Ändern Sie das Standard-PostgreSQL-Passwort in Ihrer .env.local Datei
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">CORS für Produktion konfigurieren</p>
                    <p className="text-sm text-gray-600">
                      Aktualisieren Sie ALLOWED_ORIGINS bei der Bereitstellung in der Produktion
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Future Features */}
            <Card>
              <CardHeader>
                <CardTitle>Demnächst verfügbar</CardTitle>
                <CardDescription>Erweiterte Sicherheitsfunktionen in Entwicklung</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Echtzeit-Bedrohungsüberwachung</li>
                  <li>• Automatische Angriffserkennung und -blockierung</li>
                  <li>• Sicherheitsereignisprotokollierung und -analyse</li>
                  <li>• IP-basierte Ratenbegrenzung</li>
                  <li>• Erweiterte Sicherheitsanalysen</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
