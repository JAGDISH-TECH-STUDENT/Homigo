const Favorite = require("../models/favorite");
const Listing = require("../models/listing");

module.exports.toggleFavorite = async (req, res) => {
    const { id } = req.params;
    try {
        const listing = await Listing.findById(id);
        if (!listing) return res.status(404).json({ error: "Listing not found" });
        const existingFavorite = await Favorite.findOne({ user: req.user._id, listing: id });
        if (existingFavorite) {
            await Favorite.findByIdAndDelete(existingFavorite._id);
            return res.json({ success: true, action: "removed" });
        } else {
            const newFavorite = new Favorite({ user: req.user._id, listing: id });
            await newFavorite.save();
            return res.json({ success: true, action: "added" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Something went wrong" });
    }
};

module.exports.getFavorites = async (req, res) => {
    const favorites = await Favorite.find({ user: req.user._id })
        .populate({ path: "listing", populate: { path: "owner" } })
        .sort({ createdAt: -1 });
    res.json({ favorites });
};
