const express = require("express");
const Listing = require("../models/listings");
const { isLoggedIn, isOwner } = require("../middleware");
const escapeRegExp = require("lodash.escaperegexp"); // for safe regex (optional)

const router = express.Router();

// Index Route
router.get("/main", isLoggedIn, (req, res) => {
  res.render("listings/main.ejs");
});

// Show all listings
router.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

// New listing form
router.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});
router.get("/listings/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    req.flash("error", "Please enter a search term.");
    return res.redirect("/listings");
  }

 const listings = await Listing.find({
  $or: [
    { title: { $regex: escapeRegExp(query), $options: "i" } },
    { description: { $regex: escapeRegExp(query), $options: "i" } },
    { location: { $regex: escapeRegExp(query), $options: "i" } }
  ]
});


  res.render("listings/index.ejs", { allListings: listings });
});


// Show specific listing
router.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("author");
  res.render("listings/show.ejs", { listing });
});

// Create a new listing
router.post("/listings", isLoggedIn, async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.author = req.session.userId; // Set current user as author
  await newListing.save();

  req.flash("success", "Successfully created a new listing!");
  res.redirect("/listings");
});

// Edit listing form
router.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

// Update a listing
router.put("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  req.flash("success", "Successfully updated the listing!");
  res.redirect(`/listings/${id}`);
});

// Delete a listing
router.delete("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);

  req.flash("success", "Successfully deleted the listing!");
  res.redirect("/listings");
});


module.exports = router;
