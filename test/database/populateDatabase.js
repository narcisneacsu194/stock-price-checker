const { ObjectID } = require('mongodb');
const { Stock } = require('../../models/Stock');

const stocks = [
    {
        stock: 'FB',
        price: '162.81'
    },
    {
        stock: 'GOOG',
        price: '1116.05'
    }
];

const populateStockCollection = (done) => {
  Stock.deleteMany({}).then(() => {
    Stock.insertMany(stocks).then(() => done());
  });
};

module.exports = { populateStockCollection, stocks };