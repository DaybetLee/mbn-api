const mongoose = require("mongoose");

module.exports = (req, res, next) =>
  mongoose.Types.ObjectId.isValid(req.params.id)
    ? next()
    : res.status(400).send("Invalid ID");
