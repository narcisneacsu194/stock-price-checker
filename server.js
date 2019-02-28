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

  const promises = stock.map(async (stockIter) => {
    const response = await axios.get(`${URL}&symbol=${stockIter}&apikey=${API_KEY}`);

      if(response.data['Note']){
        return { note: response.data['Note'] };
      }

      if(response.data['Error Message']){
        return { error: `Symbol '${stockIter}' doesn't belong to any company. Please try again!` };
      }

      const metadataObj = response.data['Meta Data'];
      const symbol = metadataObj['2. Symbol'];
      const symbolUpper = symbol.toUpperCase();
      const timeSeries = response.data['Time Series (Daily)'];
      const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
      const firstObj = timeSeries[yesterday];

      let closedStock = firstObj['4. close'];
      closedStock = parseFloat(closedStock).toFixed(2);

      let stockDb = await Stock.findOne({ stock: symbolUpper });

      if(stockDb && (stockDb.note || stockDb.error))return stockDb;

      if(!stockDb){
        let newStockDb = new Stock({ stock: symbolUpper, price: closedStock });
        newStockDb = await newStockDb.save();
        return newStockDb;
      }

      if(stockDb.price !== closedStock){
        stockDb.price = closedStock;
        stockDb = stockDb.save();
        return stockDb
      }

      return stockDb;
  });

  return Promise.all(promises).then((results) => {

    if(results[0].note){
      return res.status(400).send(results[0].note);
    }
    
    if(results.length === 2 && results[1].note){
      return res.status(400).send(results[1].note);
    }

    if(results[0].error){
      return res.status(400).send(results[0].error);
    }

    if(results.length === 2 && results[1].error){
      return res.status(400).send(results[1].error);
    }

    let finalStock;

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