"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_utils_1 = require("../utils/prisma.utils");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return prisma_utils_1.prisma; } });
process.on('beforeExit', async () => {
    await prisma_utils_1.prisma.$disconnect();
});
//# sourceMappingURL=prisma.service.js.map