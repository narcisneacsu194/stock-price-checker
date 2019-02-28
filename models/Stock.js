const mongoose = require('mongoose');
const IpAddressSchema = require('./IpAddress');

const StockSchema = mongoose.Schema({
  stock: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    required: true,
    default: 0
  },
  addresses: [IpAddressSchema]
});

const Stock = mongoose.model('Stock', StockSchema);

module.exports = { Stock };
