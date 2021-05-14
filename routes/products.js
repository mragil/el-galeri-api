const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Product } = require("../models/Product");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");
    if (isValid) uploadError = null;
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

/**
 * @swagger
 * components:
 *    schemas:
 *      Product:
 *        type: object
 *        required:
 *          - name
 *          - description
 *        properties:
 *          id:
 *            type: string
 *            description: Auto generated id of the product
 *          name:
 *            type: string
 *            description: Name of the product
 *          description:
 *            type: string
 *            description: Description of the product
 *          detailDescription:
 *            type: string
 *            description: Detail description of the product
 *          image:
 *            type: string
 *            description: Url of the image product
 *          images:
 *            type: array
 *            description:  Urls of the image product
 *          price:
 *            type: number
 *            description: Price of the product
 *          stock:
 *            type: number
 *            description: Stock of the product
 *          dateCreated:
 *            type: date
 *            description: Auto generated date of the product created
 *        example:
 *          id: 608a50efb895e53188a40bf5
 *          name: Kemeja Lengan Panjang
 *          description: Kemeja lengan panjang dengan bahan premium.
 *          detailDescription: Kemeja lengan panjang tersedia dalam ukuran M, L, XL.
 *          image: http://localhost:3000/public/uploads/WhatsApp-Image-2020-11-09-at-08.39.36.jpeg-1619677423907.jpeg
 *          images: [http://localhost:3000/public/uploads/WhatsApp-Image-2020-11-09-at-08.39.34-(2).jpeg-1619678815858.jpeg]
 *          price: 250000
 *          stock: 20
 *          dateCreated: 2021-04-29T06:23:43.921Z
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: All routes of product
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Returns the list of all product
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: The list of all product
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Internal server error
 *       404:
 *         description: Products not found
 */
router.get(`/`, async (req, res) => {
  const productList = await Product.find().catch((err) => {
    return res.status(400).json({
      success: false,
      message: "Internal Server Error",
    });
  });

  if (!productList) {
    res.status(404).json({
      success: false,
      error: "Products not found",
    });
  }

  res.send(productList);
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get the product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product id
 *     responses:
 *       200:
 *         description: Product Data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Internal server error
 *       404:
 *         description: User not found
 */
router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).catch((err) => {
    return res.status(400).json({
      success: false,
      message: "Internal Server Error",
    });
  });
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product with given ID is not found",
    });
  }

  res.send(product);
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                  type: string
 *                  description: The product name.
 *                  example: Kemeja Lengan Panjang
 *               description:
 *                  type: string
 *                  description: Description of the product.
 *                  example: Kemeja lengan panjang dengan bahan premium.
 *               detailDescription:
 *                  type: string
 *                  description: Detail description of the product.
 *                  example: Kemeja lengan panjang tersedia dalam ukuran M, L, XL.
 *               image:
 *                  type: string
 *                  format: binary
 *                  description: Image of the product.
 *               price:
 *                  type: number
 *                  description: Price of the produt.
 *                  example: 250000.
 *               stock:
 *                  type: number
 *                  description: Stock of the produt.
 *                  example: 20.
 *
 *     responses:
 *       200:
 *         description: Product successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *          description: Image File is not presented
 *       500:
 *         description: Internal Server Error
 */

router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  const file = req.file;
  if (!file)
    return res.status(400).json({
      success: false,
      message: "Image file is not presented",
    });
  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    detailDescription: req.body.detailDescription,
    image: `${basePath}${fileName}`,
    price: req.body.price,
    stock: req.body.stock,
  });
  product = await product.save().catch((err) => {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Failed to create product",
    });
  }

  res.send(product);
});

/**
 * @swagger
 * /products/gallery-images/{id}:
 *   put:
 *     summary: Add images gallery to product
 *     tags: [Products]
 *     parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          required: true
 *          description: Product id
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                  type: array
 *                  items:
 *                      type: string
 *                      format: binary
 *                      description: Image url
 *
 *     responses:
 *       200:
 *         description: Product successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *          description: Image File is not presented
 *       404:
 *          description: Product with given ID is not found!
 *       500:
 *         description: Internal Server Error
 */

router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    console.log("masuk");
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    if (!files) {
      return res.status(400).json({
        success: false,
        message: "Image file is not presented",
      });
    }

    files.map((file) => {
      imagesPaths.push(`${basePath}${file.filename}`);
    });
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    ).catch((err) => {
      return res.status(400).json({
        success: false,
        message: "Internal Server Error",
      });
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product with given ID is not found!",
      });
    }
    res.send(product);
  }
);

module.exports = router;
