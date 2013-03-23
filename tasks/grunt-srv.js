/*
 * grunt-srv
 *
 * Copyright (c) 2013 GoodData Corporation
 */
module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-srv/node_modules/grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-srv/node_modules/grunt-connect-proxy');
    grunt.registerTask('grunt-srv', function(target) {

        var fs = require('fs'),
            path = require('path'),
            proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

        var mountFolder = function(connect, dir) {
            return connect.static(path.resolve(dir));
        };

        // merge options with defaults
        var taskOptions = this.options({
            port: 8443,
            backendPrefix: '/gdc',
            backendHost: 'secure.gooddata.com',
            backendPort: 443
        });

        // relative to the gruntfile which uses grunt-srv
        var certificatePath = path.resolve('./cert');

        grunt.initConfig({
            connect: {
                server: {
                    options: {
                        protocol: 'https',
                        port: taskOptions.port,
                        key: fs.readFileSync(certificatePath + '/server.key').toString(),
                        cert: fs.readFileSync(certificatePath + '/server.crt').toString(),
                        ca: fs.readFileSync(certificatePath + '/ca.crt').toString(),
                        passphrase: 'grunt',
                        keepalive: true,
                        middleware: function(connect) {
                            return [
                                function(req, res, next) {
                                    var writeHead = res.writeHead;
                                    res.writeHead = function(statusCode, headers) {
                                        // headers['set-cookie'] is an array of set-cookie strings
                                        if (headers && headers['set-cookie'] && headers['set-cookie'].length) {
                                            headers['set-cookie'] = headers['set-cookie'].map(function(setCookieHeader) {
                                                return setCookieHeader.replace(/(domain=[^ ]+; )/mg, '');
                                            });
                                        }

                                        res.writeHead = writeHead;
                                        res.writeHead.apply(this, [statusCode, headers]);
                                    };
                                    next();
                                },
                                proxySnippet,
                                mountFolder(connect, 'html')
                            ];
                        }
                    }
                },
                proxies: [{
                        context: taskOptions.backendPrefix,
                        host: taskOptions.backendHost,
                        port: taskOptions.backendPort,
                        https: true,
                        changeOrigin: true
                }]
            }
        });


        grunt.task.run([
            'configureProxies',
            'connect'
        ]);
    });
};
