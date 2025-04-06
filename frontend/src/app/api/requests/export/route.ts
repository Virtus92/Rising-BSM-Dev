import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

/**
 * Handler for exporting requests data to CSV or Excel
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get format from query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const filename = searchParams.get('filename') || 'requests';
    
    // Extract filter parameters
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the database query with filters
    let query = db.selectFrom('requests')
      .select([
        'requests.id',
        'requests.name',
        'requests.email',
        'requests.phone',
        'requests.message',
        'requests.service',
        'requests.status',
        'requests.created_at as createdAt',
        'requests.updated_at as updatedAt'
      ]);
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.where('requests.status', '=', status);
    }
    
    if (service) {
      query = query.where('requests.service', '=', service);
    }
    
    if (startDate) {
      query = query.where('requests.created_at', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('requests.created_at', '<=', endDate);
    }
    
    // Execute the query
    const requests = await query.execute();
    
    // Prepare the data for export
    const exportData = requests.map(request => ({
      ID: request.id,
      Name: request.name,
      Email: request.email,
      Phone: request.phone || 'N/A',
      Service: request.service || 'N/A',
      Status: getStatusLabel(request.status),
      Message: request.message || '',
      CreatedAt: new Date(request.createdAt).toLocaleDateString('de-DE'),
      UpdatedAt: new Date(request.updatedAt).toLocaleDateString('de-DE')
    }));
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
    
    // Generate the file
    if (format === 'excel') {
      // Excel format
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`
        }
      });
    } else {
      // CSV format
      const csvString = XLSX.utils.sheet_to_csv(worksheet);
      
      return new NextResponse(csvString, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    }
  } catch (error) {
    console.error('Error exporting requests:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to export requests' },
      { status: 500 }
    );
  }
}

/**
 * Get a human-readable status label
 */
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'new': 'Neu',
    'in_progress': 'In Bearbeitung',
    'completed': 'Abgeschlossen',
    'cancelled': 'Abgebrochen'
  };
  
  return statusLabels[status] || status;
}
