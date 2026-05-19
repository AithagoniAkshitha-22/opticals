import { Router } from "express"
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  checkReturningPatient,
  getTodaysPatients,
} from "../controllers/patientController"

const router = Router()

router.get("/today", getTodaysPatients)
router.get("/check-returning", checkReturningPatient)
router.get("/", getPatients)
router.get("/:id", getPatientById)
router.post("/", createPatient)
router.put("/:id", updatePatient)

export default router
