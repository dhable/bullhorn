/**
 * The web drain takes a notification request and transforms it into
 * a socket.io event for a client.
 *
 * @module web
 */
var _ = require("lodash"),
    stats = require("../stats.js"),
    logger = require("../logger.js");


var notifications,
    clientMap = {},
    log = logger("drains.web");


/**
 * Shorthand function for checking if a value is null or
 * undefined. Uses lodash isNull and isUndefined.
 *
 * @param value Value to check
 * @returns true if the value is null or undefined, otherwise false.
 */
var isNullOrUndefined = function(value) {
  return _.isNull(value) || _.isUndefined(value);
};


/**
 * Given a user guid value, fetches the list of socket.io sockets
 * that are currently in use and have announced themselves to the
 * user guid. If the user guid hasn't been previously seen, this
 * method will create a new, empty socket list and return that.
 *
 * @param userGuid The user guid value to check against.
 * @return An array of socket.io objects or undefined if userGuid is an invalid type.
 */
var fetchSocketList = function(userGuid) {
  if(_.isNull(userGuid) || _.isUndefined(userGuid) || _.isFunction(userGuid))
    return undefined;

  if(!_.has(clientMap, userGuid))
    clientMap[userGuid] = [];
  return clientMap[userGuid];
};


/**
 * Given an array, finds the first open index that contains a null or
 * undefined value. These values are deemed safe for reuse. If the array
 * is completely full, the index will be 1 past the last index. Assigning
 * to this index has the effect of extending the array size by 1.
 *
 * @param array The array to check for an open position.
 * @returns The index to insert the next element at.
 */
var findOpenIndex = function(array) {
  for(var i = 0; i < array.length; i++) {
    if(array[i] === null || array[i] === undefined)
      return i;
  }

  return array.length;
};


/**
 * Given a user guid and socket index, this method will remove the reference
 * to that socket object. If all of the sockets are null or undefined, the entry
 * in the client map will be removed to conserve memory.
 *
 * @param userGuid The user guid to remove a socket from.
 * @param socketIndex the 0 based index of the socket object to remove.
 */
var clearSocketFromList = function(userGuid, socketIndex) {
  var i, sockets;

  // Ensure we have valid parameters
  if(_.isNull(userGuid) || _.isUndefined(userGuid) || !_.isNumber(socketIndex)) {
    log.error("clearSocketFromList: invalid arguments = [%s, %s]", userGuid, socketIndex);
    return;
  }

  // nullify the socket at socketIndex as long as socketIndex is
  // within the valid range.
  sockets = clientMap[userGuid];
  if(0 <= socketIndex && socketIndex < sockets.length)
    sockets[socketIndex] = null;

  if(_.every(sockets, isNullOrUndefined))
    delete clientMap[userGuid];
};


/**
 * Socket.io event handler for the "announce" event. This handler
 * registers the socket with the client map and cancels the previous
 * anonymous connection timer.
 *
 * After execution, the socket will be known to the web drain and can
 * start being used for notifications.
 *
 * @param socket The socket.io socket object.
 * @param timeoutId The id of any timeout that we no longer want to fire.
 * @param message  The announce parameter object.
 */
var handleAnnounceEvent = function(socket, timeoutId, message) {
  var userGuid = message.user,
      version = message.version,
      socketList = fetchSocketList(userGuid),
      assignedIndex = findOpenIndex(socketList);

  clearTimeout(timeoutId);
  socketList[assignedIndex] = socket;
  socket.on("disconnect", _.partial(clearSocketFromList, userGuid, assignedIndex));
};


/**
 * Socket.io event handler for the "connection" event. This handler
 * waits for the announce event from the client for a period of time.
 * If no announce event is recieved, the connection will be closed.
 *
 * @param socket The newly established socket.io socket.
 */
var handleClientConnect = function(socket) {
  var timeoutRef = setTimeout(function() {
    log.warn("kicking anonymous connection");
    socket.disconnect();
  }, 3000);

  socket.on("announce", _.partial(handleAnnounceEvent, socket, timeoutRef));
};


/**
 * The stats collector for the Web drain.
 */
exports.stats = new stats.Collector();


/**
 * Name of this drain module.
 */
exports.name = "web";


/**
 * Method that can bind the web drain module to a particular socket.io server
 * instance. This is used in the bootstrap process to tie the web drain as an
 * add on server to the restify server.
 *
 * @param ioServer The newly created socket.io server instance.
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
 * The drain public API used to send a message via the web drain to a user's
 * interactive session.
 */
exports.pour = function(to, message, template, callback) {
  to.forEach(function(recipient) {
    var sockets = fetchSocketList(recipient.id);
    sockets.forEach(function(session) {
      session.emit("notification", message);
    });
  });
};


/**
 * Checks to see if there is a client connected with a particular user guid.
 *
 * @param userGuid The user guid value to check.
 * @returns true if the client is known to the web drain (currently connected).
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
