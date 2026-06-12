import mongoose, { Schema, Document } from "mongoose"

export interface IBrand extends Document {
  name: string
  type: "frame" | "lens" | "drop" | "tablet"
  createdAt: Date
  updatedAt: Date
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["frame", "lens", "drop", "tablet"], required: true },
  },
  { timestamps: true }
)

BrandSchema.index({ name: 1, type: 1 }, { unique: true })

export default mongoose.model<IBrand>("Brand", BrandSchema)
