const mongoose = require("mongoose");
const User = require("../models/user");

if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const dbUrl = process.env.ATLASDB_URL;

async function changeAdminUsername() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

        const newUsername = process.argv[2];
        
        if (!newUsername) {
            console.log("Usage: node init/change-admin-username.js <new-username>");
            console.log("Example: node init/change-admin-username.js myNewAdminName");
            process.exit(1);
        }

        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            console.log(`Username '${newUsername}' is already taken. Please choose a different username.`);
            process.exit(1);
        }

        // Find admin user
        const admin = await User.findOne({ role: "admin" });
        
        if (!admin) {
            console.log("No admin user found. Please run 'npm run seed-admin' first.");
            process.exit(1);
        }

        // Change username
        const oldUsername = admin.username;
        admin.username = newUsername;
        await admin.save();

        console.log("Admin username changed successfully!");
        console.log("=================================");
        console.log(`Old Username: ${oldUsername}`);
        console.log(`New Username: ${newUsername}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Role: ${admin.role}`);
        console.log("=================================");

        process.exit(0);
    } catch (error) {
        console.error("Error changing admin username:", error);
        process.exit(1);
    }
}

changeAdminUsername();
