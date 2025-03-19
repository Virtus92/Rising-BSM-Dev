"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
// Graceful shutdown
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
//# sourceMappingURL=prisma.service.js.map