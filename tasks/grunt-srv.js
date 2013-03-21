/*global node:true*/
/*
 * grunt-srv
 *
 * Copyright (c) 2013 GoodData Corporation
 */
module.exports = function(grunt) {

    var fs = require('fs');
    var path = require('path');

    var mountFolder = function (connect, dir) {
        return connect.static(path.resolve(dir));
    };
    var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

    // relative to the gruntfile which uses grunt-srv
    var certificatePath = path.resolve('./cert');

    grunt.initConfig({
        connect: {
            server: {
                options: {
                    protocol: 'https',
                    port: 8443,
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
            proxies: [
                {
                    context: '/gdc',
                    host: 'secure.gooddata.com',
                    port: 443,
                    https: true,
                    changeOrigin: true
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-srv/node_modules/grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-srv/node_modules/grunt-connect-proxy');
    grunt.registerTask('grunt-srv', function(target) {
        grunt.task.run([
            'configureProxies',
            'connect'
        ]);
    });
};
