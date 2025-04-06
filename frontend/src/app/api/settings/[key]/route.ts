import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { ISettingsService } from '@/lib/server/interfaces/ISettingsService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/settings/[key]
 * Holt eine bestimmte Systemeinstellung anhand des Schlüssels (Nur für Admin)
 */
export const GET = withRoles(['admin'], async (req: NextRequest) => {
  try {
    const settingsService = container.resolve<ISettingsService>('SettingsService');
    
    // Schlüssel aus der URL extrahieren
    const key = req.url.split('/').pop() || '';
    
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Einstellungsschlüssel ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const setting = await settingsService.getSettingByKey(key);
    
    if (!setting) {
      return NextResponse.json(
        {
          success: false,
          error: `Einstellung mit dem Schlüssel "${key}" nicht gefunden`,
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: setting,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});

/**
 * PUT /api/settings/[key]
 * Aktualisiert eine bestimmte Systemeinstellung anhand des Schlüssels (Nur für Admin)
 */
export const PUT = withRoles(['admin'], async (req: NextRequest) => {
  try {
    const settingsService = container.resolve<ISettingsService>('SettingsService');
    
    // Schlüssel aus der URL extrahieren
    const key = req.url.split('/').pop() || '';
    
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Einstellungsschlüssel ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const { value, description } = await req.json();
    
    if (value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wert ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const setting = await settingsService.updateSetting(key, value, description);
    
    return NextResponse.json({
      success: true,
      data: setting,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});

/**
 * DELETE /api/settings/[key]
 * Löscht eine bestimmte Systemeinstellung anhand des Schlüssels (Nur für Admin)
 */
export const DELETE = withRoles(['admin'], async (req: NextRequest) => {
  try {
    const settingsService = container.resolve<ISettingsService>('SettingsService');
    
    // Schlüssel aus der URL extrahieren
    const key = req.url.split('/').pop() || '';
    
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Einstellungsschlüssel ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const result = await settingsService.deleteSetting(key);
    
    return NextResponse.json({
      success: result,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});
