import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/server';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';

/**
 * Handler for exporting customers data to CSV or Excel
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
    const filename = searchParams.get('filename') || 'customers';
    
    // Extract filter parameters
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const postalCode = searchParams.get('postalCode');
    const newsletter = searchParams.get('newsletter');
    
    // Build the database query with filters
    // Da wir jetzt Prisma anstelle von Kysely/db verwenden, müssen wir den Abfragestil ändern
    
    // Basisabfrage vorbereiten
    const where: any = {};
    
    // Filter anwenden
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company_name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }
    
    if (city) {
      where.city = { contains: city };
    }
    
    if (postalCode) {
      where.postal_code = { contains: postalCode };
    }
    
    if (newsletter === 'true' || newsletter === 'false') {
      where.newsletter = newsletter === 'true';
    }
    
    // Abfrage ausführen
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        type: true,
        name: true,
        company_name: true,
        email: true,
        phone: true,
        street: true,
        postal_code: true,
        city: true,
        country: true,
        vat_id: true,
        website: true,
        notes: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    });
    
    // Prepare the data for export
    const exportData = customers.map(customer => ({
      ID: customer.id,
      Type: customer.type === 'business' ? 'Geschäftskunde' : 'Privatkunde',
      Name: customer.name,
      Company: customer.company_name || '',
      Email: customer.email,
      Phone: customer.phone || '',
      Street: customer.street || '',
      PostalCode: customer.postal_code || '',
      City: customer.city || '',
      Country: customer.country || '',
      VATId: customer.vat_id || '',
      Website: customer.website || '',
      Status: customer.status,
      Notes: customer.notes || '',
      CreatedAt: new Date(customer.created_at).toLocaleDateString('de-DE'),
      UpdatedAt: new Date(customer.updated_at).toLocaleDateString('de-DE')
    }));
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
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
    console.error('Error exporting customers:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to export customers' },
      { status: 500 }
    );
  }
}
