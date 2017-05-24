#!/usr/bin/env node
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const common = require('../common');
const DEFAULT_INTERFACE = common.getDefaultInterface();
const getPort = require('get-port');

// define args 
const optionDefinitions = [
    {name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.'},
    {name: 'verbose', alias: 'v', type: Boolean},
    {name: 'mcgroup', alias: 'm', type: String, defaultOption: true, description: 'The multicast address to produce to.'},
    {name: 'delay', alias: 'd', type: Number, description: `The delay in ms - if left out will be ${common.DEFAULT_DELAY}`},
    {name: 'interface', alias: 'i', type: String, description: `Interface to produce messages on - default is ${DEFAULT_INTERFACE.name}`},
    {name: 'port', alias: 'p', type: Number, description: `Port to produce messages on - default is ${common.DEFAULT_PORT}`}
];
const sections = [
  {
    header: 'Node.js multicast producer',
    content: 'Produces multicast messages to the supplied multicast address at a specified delay.'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
];
const options = commandLineArgs(optionDefinitions);
if (options.help) {
    console.log(getUsage(sections));
    process.exit(0);
}

// get data based on command line input
const delay = !options.delay || options.delay < 100 ? common.DEFAULT_DELAY : options.delay;
const iface = options.interface ? common.getInterface(options.interface) : DEFAULT_INTERFACE;
const mcgroup = options.mcgroup ? options.mcgroup : common.DEFAULT_MCGROUP;
const port = options.port ? options.port : common.DEFAULT_PORT;

if (!iface) {
    console.log(`ERROR - unable to find requested interface '${options.interface}' - aborting...`);
    process.exit(-1);
} else if (options.interface) {
    console.log(`INFO - found requested interface '${options.interface}' (${iface.name} / ${iface.address}:${port})...`);
} else {
    console.log(`INFO - using default interface '${iface.name}' (${iface.name} / ${iface.address}:${port})...`);
}

// get port to send on
getPort().then(producePort => {
    console.log(`INFO - publishing on port ${producePort}...`);
    
    // listen for errors
    server.on('error', (err) => {
        console.log(`server error:\n${err.stack}`);
        server.close();
    });

    // start producing
    const socket = dgram.createSocket('udp4');

    // listen for shutdown
    process.on( 'SIGINT', function() {
        console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
        server.close();
        socket.close();
        process.exit( );
    })
    console.log(`Multicast producer sending message with delay of ${delay} ms on multicast group ${mcgroup}:${port}`);
    let counter = 0;
    socket.bind(producePort, () => {
        setInterval(() => {
            counter++;
            const msg = `Message no. ${counter}`;
            socket.send(msg, 0, msg.length, port, mcgroup, () => console.log(`Sent multicast message (${msg})...`));
        }, delay);
    });

});

