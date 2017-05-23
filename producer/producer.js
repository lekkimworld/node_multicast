#!/usr/bin/env node
var os = require('os');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const ifaces = os.networkInterfaces();
const DEFAULT_DELAY = 2000;
const DEFAULT_MCGROUP = '239.9.11.212';
const DEFAULT_PORT = 2311;
const DEFAULT_INTERFACE = (function() {
    for (let i=0, count=Object.keys(ifaces).length; i<count; i++) {
        const iname = Object.keys(ifaces)[i];
        for (let j=0; j<ifaces[iname].length; j++) {
            const elem = ifaces[iname][j];
            if (elem.mac !== '00:00:00:00:00:00' && elem.family === 'IPv4') {
                // found first non-loopback ipv4 interface
                return {'name': iname, 'address': elem.address};
            }
        }
    }
})();

// define args 
const optionDefinitions = [
    {name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.'},
    {name: 'verbose', alias: 'v', type: Boolean},
    {name: 'mcgroup', alias: 'm', type: String, defaultOption: true, description: 'The multicast address to produce to.'},
    {name: 'delay', alias: 'd', type: Number, description: `The delay in ms - if left out will be ${DEFAULT_DELAY}`},
    {name: 'interface', alias: 'i', type: String, description: `Interface to produce messages on - default is ${DEFAULT_INTERFACE.name}`},
    {name: 'port', alias: 'p', type: Number, description: `Port to produce messages on - default is ${DEFAULT_PORT}`}
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

// get multicast address and port
const mcgroup = options.mcgroup ? options.mcgroup : DEFAULT_MCGROUP;
const port = options.port ? options.port : DEFAULT_PORT;

// get delay
const delay = !options.delay || options.delay < 100 ? DEFAULT_DELAY : options.delay;

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
global.setInterval(() => {
    counter++;
    const msg = `Message no. ${counter}`;
    socket.send(msg, port, mcgroup, () => console.log(`Sent multicast message (${msg})...`));
}, delay);

