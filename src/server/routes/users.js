/**
 * Created by rachelkoldenhoven on 3/14/16.
 */
var express = require('express');
var router = express.Router();
var pg = require('pg');
var knex = require('../../../db/knex');
var queries = require("../../../queries2");

//Get Single User Profile
router.get('/:id', function(req, res, next) {
    var userID = req.params.id;
  queries.verifyAdmin(req.user).then(function(isAdmin) {
    if (!(req.user !== userID || isAdmin[0].admin)) {
      res.redirect('/');
    } else {
      var isAdmin = true;
      queries.getUser(userID)
        .then(function (userData) {
          queries.getUserAddress(userID)
            .then(function (addressData) {
              userData.address = addressData;
              queries.getUserWorkExp(userID)
                .then(function (workExpData) {
                  workExpData = workExpData.rows;
                  res.render('user', {
                    title: 'User Profile',
                    user: req.user,
                    userData: userData[0],
                    userAddress: userData.address[0],
                    userSkills: workExpData,
                    isAdmin: isAdmin
                  })
                });
            });
        });
    }
  });
});

router.get('/:id/edit', function(req, res, next) {
  var userID = req.params.id;
  queries.verifyAdmin(req.user).then(function(isAdmin) {
    if (!(req.user !== userID || isAdmin[0].admin)) {
      res.redirect('/');
    } else {
      var isAdmin = true;
      queries.getUser(userID)
        .then(function(userData) {
          queries.getUserAddress(userID)
            .then(function (addressData) {
              userData.address = addressData;
              queries.getUserWorkExp(userID)
                .then(function (workExpData) {
                  workExpData = workExpData.rows;
                  res.render('profile_builder', {
                    title: 'Profile Builder',
                    user: req.user,
                    userData: userData[0],
                    userAddress: userData.address[0],
                    workExperience: workExpData,
                    isAdmin: isAdmin
                  })
                });
            });
        });
    }
  });
});


router.put('/:id/edit-contact', function(req, res, next) {
  var userUpdate = req.body;
  queries.getUser(req.params.id).update({'fname': userUpdate.fname, 'lname': userUpdate.lname, 'email': userUpdate.email, 'phone':userUpdate.phone})
    .then(function() {
      res.json({message: 'Contact information updated.'});
    })
    .catch(function() {
      res.json({message: 'Something went wrong.'});
    });
});

router.post('/:id/edit-address', function(req, res, next) {
  var userID = req.params.id;
  var addressUpdate = req.body;
  queries.getUserAddress(userID)
  .then(function(data) {
    if (data.length) {
      queries.updateAddress(userID, addressUpdate)
      .then(function() {
        res.json({message: 'Address information updated.'});
      })
      .catch(function() {
        res.json({message: 'Something went wrong updating your address.'})
      })
    } else {
      queries.addAddress(userID, addressUpdate)
      .then(function() {
        res.json({message: 'Address information added.'});
      })
      .catch(function(err) {
        res.json({message: 'Something went wrong adding your address.'})
      })
    }
  })
  .catch(function() {
  })
});

router.post('/:id/edit-skills', function(req, res, next) {
  var userID = req.params.id;
  var skillsUpdate = JSON.parse(req.body.data);
  var skillsOnly = skillsUpdate.skills;
  queries.getUserSkills(userID).del()
  .then(function() {
    skillsOnly.forEach(function(el) {
      var newSkillObj = {}
      if (el.skill_id || el.level_id) {
        newSkillObj = {
          skill_id: parseInt(el.skill_id),
          level_id: parseInt(el.level_id)
        };
        queries.addNewSkill(userID, newSkillObj)
        .then(function() {
        })
        .catch(function(err) {
        })
      }
    })
  })
  .then(function(){
    queries.addOtherSkill(userID, skillsUpdate)
    .then(function() {
      res.json({message: 'Skills information updated.'})
    })
    .catch(function(err) {
      res.json({message: 'Something went wrong inserting your information.'})
    })
  })
  .catch(function(err) {
      res.json('something is genuinely messed up.');
    });
});

// get a print-ready profile
router.get('/:id/print', function(req, res, next) {
  var userID = req.params.id;
  queries.verifyAdmin(req.user).then(function(isAdmin) {
    if (!(req.user !== userID || isAdmin[0].admin)) {
      res.redirect('/');
    } else {
      queries.getUser(userID)
        .then(function (userData) {
          queries.getUserAddress(userID)
            .then(function (addressData) {
              userData.address = addressData;
              queries.getUserWorkExp(userID)
                .then(function (workExpData) {
                  workExpData = workExpData.rows;
                  res.render('print', {
                    title: 'User Profile',
                    user: req.user,
                    userData: userData[0],
                    userAddress: userData.address[0],
                    userSkills: workExpData
                  })
                });
            });
        });
    }
  });
});



module.exports = router;
