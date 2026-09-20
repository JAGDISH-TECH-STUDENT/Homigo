const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { ensureAuth } = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function confirmQrPayment(booking, payment) {
  return confirmCapturedPayment(payment, booking);
}

async function confirmCapturedPayment(payment, knownBooking = null) {
  const booking = await Booking.findOne({
    $or: [
      { paymentOrderId: payment.order_id },
      { paymentQrCodeId: payment.qr_code_id }
    ],
    status: "pending"
  }) || knownBooking;
  if (!booking) return false;
  if (payment.status !== "captured" || payment.amount !== booking.totalPrice * 100 || payment.currency !== "INR") return false;

  const lockUntil = new Date(Date.now() + 30 * 1000);
  const lockedListing = await Listing.findOneAndUpdate(
    {
      _id: booking.listing,
      $or: [{ bookingLockUntil: null }, { bookingLockUntil: { $lt: new Date() } }]
    },
    { $set: { bookingLockUntil: lockUntil } },
    { new: true }
  );
  if (!lockedListing) return false;

  try {
    const overlapping = await Booking.exists({
      _id: { $ne: booking._id },
      listing: booking.listing,
      status: "confirmed",
      checkIn: { $lt: booking.checkOut },
      checkOut: { $gt: booking.checkIn }
    });
    if (overlapping) {
      booking.paymentStatus = "failed";
      await booking.save();
      return false;
    }
    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paymentId = payment.id;
    await booking.save();
    return true;
  } finally {
    await Listing.updateOne({ _id: booking.listing, bookingLockUntil: lockUntil }, { $set: { bookingLockUntil: null } });
  }
}

router.post("/create-order", ensureAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.body.bookingId, user: req.user._id, status: "pending" }).populate("listing", "title");
    if (!booking) return res.status(404).json({ error: "Pending booking not found" });
    if (booking.paymentOrderId) return res.json({ orderId: booking.paymentOrderId, amount: booking.totalPrice * 100, keyId: process.env.RAZORPAY_KEY_ID });

    const options = {
      amount: Math.round(booking.totalPrice * 100),
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        listingTitle: booking.listing.title
      }
    };

    const order = await razorpay.orders.create(options);
    booking.paymentOrderId = order.id;
    booking.paymentStatus = "created";
    await booking.save();
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

router.post("/create-qr", ensureAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.body.bookingId, user: req.user._id, status: "pending" }).populate("listing", "title");
    if (!booking) return res.status(404).json({ error: "Pending booking not found" });
    if (booking.paymentQrCodeId && booking.paymentQrImageUrl) {
      return res.json({ qrCodeId: booking.paymentQrCodeId, imageUrl: booking.paymentQrImageUrl, amount: booking.totalPrice * 100 });
    }

    const qrCode = await razorpay.qrCode.create({
      type: "upi_qr",
      name: "Homigo Booking",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: Math.round(booking.totalPrice * 100),
      description: booking.listing.title,
      close_by: Math.floor(Date.now() / 1000) + (15 * 60),
      notes: { bookingId: booking._id.toString() }
    });
    booking.paymentQrCodeId = qrCode.id;
    booking.paymentQrImageUrl = qrCode.image_url;
    booking.paymentStatus = "created";
    await booking.save();
    res.json({ qrCodeId: qrCode.id, imageUrl: qrCode.image_url, amount: booking.totalPrice * 100 });
  } catch (error) {
    console.error("Razorpay QR creation error:", error.response?.data || error.message);
    const razorpayError = error.error || error;
    if (razorpayError.statusCode === 404 || razorpayError.description?.includes("URL was not found")) {
      return res.status(503).json({ error: "Razorpay QR Codes are not enabled for this account. Enable QR Codes in the Razorpay Dashboard or contact Razorpay support." });
    }
    res.status(502).json({ error: "Unable to create Razorpay QR code" });
  }
});

router.get("/qr-status/:bookingId", ensureAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id, status: "pending" });
    if (!booking || !booking.paymentQrCodeId) return res.status(404).json({ error: "QR payment not found" });
    const response = await razorpay.qrCode.fetchAllPayments(booking.paymentQrCodeId);
    const payment = response.items?.find(item => item.status === "captured");
    if (payment && await confirmCapturedPayment(payment, booking)) {
      return res.json({ paid: true, booking });
    }
    res.json({ paid: false });
  } catch (error) {
    console.error("Razorpay QR status error:", error.response?.data || error.message);
    res.status(502).json({ error: "Unable to check Razorpay QR payment status" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const signature = req.get("X-Razorpay-Signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Invalid webhook configuration or payload" });
    }

    const digest = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
    const validSignature = digest.length === signature.length
      && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    if (!validSignature) return res.status(401).json({ error: "Invalid webhook signature" });

    const event = JSON.parse(req.body.toString("utf8"));
    const payment = event.payload?.payment?.entity;
    if (event.event === "payment.captured" && payment) {
      await confirmCapturedPayment(payment);
    } else if (event.event === "payment.failed" && payment) {
      await Booking.updateOne(
        { $or: [{ paymentOrderId: payment.order_id }, { paymentQrCodeId: payment.qr_code_id }], status: "pending" },
        { $set: { paymentStatus: "failed" } }
      );
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(400).json({ error: "Invalid webhook payload" });
  }
});

router.post("/verify-payment", ensureAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const booking = await Booking.findOne({ paymentOrderId: razorpay_order_id, user: req.user._id });
    if (!booking) return res.status(404).json({ error: "Payment booking not found" });
    if (booking.status === "confirmed" && booking.paymentId === razorpay_payment_id) return res.json({ verified: true, booking });

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const validSignature = generatedSignature.length === razorpay_signature?.length
      && crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpay_signature));
    if (!validSignature) {
      res.status(400).json({ verified: false, error: "Invalid signature" });
      return;
    }
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id)
    ]);
    if (order.amount !== booking.totalPrice * 100 || order.currency !== "INR" || payment.order_id !== razorpay_order_id || payment.amount !== order.amount || payment.status !== "captured") {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ verified: false, error: "Payment details do not match booking" });
    }
    const confirmed = await confirmCapturedPayment(payment, booking);
    if (!confirmed) return res.status(409).json({ verified: false, error: "These dates are no longer available" });
    res.json({ verified: true, booking });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;