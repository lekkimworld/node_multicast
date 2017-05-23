#!/usr/bin/env node
var os = require('os');
var dgram = require('dgram');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
var client = dgram.createSocket('udp4');
var ifaces = os.networkInterfaces();
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
    {name: 'interface', alias: 'i', type: String, description: `Interface to produce messages on - default is ${DEFAULT_INTERFACE.name}`},
    {name: 'port', alias: 'p', type: Number, description: `Port to produce messages on - default is ${DEFAULT_PORT}`}
];
const sections = [
  {
    header: 'Node.js multicast consumer',
    content: 'Consumes multicast messages to the supplied multicast address.'
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

client.on('listening', function () {
    var address = client.address();
    console.log(`UDP Client listening on ${address.address}:${address.port} (local IP: ${DEFAULT_INTERFACE.address})`);
    client.setBroadcast(true)
    client.setMulticastTTL(128); 
    client.addMembership(mcgroup, DEFAULT_INTERFACE.address);
});

client.on('error', function onSocketError(err) {
    console.log(`Socket error: ${err.message}`);
});

client.on('message', function (message, remote) {   
    console.log(`MCast Msg: From: ${remote.address}:${remote.port} - ${message}`);
});

client.bind(port, "0.0.0.0");
