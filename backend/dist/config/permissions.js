"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.rolePermissions = exports.permissionKeys = void 0;
exports.permissionKeys = [
    'items.read',
    'items.create',
    'items.update',
    'items.delete',
    'items.import',
    'items.timeline.read',
    'categories.read',
    'categories.manage',
    'stock.read',
    'stock.write',
    'scan.create',
    'qr.read',
    'reports.read',
    'reports.export',
];
exports.rolePermissions = {
    ADMIN: new Set(exports.permissionKeys),
    MANAGER: new Set([
        'items.read',
        'items.create',
        'items.update',
        'items.import',
        'items.timeline.read',
        'categories.read',
        'categories.manage',
        'stock.read',
        'stock.write',
        'scan.create',
        'qr.read',
        'reports.read',
    ]),
    USER: new Set([
        'items.read',
        'items.timeline.read',
        'categories.read',
        'stock.read',
        'scan.create',
        'qr.read',
        'reports.read',
    ]),
};
const hasPermission = (role, permission) => exports.rolePermissions[role]?.has(permission) ?? false;
exports.hasPermission = hasPermission;
