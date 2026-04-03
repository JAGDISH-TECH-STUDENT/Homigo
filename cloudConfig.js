const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage} = require('multer-storage-cloudinary');

if (!process.env.CLOUD_NAME || !process.env.CLOUD_API_KEY || !process.env.CLOUD_API_SECRET) {
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
        resource_type: "auto"
    }
});

module.exports = {
    cloudinary,
    storage
}; 