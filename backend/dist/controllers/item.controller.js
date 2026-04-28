"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemController = void 0;
const sync_1 = require("csv-parse/sync");
const xlsx_1 = __importDefault(require("xlsx"));
const item_service_1 = require("../services/item.service");
exports.itemController = {
    create: async (req, res, next) => {
        try {
            const item = await item_service_1.itemService.create(req.body, req.user?.userId);
            res.status(201).json(item);
        }
        catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            const data = await item_service_1.itemService.list(req.query);
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    },
    getById: async (req, res, next) => {
        try {
            res.json(await item_service_1.itemService.getById(String(req.params.id)));
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            res.json(await item_service_1.itemService.update(String(req.params.id), req.body, req.user?.userId));
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            await item_service_1.itemService.delete(String(req.params.id), req.user?.userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    import: async (req, res, next) => {
        try {
            if (!req.file) {
                res.status(400).json({ message: 'File is required' });
                return;
            }
            let records = [];
            const fileName = req.file.originalname.toLowerCase();
            if (fileName.endsWith('.csv')) {
                records = (0, sync_1.parse)(req.file.buffer.toString('utf8'), {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                });
            }
            else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const workbook = xlsx_1.default.read(req.file.buffer, { type: 'buffer' });
                const firstSheet = workbook.SheetNames[0];
                records = xlsx_1.default.utils.sheet_to_json(workbook.Sheets[firstSheet]);
            }
            else {
                res.status(400).json({ message: 'Unsupported file format. Use CSV or Excel.' });
                return;
            }
            const rows = records.map((record) => ({
                name: String(record.name ?? record.Name ?? ''),
                sku: String(record.sku ?? record.SKU ?? ''),
                category: String(record.category ?? record.Category ?? ''),
                quantity: Number(record.quantity ?? record.Quantity ?? 0),
                reservedQty: Number(record.reservedQty ?? record.ReservedQty ?? 0),
                price: Number(record.price ?? record.Price ?? 0),
                supplier: String(record.supplier ?? record.Supplier ?? ''),
                location: String(record.location ?? record.Location ?? ''),
                description: String(record.description ?? record.Description ?? ''),
            }));
            const result = await item_service_1.itemService.createManyFromImport(rows, req.user?.userId);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
