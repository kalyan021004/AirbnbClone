const express = require("express");
const mongoose = require("mongoose");
const Listing = require("../models/listings");
const { isLoggedIn, isOwner } = require("../middleware");
const escapeRegExp = require("lodash.escaperegexp");

const router = express.Router();

// Index Route - main page
router.get('/main', isLoggedIn, (req, res) => {
  console.log('Current user:', req.user);
  res.render('listings/main', { currentUser: req.user });
});

router.get('/listings/filter', async (req, res, next) => {
  try {
    const { country, minPrice, maxPrice } = req.query;
    let query = {};

    if (country) {
      query.country = new RegExp(country, 'i'); // Use country field, not location
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    console.log("Filter Query:", query);

    const filteredListings = await Listing.find(query);

    console.log("Filtered listings count:", filteredListings.length);

    res.render('listings/index', {
      allListings: filteredListings,
      country, minPrice, maxPrice,
      currentUser: req.user
    });
  } catch (err) {
    console.error("Error filtering listings:", err);
    next(err);
  }
});



// Show all listings
router.get("/listings", async (req, res, next) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {
      allListings,
      currentUser: req.user
    });
  } catch (err) {
    next(err);
  }
});

// New listing form
router.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs", {
    currentUser: req.user
  });
});

// Search listings
router.get("/listings/search", async (req, res, next) => {
  try {
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

    res.render("listings/index.ejs", {
      allListings: listings,
      currentUser: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Show specific listing with ObjectId validation
router.get("/listings/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid listing ID");
    err.status = 400;
    return next(err);
  }

  try {
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" },
      })
      .populate("author");

    if (!listing) {
      const err = new Error("Listing not found");
      err.status = 404;
      return next(err);
    }

    res.render("listings/show.ejs", {
      listing,
      currentUser: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Create new listing
router.post('/listings', isLoggedIn, async (req, res, next) => {
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
router.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid listing ID");
    err.status = 400;
    return next(err);
  }

  try {
    const listing = await Listing.findById(id);
    if (!listing) {
      const err = new Error("Listing not found");
      err.status = 404;
      return next(err);
    }
    res.render("listings/edit.ejs", {
      listing,
      currentUser: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Update a listing
router.put("/listings/:id", isLoggedIn, isOwner, async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid listing ID");
    err.status = 400;
    return next(err);
  }

  try {
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success", "Successfully updated the listing!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});

// Delete a listing
router.delete("/listings/:id", isLoggedIn, isOwner, async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Invalid listing ID");
    err.status = 400;
    return next(err);
  }

  try {
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted the listing!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
