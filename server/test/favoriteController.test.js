// test/favoriteController.test.js
const request = require("supertest");
const app = require("../server/index.js");
const { createToken } = require("./setup.js");
const User = require("../server/models/User.js");
const Restaurant = require("../server/models/Restaurant.js");
const mongoose = require("mongoose");

describe("Favorite Controller", () => {
  let token;
  let userId;
  let restaurantId;
  let dealId;

  beforeEach(async () => {
    const user = await User.create({ name: "Test User", email: "test@example.com", password: "password123" });
    userId = user._id;
    token = createToken(userId);

    const restaurant = await Restaurant.create({
      name: "Test Restaurant",
      city: "Test City",
      deals: [{ title: "Test Deal", price: 10, _id: new mongoose.Types.ObjectId() }]
    });
    restaurantId = restaurant._id;
    dealId = restaurant.deals[0]._id;
  });

  afterEach(async () => {
    await User.deleteMany();
    await Restaurant.deleteMany();
  });

  it("should add a favorite", async () => {
    const res = await request(app)
      .post("/api/user/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ restaurantId, dealId });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Added to favorites");
  });

  it("should return 404 if restaurant not found", async () => {
    const res = await request(app)
      .post("/api/user/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ restaurantId: new mongoose.Types.ObjectId(), dealId });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Restaurant not found");
  });
});
