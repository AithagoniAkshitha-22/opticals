"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const router = (0, express_1.Router)();
router.get("/dashboard", orderController_1.getDashboardStats);
router.get("/report/monthly", orderController_1.getMonthlyReport);
router.get("/", orderController_1.getOrders);
router.get("/:id", orderController_1.getOrderById);
router.post("/", orderController_1.createOrder);
router.put("/:id/status", orderController_1.updateOrderStatus);
router.put("/:id/payment", orderController_1.updatePayment);
router.post("/:id/whatsapp", orderController_1.logWhatsApp);
router.delete("/:id", orderController_1.softDeleteOrder);
router.post("/:id/restore", orderController_1.restoreOrder);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map