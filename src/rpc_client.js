#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var args = process.argv.slice(2);

if (args.length === 0) {
    console.log("Usage: rpc_client.js num");
    process.exit(1);
}

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        channel.assertQueue('', {
            exclusive: true
        }, function(error2, q) {
            if (error2) {
                throw error2;
            }
            //var correlationId = generateUuid();
            var num = parseInt(args[0]);
            var receivedCount = 0;
            var startTime = process.hrtime();


            channel.consume(q.queue, function(msg) {
                receivedCount++;
                if (receivedCount == num) {
                    var endTime = process.hrtime(startTime);
                    console.log(' [.] Task finished after %d ms', endTime[0] * 1000 + endTime[1] / 1000000);
                    setTimeout(function() {
                        connection.close();
                        process.exit(0);
                    }, 500);
                }
            }, {
                noAck: true
            });


            console.log(' [x] Sending %d request...', num);
            for (var i = 0; i < num; i++) {
                channel.sendToQueue('rpc_queue',
                    Buffer.from(JSON.stringify({
                        id: i,
                        time: process.hrtime()
                    })), {
                        correlationId: generateUuid(),
                        replyTo: q.queue
                    });
            }
        });
    });
});

function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}
