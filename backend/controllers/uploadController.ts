import type { Request, Response } from "express"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Upload base64 image or file to Cloudinary
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, folder = "kasturi-eye", resourceType = "auto" } = req.body

    if (!data) {
      res.status(400).json({ success: false, error: "No file data provided" })
      return
    }

    const result = await cloudinary.uploader.upload(data, {
      folder,
      resource_type: resourceType as "auto" | "image" | "raw",
      quality: "auto",
      fetch_format: "auto",
    })

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      },
    })
  } catch (error: any) {
    console.error("Cloudinary upload error:", error)
    res.status(500).json({ success: false, error: error.message || "Upload failed" })
  }
}
