const Review = require("./models/review.models");

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (!req.session.userId) {
    req.flash("error", "You must be signed in");
    return res.redirect("/signin");
  }
  next();
}

// Stub for ownership check (you can implement later)
function isOwner(req, res, next) {
  // ownership check here
  next();
}

// Middleware to check if current user is the author of the review
async function isReviewAuthor(req, res, next) {
  const { reviewId } = req.params;
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash("error", "Review not found.");
      return res.redirect("back");
    }
    if (!review.author.equals(req.session.userId)) {
      req.flash("error", "You do not have permission to delete this review.");
      return res.redirect("back");
    }
    next();
  } catch (err) {
    console.error("Error checking review author:", err);
    next(err);
  }
}

module.exports = {
  isLoggedIn,
  isOwner,
  isReviewAuthor,
};
