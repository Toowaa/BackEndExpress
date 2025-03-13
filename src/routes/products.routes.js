import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const router = Router();
const prisma = new PrismaClient();

router.get("/products", async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

router.post("/products", async (req, res) => {
  
    try {
        const response = await prisma.product.create({
            data:req.body,
          });
          res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
 
});

export default router;
