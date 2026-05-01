// test/reviewController.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/index.js");
const { createToken } = require("./setup.js");
const User = require("../server/models/User.js");
const Restaurant = require("../server/models/Restaurant.js");

describe("Review Controller Tests", () => {
  let customerToken, managerToken, adminToken;
  let customer, manager, admin;
  let restaurant, deal;

  beforeEach(async () => {
    await User.deleteMany({});
    await Restaurant.deleteMany({});

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

    admin = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "hashedpassword",
      role: "admin",
      isAdmin: true
    });
    await admin.save();
    adminToken = createToken(admin._id, "admin");

    restaurant = new Restaurant({
      name: "Test Restaurant",
      city: "Test City",
      cuisine: "Italian",
      restaurantManagerId: manager._id,
      status: "approved"
    });

    const dealData = {
      title: "Test Deal",
      description: "Test Description",
      price: 10.99,
      status: "approved",
      isActive: true
    };
    restaurant.deals.push(dealData);
    await restaurant.save();
    deal = restaurant.deals[0];
  });

  describe("POST /api/user/reviews", () => {
    test("should add a review successfully", async () => {
      const reviewData = {
        restaurantId: restaurant._id,
        dealId: deal._id,
        rating: 4,
        comment: "Great deal!"
      };

      const response = await request(app)
        .post("/api/user/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(reviewData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Review added successfully");

      const updatedRestaurant = await Restaurant.findById(restaurant._id);
      expect(updatedRestaurant.deals[0].reviews.length).toBe(1);
      expect(updatedRestaurant.deals[0].reviews[0].rating).toBe(4);
      expect(updatedRestaurant.deals[0].reviews[0].comment).toBe("Great deal!");
    });

    test("should reject review with invalid rating (too high)", async () => {
      const reviewData = {
        restaurantId: restaurant._id,
        dealId: deal._id,
        rating: 6,
        comment: "Invalid rating"
      };

      const response = await request(app)
        .post("/api/user/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.message).toBe("Rating must be between 1 and 5");
    });

    test("should reject review with invalid rating (too low)", async () => {
      const reviewData = {
        restaurantId: restaurant._id,
        dealId: deal._id,
        rating: 0,
        comment: "Invalid rating"
      };

      const response = await request(app)
        .post("/api/user/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.message).toBe("Rating must be between 1 and 5");
    });

    test("should reject review without authentication", async () => {
      const reviewData = {
        restaurantId: restaurant._id,
        dealId: deal._id,
        rating: 4,
        comment: "Unauthorized review"
      };

      const response = await request(app)
        .post("/api/user/reviews")
        .send(reviewData)
        .expect(401);

      expect(response.body.message).toBe("Access denied. No token provided.");
    });

    test("should allow multiple users to review the same deal", async () => {
      const secondCustomer = new User({
        name: "Second Customer",
        email: "second@example.com",
        password: "hashedpassword",
        role: "customer"
      });
      await secondCustomer.save();
      const secondCustomerToken = createToken(secondCustomer._id, "customer");

      const firstReview = {
        restaurantId: restaurant._id,
        dealId: deal._id,
        rating: 4,
        comment: "First review"
      };

      const secondReview = {
        restaurantId: restaurant._id,
        dealId: deal._id,
        rating: 5,
        comment: "Second review"
      };

      await request(app)
        .post("/api/user/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(firstReview)
        .expect(200);

      await request(app)
        .post("/api/user/reviews")
        .set("Authorization", `Bearer ${secondCustomerToken}`)
        .send(secondReview)
        .expect(200);

      const updatedRestaurant = await Restaurant.findById(restaurant._id);
      expect(updatedRestaurant.deals[0].reviews.length).toBe(2);
    });
  });

  describe("GET /api/user/reviews/:restaurantId/:dealId", () => {
    beforeEach(async () => {
      deal.reviews.push({
        userId: customer._id,
        rating: 4,
        comment: "Great deal!"
      });
      await restaurant.save();
    });

    test("should get reviews for a deal", async () => {
      const response = await request(app)
        .get(`/api/user/reviews/${restaurant._id}/${deal._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reviews.length).toBe(1);
      expect(response.body.reviews[0].rating).toBe(4);
      expect(response.body.reviews[0].comment).toBe("Great deal!");
      expect(response.body.reviews[0].userName).toBe("Customer User");
      expect(response.body.reviews[0].userEmail).toBe("customer@example.com");
      expect(response.body.averageRating).toBe("4.0");
      expect(response.body.totalReviews).toBe(1);
    });

    test("should return empty reviews array for deal with no reviews", async () => {
      restaurant.deals[0].reviews = [];
      await restaurant.save();

      const response = await request(app)
        .get(`/api/user/reviews/${restaurant._id}/${deal._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reviews.length).toBe(0);
      expect(response.body.averageRating).toBe(0);
      expect(response.body.totalReviews).toBe(0);
    });

    test("should calculate correct average rating", async () => {
      const secondCustomer = new User({
        name: "Second Customer",
        email: "second@example.com",
        password: "hashedpassword",
        role: "customer"
      });
      await secondCustomer.save();

      deal.reviews.push({
        userId: secondCustomer._id,
        rating: 2,
        comment: "Poor experience"
      });
      await restaurant.save();

      const response = await request(app)
        .get(`/api/user/reviews/${restaurant._id}/${deal._id}`)
        .expect(200);

      expect(response.body.reviews.length).toBe(2);
      expect(response.body.averageRating).toBe("3.0");
    });
  });

  describe("PUT /api/user/reviews/:id", () => {
    let review;

    beforeEach(async () => {
      review = {
        userId: customer._id,
        rating: 3,
        comment: "Original review"
      };
      deal.reviews.push(review);
      await restaurant.save();
      review = deal.reviews[0];
    });

    test("should update review successfully", async () => {
      const updateData = {
        rating: 5,
        comment: "Updated review"
      };

      const response = await request(app)
        .put(`/api/user/reviews/${review._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Review updated successfully");

      const updatedRestaurant = await Restaurant.findById(restaurant._id);
      const updatedReview = updatedRestaurant.deals[0].reviews[0];
      expect(updatedReview.rating).toBe(5);
      expect(updatedReview.comment).toBe("Updated review");
    });

    test("should reject update with no fields", async () => {
      const response = await request(app)
        .put(`/api/user/reviews/${review._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe("At least one field (rating or comment) is required for update");
    });

    test("should reject update with invalid rating", async () => {
      const updateData = { rating: 6 };

      const response = await request(app)
        .put(`/api/user/reviews/${review._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toBe("Rating must be between 1 and 5");
    });

    test("should reject update without authentication", async () => {
      const updateData = { rating: 5 };

      const response = await request(app)
        .put(`/api/user/reviews/${review._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe("Access denied. No token provided.");
    });
  });
});
