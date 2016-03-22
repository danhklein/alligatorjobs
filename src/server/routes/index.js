var express = require('express');
var router = express.Router();
var pg = require('pg');
var knex = require('../../../db/knex');
var queries = require("../../../queries2");
var helpers = require('../lib/helpers');
var passport = require('passport');



router.get('/', function(req, res, next) {
  res.render('index', { title: 'Alligator Jobs', user: req.user });
});

router.get('/register', helpers.loginRedirect, function(req, res, next) {
  res.render('register', { title: 'Alligator Jobs', user: req.user});
});

router.post('/register', function(req, res, next) {
  var fname = req.body.fname;
  var lname = req.body.lname;
  var email = req.body.email;
  var password = req.body.password;
  // check if email is unique
  queries.getUserByEmail(email)
    .then(function(data){
      // if email is in the database send an error
      if(data.length) {
          res.render('register',
            { title: 'Alligator Jobs',
              user: req.user,
              status: 'warning',
              message: 'Email already registered!'
            });
      } else {
        // hash and salt the password
        var hashedPassword = helpers.hashing(password);
        // if email is not in the database insert it
        queries.registerUser({fname: fname, lname: lname, password: hashedPassword, email:email})
          .then(function(data) {
            passport.authenticate('local', function(err, user) {
              if (err) {
                return next(err);
              } else {
                req.logIn(user, function(err) {
                  if (err) {
                    return next(err);
                  } else {
                    return res.redirect('/');
                  }
                });
              }
            })(req, res, next);
          })
          .catch(function(err) {
            return res.send('crap', err);
          });
      }
    })
    .catch(function(err){
      return next(err);
    });
});

router.get('/login', helpers.loginRedirect, function(req, res, next) {
  res.render('login', { title: 'Alligator Jobs', user: req.user });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user) {
    if (err) {
      res.render('login',
        { title: 'Alligator Jobs',
          status: 'warning',
          message: 'Email/Password combination incorrect!'
        });
    } else {
      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        } else {
          return res.redirect('/');
        }
      });
    }
  })(req, res, next);
});

router.get('/cultures', function(req, res, next) {
  res.render('cultures', { title: 'Alligator Jobs', user: req.user });
});

router.get('/cultures/:id', function(req, res, next) {
  var cultureID = req.params.id;
  queries.getSingleCulture(cultureID)
    .then(function(cultureData) {
      queries.getCultureResources(cultureID)
        .then(function(resourceData) {
          cultureData.resources = resourceData;
          res.render('culture_profile', {
            title: 'Culture Page',
            user: req.user,
            cultureData: cultureData[0],
            cultureResources: cultureData.resources
          });
        });
    });
});

  router.get('/public/user/:id', function(req, res, next) {
    var userID = req.params.id;
    queries.getUser(userID)
      .then(function (userData) {
        queries.getUserAddress(userID)
          .then(function (addressData) {
            userData.address = addressData;
            queries.getUserWorkExp(userID)
              .then(function (workExpData) {
                workExpData = workExpData.rows;
                res.render('user', {
                  title: 'View Profile',
                  userData: userData[0],
                  userAddress: userData.address[0],
                  userSkills: workExpData
                })
              });
          });
      });
  });


router.get('/contact', function(req, res, next) {
  if(req.user) {
    queries.getUser(req.user)
      .then(function(userData) {
        res.render('contact', {
          title: 'Contact Us',
          userData: userData[0]
        })
      })
  } else {
    res.render('contact', {
      title: 'Contact Us'
    })
  }
});

module.exports = router;
