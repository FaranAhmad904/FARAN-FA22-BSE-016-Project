// test/restaurantController.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/index.js");
const User = require("../server/models/User.js");
const Restaurant = require("../server/models/Restaurant.js");
const { createToken } = require("./setup.js");

describe("Restaurant Controller Tests", () => {
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

  describe("GET /api/restaurants", () => {
    test("should get all approved restaurants", async () => {
      const response = await request(app)
        .get("/api/restaurants")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe("Test Restaurant");
      expect(response.body[0].status).toBe("approved");
    });

    test("should filter restaurants by city", async () => {
      const response = await request(app)
        .get("/api/restaurants?city=Test City")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].city).toBe("Test City");
    });

    test("should filter restaurants by cuisine", async () => {
      const response = await request(app)
        .get("/api/restaurants?cuisine=Italian")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].cuisine).toBe("Italian");
    });

    test("should search restaurants by name", async () => {
      const response = await request(app)
        .get("/api/restaurants?search=Test")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toContain("Test");
    });

    test("should return empty array for non-matching filters", async () => {
      const response = await request(app)
        .get("/api/restaurants?city=NonExistentCity")
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    test("should not return pending restaurants", async () => {
      const pendingRestaurant = new Restaurant({
        name: "Pending Restaurant",
        city: "Test City",
        cuisine: "Mexican",
        restaurantManagerId: manager._id,
        status: "pending"
      });
      await pendingRestaurant.save();

      const response = await request(app)
        .get("/api/restaurants")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe("Test Restaurant");
    });

    test("should sort featured restaurants first", async () => {
      const featuredRestaurant = new Restaurant({
        name: "Featured Restaurant",
        city: "Test City",
        cuisine: "Asian",
        restaurantManagerId: manager._id,
        status: "approved",
        featured: true
      });
      await featuredRestaurant.save();

      const response = await request(app)
        .get("/api/restaurants")
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body[0].featured).toBe(true);
      expect(response.body[0].name).toBe("Featured Restaurant");
    });
  });

  describe("Restaurant Deals Integration", () => {
    beforeEach(async () => {
      const deal = {
        title: "Test Deal",
        description: "Test Description",
        price: 10.99,
        status: "approved",
        isActive: true,
        featured: false
      };
      restaurant.deals.push(deal);
      await restaurant.save();
    });

    test("should include approved and active deals in restaurant data", async () => {
      const response = await request(app)
        .get("/api/restaurants")
        .expect(200);

      expect(response.body[0].deals).toBeDefined();
      expect(response.body[0].deals.length).toBe(1);
      expect(response.body[0].deals[0].title).toBe("Test Deal");
    });

    test("should not include pending deals", async () => {
      const pendingDeal = {
        title: "Pending Deal",
        description: "Pending Description",
        price: 15.99,
        status: "pending",
        isActive: true
      };
      restaurant.deals.push(pendingDeal);
      await restaurant.save();

      const response = await request(app)
        .get("/api/restaurants")
        .expect(200);

      expect(response.body[0].deals.length).toBe(1);
      expect(response.body[0].deals[0].title).toBe("Test Deal");
    });

    test("should not include inactive deals", async () => {
      const inactiveDeal = {
        title: "Inactive Deal",
        description: "Inactive Description",
        price: 20.99,
        status: "approved",
        isActive: false
      };
      restaurant.deals.push(inactiveDeal);
      await restaurant.save();

      const response = await request(app)
        .get("/api/restaurants")
        .expect(200);

      expect(response.body[0].deals.length).toBe(1);
      expect(response.body[0].deals[0].title).toBe("Test Deal");
    });

    test("should sort featured deals first", async () => {
      const featuredDeal = {
        title: "Featured Deal",
        description: "Featured Description",
        price: 25.99,
        status: "approved",
        isActive: true,
        featured: true
      };
      restaurant.deals.push(featuredDeal);
      await restaurant.save();

      const response = await request(app)
        .get("/api/restaurants")
        .expect(200);

      expect(response.body[0].deals.length).toBe(2);
      expect(response.body[0].deals[0].featured).toBe(true);
      expect(response.body[0].deals[0].title).toBe("Featured Deal");
    });

    test("should filter restaurants with featured deals only", async () => {
      const featuredDeal = {
        title: "Featured Deal",
        description: "Featured Description",
        price: 25.99,
        status: "approved",
        isActive: true,
        featured: true
      };
      restaurant.deals.push(featuredDeal);
      await restaurant.save();

      const response = await request(app)
        .get("/api/restaurants?featuredOnly=true")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].deals.length).toBe(1);
      expect(response.body[0].deals[0].featured).toBe(true);
    });

    test("should return empty array when no restaurants have featured deals", async () => {
      const response = await request(app)
        .get("/api/restaurants?featuredOnly=true")
        .expect(200);

      expect(response.body.length).toBe(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      jest.spyOn(Restaurant, 'find').mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get("/api/restaurants")
        .expect(500);

      expect(response.body.message).toBe("Error fetching restaurants");

      Restaurant.find.mockRestore();
    });
  });
});
