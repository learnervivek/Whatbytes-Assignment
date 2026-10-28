import { PrismaClient } from '@prisma/client';

// Initialize a single PrismaClient instance across the application
const prisma = new PrismaClient();

export default prisma;
