const Favorite = require("../models/favorite");
const Listing = require("../models/listing");

module.exports.toggleFavorite = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    try {
        // Check if listing exists
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found!" });
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({ user: userId, listing: id });

        if (existingFavorite) {
            // Remove from favorites
            await Favorite.findByIdAndDelete(existingFavorite._id);
            return res.json({ success: true, action: "removed" });
        } else {
            // Add to favorites
            const newFavorite = new Favorite({ user: userId, listing: id });
            await newFavorite.save();
            return res.json({ success: true, action: "added" });
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return res.status(500).json({ error: "Something went wrong!" });
    }
};

module.exports.getFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user._id })
            .populate({
                path: "listing",
                populate: {
                    path: "owner"
                }
            })
            .sort({ createdAt: -1 });

        res.render("listings/favorites.ejs", { favorites });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        req.flash("error", "Something went wrong!");
        res.redirect("/listings");
    }
};
