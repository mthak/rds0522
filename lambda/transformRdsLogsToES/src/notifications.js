let sendEmailNotice = (txt) => {
    let AWS = require('aws-sdk');
    let ses = new AWS.SES({'region': 'us-east-1'});

    let params = {
        Destination: {
            BccAddresses: [],
            CcAddresses: [
                "aws-jdf-alerts@JohnDeere.com"
            ],
            ToAddresses: [
                "aws-jdf-alerts@JohnDeere.com"
            ]
        },
        Message: {
            Body: {
                Text: {
                    Charset: "UTF-8",
                    Data: txt
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "RDS Log Shipper encountered an error"
            }
        },
        ReplyToAddresses: ["aws-jdf-alerts@JohnDeere.com"],
        ReturnPath: "",
        ReturnPathArn: "",
        Source: "",
        SourceArn: ""
    };
    ses.sendEmail(params, function (err, data) {
        if (err) {
            console.error(`Error sending SES email ${err}`, err.stack);
        }
        else {
            console.log(`Sent SES email: ${data}`);
        }
    });
};

exports.sendEmailNotice = sendEmailNotice;