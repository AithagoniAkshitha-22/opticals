import type { Request, Response } from "express"
import Brand from "../models/Brand"
import Order from "../models/Order"
import AuditLog from "../models/AuditLog"

// Get all brands
export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query
    const query: any = {}
    if (type) query.type = type

    const brands = await Brand.find(query).sort({ name: 1 }).lean()
    res.status(200).json({ success: true, data: brands })
  } catch (error) {
    console.error("Error fetching brands:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Create brand
export const createBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type } = req.body
    if (!name || !type) {
      res.status(400).json({ success: false, error: "Name and type are required" })
      return
    }
    if (!["frame", "lens"].includes(type)) {
      res.status(400).json({ success: false, error: "Type must be 'frame' or 'lens'" })
      return
    }

    const existing = await Brand.findOne({ name: name.trim(), type })
    if (existing) {
      res.status(400).json({ success: false, error: `A ${type} brand with this name already exists` })
      return
    }

    const brand = new Brand({ name: name.trim(), type })
    const saved = await brand.save()

    await AuditLog.create({
      recordType: "Brand",
      recordId: saved._id,
      action: "create",
      changedBy: req.headers["x-user"] || "staff",
      description: `Brand ${saved.name} (${saved.type}) created`,
      newValues: { name: saved.name, type: saved.type },
    })

    res.status(201).json({ success: true, data: saved, message: "Brand created successfully" })
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: "Brand already exists" })
      return
    }
    console.error("Error creating brand:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Update brand
export const updateBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: "Name is required" })
      return
    }

    const brand = await Brand.findById(id)
    if (!brand) {
      res.status(404).json({ success: false, error: "Brand not found" })
      return
    }

    const duplicate = await Brand.findOne({ name: name.trim(), type: brand.type, _id: { $ne: id } })
    if (duplicate) {
      res.status(400).json({ success: false, error: "A brand with this name already exists" })
      return
    }

    const oldName = brand.name
    brand.name = name.trim()
    await brand.save()

    // Cascade update in orders
    if (brand.type === "frame") {
      await Order.updateMany({ "frames.brand": oldName }, { $set: { "frames.$[elem].brand": name.trim() } }, { arrayFilters: [{ "elem.brand": oldName }] })
    } else {
      await Order.updateMany({ "lenses.brand": oldName }, { $set: { "lenses.$[elem].brand": name.trim() } }, { arrayFilters: [{ "elem.brand": oldName }] })
    }

    await AuditLog.create({
      recordType: "Brand",
      recordId: id,
      action: "update",
      changedBy: req.headers["x-user"] || "staff",
      description: `Brand renamed from ${oldName} to ${name.trim()}`,
      previousValues: { name: oldName },
      newValues: { name: name.trim() },
    })

    res.status(200).json({ success: true, data: brand, message: "Brand updated successfully" })
  } catch (error) {
    console.error("Error updating brand:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}
