import { Router } from "express"
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  logWhatsApp,
  getDashboardStats,
  getMonthlyReport,
  softDeleteOrder,
  restoreOrder,
  updatePayment,
} from "../controllers/orderController"

const router = Router()

router.get("/dashboard", getDashboardStats)
router.get("/report/monthly", getMonthlyReport)
router.get("/", getOrders)
router.get("/:id", getOrderById)
router.post("/", createOrder)
router.put("/:id/status", updateOrderStatus)
router.put("/:id/payment", updatePayment)
router.post("/:id/whatsapp", logWhatsApp)
router.delete("/:id", softDeleteOrder)
router.post("/:id/restore", restoreOrder)

export default router
