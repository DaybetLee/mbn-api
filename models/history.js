const { date } = require("joi");
const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now() },
});
