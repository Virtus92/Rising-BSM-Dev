import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

/**
 * Handler for exporting appointments data to CSV or Excel
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
    const filename = searchParams.get('filename') || 'appointments';
    
    // Extract filter parameters
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the database query with filters
    let query = db.selectFrom('appointments')
      .leftJoin('customers', 'appointments.customer_id', 'customers.id')
      .leftJoin('projects', 'appointments.project_id', 'projects.id')
      .leftJoin('users', 'appointments.assigned_to', 'users.id')
      .select([
        'appointments.id',
        'appointments.title',
        'appointments.description',
        'appointments.status',
        'appointments.date',
        'appointments.start_time as startTime',
        'appointments.end_time as endTime',
        'appointments.location',
        'appointments.created_at as createdAt',
        'appointments.updated_at as updatedAt',
        'customers.id as customerId',
        'customers.name as customerName',
        'projects.id as projectId',
        'projects.title as projectTitle',
        'users.id as userId',
        'users.name as userName'
      ]);
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.where('appointments.status', '=', status);
    }
    
    if (customerId) {
      query = query.where('appointments.customer_id', '=', Number(customerId));
    }
    
    if (projectId) {
      query = query.where('appointments.project_id', '=', Number(projectId));
    }
    
    if (startDate) {
      query = query.where('appointments.date', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('appointments.date', '<=', endDate);
    }
    
    // Execute the query
    const appointments = await query.execute();
    
    // Prepare the data for export
    const exportData = appointments.map(appointment => ({
      ID: appointment.id,
      Title: appointment.title,
      Customer: appointment.customerName || 'N/A',
      Project: appointment.projectTitle || 'N/A',
      Status: getStatusLabel(appointment.status),
      Date: new Date(appointment.date).toLocaleDateString('de-DE'),
      StartTime: appointment.startTime || 'N/A',
      EndTime: appointment.endTime || 'N/A',
      Location: appointment.location || 'N/A',
      AssignedTo: appointment.userName || 'N/A',
      Description: appointment.description || '',
      CreatedAt: new Date(appointment.createdAt).toLocaleDateString('de-DE'),
      UpdatedAt: new Date(appointment.updatedAt).toLocaleDateString('de-DE')
    }));
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
    
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
    console.error('Error exporting appointments:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to export appointments' },
      { status: 500 }
    );
  }
}

/**
 * Get a human-readable status label
 */
function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'scheduled': 'Geplant',
    'confirmed': 'Bestätigt',
    'completed': 'Abgeschlossen',
    'cancelled': 'Abgesagt',
    'no-show': 'Nicht erschienen'
  };
  
  return statusLabels[status] || status;
}
