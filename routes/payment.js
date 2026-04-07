const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount, listingTitle, nights, checkIn, checkOut } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `booking_${Date.now()}`,
      notes: {
        listingTitle: listingTitle || "Homigo Booking",
        nights: nights || 1,
        checkIn: checkIn || "",
        checkOut: checkOut || ""
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const crypto = require("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;