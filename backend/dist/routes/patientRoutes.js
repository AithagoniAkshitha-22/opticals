"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientController_1 = require("../controllers/patientController");
const router = (0, express_1.Router)();
router.get("/today", patientController_1.getTodaysPatients);
router.get("/check-returning", patientController_1.checkReturningPatient);
router.get("/", patientController_1.getPatients);
router.get("/:id", patientController_1.getPatientById);
router.post("/", patientController_1.createPatient);
router.put("/:id", patientController_1.updatePatient);
router.delete("/:id", patientController_1.softDeletePatient);
router.post("/:id/restore", patientController_1.restorePatient);
exports.default = router;
//# sourceMappingURL=patientRoutes.js.map