import mongoose, { Schema, Document } from "mongoose"

export interface IPatient extends Document {
  name: string
  phone: string
  age: number
  address: string
  createdAt: Date
  updatedAt: Date
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    address: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

PatientSchema.index({ phone: 1 })
PatientSchema.index({ name: "text" })

export default mongoose.model<IPatient>("Patient", PatientSchema)
