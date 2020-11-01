const jwt = require("jsonwebtoken");
const { Device } = require("../models/device");
const config = require("config");

module.exports = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Unauthorize access");

  const decoded = jwt.verify(token, config.get("secretKey"));
  const device = await Device.findById(decoded._id);
  return !device ? res.status(403).send("Forbidden access") : next();
};
