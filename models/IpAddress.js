const mongoose = require('mongoose');

const IpAddressSchema = mongoose.Schema({
  ip: {
    type: String,
    required: true,
  },
});

module.exports = IpAddressSchema;
