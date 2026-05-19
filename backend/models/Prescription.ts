import mongoose, { Schema, Document } from "mongoose"

export interface IEyeData {
  sph: number | null
  cyl: number | null
  axis: number | null
  visionType: "Far" | "Near"
}

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId
  type: "manual" | "upload"
  rightEye?: IEyeData
  leftEye?: IEyeData
  fileUrl?: string
  fileName?: string
  createdAt: Date
  updatedAt: Date
}

const EyeDataSchema = new Schema<IEyeData>(
  {
    sph: { type: Number, default: null },
    cyl: { type: Number, default: null },
    axis: { type: Number, min: 0, max: 180, default: null },
    visionType: { type: String, enum: ["Far", "Near"], required: true },
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
