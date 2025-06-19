const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const MongoStore = require("connect-mongo");
require('dotenv').config();
const listingRoutes = require("./routes/listing.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const reviewRoutes = require("./routes/review.routes.js");

const app = express();
const MONGO_URL =process.env.MONGO_URL ;
const SESSION_SECRET = process.env.SESSION_SECRET || "defaultSecret";

const PORT = process.env.PORT || 8080;

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // = 14 days session expiration
    }),
    cookie: {
      secure: false, // true if using HTTPS, false for local dev
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in ms
    },
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

mongoose.connect(MONGO_URL)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use("/", listingRoutes);
app.use("/", authRoutes);
app.use("/listings/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("listings/home.ejs");
});

app.listen(PORT, () => {
  console.log("Server listening on port 8080");
});
