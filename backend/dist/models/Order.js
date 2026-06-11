"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const OrderSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Patient", required: true },
    frames: [
        {
            brand: { type: String, required: true, default: "Unknown" },
            quantity: { type: Number, required: true, min: 1, default: 1 },
            imageUrl: { type: String },
            _id: false,
        },
    ],
    lenses: [
        {
            brand: { type: String, required: true, default: "Unknown" },
            powerDetails: { type: String, default: "" },
            _id: false,
        },
    ],
    drops: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            _id: false,
        },
    ],
    tablets: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            _id: false,
        },
    ],
    prescriptionFileUrl: { type: String },
    prescriptionFileName: { type: String },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    amountPaid: { type: Number, min: 0, default: 0 },
    dueAmount: { type: Number, min: 0, default: 0 },
    orderNumber: { type: String, unique: true, sparse: true },
    status: {
        type: String,
        enum: ["Ordered", "Processing", "Ready for Pickup", "Delivered", "Delayed"],
        default: "Ordered",
    },
    statusHistory: [
        {
            status: { type: String },
            changedAt: { type: Date, default: Date.now },
            changedBy: { type: String },
            _id: false,
        },
    ],
    whatsappLogs: [
        {
            sentAt: { type: Date, default: Date.now },
            sentBy: { type: String, required: true },
            _id: false,
        },
    ],
    doctorName: { type: String, default: "Dr. Kasturi" },
    isDelayed: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
}, { timestamps: true });
OrderSchema.index({ patientId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model("Order", OrderSchema);
//# sourceMappingURL=Order.js.map