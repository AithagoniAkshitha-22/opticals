import mongoose, { Schema, Document } from "mongoose"

export interface IEyeVision {
  sph?: number | null
  cyl?: number | null
  axis?: number | null
  va?: string
}

export interface IEyeDataNew {
  dv?: IEyeVision
  nv?: IEyeVision
}

// Legacy shape (kept for backward compat)
export interface IEyeDataLegacy {
  sph?: number | null
  cyl?: number | null
  axis?: number | null
  visionType?: "Far" | "Near"
}

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId
  type: "manual" | "upload"
  rightEye?: IEyeDataNew & IEyeDataLegacy
  leftEye?: IEyeDataNew & IEyeDataLegacy
  fileUrl?: string
  fileName?: string
  createdAt: Date
  updatedAt: Date
}

const EyeVisionSchema = new Schema<IEyeVision>(
  {
    sph: { type: Number, default: null },
    cyl: { type: Number, default: null },
    axis: { type: Number, min: 0, max: 180, default: null },
    va: { type: String, default: "" },
  },
  { _id: false }
)

const EyeDataSchema = new Schema(
  {
    // New dv/nv structure
    dv: { type: EyeVisionSchema },
    nv: { type: EyeVisionSchema },
    // Legacy fields kept for backward compatibility
    sph: { type: Number, default: null },
    cyl: { type: Number, default: null },
    axis: { type: Number, min: 0, max: 180, default: null },
    visionType: { type: String, enum: ["Far", "Near"] },
  },
  { _id: false }
)

const PrescriptionSchema = new Schema<IPrescription>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    type: { type: String, enum: ["manual", "upload"], required: true },
    rightEye: { type: EyeDataSchema },
    leftEye: { type: EyeDataSchema },
    fileUrl: { type: String },
    fileName: { type: String },
  },
  { timestamps: true }
)

PrescriptionSchema.index({ patientId: 1 })

export default mongoose.model<IPrescription>("Prescription", PrescriptionSchema)
