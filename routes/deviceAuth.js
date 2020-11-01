const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const { Device, validate } = require("../models/device");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const device = await Device.findOne({ mac: req.body.mac });
  if (!device) return res.status(400).send("Invalid logging");

  const psk = await bcrypt.compare(req.body.psk, device.psk);
  if (!psk) return res.status(400).send("Invalid logging");

  res.send(device.generateAuthToken());
});

module.exports = router;
