import type { Request, Response } from "express"
import Prescription from "../models/Prescription"
import Patient from "../models/Patient"
import AuditLog from "../models/AuditLog"

// Add prescription (manual or upload)
export const createPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, type, rightEye, leftEye, fileUrl, fileName } = req.body

    if (!patientId) {
      res.status(400).json({ success: false, error: "Patient ID is required" })
      return
    }

    const patient = await Patient.findById(patientId)
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" })
      return
    }

    if (type === "manual") {
      if (!rightEye && !leftEye) {
        res.status(400).json({ success: false, error: "At least one eye data is required for manual entry" })
        return
      }
      // Validate axis range
      if (rightEye?.axis !== null && rightEye?.axis !== undefined && (rightEye.axis < 0 || rightEye.axis > 180)) {
        res.status(400).json({ success: false, error: "Right eye axis must be between 0 and 180" })
        return
      }
      if (leftEye?.axis !== null && leftEye?.axis !== undefined && (leftEye.axis < 0 || leftEye.axis > 180)) {
        res.status(400).json({ success: false, error: "Left eye axis must be between 0 and 180" })
        return
      }
    } else if (type === "upload") {
      if (!fileUrl) {
        res.status(400).json({ success: false, error: "File URL is required for upload type" })
        return
      }
    } else {
      res.status(400).json({ success: false, error: "Type must be 'manual' or 'upload'" })
      return
    }

    const prescription = new Prescription({
      patientId,
      type,
      rightEye: type === "manual" ? rightEye : undefined,
      leftEye: type === "manual" ? leftEye : undefined,
      fileUrl: type === "upload" ? fileUrl : undefined,
      fileName: type === "upload" ? fileName : undefined,
    })

    const saved = await prescription.save()

    await AuditLog.create({
      recordType: "Prescription",
      recordId: saved._id,
      action: "create",
      changedBy: req.headers["x-user"] || "staff",
      description: `Prescription added for patient ${patient.name}`,
      newValues: { patientId, type },
    })

    res.status(201).json({ success: true, data: saved, message: "Prescription saved successfully" })
  } catch (error) {
    console.error("Error creating prescription:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Get prescriptions for a patient
export const getPatientPrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params
    const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 }).lean()
    res.status(200).json({ success: true, data: prescriptions })
  } catch (error) {
    console.error("Error fetching prescriptions:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}
