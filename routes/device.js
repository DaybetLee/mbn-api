const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");

const { Device, validate } = require("../models/device");
const { User } = require("../models/user");
const validateID = require("../middlewares/validateID");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.get("/", (req, res) => {
  Device.find()
    .sort("mac")
    .select("-psk")
    .then((device) => res.send(device));
});

router.post("/", [authentication, authorization], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const mac = await Device.findOne({ mac: req.body.mac });
  if (mac)
    return res
      .status(400)
      .send(
        "Device found in database. Update detail or delete entry to continue"
      );

  const device = new Device({
    name: req.body.name,
    mac: req.body.mac,
    psk: req.body.psk,
    notify: true,
  });
  device.psk = await bcrypt.hash(device.psk, await bcrypt.genSalt(10));

  await device.save();

  await User.updateOne(
    { _id: req.user._id },
    {
      $push: {
        devices: _.pick(device, ["_id", "mac", "psk", "notify"]),
        history: {
          message: `${device.name} has been added to list.`,
          origin: "System",
        },
      },
    }
  );

  res.send(device);
});

router.put(
  "/:id",
  [validateID, authentication, authorization],
  async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const current = await Device.findById(req.params.id);
    if (!current) return res.status(404).send("Device not found");

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name || current.name,
          mac: req.body.mac || current.mac,
          psk:
            (await bcrypt.hash(req.body.psk, await bcrypt.genSalt(10))) ||
            current.psk,
          notify: req.body.notify,
        },
      },
      { new: true }
    );

    if (!device) return res.status(404).send("Device not found");

    const user = await User.findOne({
      "devices._id": req.params.id,
    });

    user.devices.id(req.params.id).name = device.name;
    user.devices.id(req.params.id).mac = device.mac;
    user.devices.id(req.params.id).psk = device.psk;
    user.devices.id(req.params.id).notify = device.notify;

    await user.save();
    res.send(device);
  }
);

router.delete(
  "/:id",
  [validateID, authentication, authorization],
  async (req, res) => {
    const device = await Device.findByIdAndRemove(req.params.id);

    const user = await User.findOneAndUpdate(
      {
        "devices._id": req.params.id,
      },
      {
        $push: {
          history: {
            message: `${device.name} has been deleted from list.`,
            origin: "System",
          },
        },
      }
    );

    user.devices.id(req.params.id).remove();
    await user.save();

    return device
      ? res.send(_.pick(device, ["mac", "_id"]))
      : res.status(404).send("Device not found");
  }
);

module.exports = router;
