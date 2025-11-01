const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "API documentation for the e-commerce backend",
    },
    servers: [
      {
        url: "/",
      },
      {
        url: "http://localhost:8000/",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    // You can add controllers/models if you keep annotations there too:
    // path.join(__dirname, "../controller/*.js"),
    // path.join(__dirname, "../models/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;


