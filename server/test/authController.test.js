// test/authController.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/index.js");
const User = require("../server/models/User.js");
const { createToken } = require("./setup.js");

describe("Auth Controller Tests", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/signup", () => {
    test("should create a new customer user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123"
      };

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Signup successful");
      expect(response.body.role).toBe("customer");

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe("customer");
    });

    test("should create a restaurant manager user successfully", async () => {
      const userData = {
        name: "Restaurant Manager",
        email: "manager@example.com",
        password: "password123",
        role: "restaurantManager"
      };

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.role).toBe("restaurantManager");
    });

    test("should reject admin account creation through signup", async () => {
      const userData = {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin"
      };

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(403);

      expect(response.body.message).toBe("Cannot create admin account through signup");
    });

    test("should reject duplicate email registration", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123"
      };

      await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe("User already exists");
    });

    test("should reject registration with missing fields", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "John Doe",
          email: "john@example.com"
        })
        .expect(400);

      expect(response.body.message).toBe("Missing fields");
    });

    test("should reject invalid role", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "invalidRole"
      };

      const response = await request(app)
        .post("/api/auth/signup")
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe("Invalid role");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = new User({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "customer"
      });
      await user.save();
    });

    test("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123"
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeTruthy();
      expect(response.body.role).toBe("customer");
      expect(response.body.isAdmin).toBe(false);
    });

    test("should reject login with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword"
        })
        .expect(400);

      expect(response.body.message).toBe("Invalid credentials");
    });

    test("should reject login with non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123"
        })
        .expect(400);

      expect(response.body.message).toBe("Invalid credentials");
    });

    test("should reject login with missing fields", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com"
        })
        .expect(400);

      expect(response.body.message).toBe("Missing fields");
    });
  });

  describe("GET /api/auth/profile", () => {
    let user, token;

    beforeEach(async () => {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("password123", 10);
      user = new User({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "customer"
      });
      await user.save();
      token = createToken(user._id, user.role);
    });

    test("should get user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.name).toBe("Test User");
      expect(response.body.email).toBe("test@example.com");
      expect(response.body.role).toBe("customer");
      expect(response.body.password).toBeUndefined();
    });

    test("should reject profile request without token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .expect(401);

      expect(response.body.message).toBe("Access denied. No token provided.");
    });

    test("should reject profile request with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalidtoken")
        .expect(401);

      expect(response.body.message).toBe("Invalid token.");
    });
  });
});
