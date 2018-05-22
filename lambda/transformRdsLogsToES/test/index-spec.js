let index = require("../src/index");
let event = require("./event.json");
let eventDevl = require("./event-devl.json");

describe('Transform To ES', function () {
    describe('Run', function () {
        it('shared', function () {
            index.handler(event, {}, function () {
                console.log("in callback");
            });
        });
        it('devl', function () {
            index.handler(eventDevl, {}, function () {
                console.log("in callback");
            });
        });
    });
});

