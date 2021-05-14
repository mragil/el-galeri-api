const express = require("express");
const router = express.Router();

//Model
const { Order } = require("../models/Order");
const { OrderItem } = require("../models/OrderItem");

/**
 * @swagger
 * components:
 *    examples:
 *      orderItem:
 *          quantity: 2
 *          product: 6075ab19b1e46236c89bf80d
 */

/**
 * @swagger
 * components:
 *    schemas:
 *      Order:
 *        type: object
 *        required:
 *          - orderItems
 *          - totalPrice
 *          - user
 *        properties:
 *          id:
 *            type: string
 *            description: Auto generated id of the order
 *          orderItems:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/OrderItem'
 *            description: List of object that contain quantity and id of the purchased product
 *          totalPrice:
 *            type: number
 *            description: Total price of the purchased product
 *          user:
 *            type: string
 *            description: The id of the user that placing the order
 *          dateOrdered:
 *            type: date
 *            description: Date of order take place
 *        example:
 *          id: 608a50efb895e53188a40bf5
 *          orderItems: [{ quantity : 2, product : 608a50efb895e53188a40bf5}]
 *          totalPrice: 320000
 *          user: 60896dfd4425c657ccfea7a6
 *          dateOrdered: 2021-04-29T16:33:23.160Z
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: All routes of orders
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Returns the list of all order
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: The list of all order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 *       404:
 *         description: Orders not found
 */
router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 })
    .catch((err) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error!",
      });
    }); //sort by the newest

  if (!orderList) {
    res.status(404).json({
      success: false,
      message: "Orders not found!",
    });
  }

  res.send(orderList);
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get the order by id
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order id
 *     responses:
 *       200:
 *         description: Order Data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
 *       404:
 *         description: Order not found
 */

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        select: "name price ",
      },
    })
    .catch((err) => {
      return res.status(500).json({
        success: false,
        message: "Internal server error!",
      });
    });

  if (!order) {
    res.status(404).json({
      success: false,
      message: "Order not found!",
    });
  }
  res.send(order);
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderItems:
 *                  type: array
 *                  items:
 *                      type: object
 *                      properties:
 *                          quantity:
 *                              type: number
 *                              description: Quantity of the purchased product
 *                              example: 2
 *                          product:
 *                              type: string
 *                              description: Id of the purchased product
 *                              example: 608a50efb895e53188a40bf5
 *                  description: List of purchased product & quantity.
 *                  example:
 *                      -   quantity: 2
 *                          product: 6090df863dbf1045fc651cdb
 *                      -   quantity: 1
 *                          product: 6090dfc53dbf1045fc651cdc
 *               user:
 *                  type: string
 *                  description: The user's id.
 *                  example: 60896dfd4425c657ccfea7a6
 *     responses:
 *       200:
 *         description: Order successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *          description: Failed To Create Order
 *       500:
 *         description: Internal Server Error
 */

router.post(`/`, async (req, res) => {
  try {
    const orderItemsIds = await Promise.all(
      req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
      })
    );

    const totalPrices = await Promise.all(
      orderItemsIds.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate(
          "product",
          "price"
        );
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
      })
    );

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    let order = new Order({
      orderItems: orderItemsIds,
      totalPrice,
      user: req.body.user,
    });

    order = await order.save();

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Failed to create order!",
      });
    }
    res.send(order);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!s",
    });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Remove the order by id
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order id
 *
 *     responses:
 *       200:
 *         description: Order successfully deleted!
 *       404:
 *         description: Order not found!
 *       500:
 *         description: Internal Server Error!
 */

router.delete("/:id", async (req, res) => {
  const deletedOrder = await Order.findByIdAndRemove(req.params.id).catch(
    (err) => {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error!",
      });
    }
  );

  if (!deletedOrder) {
    return res.status(404).json({
      success: false,
      message: "Order not found!",
    });
  }

  await deletedOrder.orderItems.map(async (orderItem) => {
    await OrderItem.findByIdAndRemove(orderItem);
  });

  return res.status(200).json({
    success: true,
    message: "Order successfully deleted!",
  });
});

module.exports = router;
