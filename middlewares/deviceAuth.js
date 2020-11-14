const bcrypt = require("bcrypt");

const { Device, validate } = require("../models/device");

module.exports = async (req, res, next) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const device = await Device.findOne({ mac: req.body.mac });
  if (!device) return res.status(400).send("Device not registered");

  const psk = await bcrypt.compare(req.body.psk, device.psk);
  if (!psk) return res.status(400).send("Invalid key");

  req.device = device;

  return device.notify ? next() : res.status(405).send("Method not allowed");
};
