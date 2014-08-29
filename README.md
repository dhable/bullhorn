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
