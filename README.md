grunt-srv
=========

Simple web server for gd development.
Use from a Gruntfile.js


```shell
grunt.loadNpmTasks('grunt-srv');
```

The module supports the following options inside grunt.initConfig()

```shell
    "grunt-srv": {
        options: {
            port: 8443,
            backendPrefix: '/gdc',
            backendHost: 'secure.gooddata.com',
            backendPort: 443
        }
    }
```

