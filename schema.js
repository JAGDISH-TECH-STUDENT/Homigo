const Joi = require("joi");
module.exports.ListingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(1),
    category: Joi.string().valid('Trending', 'Rooms', 'Iconic cities', 'Mountains', 'Castles', 'Amazing pools', 'Camping', 'Farms', 'Arctic', 'Domes', 'Boats').allow('').optional(),
    maxGuests: Joi.number().min(1).optional(),
    bedrooms: Joi.number().min(0).optional(),
    beds: Joi.number().min(0).optional(),
    baths: Joi.number().min(0).optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    houseRules: Joi.string().allow('').optional(),
    checkInTime: Joi.string().optional(),
    checkOutTime: Joi.string().optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().allow("", null).optional(),
        filename: Joi.string().allow("", null).optional(),
      })
    ).optional(),
  }).required()
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required()
  }).required(),
});