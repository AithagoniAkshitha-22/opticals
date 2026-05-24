import { Router } from "express"
import { uploadFile } from "../controllers/uploadController"

const router = Router()

router.post("/", uploadFile)

export default router
