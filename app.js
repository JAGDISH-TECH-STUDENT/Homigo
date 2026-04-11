if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
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
const compression = require("compression");

app.use(compression());

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
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl, {
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
}

app.use(cors({
    origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        secure: false
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
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    res.status(statusCode).json({ error: message });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
