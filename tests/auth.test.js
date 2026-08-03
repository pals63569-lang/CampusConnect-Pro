const request = require("supertest");
const { app, server } = require("../server");
const mongoose = require("mongoose");

describe("Auth Validation & Endpoints", () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (server && server.close) {
      server.close();
    }
  });

  it("should fail registration with invalid email format", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "invalid-email-string",
      password: "password123",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Validation Error");
  });

  it("should fail registration with short password", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "testuser@campus.edu",
      password: "123",
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("success", false);
  });
});
