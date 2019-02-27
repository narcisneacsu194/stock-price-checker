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
  const stock = req.query.stock;
  const like = req.query.like;

  if(!stock){
    return res.status(400).send('You need to provide a stock query param (i.e "goog")');
  }

  const response = await axios.get(`${URL}&symbol=${stock}&apikey=${API_KEY}`);
  
  if(response.data['Error Message']){
    return res.status(400).send(response.data['Error Message']);
  }

  const metadataObj = response.data['Meta Data'];
  const symbol = metadataObj['2. Symbol'];
  const symbolUpper = symbol.toUpperCase();
  const timeSeries = response.data['Time Series (Daily)'];
  const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
  const firstObj = timeSeries[yesterday];
  
  let closedStock = firstObj['4. close'];

  let stockDb = await Stock.findOne({ stock: symbolUpper });
  
  if(!stockDb){
    const newStockDb = new Stock({ stock: symbolUpper });
    stockDb = await newStockDb.save();
  }

  if(like === "true"){
    const ipAddress = await ip.v4();
    let likeOrNot = true;
    
    const addresses = stockDb.addresses.forEach((address, index) => {
      if(address.ip === ipAddress){
        likeOrNot = false;
      }
    });

    if(likeOrNot){
      stockDb.addresses.push({ ip: ipAddress } );
      stockDb.likes += 1;
      await stockDb.save();
    }
  }

  const resultStock = _.pick(stockDb, ['stock', 'likes']);
  closedStock = parseFloat(closedStock).toFixed(2);
  const finalStock = {
    stockData: {
      stock: resultStock.stock,
      price: closedStock,
      likes: resultStock.likes
    }
  };

  return res.send(finalStock);
});

app.listen(port, () => {
    /* eslint no-console: 0 */
  console.log(`Server started up on port ${port}`);
});

module.exports = { app };