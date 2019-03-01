# Stock Price Checker

Microservice project for returning stock prices of companies that are registered in the stock market.
The prices of the stocks are obtained from a 3rd party API (Alpha Vantage).
The prices are taken from the previous day of the current date (i.e. today is 1 March 2019, and the prices are generated
on the 28th of February 2019).

### Endpoints:

* *GET /api/stock-prices* will try to obtain the stock price of one or two companies. For example, if I want to obtain the stock price of Microsoft from my computer, I will use the query parameter *stock=msft*. The full URL looks like this:

     ```
      http://localhost:3000/api/stock-prices?stock=msft
     ```

  After making this request, a response like the following will show up:

     ```
      {
        "stockData": {
          "stock": "MSFT",
          "price": "112.03",
          "likes": 0
        }
      }
     ```
  
  You may wonder what the *likes* property is all about. With another query parameter that can be added to the URL, a user
  can mark the stock data of a specific company as "liked". A user that uses the same public IP address over a longer period of time
  can't like the stock data of a company more than once. The user must provide the *true* value in order to like a stock. If the user
  uses something other than *true*, then the value provided is ignored, and the stock of that specific company will not be liked.

  The following URL is used for liking the stock price of a company:

     ```
      http://localhost:3000/api/stock-prices?stock=msft&like=true
     ```

  After making this request, a response like the following will show up:

     ```
      {
        "stockData": {
          "stock": "MSFT",
          "price": "112.03",
          "likes": 1
        }
      }
     ```

  As you can see, the value of the *likes* property is incremented by one. If another user with a different public IP address
  decides to like that stock, as you can guess, the new value for the *likes* property will be 2.

  There is also the following endpoint that can be executed:

     ```
      http://localhost:3000/api/stock-prices?stock=msft&stock=goog
     ```

  After making this request, a response like the following will show up:

     ```
      {
        "stockData": [
          {
            "stock": "MSFT",
            "price": "112.03",
            "rel_likes": 1
          },
          {
            "stock": "GOOG",
            "price": "1119.92",
            "rel_likes": -1
          }
        ]
      }
     ```

  We can also display an array that has two stock prices of two different companies. This *likes* property
  in this case is replaced with *rel_likes*. This is the difference of likes between the two specified companies,
  in this case Microsoft and Google. In a previous request from this doc, we liked with a single public IP address
  the stock of Microsoft. But we just obtained the stock for Google, and didn't get to like it. So for the stock of 
  Microsoft, *rel_likes* will equal the difference between the number of likes of Microsoft and that of Google. 
  So 1 - 0 = 1. The *rel_likes* of Google will be the difference between the number of likes of Google and that of 
  Microsoft. So we have 0 - 1 = -1. This explains the output that is displayed above.

  If the user decides that he wants to retrieve the stock prices of those two companies, and also like them, he can
  make a request using the following endpoint:

     ```
      http://localhost:3000/api/stock-prices?stock=msft&stock=goog&like=true
     ```

  In this case, the user already liked the stock of Microsoft. So the number of likes for that company will remain the same.
  Because the user didn't get to previously like Google's stock, the number of likes will be incremented. So the following
  response will be returned to the user:

     ```
      {
        "stockData": [
          {
            "stock": "MSFT",
            "price": "112.03",
            "rel_likes": 0
          },
          {
            "stock": "GOOG",
            "price": "1119.92",
            "rel_likes": 0
          }
        ]
      }
     ```

  The two companies now each have one like. So the *rel_likes* property will have the value 0 for both stocks.

  ###### Error Cases

   - If the user doesn't provide any query parameter with the name *stock*, then the 
   following message will be returned, with a status code of 400:
   **You need to provide a stock query param (i.e "goog")**

   - If one or both of the provided *stock* query parameters contain a symbol that does not belong to any company from the stock market, then the following message 
   will be returned to the user, with a status code of 400:
   **Symbol 'msff' doesn't belong to any company. Please try again!**. The "msff" symbol is just an example.

   - One thing to be mentioned is that the microservice uses a free version of the *Alpha Vantage* Stock API. So you can only 
   get a maximum of 5 different stock prices per minute. If the 
   user of the microservice tries to get more than that in a minute, the following message will be returned: **Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.**


## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

You need to have ***git***, ***npm***, ***nodejs*** and ***mongodb*** installed on your computer.

### Installation steps

```
> cd {your_local_path}/mongodb/bin
> ./mongod --dbpath {path_of_mongo_data_folder}
> git clone git@github.com:narcisneacsu194/stock-price-checker.git
> cd {your_local_path}/stock-price-checker
> npm install
> node server.js
```

You can then access the application with any browser or with software like Postman, using the following URL:

```
localhost:3000
```
