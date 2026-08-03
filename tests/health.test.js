const request = require("supertest");
const { app, server } = require("../server");
const mongoose = require("mongoose");

describe("Health Check API Endpoint", () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (server && server.close) {
      server.close();
    }
  });

  it("should return 200 OK and health statistics for GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("message", "CampusConnect Pro API is operational");
    expect(res.body.data).toHaveProperty("project", "CampusConnect Pro");
    expect(res.body.data).toHaveProperty("status", "Operational");
  });

  it("should return 200 OK for GET /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
  });
});
