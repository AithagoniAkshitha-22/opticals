import mongoose, { Document } from "mongoose";
export interface IAuditLog extends Document {
    recordType: "Patient" | "Prescription" | "Order" | "Brand";
    recordId: mongoose.Types.ObjectId;
    action: "create" | "update";
    changedBy: string;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}> & IAuditLog & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=AuditLog.d.ts.map