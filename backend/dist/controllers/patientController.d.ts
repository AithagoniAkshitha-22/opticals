import type { Request, Response } from "express";
export declare const createPatient: (req: Request, res: Response) => Promise<void>;
export declare const getPatients: (req: Request, res: Response) => Promise<void>;
export declare const getPatientById: (req: Request, res: Response) => Promise<void>;
export declare const updatePatient: (req: Request, res: Response) => Promise<void>;
export declare const checkReturningPatient: (req: Request, res: Response) => Promise<void>;
export declare const getTodaysPatients: (req: Request, res: Response) => Promise<void>;
export declare const softDeletePatient: (req: Request, res: Response) => Promise<void>;
export declare const restorePatient: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=patientController.d.ts.map