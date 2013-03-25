/*
 * grunt-srv
 *
 * Copyright (c) 2013 GoodData Corporation
 */

module.exports = function(grunt) {

    // load dependencies and register task
    grunt.loadNpmTasks('grunt-srv/node_modules/grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-srv/node_modules/grunt-connect-proxy');
    grunt.registerTask('grunt-srv', function(target) {

        var fs = require('fs'),
            path = require('path'),
            proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

        // link cookie stripper, path relative to this file
        var cookieStripper = require('../lib/cookie_stripper.js');

        // contrib-connect mount static helper
        var mountFolder = function(connect, dir) {
            return connect.static(path.resolve(dir));
        };

        // merge options with defaults
        var taskOptions = this.options({
            port: 8443,
            backendPrefix: '/gdc',
            backendHost: 'secure.gooddata.com',
            backendPort: 443,
            certificateDirectory: './cert'
        });

        // relative to the gruntfile which uses grunt-srv
        var certificatePath = path.resolve(taskOptions.certificateDirectory);

        grunt.initConfig({
            connect: {
                server: {
                    options: {
                        // need to use the pull-requested connect version for https to work correctly
                        protocol: 'https',
                        port: taskOptions.port,
                        key: fs.readFileSync(certificatePath + '/server.key').toString(),
                        cert: fs.readFileSync(certificatePath + '/server.crt').toString(),
                        ca: fs.readFileSync(certificatePath + '/ca.crt').toString(),
                        passphrase: 'grunt',

                        keepalive: true,
                        middleware: function(connect) {
                            return [
                                cookieStripper,
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
