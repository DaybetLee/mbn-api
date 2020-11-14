const CryptoJS = require("crypto-js");
const config = require("config");
const Joi = require("joi");

const key = CryptoJS.enc.Hex.parse(config.get("AESKey"));

const validate = (body) => {
  const schema = Joi.object({
    message: Joi.string().required(),
    iv: Joi.string().required(),
  });
  return schema.validate(body);
};

module.exports = (req, res, next) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const base64 = CryptoJS.enc.Base64.parse(req.body.iv);

  const byteArray = CryptoJS.enc.Utf8.stringify(base64)
    .split(",")
    .map((num) => Number(num));

  const hexString = toHexString(byteArray);
  const iv = CryptoJS.enc.Hex.parse(hexString);

  var bytes = CryptoJS.AES.decrypt(req.body.message, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  req.body = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  next();
};

toHexString = (byteArray) => {
  return Array.prototype.map
    .call(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("");
};
