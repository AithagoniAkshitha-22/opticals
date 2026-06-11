"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const cloudinary_1 = require("cloudinary");
// Upload base64 image or file to Cloudinary
const uploadFile = async (req, res) => {
    try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (!cloudName || !apiKey || !apiSecret) {
            console.error("Cloudinary env vars missing:", { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
            res.status(500).json({ success: false, error: "Cloudinary is not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." });
            return;
        }
        cloudinary_1.v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
        const { data, folder = "kasturi-eye", resourceType = "auto" } = req.body;
        if (!data) {
            res.status(400).json({ success: false, error: "No file data provided" });
            return;
        }
        const result = await cloudinary_1.v2.uploader.upload(data, {
            folder,
            resource_type: resourceType,
            quality: "auto",
            fetch_format: "auto",
        });
        res.status(200).json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
            },
        });
    }
    catch (error) {
        console.error("Cloudinary upload error:", error);
        res.status(500).json({ success: false, error: error.message || "Upload failed" });
    }
};
exports.uploadFile = uploadFile;
//# sourceMappingURL=uploadController.js.map