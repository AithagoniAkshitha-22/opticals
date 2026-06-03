import { Router } from "express"
import { uploadFile } from "../controllers/uploadController"

const router = Router()

router.post("/", uploadFile)

// Debug endpoint — returns whether Cloudinary env vars are set (not their values)
router.get("/check", (_req, res) => {
  res.json({
    CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
  })
})

export default router
