/**
 * Module with various common functions for working with Restify or
 * building up Restify chain handling functions.
 *
 * @module services.api.routes.common
 */
var _ = require("lodash"),
    dao = require("../../../dao"),
    security = require("../../../security"); 


var log = require("../../../logger.js")("api");

var oldBrowserRedirectTmpl = _.template(
   "<html>" +
   "<head><title>Page Moved</title></head>" +
   "<body>" +
   "<h1>This page has moved</h1>" +
   "<p>This page has moved to <a href='${newLocation}'>${newLocation}</a>.</p>" +
   "</body></html>");


module.exports = function(conf) {
    return {
        /**
         * Restify handler function that ensures the request is from an authorized source
         * for the API being called. This handler and any functions it calls should not include
         * a dependency on the database to ensure that we fail unauthorized attempts fast and
         * without spending resources. This will help us weather an attack on the API.
         *
         * @param req The restify request object
         * @param res The restify response object
         * @param next The restify continuation function
        */
        authorize: function(req, res, next) {
            var salt = conf.get("crypto.salts.apikey"),
                appId = req.context.appId,
                apiKey = req.authorization;

            if(apiKey && apiKey.scheme === "X-Jetway-API-Key" && security.isKeyValid(salt, appId, apiKey.credentials)) {
                return next();
            } else {
                return next(new restify.UnauthorizedError());
            }
        },

        /**
         * A Restify chain handler that simply generates a HTTP/200 response with
         * no body content.
         *
         * @memberOf services.api.routes.common
        */
        emptyOKChainHandler: function(req, res, next) {
            res.send(200);
            next(false);
        },

        /**
         * Issues a HTTP redirect to a new URL. Also sends back a HTML page to handle
         * older browsers or browsers that fail to follow the redirect header.
         * 
         * @memberOf services.api.routes.common
         * @param redirectTo A fully qualified URL (e.g. http://domain.com) on where to redirect to.
         * @return Restify chain function that will handle the rediret.
         */
        redirect: function(redirectTo){
            return function(req, res, next) {
                var htmlPayload = oldBrowserRedirectTmpl({newLocation: redirectTo});

                res.writeHead(301, {
                    "Content-Type": "text/html",
                    "Content-Length": htmlPayload.length,
                    "Location": redirectTo
                });

                res.write(htmlPayload);
                res.end();
                next(false);
            };
        },

        /**
         * Restify chain handler function that uses the DAO layer to attempt to load the Application 
         * entity object from the DB. Translates the DAO level errors into API layers and sets up the
         * local session for future chain handlers.         
         */
        loadApplication: function(req, res, next) {
            var appId = req.context.appId;

            dao.Application.findById(appId)
                .then(function(application) {
                    req.local.app = application;
                    return next();
                })
                .catch(function(err) {
                    if(err.notFound) {
                        return next(new restify.NotFoundError());
                    } else {
                        log.error("unhandled err looking up application by id. reason: %s", err);
                        return next(new restify.InternalServerError());
                    }
                });
        },

        translateExternalAppId: function(req, res, next) {
            req.local.externalAppId = req.context.appId;

            dao.ExternalApp.findById(req.local.externalAppId)
                .then(function(externalApp) {
                    req.context.appId = externalApp.appId;
                    return next();
                })
                .catch(function(err) {
                    if(err.notFound) {
                        return next(new restify.NotFoundError());
                    } else {
                        log.error("unhandled err looking up application by id. reason: %s", err);
                        return next(new restify.InternalServerError());
                    }
                });
        },

        requestLocalStorage: function(req, res, next) {
            if(_.has(req, "local")) {
                log.warn("restify request already contains a local object with values %j", req.local);
            }

            req.local = {};
            next();
        }
    };
};