const Listing = require("./models/listings");

function isLoggedIn(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/signin');
}
 async function isOwner(req,res,next){
    const {id}=req.params;
    const listing =await Listing.findById(id);
    if(!listing){
        return res.status(404).send("Listing not found")
    }
    if(!listing.author.equals(req.session.userId)){
            return res.status(403).send("Unauthorized: You are not the owner");

    }
    next();

}
 async function isReviewAuthor (req, res, next){
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review || !review.author.equals(req.session.userId)) {
    return res.status(403).send("Unauthorized: Not your review");
  }
  next();
};

module.exports={isLoggedIn,isOwner,isReviewAuthor};