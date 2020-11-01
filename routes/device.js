const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");

const { Device, validate } = require("../models/device");
const validateID = require("../middlewares/validateID");

router.get("/", (req, res) => {
  Device.find()
    .sort("mac")
    .select("-psk")
    .then((device) => res.send(device));
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const mac = await Device.findOne({ mac: req.body.mac });
  if (mac)
    return res
      .status(400)
      .send(
        "Device found in database. Update detail or delete entry to continue"
      );

  const device = new Device(_.pick(req.body, ["mac", "psk"]));
  device.psk = await bcrypt.hash(device.psk, await bcrypt.genSalt(10));

  device.save().then((device) => res.send(_.pick(device, ["mac", "_id"])));
});

router.delete("/:id", validateID, async (req, res) => {
  const device = await Device.findByIdAndRemove(req.params.id);
  return device
    ? res.send(_.pick(device, ["mac", "_id"]))
    : res.status(404).send("Device not found");
});

module.exports = router;
