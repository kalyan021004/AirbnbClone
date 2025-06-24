function isLoggedIn(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'You must be signed in');
    return res.redirect('/signin');
  }
  next();
}


function isOwner(req, res, next) {
  // ownership check here
  next();
}

function isReviewAuthor(req, res, next) {
  // review author check here
  next();
}

module.exports = {
  isLoggedIn,
  isOwner,
  isReviewAuthor
};
