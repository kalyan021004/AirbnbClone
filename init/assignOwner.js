import mongoose from "mongoose";
import Listing from "../models/listings.js";
import User from "../models/user.js";


const assignOwner = async () => {
  await mongoose.connect(MONGO_URL);

  // Get your user (you can also hardcode the _id)
  const user = await User.findOne({ email: "kalyan021004@gmail.com" });

  if (!user) {
    console.log("User not found");
    return;
  }

  // Assign all listings to this user
  await Listing.updateMany({}, { author: user._id });

  console.log("All listings now assigned to:", user.username);
  await mongoose.disconnect();
};

assignOwner();
