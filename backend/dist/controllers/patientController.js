"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restorePatient = exports.softDeletePatient = exports.getTodaysPatients = exports.checkReturningPatient = exports.updatePatient = exports.getPatientById = exports.getPatients = exports.createPatient = void 0;
const Patient_1 = __importDefault(require("../models/Patient"));
const Prescription_1 = __importDefault(require("../models/Prescription"));
const Order_1 = __importDefault(require("../models/Order"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
// Create patient
const createPatient = async (req, res) => {
    try {
        const { name, phone, age, address } = req.body;
        if (!name || !phone || !age || !address) {
            res.status(400).json({ success: false, error: "Name, phone, age, and address are required" });
            return;
        }
        const patient = new Patient_1.default({ name: name.trim(), phone: phone.trim(), age: Number(age), address: address.trim() });
        const saved = await patient.save();
        await AuditLog_1.default.create({
            recordType: "Patient",
            recordId: saved._id,
            action: "create",
            changedBy: req.headers["x-user"] || "staff",
            description: `Patient ${saved.name} created`,
            newValues: { name: saved.name, phone: saved.phone, age: saved.age, address: saved.address },
        });
        res.status(201).json({ success: true, data: saved, message: "Patient created successfully" });
    }
    catch (error) {
        console.error("Error creating patient:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.createPatient = createPatient;
// Get all patients with search/filter/pagination
const getPatients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", date = "" } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Math.min(50, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const query = { isHidden: { $ne: true } };
        if (search) {
            query.$or = [
                { name: { $regex: String(search).trim(), $options: "i" } },
                { address: { $regex: String(search).trim(), $options: "i" } },
                { phone: { $regex: String(search).trim(), $options: "i" } },
            ];
        }
        // Filter by specific date (YYYY-MM-DD)
        if (date) {
            const start = new Date(String(date));
            start.setHours(0, 0, 0, 0);
            const end = new Date(String(date));
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }
        const [patients, total] = await Promise.all([
            Patient_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            Patient_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: {
                patients,
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error("Error fetching patients:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.getPatients = getPatients;
// Get single patient with prescriptions and orders
const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient_1.default.findById(id).lean();
        if (!patient) {
            res.status(404).json({ success: false, error: "Patient not found" });
            return;
        }
        const [prescriptions, orders] = await Promise.all([
            Prescription_1.default.find({ patientId: id }).sort({ createdAt: -1 }).lean(),
            Order_1.default.find({ patientId: id, isHidden: { $ne: true } }).sort({ createdAt: -1 }).lean(),
        ]);
        res.status(200).json({ success: true, data: { patient, prescriptions, orders } });
    }
    catch (error) {
        console.error("Error fetching patient:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.getPatientById = getPatientById;
// Update patient
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, age, address } = req.body;
        const existing = await Patient_1.default.findById(id);
        if (!existing) {
            res.status(404).json({ success: false, error: "Patient not found" });
            return;
        }
        const previousValues = { name: existing.name, phone: existing.phone, age: existing.age, address: existing.address };
        const updated = await Patient_1.default.findByIdAndUpdate(id, {
            ...(name && { name: name.trim() }),
            ...(phone && { phone: phone.trim() }),
            ...(age && { age: Number(age) }),
            ...(address && { address: address.trim() }),
        }, { new: true, runValidators: true });
        await AuditLog_1.default.create({
            recordType: "Patient",
            recordId: id,
            action: "update",
            changedBy: req.headers["x-user"] || "staff",
            description: `Patient ${updated?.name} updated`,
            previousValues,
            newValues: req.body,
        });
        res.status(200).json({ success: true, data: updated, message: "Patient updated successfully" });
    }
    catch (error) {
        console.error("Error updating patient:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.updatePatient = updatePatient;
// Check returning patient by phone
const checkReturningPatient = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            res.status(400).json({ success: false, error: "Phone number required" });
            return;
        }
        const patient = await Patient_1.default.findOne({ phone: String(phone).trim(), isHidden: { $ne: true } }).lean();
        if (!patient) {
            res.status(200).json({ success: true, data: { isReturning: false, patient: null } });
            return;
        }
        const [prescriptions, orders] = await Promise.all([
            Prescription_1.default.find({ patientId: patient._id }).sort({ createdAt: -1 }).lean(),
            Order_1.default.find({ patientId: patient._id, isHidden: { $ne: true } }).sort({ createdAt: -1 }).lean(),
        ]);
        res.status(200).json({
            success: true,
            data: { isReturning: true, patient, prescriptions, orders },
        });
    }
    catch (error) {
        console.error("Error checking returning patient:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.checkReturningPatient = checkReturningPatient;
// Get today's patients
const getTodaysPatients = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const patients = await Patient_1.default.find({
            createdAt: { $gte: today, $lt: tomorrow },
        })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, data: { patients, count: patients.length } });
    }
    catch (error) {
        console.error("Error fetching today's patients:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.getTodaysPatients = getTodaysPatients;
// Hard delete patient
const softDeletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient_1.default.findByIdAndDelete(id);
        if (!patient) {
            res.status(404).json({ success: false, error: "Patient not found" });
            return;
        }
        await AuditLog_1.default.create({
            recordType: "Patient", recordId: id, action: "delete",
            changedBy: req.headers["x-user"] || "staff",
            description: `Patient ${patient.name} permanently deleted`,
        });
        res.status(200).json({ success: true, message: "Patient deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting patient:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.softDeletePatient = softDeletePatient;
// Restore patient
const restorePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient_1.default.findByIdAndUpdate(id, { isHidden: false }, { new: true });
        if (!patient) {
            res.status(404).json({ success: false, error: "Patient not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Patient restored successfully" });
    }
    catch (error) {
        console.error("Error restoring patient:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
exports.restorePatient = restorePatient;
//# sourceMappingURL=patientController.js.map