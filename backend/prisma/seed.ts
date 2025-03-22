// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.$transaction([
    prisma.appointmentNote.deleteMany(),
    prisma.requestNote.deleteMany(),
    prisma.projectNote.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.project.deleteMany(),
    prisma.contactRequest.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.userActivity.deleteMany(),
    prisma.userSettings.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.service.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create test users with different roles
  const adminPassword = await bcrypt.hash('AdminPass123!', 10);
  const managerPassword = await bcrypt.hash('ManagerPass123!', 10);
  const employeePassword = await bcrypt.hash('EmployeePass123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      phone: '+43 1 234 567',
      status: 'aktiv'
    }
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Manager User',
      email: 'manager@example.com',
      password: managerPassword,
      role: 'manager',
      phone: '+43 1 234 568',
      status: 'aktiv'
    }
  });

  const employee = await prisma.user.create({
    data: {
      name: 'Employee User',
      email: 'employee@example.com',
      password: employeePassword,
      role: 'mitarbeiter',
      phone: '+43 1 234 569',
      status: 'aktiv'
    }
  });

  // Create user settings
  await prisma.userSettings.create({
    data: {
      userId: admin.id,
      darkMode: true,
      emailNotifications: true,
      pushNotifications: false,
      language: 'de',
      notificationInterval: 'sofort'
    }
  });

  // Create test customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Privatkunde GmbH',
        company: 'Privatkunde GmbH',
        email: 'contact@privatkunde.com',
        phone: '+43 1 987 654',
        address: 'Privatstraße 123',
        postalCode: '1010',
        city: 'Wien',
        type: 'privat',
        status: 'aktiv',
        newsletter: true
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Business Kunde AG',
        company: 'Business Kunde AG',
        email: 'info@businesskunde.com',
        phone: '+43 1 987 655',
        address: 'Geschäftsstraße 456',
        postalCode: '1020',
        city: 'Wien',
        type: 'geschaeft',
        status: 'aktiv',
        newsletter: false
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Inaktiver Kunde',
        email: 'inactive@example.com',
        status: 'inaktiv',
        type: 'privat'
      }
    })
  ]);

  // Create test services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Reinigungsservice',
        description: 'Professionelle Reinigung von Büroflächen',
        priceBase: 45.0,
        unit: 'Stunde',
        vatRate: 20.0,
        active: true
      }
    }),
    prisma.service.create({
      data: {
        name: 'Wartungsservice',
        description: 'Regelmäßige Wartung technischer Anlagen',
        priceBase: 60.0,
        unit: 'Einheit',
        vatRate: 20.0,
        active: true
      }
    }),
    prisma.service.create({
      data: {
        name: 'Logistikservice',
        description: 'Transport und Logistikdienstleistungen',
        priceBase: 80.0,
        unit: 'Stunde',
        vatRate: 20.0,
        active: false
      }
    })
  ]);

  // Create test projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        title: 'Büroreinigung Jahresvertrag',
        customerId: customers[0].id,
        serviceId: services[0].id,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        amount: 5000.0,
        description: 'Jährlicher Vertrag für Büroreinigung',
        status: 'in_bearbeitung',
        createdBy: admin.id
      }
    }),
    prisma.project.create({
      data: {
        title: 'Anlageninstallation',
        customerId: customers[1].id,
        serviceId: services[1].id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        amount: 8500.0,
        description: 'Installation neuer technischer Anlagen',
        status: 'neu',
        createdBy: manager.id
      }
    }),
    prisma.project.create({
      data: {
        title: 'Abgeschlossenes Projekt',
        customerId: customers[0].id,
        serviceId: services[0].id,
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        endDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        amount: 3000.0,
        description: 'Bereits abgeschlossenes Projekt',
        status: 'abgeschlossen',
        createdBy: employee.id
      }
    })
  ]);

  // Create project notes
  await Promise.all([
    prisma.projectNote.create({
      data: {
        projectId: projects[0].id,
        userId: admin.id,
        userName: admin.name,
        text: 'Kundengespräch durchgeführt, Vertrag beginnt am ersten des nächsten Monats.'
      }
    }),
    prisma.projectNote.create({
      data: {
        projectId: projects[1].id,
        userId: manager.id,
        userName: manager.name,
        text: 'Materialbeschaffung in Arbeit. Lieferung in 2 Wochen.'
      }
    })
  ]);

  // Create test appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        title: 'Kundenbesichtigung',
        customerId: customers[0].id,
        projectId: projects[0].id,
        appointmentDate: tomorrow,
        duration: 60,
        location: 'Büro des Kunden',
        description: 'Erste Besichtigung der Räumlichkeiten',
        status: 'geplant',
        createdBy: admin.id
      }
    }),
    prisma.appointment.create({
      data: {
        title: 'Installation Erstgespräch',
        customerId: customers[1].id,
        projectId: projects[1].id,
        appointmentDate: nextWeek,
        duration: 90,
        location: 'Kundenstandort',
        description: 'Besprechung der Installationsdetails',
        status: 'bestaetigt',
        createdBy: manager.id
      }
    })
  ]);

  // Create appointment notes
  await Promise.all([
    prisma.appointmentNote.create({
      data: {
        appointmentId: appointments[0].id,
        userId: admin.id,
        userName: admin.name,
        text: 'Kunde wünscht Terminverschiebung auf Nachmittag.'
      }
    })
  ]);

  // Create contact requests
  const requests = await Promise.all([
    prisma.contactRequest.create({
      data: {
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '+43 1 234 567',
        service: 'facility',
        message: 'Ich interessiere mich für Ihren Reinigungsservice.',
        status: 'neu',
        ipAddress: '192.168.1.1'
      }
    }),
    prisma.contactRequest.create({
      data: {
        name: 'Anna Musterfrau',
        email: 'anna@example.com',
        phone: '+43 1 234 568',
        service: 'moving',
        message: 'Anfrage für Transportdienstleistungen.',
        status: 'in_bearbeitung',
        processorId: employee.id,
        ipAddress: '192.168.1.2'
      }
    })
  ]);

  // Create request notes
  await Promise.all([
    prisma.requestNote.create({
      data: {
        requestId: requests[1].id,
        userId: employee.id,
        userName: employee.name,
        text: 'Kunde zurückgerufen, Termin für nächste Woche vereinbart.'
      }
    })
  ]);

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'anfrage',
        title: 'Neue Kontaktanfrage',
        message: 'Eine neue Kontaktanfrage von Max Mustermann ist eingegangen.',
        referenceId: requests[0].id,
        referenceType: 'kontaktanfragen',
        read: false
      }
    }),
    prisma.notification.create({
      data: {
        userId: manager.id,
        type: 'termin',
        title: 'Termin bestätigt',
        message: 'Der Termin "Installation Erstgespräch" wurde bestätigt.',
        referenceId: appointments[1].id,
        referenceType: 'termine',
        read: false
      }
    })
  ]);

  // Create user activity logs
  await Promise.all([
    prisma.userActivity.create({
      data: {
        userId: admin.id,
        activity: 'login',
        ipAddress: '192.168.1.10'
      }
    }),
    prisma.userActivity.create({
      data: {
        userId: manager.id,
        activity: 'project_created',
        ipAddress: '192.168.1.11'
      }
    })
  ]);

  console.log('Database has been seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });