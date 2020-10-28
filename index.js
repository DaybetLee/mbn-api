const express = require("express");
const app = express();

const winston = require("./utils/winston");

require("./startups/db");
require("./startups/routes")(app);

const port = process.env.PORT || 10443;
app.listen(port, () => winston.info(`Listen on ${port}`));
