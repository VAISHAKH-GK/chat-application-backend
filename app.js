var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var db = require('./config/connect');
var indexRouter = require('./routes/index');
var cors = require('cors');

var app = express();

app.use(cors({
  origin:   ["http://localhost:3000"],
  methods:  ["GET","POST","PATCH","PUT"],
  credentials:true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const maxageSession = (1000 * 60 * 60 * 24 * 365.25  * 100000 );

app.use(session({
  key:"user",
  secret:"key",
  resave:false,
  saveUninitialized:false,
  cookie:{maxAge:maxageSession}}));

db.connect((error)=>{
  if (error){
    console.log(error);
  }
  console.log('connection done');
});

app.use('/', indexRouter);

module.exports = app;
