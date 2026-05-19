import type { Request, Response } from "express"
import Order from "../models/Order"
import Patient from "../models/Patient"
import AuditLog from "../models/AuditLog"

// Create order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, frames, lenses, drops, prescriptionFileUrl, prescriptionFileName, totalAmount, doctorName } =
      req.body

    if (!patientId) {
      res.status(400).json({ success: false, error: "Patient ID is required" })
      return
    }

    const patient = await Patient.findById(patientId)
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient not found" })
      return
    }

    const hasItems =
      (frames && frames.length > 0) || (lenses && lenses.length > 0) || (drops && drops.length > 0)
    if (!hasItems) {
      res.status(400).json({ success: false, error: "Order must contain at least one item (frame, lens, or drop)" })
      return
    }

    const order = new Order({
      patientId,
      frames: frames || [],
      lenses: lenses || [],
      drops: drops || [],
      prescriptionFileUrl,
      prescriptionFileName,
      totalAmount: totalAmount || 0,
      doctorName: doctorName || "Dr. Kasturi",
      status: "Ordered",
      statusHistory: [{ status: "Ordered", changedAt: new Date(), changedBy: req.headers["x-user"] || "staff" }],
    })

    const saved = await order.save()

    await AuditLog.create({
      recordType: "Order",
      recordId: saved._id,
      action: "create",
      changedBy: req.headers["x-user"] || "staff",
      description: `Order created for patient ${patient.name}`,
      newValues: { patientId, status: "Ordered", totalAmount },
    })

    res.status(201).json({ success: true, data: saved, message: "Order created successfully" })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Get all orders with filters
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(50, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    const query: any = {}
    if (status && status !== "all") query.status = status
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(String(startDate))
      if (endDate) query.createdAt.$lte = new Date(String(endDate))
    }

    let orders = await Order.find(query)
      .populate("patientId", "name phone address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    // Filter by patient name/phone if search provided
    if (search) {
      const s = String(search).toLowerCase()
      orders = orders.filter((o: any) => {
        const p = o.patientId as any
        return p?.name?.toLowerCase().includes(s) || p?.phone?.includes(s)
      })
    }

    const total = await Order.countDocuments(query)

    res.status(200).json({
      success: true,
      data: { orders, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Get single order
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const order = await Order.findById(id).populate("patientId", "name phone address age").lean()
    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" })
      return
    }
    res.status(200).json({ success: true, data: order })
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Update order status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ["Ordered", "Processing", "Ready for Pickup", "Delivered"]
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: "Invalid status" })
      return
    }

    const order = await Order.findById(id)
    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" })
      return
    }

    if (order.status === "Delivered") {
      res.status(400).json({ success: false, error: "Cannot update status of a delivered order" })
      return
    }

    const previousStatus = order.status
    order.status = status
    order.isDelayed = false
    order.statusHistory.push({ status, changedAt: new Date(), changedBy: req.headers["x-user"] as string || "staff" })

    await order.save()

    await AuditLog.create({
      recordType: "Order",
      recordId: id,
      action: "update",
      changedBy: req.headers["x-user"] || "staff",
      description: `Order status changed from ${previousStatus} to ${status}`,
      previousValues: { status: previousStatus },
      newValues: { status },
    })

    res.status(200).json({ success: true, data: order, message: "Order status updated" })
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Send WhatsApp notification log
export const logWhatsApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { sentBy } = req.body

    const order = await Order.findById(id).populate("patientId", "name phone")
    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" })
      return
    }

    order.whatsappLogs.push({ sentAt: new Date(), sentBy: sentBy || "staff" })
    await order.save()

    const patient = order.patientId as any
    const message = `Hello ${patient.name}, your glasses are ready for pickup at Kasturi Eye Hospitals.`
    const whatsappUrl = `https://wa.me/91${patient.phone}?text=${encodeURIComponent(message)}`

    res.status(200).json({
      success: true,
      data: { whatsappUrl, message, sentAt: new Date(), sentBy: sentBy || "staff" },
      message: "WhatsApp log recorded",
    })
  } catch (error) {
    console.error("Error logging WhatsApp:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Dashboard stats
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Auto-update delayed orders
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Auto transition to Ready for Pickup after 2 days
    await Order.updateMany(
      {
        status: { $in: ["Ordered", "Processing"] },
        createdAt: { $lte: twoDaysAgo },
      },
      {
        $set: { status: "Ready for Pickup" },
        $push: { statusHistory: { status: "Ready for Pickup", changedAt: new Date(), changedBy: "system" } },
      }
    )

    // Flag delayed orders (Ready for Pickup for 3+ days)
    await Order.updateMany(
      {
        status: "Ready for Pickup",
        updatedAt: { $lte: threeDaysAgo },
      },
      { $set: { isDelayed: true } }
    )

    const [todayPatients, activeOrders, processingOrders, readyForPickup, delayedOrders, deliveredOrders] =
      await Promise.all([
        Patient.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
        Order.countDocuments({ status: { $in: ["Ordered", "Processing", "Ready for Pickup"] } }),
        Order.countDocuments({ status: "Processing" }),
        Order.countDocuments({ status: "Ready for Pickup" }),
        Order.countDocuments({ isDelayed: true }),
        Order.countDocuments({ status: "Delivered" }),
      ])

    res.status(200).json({
      success: true,
      data: {
        todayPatients,
        activeOrders,
        processingOrders,
        readyForPickup,
        delayedOrders,
        deliveredOrders,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}

// Monthly reports
export const getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear()

    const [patientStats, orderStats] = await Promise.all([
      Patient.aggregate([
        { $match: { createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
        { $group: { _id: { month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.month": 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
        { $group: { _id: { month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.month": 1 } },
      ]),
    ])

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const report = months.map((month, i) => {
      const mNum = i + 1
      const p = patientStats.find((s: any) => s._id.month === mNum)
      const o = orderStats.find((s: any) => s._id.month === mNum)
      return { month, patients: p?.count || 0, orders: o?.count || 0 }
    })

    res.status(200).json({ success: true, data: { year, report } })
  } catch (error) {
    console.error("Error fetching monthly report:", error)
    res.status(500).json({ success: false, error: "Internal server error" })
  }
}
