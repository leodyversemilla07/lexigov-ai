"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.disconnectPrisma = disconnectPrisma;
exports.getPrisma = getPrisma;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
/**
 * Prisma client singleton
 */
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
/**
 * Disconnect Prisma client
 */
async function disconnectPrisma() {
    await exports.prisma.$disconnect();
}
/**
 * Get Prisma client instance
 */
function getPrisma() {
    return exports.prisma;
}
