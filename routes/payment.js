const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
    try {
        const { listingTitle, listingImage, price, nights, guestName, checkIn, checkOut } = req.body;
        
        if (!price || price <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: listingTitle || "Homigo Booking",
                        description: `${nights} night(s) - Check-in: ${checkIn}, Check-out: ${checkOut}`,
                        images: listingImage ? [listingImage] : [],
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/bookings?success=true`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/listings?cancelled=true`,
            customer_email: guestName,
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error("Stripe checkout error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;