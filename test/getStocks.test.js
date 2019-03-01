const expect = require('expect');
const request = require('supertest');
const moment = require('moment-timezone');
const ip = require('ip');
const { app } = require('../server');
const { Stock } = require('../models/Stock');
const { populateStockCollection, stocks } = require('./database/populateDatabase');

beforeEach(populateStockCollection);

describe('GET /api/stock-prices', () => {
  it('should successfully get information about an existing stock in the database', (done) => {
    const dbStock = {
      stock: stocks[0].stock,
      likes: stocks[0].likes
    };

    request(app)
      .get('/api/stock-prices?stock=fb')
      .expect(200)
      .expect((res) => {
        const body = res.body;
        expect(body.stockData.stock).toBe(dbStock.stock);
        expect(body.stockData.likes).toBe(dbStock.likes);
        expect(body.stockData.price).toBeTruthy();
      })
      .end(done);
  });

  it('should successfully update an existing stock from the database if its date is older than a day', (done) => {
    const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const dbStock = {
      stock: stocks[1].stock,
      likes: stocks[1].likes
    };

    request(app)
      .get('/api/stock-prices?stock=goog')
      .expect(200)
      .expect((res) => {
        const body = res.body;
        expect(body.stockData.stock).toBe(dbStock.stock);
        expect(body.stockData.price).toBeTruthy();
        expect(body.stockData.likes).toBe(dbStock.likes);
      })
      .end((err) => {
        if(err){
          return done(err);
        }

        Stock.findOne({ stock: 'GOOG' }).then((stock) => {
          expect(stock.likes).toBe(0);
          expect(stock.stock).toBe('GOOG');
          expect(stock.price).toBeTruthy();
          expect(stock.stockDate).toBe(date);
          expect(stock.addresses.length).toBe(0);
          done();
        }).catch(error => done(error));
      });
  });

  it('should successfully get information about an existing stock from 3rd party API', (done) => {
    const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const stock = {
      stock: 'AMZN',
      likes: 0
    };

    request(app)
      .get('/api/stock-prices?stock=amzn')
      .expect(200)
      .expect((res) => {
        const body = res.body;
        expect(body.stockData.stock).toBe(stock.stock);
        expect(body.stockData.likes).toBe(stock.likes);
        expect(body.stockData.price).toBeTruthy();
      })
      .end((err) => {
        if(err){
          return done(err);
        }

        Stock.findOne({ stock: 'AMZN' }).then((stock) => {
          expect(stock).toBeTruthy();
          expect(stock.likes).toBe(0);
          expect(stock.stock).toBe('AMZN');
          expect(stock.price).toBeTruthy();
          expect(stock.stockDate).toBe(date);
          expect(stock.addresses.length).toBe(0);
          done();
        }).catch(error => done(error));
      });
  });

  it('should like an existing stock from the database twice, and increment the "like" property only once', (done) => {
    const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const dbStock = {
      stock: stocks[0].stock,
      likes: stocks[0].likes
    };

    request(app)
      .get('/api/stock-prices?stock=fb&like=true')
      .expect(200)
      .expect((res) => {
        const body = res.body;
        expect(body.stockData.stock).toBe(dbStock.stock);
        expect(body.stockData.likes).toBe(1);
        expect(body.stockData.price).toBeTruthy();
      })
      .end(() => {
        request(app)
         .get('/api/stock-prices?stock=fb&like=true')
         .expect(200)
         .expect((res) => {
           const body = res.body;
           expect(body.stockData.stock).toBe(dbStock.stock);
           expect(body.stockData.likes).toBe(1);
           expect(body.stockData.price).toBeTruthy();
         })
         .end((err) => {
          if(err){
            return done(err);
          }

          Stock.findOne({ stock: 'FB'}).then((stock) => {
            const isPublicIp = ip.isPublic(stock.addresses[0].ip);
            const isV4Format = ip.isV4Format(stock.addresses[0].ip);
            expect(stock).toBeTruthy();
            expect(stock.likes).toBe(1);
            expect(stock.stock).toBe('FB');
            expect(stock.price).toBeTruthy();
            expect(stock.stockDate).toBe(date);
            expect(stock.addresses.length).toBe(1);
            expect(isPublicIp).toBeTruthy();
            expect(isV4Format).toBeTruthy();
            done();
          }).catch(error => done(error));
         });
      });
  });

  it('should return an error if no stock symbol is provided as a query param', (done) => {
    request(app)
      .get('/api/stock-prices')
      .expect(400)
      .expect((res) => {
        expect(res.text).toBe('You need to provide a stock query param (i.e "goog")');
      })
      .end(done);
  });
});