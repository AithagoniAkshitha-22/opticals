import type { Request, Response } from "express";
export declare const createOrder: (req: Request, res: Response) => Promise<void>;
export declare const getOrders: (req: Request, res: Response) => Promise<void>;
export declare const getOrderById: (req: Request, res: Response) => Promise<void>;
export declare const updateOrderStatus: (req: Request, res: Response) => Promise<void>;
export declare const logWhatsApp: (req: Request, res: Response) => Promise<void>;
export declare const getDashboardStats: (req: Request, res: Response) => Promise<void>;
export declare const getMonthlyReport: (req: Request, res: Response) => Promise<void>;
export declare const updatePayment: (req: Request, res: Response) => Promise<void>;
export declare const softDeleteOrder: (req: Request, res: Response) => Promise<void>;
export declare const restoreOrder: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=orderController.d.ts.map