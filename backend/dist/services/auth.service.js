"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../config/prisma");
const api_error_1 = require("../utils/api-error");
const jwt_1 = require("../utils/jwt");
const permissions_1 = require("../config/permissions");
const activity_service_1 = require("./activity.service");
const ensureRoleTables = async () => {
    await prisma_1.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_roles (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      roleKey VARCHAR(191) NOT NULL UNIQUE,
      name VARCHAR(191) NOT NULL,
      permissions JSON NOT NULL,
      isSystem TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
    await prisma_1.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_user_roles (
      userId VARCHAR(191) NOT NULL PRIMARY KEY,
      roleKey VARCHAR(191) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};
const parsePermissions = (value) => {
    if (Array.isArray(value))
        return value.map((item) => String(item));
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed))
                return parsed.map((item) => String(item));
        }
        catch {
            return [];
        }
    }
    return [];
};
const resolveUserPermissions = async (userId, role) => {
    await ensureRoleTables();
    const defaultPermissions = Array.from(permissions_1.rolePermissions[role]);
    const overrideRows = await prisma_1.prisma.$queryRaw `
    SELECT roleKey
    FROM admin_user_roles
    WHERE userId = ${userId}
    LIMIT 1
  `;
    const overrideRoleKey = overrideRows[0]?.roleKey;
    if (!overrideRoleKey)
        return defaultPermissions;
    const roleRows = await prisma_1.prisma.$queryRaw `
    SELECT permissions
    FROM admin_roles
    WHERE roleKey = ${overrideRoleKey}
    LIMIT 1
  `;
    const rolePermissionsFromDb = parsePermissions(roleRows[0]?.permissions);
    return rolePermissionsFromDb.length > 0 ? rolePermissionsFromDb : defaultPermissions;
};
exports.authService = {
    register: async (input) => {
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
        if (existingUser)
            throw new api_error_1.ApiError(409, 'Email already in use');
        const passwordHash = await bcrypt_1.default.hash(input.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                passwordHash,
                role: input.role ?? 'USER',
            },
        });
        await activity_service_1.activityService.create({
            action: 'REGISTER',
            entityType: 'USER',
            entityId: user.id,
            description: 'User registered',
            userId: user.id,
        });
        const permissions = await resolveUserPermissions(user.id, user.role);
        const token = (0, jwt_1.signToken)({ userId: user.id, role: user.role, permissions });
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions,
            },
        };
    },
    login: async (input) => {
        const user = await prisma_1.prisma.user.findUnique({ where: { email: input.email } });
        if (!user)
            throw new api_error_1.ApiError(401, 'Invalid email or password');
        const valid = await bcrypt_1.default.compare(input.password, user.passwordHash);
        if (!valid)
            throw new api_error_1.ApiError(401, 'Invalid email or password');
        await activity_service_1.activityService.create({
            action: 'LOGIN',
            entityType: 'USER',
            entityId: user.id,
            description: 'User logged in',
            userId: user.id,
        });
        const permissions = await resolveUserPermissions(user.id, user.role);
        const token = (0, jwt_1.signToken)({ userId: user.id, role: user.role, permissions });
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions,
            },
        };
    },
};
