import { Router } from "express"
import { getBrands, createBrand, updateBrand } from "../controllers/brandController"

const router = Router()

router.get("/", getBrands)
router.post("/", createBrand)
router.put("/:id", updateBrand)

export default router
