import mongoose, { Document } from "mongoose";
export interface IEyeData {
    sph: number | null;
    cyl: number | null;
    axis: number | null;
    visionType: "Far" | "Near";
}
export interface IPrescription extends Document {
    patientId: mongoose.Types.ObjectId;
    type: "manual" | "upload";
    rightEye?: IEyeData;
    leftEye?: IEyeData;
    fileUrl?: string;
    fileName?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPrescription, {}, {}, {}, mongoose.Document<unknown, {}, IPrescription, {}> & IPrescription & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Prescription.d.ts.map