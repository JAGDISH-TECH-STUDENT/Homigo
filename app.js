if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

if (process.env.NODE_ENV === "production") {
    const required = ["ATLASDB_URL", "SECRET", "CLOUD_NAME", "CLOUD_API_KEY", "CLOUD_API_SECRET"];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(", ")}`);
        process.exit(1);
    }
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const dbUrl = process.env.ATLASDB_URL;
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Booking = require("./models/booking.js");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(compression());
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://unpkg.com", "https://cdn.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://tile.thunderforest.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://checkout.razorpay.com", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      frameSrc: ["https://checkout.razorpay.com", "https://api.razorpay.com"],
      mediaSrc: ["'self'", "data:"],
      manifestSrc: ["'self'"],
      workerSrc: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  })
);

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== "production",
    handler: (req, res) => res.status(429).json({ error: "Too many requests. Please try again later." })
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== "production",
    handler: (req, res) => res.status(429).json({ error: "Too many authentication attempts. Please try again later." })
});

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");
const adminRouter = require("./routes/admin.js");
const favoriteRouter = require("./routes/favorite.js");
const paymentRouter = require("./routes/payment.js");
const complaintsRouter = require("./routes/complaints.js");
const notificationsRouter = require("./routes/notifications.js");
const adminComplaintsRouter = require("./routes/adminComplaintsSimple.js");
const adminAnalyticsRouter = require("./routes/adminAnalyticsSimple.js");
const forgotRouter = require("./routes/forgot.js");
const messagesRouter = require("./routes/messages.js");
const hostEarningsRouter = require("./routes/hostEarnings.js");

main().then(() => {
    console.log("connected to DB");
    cleanupExpiredBookings();
    if (require.main === module) {
        setInterval(cleanupExpiredBookings, 10 * 60 * 1000).unref();
    }
}).catch((err) => {
    console.log(err);
});

async function cleanupExpiredBookings() {
    try {
        const cutoff = new Date(Date.now() - 15 * 60 * 1000);
        const result = await Booking.updateMany(
            {
                status: "pending",
                paymentStatus: { $in: ["unpaid", "created"] },
                createdAt: { $lt: cutoff }
            },
            { $set: { status: "rejected", paymentStatus: "failed" } }
        );
        if (result.modifiedCount) console.log(`Expired ${result.modifiedCount} pending booking(s)`);
    } catch (error) {
        console.error("Pending booking cleanup failed", error);
    }
}

async function main() {
    await mongoose.connect(dbUrl, {
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
}

app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? (process.env.CLIENT_ORIGIN || "")
        : "http://localhost:5173",
    credentials: true
}));
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/forgot", authLimiter);

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 60 * 60
});
store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
});
const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    }
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/api/listings", listingRouter);
app.use("/api/listings/:id/reviews", reviewRouter);
app.use("/api/auth", userRouter);
app.use("/api", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/admin/complaints", adminComplaintsRouter);
app.use("/api/admin/analytics", adminAnalyticsRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/complaints", complaintsRouter);
app.use("/api/notifications", notificationsRouter.router);
app.use("/api/forgot", forgotRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/host/earnings", hostEarningsRouter);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "client", "dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
    });
}

app.use((err, req, res, next) => {
    console.error("Request failed", {
        method: req.method,
        path: req.originalUrl,
        statusCode: err.statusCode || 500,
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
    const statusCode = err.statusCode || 500;
    const message = statusCode >= 500 ? "Something went wrong" : (err.message || "Request failed");
    res.status(statusCode).json({ error: message });
});

if (require.main === module) {
    const PORT = process.env.PORT || 8080;
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.warn(`Port ${PORT} is already in use. Reusing the existing server on http://localhost:${PORT}.`);
            process.exit(0);
        }
        console.error("Server failed to start", error);
        process.exit(1);
    });
}

module.exports = app;
