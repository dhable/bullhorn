# bullhorn #

Real-time notification dispatcher written in node.js


## Dan's Todo List Before Calling It Done ##

* JSON schema validator and return mode for all ReST routes with bodies.
  Will make long term development and debugging easier.

* [DONE] Update conf schema to read from a series of static files.

  These include global.conf, private.conf and local.conf layered in that order.
  Check in the current conf used to bootstrap in dev mode

* [DONE] Build a service discovery module

  Read services from external file locaton.

* Build routing rule file format and loader.

* Watch routing rules, service discovery and conf files. Update in memory
  values when files change.

* Build websocket/socket.io listener for notifications being send to the web
  application. Need to register/unregister who's available.

* Write more specs - at least get good level of unit test coverage.

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
{}
```

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
  "org": "",
  "to": ["", ""],
  "msg": ""
}
```

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
