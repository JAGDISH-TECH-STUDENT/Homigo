const Listing = require("../models/listing");
const axios = require('axios');

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

module.exports.index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const listingsProjection = {
        title: 1,
        description: 1,
        price: 1,
        location: 1,
        country: 1,
        category: 1,
        images: 1,
        active: 1,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        maxGuests: 1,
        owner: 1,
        createdAt: 1
    };

    const total = await Listing.countDocuments({});
    const allListings = await Listing.find({})
        .select(listingsProjection)
        .populate("owner", "username")
        .skip(skip)
        .limit(limit)
        .lean();

    let userFavorites = [];
    if (req.user) {
        const Favorite = require("../models/favorite");
        const favorites = await Favorite.find({ user: req.user._id });
        userFavorites = favorites.map(fav => fav.listing.toString());
    }
    res.json({ 
        listings: allListings, 
        userFavorites,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }
    let coords = { lat: 28.6139, lon: 77.2090 };
    if (process.env.TOMTOM_API_KEY) {
        try {
            const geoRes = await axios.get(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(listing.location)}.json?key=${process.env.TOMTOM_API_KEY}`);
            if (geoRes.data.results && geoRes.data.results[0]?.position) {
                coords = geoRes.data.results[0].position;
            }
        } catch (e) {
            // use default coords
        }
    }
    res.json({ listing, coords, tomtomApiKey: process.env.TOMTOM_API_KEY || "" });
};

module.exports.createListing = async (req, res) => {
    try {
        let lat = 28.6139, lon = 77.2090;
        if (process.env.TOMTOM_API_KEY) {
            try {
                const geoRes = await axios.get(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(req.body.listing.location)}.json?key=${process.env.TOMTOM_API_KEY}`);
                if (geoRes.data.results && geoRes.data.results[0]?.position) {
                    lat = geoRes.data.results[0].position.lat;
                    lon = geoRes.data.results[0].position.lon;
                }
            } catch (e) {
                // use default coords
            }
        }

        if (req.body.listing.category === '') {
            delete req.body.listing.category;
        }

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;

        if (req.files && req.files.length > 0) {
            newListing.images = req.files.map(file => ({
                url: file.path,
                filename: file.filename
            }));
        } else {
            newListing.images = [{
                url: "https://thumbs.dreamstime.com/z/no-photo-available-missing-image-no-image-symbol-isolated-white-background-no-photo-available-missing-image-no-image-272386839.jpg",
                filename: "no-image"
            }];
        }

        newListing.geometry = { type: 'Point', coordinates: [lon, lat] };
        const savedListing = await newListing.save();
        res.status(201).json({ success: true, listing: savedListing });
    } catch (err) {
        console.error("Create listing error:", err);
        if (err.message && err.message.includes("Cannot read")) {
            res.status(500).json({ error: "Image upload failed. Please try a different image format (JPG, PNG, or WebP)." });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    
    const listingData = {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      country: req.body.country,
      price: req.body.price,
      category: req.body.category,
    };
    
    let existingImages = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImages = req.body.existingImages;
      } else {
        existingImages = [req.body.existingImages];
      }
    }
    
    if (listingData.category === '') {
        delete listingData.category;
    }
    
    const listing = await Listing.findById(id);
    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }
    
    // Only update fields that have values
    if (listingData.title) listing.title = listingData.title;
    if (listingData.description) listing.description = listingData.description;
    if (listingData.location) listing.location = listingData.location;
    if (listingData.country) listing.country = listingData.country;
    if (listingData.price) listing.price = listingData.price;
    if (listingData.category) listing.category = listingData.category;
    
    let finalImages = [];
    
    // Handle existing images - preserve URLs from the database if not explicitly removed
    if (existingImages.length > 0) {
      finalImages = existingImages.map(url => ({
        url: url,
        filename: url.split('/').pop() || 'image'
      }));
    }
    
    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({
            url: file.path,
            filename: file.filename
        }));
        finalImages = [...finalImages, ...newImages];
    }
    
    // If no images at all, keep the old ones or add default
    if (finalImages.length === 0 && listing.images && listing.images.length > 0) {
      finalImages = listing.images;
    }
    
    // If still no images, add default
    if (finalImages.length === 0) {
      finalImages = [{
        url: "https://thumbs.dreamstime.com/z/no-photo-available-missing-image-no-image-symbol-isolated-white-background-no-photo-available-missing-image-no-image-272386839.jpg",
        filename: "no-image"
      }];
    }
    
    listing.images = finalImages;
    await listing.save();
    res.json({ success: true, listing });
};

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndDelete(id);
    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }
    res.json({ success: true, message: "Listing deleted" });
};

module.exports.getHostListings = async (req, res) => {
    if (req.user.role !== 'host') {
        return res.status(403).json({ error: "Only hosts can access their listings" });
    }
    const listings = await Listing.find({ owner: req.user._id });
    res.json({ listings });
};

module.exports.searchListings = async (req, res) => {
    const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    let query = {};

    if (q && q.trim() !== "") {
        const searchQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(searchQuery, 'i');
        query.$or = [
            { title: searchRegex },
            { location: searchRegex },
            { country: searchRegex },
            { description: searchRegex }
        ];
    }

    if (category && category.trim() !== "") {
        query.category = category.trim();
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice && !isNaN(minPrice)) query.price.$gte = parseInt(minPrice);
        if (maxPrice && !isNaN(maxPrice)) query.price.$lte = parseInt(maxPrice);
    }

    const listingsProjection = {
        title: 1,
        description: 1,
        price: 1,
        location: 1,
        country: 1,
        category: 1,
        images: 1,
        active: 1,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        maxGuests: 1,
        owner: 1,
        createdAt: 1
    };

    const total = await Listing.countDocuments(query);
    const allListings = await Listing.find(query)
        .select(listingsProjection)
        .populate("owner", "username")
        .skip(skip)
        .limit(limitNum)
        .lean();

    let userFavorites = [];
    if (req.user) {
        const Favorite = require("../models/favorite");
        const favorites = await Favorite.find({ user: req.user._id });
        userFavorites = favorites.map(fav => fav.listing.toString());
    }

    res.json({
        listings: allListings,
        userFavorites,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
        },
        filters: { q: q || "", category: category || "", minPrice: minPrice || "", maxPrice: maxPrice || "" }
    });
};
