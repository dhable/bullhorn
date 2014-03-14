bullhorn
========

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
