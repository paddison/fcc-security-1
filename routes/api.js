/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var fetch = require("node-fetch");
const requestIp = require('request-ip');

const CONNECTION_STRING = "mongodb+srv://paddison:sevenfl4tseven@cluster0.mnwde.mongodb.net/paddison?retryWrites=true&w=majority"; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});


module.exports = function (app, db) {

  let collection = db.collection("stock");
  collection.deleteMany({}, (err, data) => {
    console.log("db wiped")
  })

  app.route('/api/stock-prices')
    .get(function (req, res){
      let ipAdr = requestIp.getClientIp(req)

      if (!Array.isArray(req.query.stock)) {
      fetch(`https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock}/quote`)
        .then(res => res.json())
        .then(json => {

          let stock = req.query.stock;
          let price = json.open;
          let stockData = {"stock": stock, "price": price}

          collection.findOne({stock: stock}, (err, data) => {
            if (!data){
              if (req.query.like === "true") {

                collection.insertOne({stock: stock, likes: [ipAdr]}, (err, data) => {
                  stockData.likes = data.ops[0].likes.length
                  res.json({stockData: stockData})
                });

              }else {

                stockData.likes = 0
                res.json({stockData: stockData})

              }
            }else{

              stockData.likes = data.likes.length

              if (req.query.like === "true" && !data.likes.includes(ipAdr)) {

                collection.updateOne({stock: stock}, {$push: {likes: ipAdr}}, (err, data) => {
                  stockData.likes++;
                  res.json({stockData: stockData})
                })

              }else {
                res.json({stockData: stockData})
              }

            }
            
          });  
        })
        .catch(() => {
          res.json({err: 'no stock found:' + req.query.stock})
        }); 

      }else if (req.query.stock.length == 2) {
        let stock1 = {};
        let stock2 = {};
        stock1.stock = req.query.stock[0];
        stock2.stock = req.query.stock[1];
        fetch(`https://repeated-alpaca.glitch.me/v1/stock/${stock1.stock}/quote`)
        .then(res => res.json())
        .then(json => {
          stock1.price = json.open;
          fetch(`https://repeated-alpaca.glitch.me/v1/stock/${stock1.stock}/quote`)
          .then(res => res.json())
          .then(json => {
            stock2.price = json.open;
            collection.findOne({stock: stock1.stock}, (err, data) => {
              if (!data) {
                if (req.query.like === "true") {
                  collection.insertOne({stock: stock1.stock, likes: [ipAdr]}, (err, data) => {
                    stock1.likes = 1;
                  })
                }else {
                  stock1.likes = 0;
                }
              }else {
  
                stock1.likes = data.likes.length
  
                if (req.query.like === "true" && !data.likes.includes(ipAdr)) {
  
                  collection.updateOne({stock: stock1.stock}, {$push: {likes: ipAdr}}, (err, data) => {
                    stock1.likes++;
                  })
                }
              }
              collection.findOne({stock: stock2.stock}, (err, data) => {
                if (!data) {
                  if (req.query.like === "true") {
                    collection.insertOne({stock: stock2.stock, likes: [ipAdr]}, (err, data) => {
                      stock2.likes = 1;
                      stock1.rel_likes = stock1.likes - stock2.likes
                      stock2.rel_likes = stock2.likes - stock1.likes
                      delete stock1.likes;
                      delete stock2.likes;
                      res.json({stockData: [stock1, stock2]})    
                    })
                  }else {
                    stock2.likes = 0;
                  }
                }else {
  
                  stock2.likes = data.likes.length
  
                  if (req.query.like === "true" && !data.likes.includes(ipAdr)) {
  
                    collection.updateOne({stock: stock2.stock}, {$push: {likes: ipAdr}}, (err, data) => {
                      stock2.likes++;
                      stock1.rel_likes = stock1.likes - stock2.likes
                      stock2.rel_likes = stock2.likes - stock1.likes
                      delete stock1.likes;
                      delete stock2.likes;
                      res.json({stockData: [stock1, stock2]})    
                    })
                  }else {
                    stock1.rel_likes = stock1.likes - stock2.likes
                    stock2.rel_likes = stock2.likes - stock1.likes
                    delete stock1.likes;
                    delete stock2.likes;
                    res.json({stockData: [stock1, stock2]})     
                  }
                }   
              })
            })
          })
          .catch(() => {
            res.json({err: 'no stock found:' + req.query.stock})
          }); 
        })
        .catch(() => {
          res.json({err: 'no stock found:' + req.query.stock})
        }); 
      }    
  });
}