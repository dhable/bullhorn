/**
 * Module with various common functions for working with Restify or
 * building up Restify chain handling functions.
 *
 * @module services.api.routes.common
 */
var _ = require("lodash"),
    dao = require("../../../dao"),
    security = require("../../../security"); 


var oldBrowserRedirectTmpl = _.template(
   "<html>" +
   "<head><title>Page Moved</title></head>" +
   "<body>" +
   "<h1>This page has moved</h1>" +
   "<p>This page has moved to <a href='${newLocation}'>${newLocation}</a>.</p>" +
   "</body></html>");


module.exports = function(log, conf) {
    return {
        /**
         * Restify handler function that ensures the request is from an authorized source
         * for the API being called. This handler and any functions it calls should not include
         * a dependency on the database to ensure that we fail unauthorized attempts fast and
         * without spending resources. This will help us weather an attack on the API.
         *
         * The header should look like:
         *   Authentication: X-Jetway-API-Key <accessKeyId>=<secretKeyHash>
         *
         * @param req The restify request object
         * @param res The restify response object
         * @param next The restify continuation function
        */
        authorize: function(req, res, next) {
            var salt = conf.get("crypto.salts.apikey"),
                authHeader = req.authorization;

            if(authHeader && 
               authHeader.scheme === "X-Jetway-API-Key" && 
               security.isAuthenticationHeaderValid(salt, authHeader.credentials)) {
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
         */
        loadDomain: function(req, res, next) {
            var domainId = req.context.domainId;

            dao.Domain.findById(domainId)
                .then(function(domainObj) {
                    req.local.domain= domainObj;
                    return next();
                })
                .catch(function(err) {
                    if(err.notFound) {
                        return next(new restify.NotFoundError());
                    } else {
                        log.error("unhandled err looking up domain by id. reason: %s", err);
                        return next(new restify.InternalServerError());
                    }
                });
        },

        loadDomainFromAccessKey: function(req, res, next) {
           var that = this,
               accessKeyId = req.context.accessKeyId;

            dao.AccessKey.findById(accessKeyId)
                .then(function(accessKeyObj) {
                   req.context.domainId = accessKeyObj.domain;
                   that.loadDomain(req, res, next);
                })
                .catch(function(err) {
                    if(err.notFound) {
                        return next(new restify.NotFoundError());
                    } else {
                        log.error("unhandled err looking up domain by access key. reason: %s", err);
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
