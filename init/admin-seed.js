const mongoose = require("mongoose");
const User = require("../models/user");

if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const dbUrl = process.env.ATLASDB_URL;

async function seedAdmin() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

                const adminUsername = "admin";
        const adminEmail = "admin@homigo.com";
        const adminPassword = "admin123";

                const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log("Admin user already exists:");
            console.log(`Username: ${existingAdmin.username}`);
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Role: ${existingAdmin.role}`);
            process.exit(0);
        }

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

                const adminUser = new User({
            username: adminUsername,
            email: adminEmail,
            role: "admin"
        });

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
