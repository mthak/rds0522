let AWS = require('aws-sdk');
AWS.config.region = "us-east-1";
let connectionClass = require('http-aws-es');
let elasticsearch = require("elasticsearch");

function bulk(elasticsearchBulkData, esDomain, context) {
    const esClient = new elasticsearch.Client({
        host: esDomain,
        log: 'error',
        connectionClass: connectionClass,
        amazonES: {
            credentials: new AWS.EnvironmentCredentials('AWS')
        }
    });

    esClient.bulk({body: elasticsearchBulkData}, (error, data) => {
        if (error) {
            console.error(`Failed to bulk upload to ES: ${error}`);
            context.fail();
        } else {
            console.log(`Successfully indexed all items`);
            context.succeed();
        }
    })
}

exports.bulk = bulk;
