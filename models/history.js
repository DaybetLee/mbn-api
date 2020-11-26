const Joi = require("joi");
const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now() },
  message: { type: String, minlength: 255 },
  origin: { type: String, enum: ["Device", "System"] },
});

const History = mongoose.model("history", historySchema);

exports.History = History;
exports.historySchema = historySchema;
