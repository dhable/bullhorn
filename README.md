# bullhorn #

Real-time notification dispatcher written in node.js

## Running The Service ##

To run the service locally in a production like environment, you'll need to
install VirtualBox and Vagrant. Once installed, you should be able to simply
type

```
vagrant up
```

This will build an Ubuntu 12.04 TLS server instance, install node.js, install
forever and then start the bullhorn server. Due to port forwarding, the bullhorn
instance will be bound to port 3001 on your local machine.

If you'd like to access the box to inspect log files or interact with the service,
type

```
vagrant ssh
```

When you're done, you can tear down the virtual environment with

```
vagrant destroy
```

## ReST API ##

Documentation for the ReST API has moved to a RAML schema. See ```v1_api_schema.raml``` for
the lastest documentation.

Why?

Well now that this API is going to be publically facing, I made the decision to use RAML as
a way of documenting the ReST API. This tool takes in a YAML style document with some rules
and can produce HTML output that we can publish on our website. The README.md technique works
well for internal documentation and internal APIs will continue to be documented in this manner.


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
