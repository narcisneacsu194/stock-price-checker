const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const _ = require('lodash');
const axios = require('axios');
const moment = require('moment-timezone');
const ip = require('public-ip');
require('./config/config.js');
require('./db/mongoose');
const { Stock } = require('./models/Stock');

const app = express();
const port = process.env.PORT || 3000;
const URL = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY';
const API_KEY = 'RYPEH4F02O8I2YDR';

app.use(bodyParser.json());
app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"]
    }
}));

app.get('/api/stock-prices', async (req, res) => {
  let stock = req.query.stock;
  const like = req.query.like;

  if(!stock){
    return res.status(400).send('You need to provide a stock query param (i.e "goog")');
  }

  if(!Array.isArray(stock)){
    stock = [stock];
  }

  let finalStock = {};  

  let metadataObj;
  let symbol;
  let symbolUpper;
  let timeSeries;
  let yesterday;
  let firstObj;
  let closedStock;
  let newStockDb;

  const promises = stock.map((stockIter) => {
    return axios.get(`${URL}&symbol=${stockIter}&apikey=${API_KEY}`).then((response) => {

      if(!response.data['Meta Data']){
        return { note: response.data['Note'] };
      }

      metadataObj = response.data['Meta Data'];
      symbol = metadataObj['2. Symbol'];
      symbolUpper = symbol.toUpperCase();
      timeSeries = response.data['Time Series (Daily)'];
      yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
      firstObj = timeSeries[yesterday];

      closedStock = firstObj['4. close'];
      closedStock = parseFloat(closedStock).toFixed(2);

      return Stock.findOne({ stock: symbolUpper });
    }).then((stockDb) => {
      if(stockDb && stockDb.note)return stockDb;

      if(!stockDb){
        newStockDb = new Stock({ stock: symbolUpper, price: closedStock });
        return newStockDb.save();
      }

      if(stockDb.price !== closedStock){
        stockDb.price = closedStock;
        return stockDb.save();
      }

      return stockDb;
    }).then((stockDb2) => {
      return stockDb2;
    });
  });

  return Promise.all(promises).then((results) => {

    if(results[0].note){
      return res.status(400).send(results[0].note);
    }
    
    if(results[1].note){
      return res.status(400).send(results[1].note);
    }

    if(results.length === 1){
      finalStock = {
        stockData: {
          stock: results[0].stock,
          price: results[0].price,
          likes: results[0].likes
        }
      };
     }else if(results.length === 2){
       finalStock = {
         stockData: [
           {
             stock: results[0].stock,
             price: results[0].price,
             rel_likes: results[0].likes - results[1].likes
           },
           {
             stock: results[1].stock,
             price: results[1].price,
             rel_likes: results[1].likes - results[0].likes
           }
         ]
       };
      }
    
    return res.send(finalStock);
  });

});

app.listen(port, () => {
    /* eslint no-console: 0 */
  console.log(`Server started up on port ${port}`);
});

module.exports = { app };