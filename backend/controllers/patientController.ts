import type { Request, Response } from "express"
import Patient from "../models/Patient"
import Prescription from "../models/Prescription"
import Order from "../models/Order"
import AuditLog from "../models/AuditLog"

// Create patient
export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, age, address } = req.body
    if (!name || !phone || !age || !address) {
      res.status(400).json({ success: false, error: "Name, phone, age, and address are required" })
      return
    }

    const patient = new Patient({ name: name.trim(), phone: phone.trim(), age: Number(age), address: address.trim() })
    const saved = await patient.save()

    await AuditLog.create({
      recordType: "Patient",
      recordId: saved._id,
      action: "create",
      changedBy: req.headers["x-user"] || "staff",
      description: `Patient ${saved.name} created`,
      newValues: { name: saved.name, phone: saved.phone, age: saved.age, address: saved.address },
    })

    res.status(201).json({ success: true, data: saved, message: "Patient created successfully" })
  } catch (error: any) {
    console.error("Error creating patient:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Get all patients with search/filter/pagination
export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = "", phone = "" } = req.query

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(50, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: String(search).trim(), $options: "i" } },
        { address: { $regex: String(search).trim(), $options: "i" } },
      ]
    }
    if (phone) {
      query.phone = { $regex: String(phone).trim(), $options: "i" }
    }

    const [patients, total] = await Promise.all([
      Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Patient.countDocuments(query),
    ])

    res.status(200).json({
      success: true,
      data: {
        patients,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error("Error fetching patients:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Get single patient with prescriptions and orders
export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const patient = await Patient.findById(id).lean()
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" })
      return
    }

    const [prescriptions, orders] = await Promise.all([
      Prescription.find({ patientId: id }).sort({ createdAt: -1 }).lean(),
      Order.find({ patientId: id }).sort({ createdAt: -1 }).lean(),
    ])

    res.status(200).json({ success: true, data: { patient, prescriptions, orders } })
  } catch (error) {
    console.error("Error fetching patient:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Update patient
export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, phone, age, address } = req.body

    const existing = await Patient.findById(id)
    if (!existing) {
      res.status(404).json({ success: false, error: "Patient not found" })
      return
    }

    const previousValues = { name: existing.name, phone: existing.phone, age: existing.age, address: existing.address }

    const updated = await Patient.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(age && { age: Number(age) }),
        ...(address && { address: address.trim() }),
      },
      { new: true, runValidators: true }
    )

    await AuditLog.create({
      recordType: "Patient",
      recordId: id,
      action: "update",
      changedBy: req.headers["x-user"] || "staff",
      description: `Patient ${updated?.name} updated`,
      previousValues,
      newValues: req.body,
    })

    res.status(200).json({ success: true, data: updated, message: "Patient updated successfully" })
  } catch (error) {
    console.error("Error updating patient:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Check returning patient by phone
export const checkReturningPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query
    if (!phone) {
      res.status(400).json({ success: false, error: "Phone number required" })
      return
    }

    const patient = await Patient.findOne({ phone: String(phone).trim() }).lean()
    if (!patient) {
      res.status(200).json({ success: true, data: { isReturning: false, patient: null } })
      return
    }

    const [prescriptions, orders] = await Promise.all([
      Prescription.find({ patientId: patient._id }).sort({ createdAt: -1 }).lean(),
      Order.find({ patientId: patient._id }).sort({ createdAt: -1 }).lean(),
    ])

    res.status(200).json({
      success: true,
      data: { isReturning: true, patient, prescriptions, orders },
    })
  } catch (error) {
    console.error("Error checking returning patient:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Get today's patients
export const getTodaysPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const patients = await Patient.find({
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({ success: true, data: { patients, count: patients.length } })
  } catch (error) {
    console.error("Error fetching today's patients:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Soft delete patient (hide)
export const softDeletePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const patient = await Patient.findByIdAndUpdate(id, { isHidden: true }, { new: true })
    if (!patient) { res.status(404).json({ success: false, error: "Patient not found" }); return }
    await AuditLog.create({
      recordType: "Patient", recordId: id, action: "update",
      changedBy: req.headers["x-user"] || "staff",
      description: `Patient ${patient.name} hidden`,
      previousValues: { isHidden: false }, newValues: { isHidden: true },
    })
    res.status(200).json({ success: true, message: "Patient hidden successfully" })
  } catch (error) {
    console.error("Error hiding patient:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Restore patient
export const restorePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const patient = await Patient.findByIdAndUpdate(id, { isHidden: false }, { new: true })
    if (!patient) { res.status(404).json({ success: false, error: "Patient not found" }); return }
    res.status(200).json({ success: true, message: "Patient restored successfully" })
  } catch (error) {
    console.error("Error restoring patient:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}
