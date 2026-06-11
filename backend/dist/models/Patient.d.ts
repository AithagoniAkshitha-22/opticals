import mongoose, { Document } from "mongoose";
export interface IPatient extends Document {
    name: string;
    phone: string;
    age: number;
    address: string;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPatient, {}, {}, {}, mongoose.Document<unknown, {}, IPatient, {}> & IPatient & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Patient.d.ts.map