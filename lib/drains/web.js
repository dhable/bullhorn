/**
 * The web drain takes a notification request and transforms it into
 * a socket.io event for a client.
 *
 * @module web
 */
var _ = require("lodash"),
    logger = require("../logger.js");


var notifications,
    clientMap = {},
    log = logger("drains.web");


var fetchSocketList = function(userGuid) {
  if(_.isNull(userGuid) || _.isUndefined(userGuid) || _.isFunction(userGuid))
    return undefined;

  if(!_.has(clientMap, userGuid))
    clientMap[userGuid] = [];
  return clientMap[userGuid];
};


var findOpenIndex = function(array) {
  for(var i = 0; i < array.length; i++) {
    if(array[i] === null || array[i] === undefined)
      return i;
  }

  return array.length;
};


var clearSocketFromList = function(userGuid, socketIndex) {
  var i = 0,
      array = clientMap[userGuid];

  array[socketIndex] = null;

  for(i = 0; i < array.length; i++) {
    if(array[i] !== null && array[i] !== undefined)
      return;
  }

  delete clientMap[userGuid];
};


var handleClientConnect = function(socket) {
  var timeoutRef;

  socket.on("announce", function(message) {
    var userGuid = message.user,
        version = message.version,
        socketList = fetchSocketList(userGuid),
        assignedIndex = findOpenIndex(socketList);

    clearTimeout(timeoutRef);
    socketList[assignedIndex] = socket;
    socket.on("disconnect", _.partial(clearSocketFromList, userGuid, assignedIndex));
  });

  timeoutRef = setTimeout(function() {
    log.warn("kicking anonymous connection");
    socket.disconnect();
  }, 3000);
};


/**
 *
 */
exports.bind = function(ioServer) {
  if(notifications) {
    log.warn("bind(): notification channel already exists. not creating a new channel");
    return;
  }

  log.info("creating socket.io notification channel");
  notifications = ioServer
                    .of("/notifications")
                    .on("connection", handleClientConnect);
};


/**
 *
 */
exports.pour = function(to, message) {
  to.forEach(function(recipient) {
    var sockets = fetchSocketList(recipient.id);
    sockets.forEach(function(session) {
      session.emit("notification", message);
    });
  });
};


/**
 *
 */
exports.isConnected = function(clientId) {
  return _.has(clientMap, clientId);
};


// The following backdoor is used for to export a number of private
// functions and global data elements so we can unit test them. When
// we get more time, we should think about how to test without this
// hack.
if(global.jasmine) {
  exports.clientMap = clientMap;
  exports.fetchSocketList = fetchSocketList;
  exports.findOpenIndex = findOpenIndex;
  exports.clearSocketFromList = clearSocketFromList;
}
