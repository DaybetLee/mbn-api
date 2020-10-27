const express = require("express");
const error = require("./middlewares/error");
const app = express();
const winston = require("./utils/winston");

app.use(error)

const port = process.env.PORT || 10443;
app.listen(port, ()=>winston.info(`Listen on ${port}`))