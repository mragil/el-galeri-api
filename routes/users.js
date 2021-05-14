const express = require("express");
const router = express.Router();
const bycrypt = require("bcryptjs");

/**
 * @swagger
 * components:
 *    schemas:
 *      User:
 *        type: object
 *        required:
 *          - name
 *          - email
 *          - password
 *        properties:
 *          id:
 *            type: string
 *            description: Auto generated id of the user
 *          name:
 *            type: string
 *            description: The name of the user
 *          password:
 *            type: string
 *            description: The password of the user
 *          email:
 *            type: string
 *            description: The email of the user
 *        example:
 *          id: 60896dfd4425c657ccfea7a6
 *          name: Muhammad Ragil
 *          email: mragil@gil.com
 *          password: asda939aadak29asdjg9
 *          isAdmin: true
 *
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: All routes of users
 */

//Model
const { User } = require("../models/User");

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns the list of all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       400:
 *         description: Internal server error
 *       404:
 *         description: Users not found
 */
router.get(`/`, async (req, res) => {
  const userList = await User.find().catch((err) => {
    return res.status(400).json({
      success: false,
      message: "Internal Server Error",
    });
  });

  if (!userList) {
    res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  res.send(userList);
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get the user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: User Data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Internal server error
 *       404:
 *         description: User not found
 */

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).catch((err) => {
    return res.status(400).json({
      success: false,
      message: "Internal Server Error",
    });
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User with given ID is not found",
    });
  }

  res.send(user);
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                  type: string
 *                  description: The user's name.
 *                  example: Muhammad Ragil
 *               email:
 *                  type: string
 *                  description: The user's email.
 *                  example: mragil@gil.com
 *               password:
 *                  type: string
 *                  description: The user's password.
 *                  example: thisispassword
 *               isAdmin:
 *                  type: boolean
 *                  description: true if user is admin, false if not.
 *                  example: true
 *
 *     responses:
 *       200:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *          description: Failed To Create User
 *       500:
 *         description: Internal Server Error
 */
router.post(`/`, async (req, res) => {
  try {
    const hashedPassword = await bycrypt.hash(req.body.password, 11);

    let user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      isAdmin: req.body.isAdmin,
    });

    user = await user.save();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Failed to create user!",
      });
    }
    res.send(user);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *  put:
 *    summary: Update the user by the id
 *    tags: [Users]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: User id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                  type: string
 *                  description: The user's name.
 *                  example: Muhammad Ragil
 *               email:
 *                  type: string
 *                  description: The user's email.
 *                  example: mragil@gil.com
 *               password:
 *                  type: string
 *                  description: The user's password.
 *                  example: thisisnewpassword
 *               isAdmin:
 *                  type: boolean
 *                  description: true if user is admin, false if not.
 *                  example: false
 *    responses:
 *      200:
 *        description: User successfully updated!
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      404:
 *        description: User with given ID is not found!
 *      500:
 *        description: Internal Server Error!
 */
router.put(`/:id`, async (req, res) => {
  try {
    const hashedPassword = await bycrypt.hash(req.body.password, 11);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        isAdmin: req.body.isAdmin,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with given ID is not found!",
      });
    }
    res.send(user);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove the user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User id
 *
 *     responses:
 *       200:
 *         description: User successfully deleted!
 *       404:
 *         description: User not found!
 */
router.delete("/:id", async (req, res) => {
  const deletedUser = await User.findByIdAndRemove(req.params.id).catch(
    (err) => {
      return res.status(400).json({
        success: false,
        error: err,
      });
    }
  );

  if (!deletedUser) {
    return res.status(404).json({
      success: false,
      message: "User not found!",
    });
  }

  return res.status(200).json({
    success: true,
    message: "User successfully deleted!",
  });
});

module.exports = router;
