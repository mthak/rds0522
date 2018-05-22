let notify = require('./notifications');
let moment = require('moment-timezone');

let parsePostgres = (logLine, lineno) => {
    let logEntry = {};
    var line = logLine.slice(0);
    try {
        if (logLine.length > 0) {
            let timeStampUTC = logLine.substring(0, 23);

            let utcTime = moment.utc(timeStampUTC.replace(" UTC", ""));
            logEntry.timeStampUTC = utcTime.format(moment.defaultFormatUtc);
            utcTime.tz('America/Chicago');
            logEntry.timeStampCST = utcTime.format("YYYY-MM-DDTHH:mm:ssZ");

            let timeStampInUTC = moment.utc(timeStampUTC.replace(" UTC", ""));
            timeStampInUTC.tz('America/Chicago');
            // logEntry.timeStampCST = timeStampInUTC.format("YYYY-MM-DD HH:mm:ss");
            logEntry.date = timeStampInUTC.format("YYYY-MM-DD");

            let logLineWithoutTimeStamp = logLine.replace(timeStampUTC + ":", "");
            let logEntrySplit = logLineWithoutTimeStamp.substring(0, logLineWithoutTimeStamp.lastIndexOf("]") + 1).split(":");

            logEntry.remoteIpAddress = logEntrySplit[0].substring(0, logEntrySplit[0].indexOf("("));
            logEntry.remotePort = logEntrySplit[0].substring(logEntrySplit[0].indexOf("(") + 1, logEntrySplit[0].indexOf(")"));

            if (logEntrySplit[1] !== undefined) {
                let userAndDb = logEntrySplit[1].split("@");
                logEntry.username = userAndDb[0];
                logEntry.database = userAndDb[1];
            }
            logEntry.processId = logEntrySplit[2].replace("[", "").replace("]", "");
            logEntry.message = logLine.substring(logLine.lastIndexOf("]:") + 2);
            logEntry.uniqueId = `${logEntry.timeStampCST}-${logEntry.processId}`
        }
    } catch (e) {
        //notify.sendEmailNotice(`Unable to parse a log line \n\nLogLine: ${logLine}\n\n  Error: ${e}`);
        console.error("Unable to parse log line %d (error follows) --> %s", lineno, e.message );
	console.error(e.stack);
    }
    return logEntry;
};

let parse = (logLine, engine, lineno) => {
    return parsePostgres(logLine, lineno);
};

exports.parse = parse;
