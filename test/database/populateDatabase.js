const { ObjectID } = require('mongodb');
const moment = require('moment-timezone');
const { Stock } = require('../../models/Stock');

const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
const date2 = moment().subtract(2, 'days').format('YYYY-MM-DD');

const stocks = [
  {
    _id: new ObjectID(),
    stock: 'FB',
    price: '162.81',
    likes: 0,
    stockDate: date,
  },
  {
    _id: new ObjectID(),
    stock: 'GOOG',
    price: '1116.05',
    likes: 0,
    stockDate: date2,
  },
];

const populateStockCollection = (done) => {
  Stock.deleteMany({}).then(() => {
    Stock.insertMany(stocks).then(() => done());
  });
};

module.exports = { populateStockCollection, stocks };
