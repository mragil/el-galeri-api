const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
//Routes Import
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const ordersRoutes = require("./routes/orders");

//.env
require("dotenv/config");
const PORT = process.env.PORT || 4001;
const api = process.env.API_URL;
//Enabling CORS
app.use(cors());
app.options("*", cors());
//Middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));

//Swagger Doc
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "El-Galeri API",
      version: "1.0.0",
      description: "El-Galeri API built with Express",
    },
    servers: [
      {
        url: "https://intense-retreat-74340.herokuapp.com/",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsDoc(options);

//Routes
app.use(`/api-docs`, swaggerUI.serve, swaggerUI.setup(specs));
app.use(`/users`, userRoutes);
app.use(`/products`, productRoutes);
app.use(`/orders`, ordersRoutes);

//static files
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

//Database
mongoose
  .connect(process.env.DB_URL, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "elgaleri-db",
  })
  .then(() => {
    console.log("DB Connected....");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
