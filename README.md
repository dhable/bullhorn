# bullhorn #

Real-time notification dispatcher written in node.js


## Dan's Todo List Before Calling It Done ##

* [SKIPPED] JSON schema validator and return mode for all ReST routes with bodies.

  The validation logic is easy enough to write in JS and connect to restify. Adding
  a schema isn't going to buy us much other than more complexity and bugs early on.

* [DONE] Update conf schema to read from a series of static files.

  These include global.conf, private.conf and local.conf layered in that order.
  Check in the current conf used to bootstrap in dev mode

* [DONE] Build a service discovery module

  Read services from external file locaton.

* Build routing rule file format and loader.

* Watch routing rules, service discovery and conf files. Update in memory
  values when files change.

* [DONE] Build websocket/socket.io listener for notifications being send to the web
  application. Need to register/unregister who's available.

* Write more specs - at least get good level of unit test coverage.

* Build test mode for socket.io

* Deployment scripts / process
  Consider vagrant at this time


## ReST API ##

These are the following valid ReST APIs that bullhorn current supports.

### Check bullhorn server health ###

This method checks the health of the bullhorn server by load balancers. As
the health of a bullhorn server gets worse, the load balancer should be
configued to send less traffic to this instance until the health improves.

#### Example Request ####
```
GET /health
```

#### Example Request Headers ####
No specific headers.

#### Example Request Body ####
Not applicable to GET requests.

#### Example Response Body ####
``` javascript
{
  "health": 0.351
}
```
The health value is a number between 0 and 1, where lower numbers indicate a
healthier system. Think of the number as the load on the bullhorn instance at
that given time.


### Send Notification ###

This method acutally sends a notification based on the best choice for a user
at that moment. The details of which method is the best for the notification
are encoded in the bullhorn routing rules.

#### Example Request ####
```
POST /notification
```

#### Example Request Headers ####
No specific headers.

#### Example Request Body ####
``` javascript
{
  "org": "4a0821d1-f88e-4898-a3e7-f745c42ba1fe",
  "to": ["jetway:c98fbf4b-0d69-4df8-916d-1cce99a5ca15",
         "jetway:3bd68a34-0a65-4cd1-a435-ac7df866ff94"],
  "msg": "Hey, something cool happened.",
  "template": "v1_notification"
}
```

The org parameter is the GUID of the users organization from the DB. We need
this in order to determine the plan (e.g. paid or not) for the user and settings
that might be applicable to all.

The to parameter is an array of strings of the recipients. The strings follow the
form of <type>:<id>. Currently the only supported type is "jetway" and that means
the id will be a DB id for a given user. In the future we may expand this to allow
bullhorn to use other types, such as sms, so we can send notifications without the
need for a user record.

The msg parameter is the details of the notification that is being sent. Different
drains can shorten or format the message as appropriate for their use.

The template parameter is optional and defines if the message should be placed
inside of a larger template when sending. This will only be used if it's supported
by the particular drain.

#### Example Response Body ####
No body content is returned.

HTTP/200 indicates that the notification was passed off successfully to the
outbound notification system successfully (SMS provider / email provider / etc).

HTTP/404 indicates that the org defined in the message is suspended or does
not exist.

HTTP/400 indicates that the request was not formatted correctly or required
fields are missing.

HTTP/500 indicates that shit went south and bullhorn was unable to fulfill the
request. Error was probably bullhorn's fault.


### Fetch Current Server Info ###

This method is intended to be used by devlopers and operations staff to inspect
the server and environment without the need for SSH.

#### Example Request ####
```
GET /ops/info
```

#### Example Request Headers ####
No specific headers.

#### Example Request Body ####
Not applicable to GET requests.

#### Example Response Body ####
``` javascript
{
  "bullhornVersion": "0.1.0",
  "cmd": "node /projects/bullhorn/app.js",
  "nodeVersion": {
    "http_parser": "1.0",
    "node": "0.10.26",
    "v8": "3.14.5.9",
    "ares": "1.9.0-DEV",
    "uv": "0.10.25",
    "zlib": "1.2.3",
    "modules": "11",
    "openssl": "1.0.1e",
  },
  "env": {
    "PATH": "/usr/local/bin:/usr/bin:/usr/local/share/npm/bin",
    "TMPDIR": "/var/folders/xs/qc9tcp0n2yl16ph6j9cbcw180000gn/T/",
    "SHELL": "/usr/local/bin/zsh",
    "HOME": "/Users/dhable",
    "USER": "dhable",
    "LOGNAME": "dhable",
  }
}
```

The body details of the nodeVersion and env modules are fetched directly from the
node.js process object. The details can vary depending on the configuration of the
system bullhorn is deployed on.

### Fetch Current Process Info ###

This method is intended to be used by developers and operations staff to view the
current process info for the server without the need for SSH.

#### Example Request ####
```
GET /ops/top
```

#### Example Request Headers ####
No specific headers.

#### Example Request Body ####
Not applicable to GET requests.

#### Example Response Body ####
``` javascript
{
  "cmd": "node /projects/bullhorn/app.js",
  "pid": 5523,
  "uptime": 13353,
  "memory": {
    "rss": 39161856,
    "heapTotal": 30107392,
    "heapUsed": 13925568
  }
}
```

### Fetch Current Notification Stats ###

This method is intended to be used by devlopers and operation staff to view the
information on the notifications that have been flowing through the system.

#### Example Request ####
```
GET /ops/stats?window=5
```

The window parameter defines how many minutes back to roll up notification statstics
for when generating the results. If not specified, it will include all statistics that
are currently in memory as defined by the stats.retentionLength configuration parameter.
These stats will be collapsed according to stats.periodLength and some granulatiry will
be lost.

#### Example Request Headers ####
No specific headers.

#### Example Request Body ####
Not applicable to GET requests.

#### Example Response Body ####
``` javascript
{
  "window": "5",
  "email": {
    "requests": 1232,
    "time": 0.324,
    "errors": 1
  }
}
```

Window is the only static field and reiterates the window defined in the request. The other
keys at the top level (e.g. "email") are named for every stat collection in the system and
depends on the configuration. Values for those keys enumerate the bucket names and the values
that fit within a given window.


## socket.io API ##

The socket.io API is contains two events that clients need to handle in order to start
using the open WebSocket connection as a potential notification channel.


### Connecting ###

After importing the socket.io JavaScript library, the client needs to open a connection
to the server on the /notifications namespace.
``` javascript
var notification = io.connect("http://<server address>/notifications");
```


### Registerting for Notifications ###

Once a connection is established, the client needs to identify itself with the user's
GUID. Without this identification, bullhorn won't be able to use this anonymous socket
and will disconnect after a short time.

To identify the socket, emit an event called "announce" which user is on the other end of
the socket and what version the client is programmed against. Since the connection could
be broken due to network hiccups, it's recommended to always emit the id event on connection.

``` javascript
notification.on("connect", function() {
  notification.emit("announce", {user: "...", version: "0.1.0"});
});
```
After emitting the id event, the client can just wait for notification events.


### Handling Notifications ###

All notifications are sent from the server on a "notification" event. The actual text
of the notification is sent as the data associated with the event. The client then just
needs to connect rendering/alerting code to the event. No reply needs to be sent.

``` javascript
notification.on("notification", function(msg) {
  // You'd probably want to do something more elobrate than a standard
  // alert box. This is just for demonstration purposes.
  alert(msg);
});
```
