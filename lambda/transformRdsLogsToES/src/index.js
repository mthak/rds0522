let AWS = require('aws-sdk');
let logParser = require("./db-log-line-parse");
let es = require("./elasticsearch");
let moment = require('moment');
let s3 = new AWS.S3();
let notify = require('./notifications');
var LineStream = require('byline').LineStream;
var stream = require('stream');

const getEsDomain = function () {
    return process.env.ES_DOMAIN || "https://vpc-logcentral-devl-6-0-3lu2yg6r6d7oigzvzpltewb3fa.us-east-1.es.amazonaws.com";
};
AWS.config.region = "us-east-1";
exports.handler = function (event, context, callback) {
    console.log("Received event" + JSON.stringify(event));
    let srcBucket = event.Records[0].s3.bucket.name;
    let srcKey = decodeURIComponent(event.Records[0].s3.object.key);
    downloadFromS3AndPublishToEs(srcBucket, srcKey, context);
};

function downloadFromS3AndPublishToEs(bucket, key, context) {
    let keyParts = key.split("/");
    let dbEngine = keyParts[1];
    let dbInstance = keyParts[2];
    let fileKey = keyParts[4];

    var numLines = -1;
    var readLines = 0;
    var parsedLines = 0;
    let bulkRequestBody = '';

    /* == Streams ==
    * To avoid loading an entire (typically large) log file into memory,
    * this is implemented as a pipeline of filters, streaming log data
    * from S3 to ES.
    * Flow: S3 file stream -> Log Line stream -> Log Record stream -> ES
    */
    var lineStream = new LineStream();

    lineStream.on('data', function(line) {
      readLines++;
    });

    lineStream.on('end', function() {
        console.log("Finished reading %d lines from S3 line stream", readLines);
	numLines = readLines;
    });

    // A stream of log records, from parsing each log line
    var recordStream = new stream.Transform({objectMode: true})
    recordStream._transform = function(line, encoding, done) {
      var logLine = line.toString();
      parsedLines++;
      if (logLine.indexOf(moment().utc().format("YYYY-MM")) !== -1) {
        try{
          let logEntryPayload = logParser.parse(logLine, dbEngine, parsedLines);

          let action = {"index": {}};
          action.index._index = "rds-" + logEntryPayload.date;
          action.index._type = "rds";

          logEntryPayload.db_engine = dbEngine;
          logEntryPayload.rdsInstance = dbInstance;
          logEntryPayload.s3_key = key;
          logEntryPayload.s3_file_name = fileKey;
          logEntryPayload.uploaded_date = new Date();

          let sanitizedPayload = JSON.stringify(logEntryPayload);
          this.push([
              JSON.stringify(action),
              sanitizedPayload
          ].join('\n') + '\n');
        } catch (e) {
            notify.sendEmailNotice(`Failed to parse and send data to es. \n\n  Error: ${e}`);
            console.log("Error parsing and sending to es -- > " + e);
        }
      }
      done();
    }

    var s3Stream = s3.getObject({Bucket: bucket, Key: key}).createReadStream();

    // Flow: S3 file stream -> Log Line stream -> Log Record stream -> ES
    s3Stream
      .pipe(lineStream)
      .pipe(recordStream)
      .on('data', function(parsedEntry) {
         bulkRequestBody += parsedEntry; 
      })
      .on('end', function() {
         console.log("*** Processed %d lines...  ALL DONE ***", parsedLines);
         es.bulk(bulkRequestBody, getEsDomain(), context);
      });

    s3Stream.on('error', function() {
        console.log(
            'Error getting object "' + key + '" from bucket "' + bucket + '".  ' +
            'Make sure they exist and your bucket is in the same region as this function.');
        context.fail();
    });
}
