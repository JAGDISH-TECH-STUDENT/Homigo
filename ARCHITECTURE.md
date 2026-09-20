# Homigo architecture

## Ownership

- `app.js`, `routes/`, `controllers/`, `models/`, `middleware/`, and `utils/` are the active API and business-logic layer.
- `client/` is the active user interface. It calls the API through `client/src/api/axios.js` and owns client-side navigation and presentation.
- `client/public/` contains the active React static assets. The old root `views/` and `public/` Express/EJS assets have been removed because no active route renders or serves them.
- `controllers/` should calculate prices, enforce authorization, and mutate booking/payment state. The React client must never be trusted for roles, prices, payment status, or ownership.

## Booking and payment contract

1. The client creates a pending booking with listing/date/guest inputs.
2. The API calculates the total from the listing and stores the pending booking.
3. The API creates a Razorpay order tied to that booking and authenticated user.
4. The API verifies the signature and retrieves the order/payment before confirming the booking.

Future payment webhooks should reconcile successful, failed, and refunded payments so the browser is not the only source of payment completion.

## Migration rule

Before deleting a legacy route or view, search deployment scripts, links, and documentation for its URL. Delete only after the React route and API equivalent have been verified in production.