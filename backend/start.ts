import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"
import connectDB from "./db/connection"
import patientRoutes from "./routes/patientRoutes"
import prescriptionRoutes from "./routes/prescriptionRoutes"
import orderRoutes from "./routes/orderRoutes"
import brandRoutes from "./routes/brandRoutes"
import uploadRoutes from "./routes/uploadRoutes"
import { errorHandler, notFound } from "./middleware/errorHandler"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 10000
app.set("trust proxy", 1)

connectDB()

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
]

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true)
    // Allow any vercel.app subdomain
    if (origin.endsWith(".vercel.app")) return callback(null, true)
    // Allow any render.com subdomain
    if (origin.endsWith(".onrender.com")) return callback(null, true)
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error("Not allowed by CORS"))
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user"],
  credentials: true,
  maxAge: 86400,
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: "Too many requests, please try again later" },
})
app.use(limiter)

app.use(express.json({ limit: "20mb" }))
app.use(express.urlencoded({ extended: true, limit: "20mb" }))

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Kasturi Eye Hospitals API is running",
    timestamp: new Date().toISOString(),
  })
})

app.use("/api/patients", patientRoutes)
app.use("/api/prescriptions", prescriptionRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/brands", brandRoutes)
app.use("/api/upload", uploadRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Kasturi Eye Hospitals API running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})

export default app
