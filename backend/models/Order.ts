import mongoose, { Schema, Document } from "mongoose"

export type OrderStatus = "Ordered" | "Processing" | "Ready for Pickup" | "Delivered" | "Delayed"

export interface IFrameItem {
  brand: string
  quantity: number
  imageUrl?: string
}

export interface ILensItem {
  brand: string
  powerDetails: string
}

export interface IDropItem {
  name: string
  quantity: number
}

export interface IWhatsAppLog {
  sentAt: Date
  sentBy: string
}

export interface IOrder extends Document {
  patientId: mongoose.Types.ObjectId
  frames: IFrameItem[]
  lenses: ILensItem[]
  drops: IDropItem[]
  prescriptionFileUrl?: string
  prescriptionFileName?: string
  totalAmount: number
  status: OrderStatus
  statusHistory: { status: OrderStatus; changedAt: Date; changedBy?: string }[]
  whatsappLogs: IWhatsAppLog[]
  doctorName: string
  isDelayed: boolean
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
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
    prescriptionFileUrl: { type: String },
    prescriptionFileName: { type: String },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
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
  },
  { timestamps: true }
)

OrderSchema.index({ patientId: 1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ createdAt: -1 })

export default mongoose.model<IOrder>("Order", OrderSchema)
