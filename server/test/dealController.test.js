// test/dealController.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/index.js");
const User = require("../server/models/User.js");
const Restaurant = require("../server/models/Restaurant.js");
const { createToken } = require("./setup.js");

describe("Deal Controller Tests", () => {
  let adminToken, customerToken, managerToken;
  let admin, customer, manager;
  let restaurant;

  beforeEach(async () => {
    await User.deleteMany({});
    await Restaurant.deleteMany({});

    admin = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "hashedpassword",
      role: "admin",
      isAdmin: true
    });
    await admin.save();
    adminToken = createToken(admin._id, "admin");

    customer = new User({
      name: "Customer User",
      email: "customer@example.com",
      password: "hashedpassword",
      role: "customer"
    });
    await customer.save();
    customerToken = createToken(customer._id, "customer");

    manager = new User({
      name: "Manager User",
      email: "manager@example.com",
      password: "hashedpassword",
      role: "restaurantManager"
    });
    await manager.save();
    managerToken = createToken(manager._id, "restaurantManager");

    restaurant = new Restaurant({
      name: "Test Restaurant",
      city: "Test City",
      cuisine: "Italian",
      restaurantManagerId: manager._id,
      status: "approved"
    });
    await restaurant.save();
  });

  describe("POST /api/manager/register-restaurant", () => {
    test("should register a new restaurant successfully", async () => {
      const restaurantData = {
        name: "New Restaurant",
        city: "New City",
        cuisine: "Mexican",
        latitude: 40.7128,
        longitude: -74.0060
      };

      const response = await request(app)
        .post("/api/manager/register-restaurant")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(restaurantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Restaurant registered successfully. Waiting for admin approval.");
      expect(response.body.restaurant.name).toBe("New Restaurant");
      expect(response.body.restaurant.status).toBe("pending");
    });

    test("should reject registration without required fields", async () => {
      const response = await request(app)
        .post("/api/manager/register-restaurant")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          name: "Incomplete Restaurant"
        })
        .expect(400);

      expect(response.body.message).toBe("Name and city are required");
    });

    test("should reject registration from non-manager", async () => {
      const restaurantData = {
        name: "Unauthorized Restaurant",
        city: "Test City",
        cuisine: "Italian"
      };

      const response = await request(app)
        .post("/api/manager/register-restaurant")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(restaurantData)
        .expect(401);

      expect(response.body.message).toBe("Access denied. Restaurant manager role required.");
    });

    test("should reject duplicate restaurant registration", async () => {
      const restaurantData = {
        name: "Duplicate Restaurant",
        city: "Test City",
        cuisine: "Italian"
      };

      await request(app)
        .post("/api/manager/register-restaurant")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(restaurantData)
        .expect(201);

      const response = await request(app)
        .post("/api/manager/register-restaurant")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(restaurantData)
        .expect(400);

      expect(response.body.message).toBe("You already have a registered restaurant. Please update your existing restaurant.");
    });
  });

  describe("POST /api/manager/add-deal", () => {
    test("should add a deal successfully", async () => {
      const dealData = {
        title: "Test Deal",
        description: "Test Description",
        price: 10.99,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        spiceLevel: 3,
        dietary: "vegetarian",
        cuisine: "Italian",
        dealType: "day"
      };

      const response = await request(app)
        .post("/api/manager/add-deal")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(dealData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Deal added successfully. Waiting for admin approval.");
      expect(response.body.deal.title).toBe("Test Deal");
      expect(response.body.deal.status).toBe("pending");
      expect(response.body.deal.isActive).toBe(false);
    });

    test("should reject deal creation without required fields", async () => {
      const response = await request(app)
        .post("/api/manager/add-deal")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          description: "Deal without title"
        })
        .expect(400);

      expect(response.body.message).toBe("Title and price are required");
    });

    test("should reject deal creation for pending restaurant", async () => {
      restaurant.status = "pending";
      await restaurant.save();

      const dealData = {
        title: "Test Deal",
        price: 10.99
      };

      const response = await request(app)
        .post("/api/manager/add-deal")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(dealData)
        .expect(403);

      expect(response.body.message).toBe("Your restaurant must be approved before you can add deals.");
    });

    test("should reject invalid deal type", async () => {
      const dealData = {
        title: "Test Deal",
        price: 10.99,
        dealType: "invalid"
      };

      const response = await request(app)
        .post("/api/manager/add-deal")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(dealData)
        .expect(400);

      expect(response.body.message).toBe("Invalid dealType");
    });

    test("should reject access from non-manager", async () => {
      const dealData = {
        title: "Unauthorized Deal",
        price: 10.99
      };

      const response = await request(app)
        .post("/api/manager/add-deal")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(dealData)
        .expect(401);

      expect(response.body.message).toBe("Access denied. Restaurant manager role required.");
    });
  });

  describe("GET /api/manager/my-deals", () => {
    beforeEach(async () => {
      const deal = {
        title: "Test Deal",
        description: "Test Description",
        price: 10.99,
        status: "approved",
        isActive: true
      };
      restaurant.deals.push(deal);
      await restaurant.save();
    });

    test("should get all deals for manager's restaurant", async () => {
      const response = await request(app)
        .get("/api/manager/my-deals")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deals.length).toBe(1);
      expect(response.body.deals[0].title).toBe("Test Deal");
    });

    test("should reject access from non-manager", async () => {
      const response = await request(app)
        .get("/api/manager/my-deals")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(401);

      expect(response.body.message).toBe("Access denied. Restaurant manager role required.");
    });
  });
});
