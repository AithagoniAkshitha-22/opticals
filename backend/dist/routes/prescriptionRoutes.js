"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prescriptionController_1 = require("../controllers/prescriptionController");
const router = (0, express_1.Router)();
router.post("/", prescriptionController_1.createPrescription);
router.get("/patient/:patientId", prescriptionController_1.getPatientPrescriptions);
exports.default = router;
//# sourceMappingURL=prescriptionRoutes.js.map