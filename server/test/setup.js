// test/setup.js
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

export const createToken = (userId, role = 'customer') => {
  return jwt.sign({ 
    id: userId, 
    isAdmin: role === 'admin',
    role: role 
  }, process.env.JWT_SECRET || "mysecretkey", { expiresIn: "1h" });
};
