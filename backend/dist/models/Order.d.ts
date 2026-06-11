import mongoose, { Document } from "mongoose";
export type OrderStatus = "Ordered" | "Processing" | "Ready for Pickup" | "Delivered" | "Delayed";
export interface IFrameItem {
    brand: string;
    quantity: number;
    imageUrl?: string;
}
export interface ILensItem {
    brand: string;
    powerDetails: string;
}
export interface IDropItem {
    name: string;
    quantity: number;
}
export interface ITabletItem {
    name: string;
    quantity: number;
}
export interface IWhatsAppLog {
    sentAt: Date;
    sentBy: string;
}
export interface IOrder extends Document {
    patientId: mongoose.Types.ObjectId;
    frames: IFrameItem[];
    lenses: ILensItem[];
    drops: IDropItem[];
    tablets: ITabletItem[];
    prescriptionFileUrl?: string;
    prescriptionFileName?: string;
    totalAmount: number;
    amountPaid: number;
    dueAmount: number;
    orderNumber: string;
    status: OrderStatus;
    statusHistory: {
        status: OrderStatus;
        changedAt: Date;
        changedBy?: string;
    }[];
    whatsappLogs: IWhatsAppLog[];
    doctorName: string;
    isDelayed: boolean;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}> & IOrder & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map