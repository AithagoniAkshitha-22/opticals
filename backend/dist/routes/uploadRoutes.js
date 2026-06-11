"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const router = (0, express_1.Router)();
router.post("/", uploadController_1.uploadFile);
// Debug endpoint — returns whether Cloudinary env vars are set (not their values)
router.get("/check", (_req, res) => {
    res.json({
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
    });
});
exports.default = router;
//# sourceMappingURL=uploadRoutes.js.map