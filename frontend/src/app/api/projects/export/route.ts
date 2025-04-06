import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

/**
 * Handler for exporting projects data to CSV or Excel
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
    const filename = searchParams.get('filename') || 'projects';
    
    // Extract filter parameters
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const serviceId = searchParams.get('serviceId');
    const search = searchParams.get('search');
    
    // Build the database query with filters
    let query = db.selectFrom('projects')
      .leftJoin('customers', 'projects.customer_id', 'customers.id')
      .leftJoin('services', 'projects.service_id', 'services.id')
      .select([
        'projects.id',
        'projects.title',
        'projects.description',
        'projects.status',
        'projects.start_date as startDate',
        'projects.end_date as endDate',
        'projects.amount',
        'projects.created_at as createdAt',
        'projects.updated_at as updatedAt',
        'customers.id as customerId',
        'customers.name as customerName',
        'services.id as serviceId',
        'services.name as serviceName'
      ]);
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.where('projects.status', '=', status);
    }
    
    if (customerId) {
      query = query.where('projects.customer_id', '=', Number(customerId));
    }
    
    if (serviceId) {
      query = query.where('projects.service_id', '=', Number(serviceId));
    }
    
    if (search) {
      query = query.where(eb => eb.or([
        eb('projects.title', 'like', `%${search}%`),
        eb('projects.description', 'like', `%${search}%`),
        eb('customers.name', 'like', `%${search}%`)
      ]));
    }
    
    // Execute the query
    const projects = await query.execute();
    
    // Prepare the data for export
    const exportData = projects.map(project => ({
      ID: project.id,
      Title: project.title,
      Customer: project.customerName || 'N/A',
      Service: project.serviceName || 'N/A',
      Status: getStatusLabel(project.status),
      StartDate: project.startDate ? new Date(project.startDate).toLocaleDateString('de-DE') : 'N/A',
      EndDate: project.endDate ? new Date(project.endDate).toLocaleDateString('de-DE') : 'N/A',
      Amount: project.amount ? `${project.amount.toFixed(2)} €` : 'N/A',
      Description: project.description || '',
      CreatedAt: new Date(project.createdAt).toLocaleDateString('de-DE'),
      UpdatedAt: new Date(project.updatedAt).toLocaleDateString('de-DE')
    }));
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
    
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
    console.error('Error exporting projects:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to export projects' },
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
    'in-progress': 'In Bearbeitung',
    'on-hold': 'Pausiert',
    'completed': 'Abgeschlossen',
    'cancelled': 'Abgebrochen'
  };
  
  return statusLabels[status] || status;
}
