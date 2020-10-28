const mongoose = require("mongoose");
const winston = require("../utils/winston");

module.exports = mongoose
  .connect(
    "mongodb+srv://admin:P@55w0rd123@mbncluster.7eptk.mongodb.net/MBNCluster?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
  )
  .then(() => winston.info("MongoDb Connected..."));
