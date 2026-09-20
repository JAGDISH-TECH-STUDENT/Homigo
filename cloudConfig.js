const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage} = require('multer-storage-cloudinary');

if (!process.env.CLOUD_NAME || !process.env.CLOUD_API_KEY || !process.env.CLOUD_API_SECRET) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Cloudinary credentials are not configured. Set CLOUD_NAME, CLOUD_API_KEY, and CLOUD_API_SECRET.");
    }
    console.warn("Warning: Cloudinary credentials not configured. Image uploads will fail.");
}

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "Homigo_dev",
        allowed_formats: ["png", "jpg", "jpeg", "gif", "webp"],
        resource_type: "image",
        transformation: [
            { width: 1600, height: 1200, crop: "limit" },
            { quality: "auto", fetch_format: "auto" }
        ]
    }
});

module.exports = {
    cloudinary,
    storage
}; 