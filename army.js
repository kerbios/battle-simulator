var _ = require('lodash');
var weapons = require('./weapons.json');
var weapon = {};


process.on('message', function(msg) {
    switch(msg.command) {
        case 'ready':
            process.send({
                command: 'ready',
                data: process.pid
            });
            break;
        case 'choose_weapon':
            var index = Math.round(Math.random()*(weapons.length-1));
            weapon = weapons[index];
            process.send({
                command: 'choose_weapon',
                data: weapon
            });
            break;
        case 'attack':
            process.send({
                command: 'attack',
                data: Math.round(Math.random()*weapon.damage)
            });
            break;
        default:
            process.stdout.write('Interuption to the battle');
            process.exit(0);
    }
});

process.on('close', function (code) {
    console.log('Our army defeated close' + code);
});

process.on('exit', function(code) {
    console.log('Our army defeated exit' + code);
});
