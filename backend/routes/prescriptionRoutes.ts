import { Router } from "express"
import { createPrescription, getPatientPrescriptions } from "../controllers/prescriptionController"

const router = Router()

router.post("/", createPrescription)
router.get("/patient/:patientId", getPatientPrescriptions)

export default router
