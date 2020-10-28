const { format, transports, createLogger } = require("winston");
require("express-async-errors");

const myFormat = format.printf(
  ({ timestamp, level, message }) => `${timestamp} -${level}- ${message}`
);

module.exports = createLogger({
  defaultMeta: { metakey: "" },
  transports: [
    new transports.File({
      filename: "./log/combined.log",
      level: "info",
      colorize: true,
      handleExceptions: true,
      handleRejections: true,
      maxsize: 1000000,
      maxFiles: 5,
      tailable: true,
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        myFormat
      ),
    }),
    new transports.Console({
      level: "info",
      colorize: true,
      handleExceptions: true,
      handleRejections: true,
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        myFormat
      ),
    }),
  ],
});
