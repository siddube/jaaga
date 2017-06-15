var express = require('express');
var mongoose = require('mongoose');
var http    = require('http');
var fs      = require('fs');
var bodyParser = require('body-parser');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
var userModel =require('./models/Users');
var User = mongoose.model('User');
var passport_config = require('./config/passport');
var app = express();
var router = express.Router();
var port = process.env.port || 8080;

mongoose.connect('mongodb://prajwal:dbpass@ds115752.mlab.com:15752/jaaga');

app.use(passport.initialize());
app.set('view engine', 'ejs');
app.use('/assets', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
	'use strict';
	res.render('index');
});

app.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  var user = new User();
  user.username = req.body.username;
  user.setPassword(req.body.password)
  user.save(function (err){
    if(err){ return next(err); }
    return res.json({token: user.generateJWT()})
  });
});

app.post('/login', function(req, res, next){
  
  
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
  
});

app.post('/savelocation', function (req, res) {
	'use strict';
  var userid = req.body.requestObj.userid;
  var name = req.body.requestObj.name;
  var location = req.body.requestObj.location;
  var lat = req.body.requestObj.lat;
  var lng = req.body.requestObj.lng;
	User.findById(userid, function (err, user) {
    user.places.push({
      name: name,
      location: location,
      lat: lat,
      lng: lng
    });
    user.save(function(err){
      
    });
  });
});

app.get('/fetchplaces/:id', function (req, res) {
  var id = req.params.id.substr(1);
  User.findById(id, function (err, user){
    res.send(user.places);
  });
});
                                           
                                          

app.listen(port);