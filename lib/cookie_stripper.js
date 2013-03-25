'use strict';

// cookie stripper taken from grizzly server, @vlki
module.exports = function(req, res, next) {
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
};
