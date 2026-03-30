const mongoose = require("mongoose");
const User = require("../models/user");

// Load environment variables
if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

// Database connection
const dbUrl = process.env.ATLASDB_URL;

async function changeAdminPassword() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

        // Get new password from command line arguments
        const newPassword = process.argv[2];
        
        if (!newPassword) {
            console.log("Usage: node init/change-admin-password.js <new-password>");
            console.log("Example: node init/change-admin-password.js myNewPassword123");
            process.exit(1);
        }

        // Find admin user
        const admin = await User.findOne({ role: "admin" });
        
        if (!admin) {
            console.log("No admin user found. Please run 'npm run seed-admin' first.");
            process.exit(1);
        }

        // Change password using passport-local-mongoose's setPassword method
        await admin.setPassword(newPassword);
        await admin.save();

        console.log("Admin password changed successfully!");
        console.log("=================================");
        console.log(`Username: ${admin.username}`);
        console.log(`Email: ${admin.email}`);
        console.log(`New Password: ${newPassword}`);
        console.log("=================================");

        process.exit(0);
    } catch (error) {
        console.error("Error changing admin password:", error);
        process.exit(1);
    }
}

changeAdminPassword();
