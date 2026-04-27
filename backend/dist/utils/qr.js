"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQrValue = void 0;
const node_crypto_1 = require("node:crypto");
const generateQrValue = () => (0, node_crypto_1.randomUUID)();
exports.generateQrValue = generateQrValue;
