"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brandController_1 = require("../controllers/brandController");
const router = (0, express_1.Router)();
router.get("/", brandController_1.getBrands);
router.post("/", brandController_1.createBrand);
router.put("/:id", brandController_1.updateBrand);
exports.default = router;
//# sourceMappingURL=brandRoutes.js.map