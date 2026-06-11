import mongoose, { Document } from "mongoose";
export interface IBrand extends Document {
    name: string;
    type: "frame" | "lens" | "drop";
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IBrand, {}, {}, {}, mongoose.Document<unknown, {}, IBrand, {}> & IBrand & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Brand.d.ts.map