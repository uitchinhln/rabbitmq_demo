#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'rpc_queue';

        channel.assertQueue(queue, {
            durable: false
        });
        channel.prefetch(1);
        console.log(' [x] Awaiting RPC requests');
        channel.consume(queue, function reply(msg) {
            var data = JSON.parse(msg.content.toString());

            console.log(" [.] receive request id %d at %d", data.id, data.time[0] * 1000 + data.time[1] / 1000000);

            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(JSON.stringify(data)), {
                    correlationId: msg.properties.correlationId
                });

            channel.ack(msg);
        });
    });
});
