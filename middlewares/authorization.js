module.exports = (req, res, next) =>
  req.user.verified ? next() : res.status(403).send("Unverified user");
