# bullhorn #

Real-time notification dispatcher written in node.js

Bullhorn was developed as a subcomponent for a devops tool that the team at Jetway was
building. Since pivoting in a new direction, we decided to open source the notification
component for others to use or build off of.

The code is provided as is. Drop us a note if you would like to contract some engineering 
time to help use this code base in your product.

__This project is no longer maintained.__

## Dependencies ##

To work with the code, you'll need

* node.js 0.10.x
* VirtualBox
* Vagrant
* grunt-cli

We also used Firebase as the backend database for our service. If you do not want to use
Firebase, you'll need to rip out the lib/dao/*.js modules and replace them with some other
backing data source.


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
the lastest documentation. This document is probably incomplete as we made chanegs to the API
without touching the code. It should provide an idea of the ReST API.


## License ##

This project is open sourced under the GNU LESSER GENERAL PUBLIC LICENSE. A copy of the
license is provided in the LICENSE file.
