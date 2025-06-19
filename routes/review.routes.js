const express = require("express");
const Listing = require("../models/listings");
const Review = require("../models/review.models");
const { isLoggedIn, isReviewAuthor } = require("../middleware");

const router = express.Router({ mergeParams: true }); // Important to access :id from parent route

// Create Review Route
router.post("/", isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params; // Listing ID
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    // Create review with form data
    const review = new Review(req.body.review);
    review.author = req.session.userId; // Set current user as author
    await review.save();

    // Add review to listing and save
    listing.reviews.push(review);
    await listing.save();

    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err); // Pass error to error handler middleware
  }
});

// Delete Review Route
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;

    // Remove review ID from listing reviews array
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // Delete the review document itself
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
