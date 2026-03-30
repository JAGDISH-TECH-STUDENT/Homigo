const mongoose = require("mongoose");
const User = require("../models/user");

// Load environment variables
if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

// Database connection
const dbUrl = process.env.ATLASDB_URL;

async function seedAdmin() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

        // Admin credentials
        const adminUsername = "admin";
        const adminEmail = "admin@homigo.com";
        const adminPassword = "admin123"; // Change this to a secure password

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log("Admin user already exists:");
            console.log(`Username: ${existingAdmin.username}`);
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Role: ${existingAdmin.role}`);
            process.exit(0);
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username: adminUsername }, { email: adminEmail }]
        });

        if (existingUser) {
            console.log("User with this username or email already exists.");
            console.log("Updating user role to admin...");
            existingUser.role = "admin";
            await existingUser.save();
            console.log("User updated to admin successfully!");
            console.log(`Username: ${existingUser.username}`);
            console.log(`Email: ${existingUser.email}`);
            console.log(`Role: ${existingUser.role}`);
            process.exit(0);
        }

        // Create new admin user
        const adminUser = new User({
            username: adminUsername,
            email: adminEmail,
            role: "admin"
        });

        // Register user with passport-local-mongoose
        await User.register(adminUser, adminPassword);

        console.log("Admin user created successfully!");
        console.log("=================================");
        console.log("Admin Credentials:");
        console.log(`Username: ${adminUsername}`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log("=================================");
        console.log("Please change the password after first login!");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
}

seedAdmin();
