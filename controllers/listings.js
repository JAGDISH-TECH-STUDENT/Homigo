const Listing=require("../models/listing");
const express = require('express');
const axios = require('axios');

const TOMTOM_API_KEY =process.env.TOMTOM_API_KEY;

module.exports.index=async (req,res)=>{
    const allListings =await Listing.find({});
    
    // Get user's favorites if logged in
    let userFavorites = [];
    if (req.user) {
        const Favorite = require("../models/favorite");
        const favorites = await Favorite.find({ user: req.user._id });
        userFavorites = favorites.map(fav => fav.listing.toString());
    }
    
    res.render("listings/index.ejs",{allListings, userFavorites});
};

module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing =async (req,res)=>{
    let  { id } = req.params;
    


    const listing= await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path:"author"
        }
    })
        .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let coords = { lat: 28.6139, lon: 77.2090 };
    
    if (process.env.TOMTOM_API_KEY) {
        try {
            const geoRes = await axios.get(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(listing.location)}.json?key=${process.env.TOMTOM_API_KEY}`);
            if (geoRes.data.results && geoRes.data.results[0]?.position) {
                coords = geoRes.data.results[0].position;
            }
        } catch (e) {
            console.error("Geocoding failed:", e.message);
        }
    }
    
    res.render("listings/show.ejs",{listing,coords,tomtomApiKey: process.env.TOMTOM_API_KEY || ""});
    
};

module.exports.createListing=async (req, res, next)=>{
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
                console.error("Geocoding failed during listing creation:", e.message);
            }
        }
    
    if (req.body.listing.category === '') {
        delete req.body.listing.category;
    }
    
    const newListing=new Listing(req.body.listing);
    newListing.owner=req.user._id;
    
    // Handle multiple image uploads
    if (req.files && req.files.length > 0) {
        newListing.images = req.files.map(file => ({
            url: file.path,
            filename: file.filename
        }));
    } else {
        // If no images uploaded, use default
        newListing.images = [{
            url: "https://thumbs.dreamstime.com/z/no-photo-available-missing-image-no-image-symbol-isolated-white-background-no-photo-available-missing-image-no-image-272386839.jpg",
            filename: "no-image"
        }];
    }
    
    newListing.geometry={
        type: 'Point',
        coordinates: [lon, lat]
    }
    let saveListing=await newListing.save();
    req.flash("success","New Listing id created!");
    res.redirect("/listings"); 
    } catch (err) {
        next(err);
    }
};
module.exports.renderEditForm=async(req,res)=>{
    let {id}=req.params;
    const listing=  await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    // Get first image for preview
    let originalImageUrl = listing.images && listing.images.length > 0 
        ? listing.images[0].url.replace("/upload","/upload/w_250")
        : "https://thumbs.dreamstime.com/z/no-photo-available-missing-image-no-image-symbol-isolated-white-background-no-photo-available-missing-image-no-image-272386839.jpg";
    res.render("listings/edit.ejs",{ listing ,originalImageUrl});
};
 module.exports.updateListing=async(req,res)=>{
    let {id}=req.params;
    
    // If category is empty string, remove it so Mongoose default will be used
    if (req.body.listing.category === '') {
        delete req.body.listing.category;
    }
    
    let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing}, { new: true });
    
    // Handle multiple image uploads
    if(req.files && req.files.length > 0){
        const newImages = req.files.map(file => ({
            url: file.path,
            filename: file.filename
        }));
        listing.images = [...listing.images, ...newImages];
        await listing.save();
    }
    req.flash("success","Listing Updated!");
    res.redirect("/listings");
 };

 module.exports.deleteListing=async(req,res)=>{
    let {id}=req.params;
    let deleteListing=await Listing.findByIdAndDelete(id); 
    req.flash("success","Listing DELETED!");
    res.redirect("/listings");
 };

module.exports.getHostListings = async (req, res) => {
    if (req.user.role !== 'host') {
        req.flash("error", "Only hosts can access their listings!");
        return res.redirect("/listings");
    }
    
    const listings = await Listing.find({ owner: req.user._id });
    res.render("listings/host-listings.ejs", { listings });
};

module.exports.searchListings = async (req, res) => {
    const { q, category, minPrice, maxPrice } = req.query;
    
    let query = {};
    
    // Text search (place/title/description)
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
    
    // Category filter
    if (category && category.trim() !== "") {
        query.category = category.trim();
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice && !isNaN(minPrice)) {
            query.price.$gte = parseInt(minPrice);
        }
        if (maxPrice && !isNaN(maxPrice)) {
            query.price.$lte = parseInt(maxPrice);
        }
    }
    
    const allListings = await Listing.find(query);
    
    // Get user's favorites if logged in
    let userFavorites = [];
    if (req.user) {
        const Favorite = require("../models/favorite");
        const favorites = await Favorite.find({ user: req.user._id });
        userFavorites = favorites.map(fav => fav.listing.toString());
    }
    
    res.render("listings/index.ejs", { 
        allListings, 
        userFavorites,
        searchQuery: q || "",
        selectedCategory: category || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || ""
    });
};
