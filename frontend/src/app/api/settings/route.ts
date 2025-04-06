import { NextResponse } from 'next/server';

// Mock settings data - in a real app, this would come from a database
let settings = {
  companyName: 'Rising BSM',
  companyLogo: '',
  companyEmail: 'info@rising-bsm.at',
  companyPhone: '+43 681 840 30 694',
  companyAddress: 'Waldmüllergang 10a, 4020 Linz',
  companyWebsite: 'https://rising-bsm.at',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
  language: 'de',
  theme: 'system',
};

/**
 * GET handler for retrieving settings
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating settings
 */
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { key, value } = data;

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Setting key is required' },
        { status: 400 }
      );
    }

    // Update the setting
    settings = {
      ...settings,
      [key]: value
    };

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      data: { [key]: value }
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
