"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = __importDefault(require("./db/connection"));
const patientRoutes_1 = __importDefault(require("./routes/patientRoutes"));
const prescriptionRoutes_1 = __importDefault(require("./routes/prescriptionRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const brandRoutes_1 = __importDefault(require("./routes/brandRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 10000;
app.set("trust proxy", 1);
(0, connection_1.default)();
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (origin.endsWith(".vercel.app"))
            return callback(null, true);
        if (origin.endsWith(".onrender.com"))
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user"],
    credentials: true,
    maxAge: 86400,
};
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions));
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, error: "Too many requests, please try again later" },
});
app.use(limiter);
app.use(express_1.default.json({ limit: "20mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "20mb" }));
app.get("/health", (req, res) => {
    res.status(200).json({ success: true, message: "Kasturi Eye Hospitals API is running", timestamp: new Date().toISOString() });
});
app.use("/api/patients", patientRoutes_1.default);
app.use("/api/prescriptions", prescriptionRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/brands", brandRoutes_1.default);
app.use("/api/upload", uploadRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Kasturi Eye Hospitals API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
exports.default = app;
//# sourceMappingURL=start.js.map