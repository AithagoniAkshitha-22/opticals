import mongoose, { Schema, Document } from "mongoose"

export interface IAuditLog extends Document {
  recordType: "Patient" | "Prescription" | "Order" | "Brand"
  recordId: mongoose.Types.ObjectId
  action: "create" | "update"
  changedBy: string
  previousValues?: Record<string, any>
  newValues?: Record<string, any>
  description: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    recordType: {
      type: String,
      enum: ["Patient", "Prescription", "Order", "Brand"],
      required: true,
    },
    recordId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, enum: ["create", "update"], required: true },
    changedBy: { type: String, required: true, default: "system" },
    previousValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

AuditLogSchema.index({ recordType: 1, recordId: 1 })
AuditLogSchema.index({ createdAt: -1 })

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)
