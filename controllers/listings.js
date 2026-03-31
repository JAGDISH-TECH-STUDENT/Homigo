const Listing=require("../models/listing");
const express = require('express');
const axios = require('axios');

const TOMTOM_API_KEY =process.env.TOMTOM_API_KEY;

module.exports.index=async (req,res)=>{
    const allListings =await Listing.find({});
    res.render("listings/index.ejs",{allListings});
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
    
    let url=req.file.path;
    let filename=req.file.filename;
    const geoRes = await axios.get(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(req.body.listing.location)}.json?key=${process.env.TOMTOM_API_KEY}`);
    const { lat, lon } = geoRes.data.results[0].position;
    const newListing=new Listing(req.body.listing);
    
    if (newListing.image?.url?.trim() === "") {
        newListing.image.url = undefined;
    }

    if (newListing.image?.filename?.trim() === "") {
        newListing.image.filename = undefined;
    }
    newListing.owner=req.user._id;
    newListing.image={url, filename};
    newListing.geometry={
        type: 'Point',
        coordinates: [lon, lat]
    }
    let saveListing=await newListing.save();
    console.log(saveListing);
    req.flash("success","New Listing id created!");
    res.redirect("/listings"); 
    
};
module.exports.renderEditForm=async(req,res)=>{
    let {id}=req.params;
    const listing=  await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{ listing ,originalImageUrl});
};
 module.exports.updateListing=async(req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing});
    if(typeof req.file !=="undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url, filename};
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
