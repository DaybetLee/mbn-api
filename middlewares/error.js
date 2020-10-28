const winston = require("../utils/winston");

module.exports = (err, req, res, next) => {
  winston.error(err.stack);
  return res.status(500).send("Something went wrong.");
};
