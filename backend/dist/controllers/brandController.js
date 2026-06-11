"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBrand = exports.createBrand = exports.getBrands = void 0;
const Brand_1 = __importDefault(require("../models/Brand"));
const Order_1 = __importDefault(require("../models/Order"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
// Get all brands
const getBrands = async (req, res) => {
    try {
        const { type } = req.query;
        const query = {};
        if (type)
            query.type = type;
        const brands = await Brand_1.default.find(query).sort({ name: 1 }).lean();
        res.status(200).json({ success: true, data: brands });
    }
    catch (error) {
        console.error("Error fetching brands:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.getBrands = getBrands;
// Create brand
const createBrand = async (req, res) => {
    try {
        const { name, type } = req.body;
        if (!name || !type) {
            res.status(400).json({ success: false, error: "Name and type are required" });
            return;
        }
        if (!["frame", "lens", "drop"].includes(type)) {
            res.status(400).json({ success: false, error: "Type must be 'frame', 'lens', or 'drop'" });
            return;
        }
        const existing = await Brand_1.default.findOne({ name: name.trim(), type });
        if (existing) {
            res.status(400).json({ success: false, error: `A ${type} brand with this name already exists` });
            return;
        }
        const brand = new Brand_1.default({ name: name.trim(), type });
        const saved = await brand.save();
        await AuditLog_1.default.create({
            recordType: "Brand",
            recordId: saved._id,
            action: "create",
            changedBy: req.headers["x-user"] || "staff",
            description: `Brand ${saved.name} (${saved.type}) created`,
            newValues: { name: saved.name, type: saved.type },
        });
        res.status(201).json({ success: true, data: saved, message: "Brand created successfully" });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ success: false, error: "Brand already exists" });
            return;
        }
        console.error("Error creating brand:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.createBrand = createBrand;
// Update brand
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ success: false, error: "Name is required" });
            return;
        }
        const brand = await Brand_1.default.findById(id);
        if (!brand) {
            res.status(404).json({ success: false, error: "Brand not found" });
            return;
        }
        const duplicate = await Brand_1.default.findOne({ name: name.trim(), type: brand.type, _id: { $ne: id } });
        if (duplicate) {
            res.status(400).json({ success: false, error: "A brand with this name already exists" });
            return;
        }
        const oldName = brand.name;
        brand.name = name.trim();
        await brand.save();
        // Cascade update in orders
        if (brand.type === "frame") {
            await Order_1.default.updateMany({ "frames.brand": oldName }, { $set: { "frames.$[elem].brand": name.trim() } }, { arrayFilters: [{ "elem.brand": oldName }] });
        }
        else {
            await Order_1.default.updateMany({ "lenses.brand": oldName }, { $set: { "lenses.$[elem].brand": name.trim() } }, { arrayFilters: [{ "elem.brand": oldName }] });
        }
        await AuditLog_1.default.create({
            recordType: "Brand",
            recordId: id,
            action: "update",
            changedBy: req.headers["x-user"] || "staff",
            description: `Brand renamed from ${oldName} to ${name.trim()}`,
            previousValues: { name: oldName },
            newValues: { name: name.trim() },
        });
        res.status(200).json({ success: true, data: brand, message: "Brand updated successfully" });
    }
    catch (error) {
        console.error("Error updating brand:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.updateBrand = updateBrand;
//# sourceMappingURL=brandController.js.map