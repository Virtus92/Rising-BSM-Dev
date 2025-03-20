import prisma from './prisma.utils';
import { faker } from '@faker-js/faker';

/**
 * Generiert Beispieldaten für Systemdiagnose
 */
export async function getSampleData() {
  return {
    users: await generateSampleUsers(),
    customers: await generateSampleCustomers(),
    projects: await generateSampleProjects()
  };
}

async function generateSampleUsers(count = 5) {
  return await prisma.user.findMany({
    take: count,
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
}

async function generateSampleCustomers(count = 5) {
  return await prisma.customer.findMany({
    take: count,
    select: {
      id: true,
      name: true,
      email: true,
      type: true
    }
  });
}

async function generateSampleProjects(count = 5) {
  return await prisma.project.findMany({
    take: count,
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true
    }
  });
}

// Optional: Funktion zum Generieren von Test-Mock-Daten
export function mockData() {
  return {
    user: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password()
    },
    customer: {
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number()
    },
    project: {
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph()
    }
  };
}