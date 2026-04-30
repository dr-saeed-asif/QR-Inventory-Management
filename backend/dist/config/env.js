"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required env variable: ${key}`);
    }
}
const alertExpiryWindowDays = Number(process.env.ALERT_EXPIRY_WINDOW_DAYS ?? 30);
const alertOverstockMultiplier = Number(process.env.ALERT_OVERSTOCK_MULTIPLIER ?? 5);
exports.env = {
    port: Number(process.env.PORT ?? 4000),
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    alertExpiryWindowDays: Number.isFinite(alertExpiryWindowDays) && alertExpiryWindowDays > 0 ? alertExpiryWindowDays : 30,
    alertOverstockMultiplier: Number.isFinite(alertOverstockMultiplier) && alertOverstockMultiplier > 1 ? alertOverstockMultiplier : 5,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    alertEmailFrom: process.env.ALERT_EMAIL_FROM,
    alertEmailTo: process.env.ALERT_EMAIL_TO,
};
