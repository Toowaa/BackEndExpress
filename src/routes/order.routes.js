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
      Cantidad += product;
      finalPrice += product.price * quantity;
    }

    const newOrder = await prisma.order.create({
      data: {
        OrderNo: newOrderNo,
        FinalPrice: finalPrice,
        Quantity: Cantidad,
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
      where: { id: orderId },
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
  } catch (error) {
    console.error("Error al eliminar la orden:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/order/:id", async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "No se encontró la orden" });
    }

    const { products } = req.body;
    if (!products || products.length === 0) {
      return res
        .status(400)
        .json({ message: "La orden debe contener productos" });
    }

    const existingProducts = await prisma.orderProduct.findMany({
      where: { orderId: orderId },
    });

    let newQuantity = 0;
    let newFinalPrice = 0;

    for (const { productId, quantity } of products) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res
          .status(400)
          .json({ message: `Producto ${productId} no encontrado` });
      }

      newQuantity += quantity;
      newFinalPrice += product.price * quantity;

      const existingProduct = existingProducts.find(
        (p) => p.productId === productId
      );

      if (existingProduct) {
        await prisma.orderProduct.update({
          where: {
            orderId_productId: {
              orderId: orderId,
              productId: productId,
            },
          },
          data: { quantity },
        });
      } else {
        await prisma.orderProduct.create({
          data: { orderId, productId, quantity },
        });
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        Quantity: newQuantity,
        FinalPrice: newFinalPrice,
      },
    });

    res.json({
      message: "Orden actualizada con éxito",
      orderId: orderId,
    });
  } catch (error) {
    console.error("Error al actualizar la orden:", error);
    res.status(500).json({ message: error.message });
  }
});


router.delete("/order/:orderId/product/:productId", async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const productId = parseInt(req.params.productId);

  try {
    const existingProduct = await prisma.orderProduct.findUnique({
      where: {
        orderId_productId: {
          orderId: orderId,
          productId: productId,
        },
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "El producto no existe en la orden" });
    }

    await prisma.orderProduct.delete({
      where: {
        orderId_productId: {
          orderId: orderId,
          productId: productId,
        },
      },
    });

    res.json({
      message: `Producto ${productId} eliminado de la orden ${orderId} con éxito`,
    });
  } catch (error) {
    console.error("Error al eliminar el producto de la orden:", error);
    res.status(500).json({ message: error.message });
  }
});


export default router;
