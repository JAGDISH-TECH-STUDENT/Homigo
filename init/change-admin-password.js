const mongoose = require("mongoose");
const User = require("../models/user");

if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const dbUrl = process.env.ATLASDB_URL;

async function changeAdminPassword() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to database");

                const newPassword = process.argv[2];
        
        if (!newPassword) {
            console.log("Usage: node init/change-admin-password.js <new-password>");
            console.log("Example: node init/change-admin-password.js myNewPassword123");
            process.exit(1);
        }

                const admin = await User.findOne({ role: "admin" });
        
        if (!admin) {
            console.log("No admin user found. Please run 'npm run seed-admin' first.");
            process.exit(1);
        }

                await admin.setPassword(newPassword);
        await admin.save();

        console.log("Admin password changed successfully!");
        console.log("=================================");
        console.log(`Username: ${admin.username}`);
        console.log(`Email: ${admin.email}`);
        console.log("=================================");

        process.exit(0);
    } catch (error) {
        console.error("Error changing admin password:", error);
        process.exit(1);
    }
}

changeAdminPassword();
