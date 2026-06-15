import { Router } from "express"
import { createPrescription, getPatientPrescriptions, deletePrescription } from "../controllers/prescriptionController"

const router = Router()

router.post("/", createPrescription)
router.get("/patient/:patientId", getPatientPrescriptions)
router.delete("/:id", deletePrescription)

export default router
