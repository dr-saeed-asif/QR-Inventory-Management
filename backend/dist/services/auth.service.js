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
const activity_service_1 = require("./activity.service");
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
        const token = (0, jwt_1.signToken)({ userId: user.id, role: user.role });
        return { token, user };
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
        const token = (0, jwt_1.signToken)({ userId: user.id, role: user.role });
        return { token, user };
    },
};
