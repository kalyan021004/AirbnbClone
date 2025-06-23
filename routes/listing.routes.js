const express = require("express");
const Listing = require("../models/listings");
const { isLoggedIn, isOwner } = require("../middleware");
const escapeRegExp = require("lodash.escaperegexp");
const upload =require("../utils/cloudinary")
const multer = require("multer");
const { storage } = require("../utils/cloudinary"); // Make sure this file exists

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

// Search listings
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

router.post('/listings', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    console.log("Uploaded file info:", JSON.stringify(req.file, null, 2));

    const newListing = new Listing(req.body.listing);
    if (req.file) {
      newListing.image = req.file.path;
    }
    newListing.author = req.session.userId;
    await newListing.save();

    req.flash('success', 'Successfully created a new listing!');
    res.redirect('/listings');
  } catch (err) {
    console.error("Error in /listings POST:", err);
    req.flash('error', 'Something went wrong, please try again.');
    res.redirect('/listings/new');
  }
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
