import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

router.get("/order", async (req, res) => {
  const orders = await prisma.order.findMany();
  res.json(orders);
});

router.post("/order", async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res
        .status(400)
        .json({ message: "La orden debe contener productos" });
    }

    const lastOrder = await prisma.order.findFirst({
      orderBy: { OrderNo: "desc" },
    });
    const newOrderNo = lastOrder ? lastOrder.OrderNo + 1 : 9901;

    let finalPrice = 0;
    let Cantidad = 0;
    for (const { productId, quantity } of products) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product)
        return res
          .status(400)
          .json({ message: `Producto ${productId} no encontrado` });
          Cantidad += quantity;
      finalPrice += product.price * quantity;
    }


    const newOrder = await prisma.order.create({
      data: {
        OrderNo: newOrderNo,
        FinalPrice: finalPrice,
        Quantity:Cantidad,
      },
    });

    const orderProducts = products.map(({ productId, quantity }) => ({
      orderId: newOrder.id,
      productId,
      quantity,
    }));

    await prisma.orderProduct.createMany({
      data: orderProducts,
    });

    res.json({
      message: "Orden creada con éxito",
      orderId: newOrder.id,
      OrderNo: newOrderNo,
    });
  } catch (error) {
    console.error("Error al crear la orden:", error);
    res.status(500).json({ message: error.message });
  }
});


router.get("/order/:id", async (req, res) => {
  const orderId = parseInt(req.params.id); 
  try {
      const order = await prisma.order.findUnique({
        where: { id:orderId },
        include: {
          products: true,
        },
      });
    
      if (!order) {
        return res.status(404).json({ message: "No se encontró la orden" });
      }
    
      res.json(order);
    } catch (error) {
        console.error("Error al obtener la orden:", error);
    }
   
  });   

router.delete("/order/:id", async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        products: true,
      },
    });
    if (!order) {
      return res.status(404).json({ message: "No se encontró la orden" });
    }
    await prisma.orderProduct.deleteMany({
      where: { orderId: orderId },
    });

    await prisma.order.delete({
      where: { id: orderId },
    });
    res.json({ message: "Orden eliminada con éxito" });
  }
  catch (error) {
    console.error("Error al eliminar la orden:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
