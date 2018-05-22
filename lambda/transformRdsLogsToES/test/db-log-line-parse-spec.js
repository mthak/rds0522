let logLine = "2017-10-20 00:00:51 UTC::@:[30564]:LOG:  checkpoint starting: time";
let logLine2 = "2017-10-20 01:02:15 UTC:10.213.36.19(43572):pegauser@jdfpega2:[12824]:DETAIL:  Key (pzcacheconfigid, pzgenerationdate, pzjar, pzpackage, pzclass)=(762781845, 1983, prgenjava.jar, com/pegarules/generated/activity, ra_action_validate_1f418f9c15194c2325506f8958140c29.java) already exists.";
let logLine3 = "2017-11-09 20:03:40 UTC:10.213.33.79(47524):[unknown]@[unknown]:[10096]:LOG:  connection received: host=10.213.33.79 port=47524";
let parser = require("../src/db-log-line-parse");
let assert = require('assert');


// "%t:%r:%u@%d:[%p]:";
// %t 	Time stamp without milliseconds 	no
// %r 	Remote host name or IP address, and remote port 	yes
// %u 	User name 	yes
// %d 	Database name 	yes
// %p 	Process ID 	no

describe('Parse', function () {
    describe('Postgres', function () {
        describe('User driven activity', function () {
            it('Extract UTC timestamp from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.timeStampUTC, "2017-10-20T01:02:15Z");
            });
            it('Extract CST timestamp from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.timeStampCST, "2017-10-19T20:02:15-05:00");
            });
            it('Extract date from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.date, "2017-10-19");
            });
            it('Extract IP Address from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.remoteIpAddress, "10.213.36.19");
            });
            it('Extract remote port from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.remotePort, "43572");
            });
            it('Extract username from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.username, "pegauser");
            });
            it('Extract database from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.database, "jdfpega2");
            });
            it('Extract process ID from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.processId, "12824");
            });
            it('Extract message from the log line', function () {
                let result = parser.parse(logLine2, "postgres");
                assert.equal(result.message, "DETAIL:  Key (pzcacheconfigid, pzgenerationdate, pzjar, pzpackage, pzclass)=(762781845, 1983, prgenjava.jar, com/pegarules/generated/activity, ra_action_validate_1f418f9c15194c2325506f8958140c29.java) already exists.");
            });
        });
        describe('Connection made', function () {
            it('Extract UTC timestamp from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.timeStampUTC, "2017-11-09T20:03:40Z");
            });
            it('Extract CST timestamp from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.timeStampCST, "2017-11-09T14:03:40-06:00");
            });
            it('Extract date from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.date, "2017-11-09");
            });
            it('Extract IP Address from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.remoteIpAddress, "10.213.33.79");
            });
            it('Extract remote port from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.remotePort, "47524");
            });
            it('Extract username from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.username, "[unknown]");
            });
            it('Extract database from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.database, "[unknown]");
            });
            it('Extract process ID from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.processId, "10096");
            });
            it('Extract message from the log line', function () {
                let result = parser.parse(logLine3, "postgres");
                assert.equal(result.message, "LOG:  connection received: host=10.213.33.79 port=47524");
            });
        });
        describe('System driven activity', function () {
            it('Extract timestamp from the log line', function () {
                let result = parser.parse(logLine, "postgres");
                assert.equal(result.timeStampUTC, "2017-10-20T00:00:51Z");
            });
            it('Extract IP Address from the log line', function () {
                let result = parser.parse(logLine, "postgres");
                assert.equal(result.remoteIpAddress, "");
            });
            it('Extract remote port from the log line', function () {
                let result = parser.parse(logLine, "postgres");
                assert.equal(result.remotePort, "");
            });
            it('Extract username from the log line', function () {
                let result = parser.parse(logLine, "postgres");
                assert.equal(result.username, "");
            });
            it('Extract database from the log line', function () {
                let result = parser.parse(logLine, "postgres");
                assert.equal(result.database, "");
            });
            it('Extract process ID from the log line', function () {
                let result = parser.parse(logLine, "postgres");
                assert.equal(result.processId, "30564");
            });
            it('Extract message from the log line', function () {
                let result = parser.parse(logLine, "postgres");
                assert.equal(result.message, "LOG:  checkpoint starting: time");
            });
        });
    });
});

