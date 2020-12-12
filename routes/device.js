const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");

const { Device, validate } = require("../models/device");
const { User } = require("../models/user");
const validateID = require("../middlewares/validateID");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

router.post("/", [authentication, authorization], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const mac = await Device.findOne({ mac: req.body.mac });
  if (mac) return res.status(400).send(`${mac.mac} found in database`);

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
        devices: _.pick(device, ["_id", "name", "mac", "psk", "notify"]),
        history: {
          message: `${device.name} has been added to list.`,
          origin: "System",
        },
      },
    }
  );

  res.send(device);
});

router.patch(
  "/:id",
  [validateID, authentication, authorization],
  async (req, res) => {
    const current = await Device.findById(req.params.id);
    if (!current) return res.status(404).send("Device not found");

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          notify: !current.notify,
        },
      },
      { new: true }
    );

    if (!device) return res.status(404).send("Device not found");

    const user = await User.findOne({
      "devices._id": req.params.id,
    });

    user.devices.id(req.params.id).notify = device.notify;

    await user.save();
    res.send(device.notify);
  }
);

router.delete(
  "/:id",
  [validateID, authentication, authorization],
  async (req, res) => {
    const device = await Device.findByIdAndRemove(req.params.id);
    if (!device) return res.status(404).send("Device not found");

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

    res.send(_.pick(device, ["mac", "_id"]));
  }
);

module.exports = router;
