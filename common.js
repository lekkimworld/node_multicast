var os = require('os');
const ifaces = os.networkInterfaces();

module.exports = {
    DEFAULT_DELAY: 2000,
    DEFAULT_MCGROUP: '239.9.11.212',
    DEFAULT_PORT: 2311,

    getDefaultInterface: function() {
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
    },
    getInterface: function(wanted_iname) {
        for (let i=0, count=Object.keys(ifaces).length; i<count; i++) {
            const iname = Object.keys(ifaces)[i];
            if (iname !== wanted_iname) continue;

            // loop addresses
            for (let j=0; j<ifaces[iname].length; j++) {
                const elem = ifaces[iname][j];
                if (elem.family === 'IPv4') {
                    // found first non-loopback ipv4 interface
                    return {'name': iname, 'address': elem.address};
                }
            }
        }
    }
}
