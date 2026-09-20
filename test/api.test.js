const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

let app;
let mongoose;
let User;
let Listing;
const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

async function signup(username) {
    return request(app)
        .post("/api/auth/signup")
        .send({ username, email: `${username}@example.com`, password: "strong-password" });
}

async function signupWithAgent(agent, username) {
    return agent.post("/api/auth/signup")
        .send({ username, email: `${username}@example.com`, password: "strong-password" });
}

test.before(async () => {
    process.env.NODE_ENV = "test";
    process.env.SECRET = "test-session-secret";
    if (!hasTestDatabase) return;
    process.env.ATLASDB_URL = process.env.TEST_DATABASE_URL;
    app = require("../app");
    mongoose = require("mongoose");
    User = require("../models/user");
    Listing = require("../models/listing");
    await mongoose.connection.asPromise();
});

test.after(async () => {
    if (!hasTestDatabase) return;
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});

test.beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Listing.deleteMany({})]);
});

test("signup ignores a client-supplied admin role", { skip: !hasTestDatabase }, async () => {
    const response = await request(app)
        .post("/api/auth/signup")
        .send({ username: "role-test", email: "role@example.com", password: "strong-password", role: "admin" });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.role, "guest");
});

test("blocked sessions cannot access protected endpoints", { skip: !hasTestDatabase }, async () => {
    const agent = request.agent(app);
    const signupResponse = await agent.post("/api/auth/signup").send({
        username: "blocked-test",
        email: "blocked@example.com",
        password: "strong-password"
    });
    await User.findByIdAndUpdate(signupResponse.body.user._id, { blocked: true });

    const response = await agent.get("/api/bookings");
    assert.equal(response.status, 401);
});

test("booking creation is pending and calculates the server-side total", { skip: !hasTestDatabase }, async () => {
    const agent = request.agent(app);
    const signupResponse = await agent.post("/api/auth/signup").send({
        username: "booking-test",
        email: "booking-test@example.com",
        password: "strong-password"
    });
    const listingOwner = await User.register(new User({
        username: "host-test",
        email: "host@example.com",
        role: "host"
    }), "strong-password");
    const listing = await Listing.create({
        title: "Test stay",
        description: "A test stay",
        price: 100,
        location: "Test city",
        country: "Test country",
        owner: listingOwner._id,
        geometry: { type: "Point", coordinates: [0, 0] }
    });

    assert.equal(signupResponse.status, 201);
    const response = await agent.post(`/api/listings/${listing._id}/bookings`).send({
        booking: { checkIn: "2099-01-10", checkOut: "2099-01-12", guests: 2 }
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.booking.status, "pending");
    assert.equal(response.body.booking.totalPrice, 224);
});

test("payment order creation cannot access another user's booking", { skip: !hasTestDatabase }, async () => {
    const ownerAgent = request.agent(app);
    const ownerSignup = await signupWithAgent(ownerAgent, "payment-owner");
    const listingOwner = await User.register(new User({
        username: "payment-host",
        email: "payment-host@example.com",
        role: "host"
    }), "strong-password");
    const listing = await Listing.create({
        title: "Payment stay",
        description: "A payment test stay",
        price: 100,
        location: "Test city",
        country: "Test country",
        owner: listingOwner._id,
        geometry: { type: "Point", coordinates: [0, 0] }
    });
    const booking = await ownerAgent.post(`/api/listings/${listing._id}/bookings`).send({
        booking: { checkIn: "2099-02-10", checkOut: "2099-02-11", guests: 1 }
    });
    assert.equal(booking.status, 201);

    const otherAgent = request.agent(app);
    await otherAgent.post("/api/auth/signup").send({
        username: "payment-other",
        email: "payment-other@example.com",
        password: "strong-password"
    });
    const response = await otherAgent.post("/api/payment/create-order").send({
        bookingId: booking.body.booking._id,
        amount: 1
    });

    assert.equal(response.status, 404);
    assert.match(response.body.error, /Pending booking not found/);
});
