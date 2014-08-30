/**
 *
 * @module routes.recipient
 */
var _ = require("lodash"),
    restify = require("restify"),
    dao = require("../../dao");


var createProfile = function(log, req, res, next) {
   if(!req.body) {
      return next(new restify.BadRequestError());
   }

   dao.Profile.create(req.body)
      .then(function(storedObj) {
         res.json({
            guid: storedObj.id
         });

         next(false);
      })
      .catch(function(err) {
         log.warn("createProfile: faild to create object. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


var loadProfile = function(log, req, res, next) {
   var profileId = req.context.profileId;

   dao.Profile.findById(profileId)
      .then(function(profileObj) {
         req.local.profile = profileObj;
         next();
      })
      .catch(function(err) {
         if(err.notFound) {
            next(new restify.NotFoundError());
         } else {
            log.error("unhandled err looking up profile by id. reason: %s", err.message);
            next(new restify.InternalServerError());
         }
      });
};


var returnProfile = function(req, res, next) {
   var profile = req.local.profile;

   res.json(profile);
   next(false);
};


var updateProfile = function(log, req, res, next) {
   var profile = req.local.profile,
       updatedProfile = req.body;

   updatedProfile.id = profile.id;
   dao.Profile.update(updatedProfile)
      .then(function(profileObj) {
         req.local.profile = profileObj;
         next();
      })
      .catch(function(err) {
         log.error("updateProfile failed. reason: %s", err.message);
         next(new restify.InternalServerError());
      });
};


var deleteProfile = function(log, req, res, next) {
   var profileId = req.context.profileId;

   dao.Profile.del(profileId)
      .then(function() {
         next();
      })
      .catch(function(err) {
         log.error("deleteProfile failed. reason: %s", err.message);
         next(); // The API will pretty much assert delete worked no matter what
      });
};


exports.init = function(server, log, conf) {
   var common = require("./common.js")(log, conf);

   server.post({path: "/profiles", version: "1.0.0"},
               common.authorize, _.partial(createProfile, log), returnProfile);

   server.get({path: "/profiles/:profileId", version: "1.0.0"},
              common.authorize, _.partial(loadProfile, log), returnProfile);

   server.put({path: "/profiles/:profileId", version: "1.0.0"},
              common.authorize, _.partial(loadProfile, log), _.partial(updateProfile, log), returnProfile);

   server.del({path: "/profiles/:profileId", version: "1.0.0"},
              common.authorize, _.partial(deleteProfile, log), common.emptyOKChainHandler);
};
