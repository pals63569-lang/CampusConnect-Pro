const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const config = require("./env");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CampusConnect Pro API Reference",
      version: "1.0.0",
      description:
        "Production-ready Express.js API for CampusConnect Pro - Smart College Event Management System.",
      contact: {
        name: "CampusConnect Pro Support",
        email: "support@campusconnect.edu",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: "Development Server (v1)",
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

module.exports = setupSwagger;
