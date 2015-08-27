var Army = require('child_process');
var Q = require('q');
var armyPath = __dirname + '/army.js';
var firstArmy = Army.fork(armyPath);
var secondArmy = Army.fork(armyPath);
var battle = [];

var Commands = {
    READY: 'ready',
    CHOOSE_WEAPON: 'choose_weapon',
    ATTACK: 'attack'
}

initArmies()
    .then(prepareTheBattle)
    .then(setHealth)
    .then(firstArmyPickWeapon)
    .then(secondArmyPickWeapon)
    .then(startBattle)
    .catch(function(err) {
        console.error(err);
        endBattle();
    });


function initArmies() {
    firstArmy.send({command: Commands.READY});
    secondArmy.send({command: Commands.READY});

    firstArmy.on('message', function (msg) {
        if(msg.command === Commands.READY) {
            firstArmy.pid = msg.data;
        }
    });

    secondArmy.on('message', function (msg) {
        if(msg.command === Commands.READY) {
            secondArmy.pid = msg.data;
        }
    });

    return Q();
}

function prepareTheBattle() {
    console.log('- Armies enter to battlefield');
    battle.push(firstArmy);
    battle.push(secondArmy);
    //here we can put some awesome code with terrain and use battle instance forEach;
}

function setHealth() {
    console.log('- Set 100 health for each army');
    firstArmy.health = 100;
    secondArmy.health = 100;
}

function firstArmyPickWeapon() {
    console.log('- Now first army picking weapons');
    var dfd = Q.defer();
    firstArmy.send({command: Commands.CHOOSE_WEAPON});

    firstArmy.on('message', function (msg) {
        if(msg.command === Commands.CHOOSE_WEAPON) {
            firstArmy.weapon = msg.data;
            dfd.resolve();
            console.log('- First army picked: ', firstArmy.weapon.item)
        }
    });
    return dfd.promise;
}

function secondArmyPickWeapon() {
    console.log('- Now second army picking weapons');
    var dfd = Q.defer();
    secondArmy.send({command: Commands.CHOOSE_WEAPON});

    secondArmy.on('message', function (msg) {
        if(msg.command === Commands.CHOOSE_WEAPON) {
            secondArmy.weapon = msg.data;
            dfd.resolve();
            console.log('- Second army picked: ', secondArmy.weapon.item)
        }
    });
    return dfd.promise;
}

var i = 1;
function startBattle() {
    return round(i)
        .then(function(stillFight) {
            if(stillFight) {
                i++;
                return startBattle();
            }
        });
}

function endBattle() {
    process.kill(firstArmy.pid, 'SIGHUP');
    process.kill(secondArmy.pid, 'SIGHUP');
    process.exit(0);
}

function round(i) {
    console.log(' === ROUND ' + i + ' === ');

    return Q.all([firstArmyAttack(), secondArmyAttack()])
        .spread(function() {
            return Q(true);
        });

    function secondArmyAttack() {
        var dfd = Q.defer();
        secondArmy.send({command: Commands.ATTACK});
        secondArmy.on('message', onAttack);
        return dfd.promise;

        function onAttack(msg) {
            if(msg.command === Commands.ATTACK) {
                firstArmy.health -= msg.data;
                if(firstArmy.health <= 0) {
                    console.log('- Second army hit the first for ' + msg.data + ' damage, first ' + firstArmy.health + 'HP left');
                    dfd.reject('Second army WIN');
                } else {
                    console.log('- Second army hit the first for ' + msg.data + ' damage, first ' + firstArmy.health + 'HP left');
                    dfd.resolve();
                }
                secondArmy.removeListener('message', onAttack);
            }
        }
    }

    function firstArmyAttack() {
        var dfd = Q.defer();
        firstArmy.send({command: Commands.ATTACK});
        firstArmy.on('message', onAttack);
        return dfd.promise;

        function onAttack(msg) {
            if(msg.command === Commands.ATTACK) {
                secondArmy.health -= msg.data;
                if(secondArmy.health <= 0) {
                    console.log('- First army hit the second for ' + msg.data + ' damage, second ' + secondArmy.health + 'HP left');
                    dfd.reject('First army WIN');
                } else {
                    console.log('- First army hit the second for ' + msg.data + ' damage, second ' + secondArmy.health + 'HP left');
                    dfd.resolve();
                }
                firstArmy.removeListener('message', onAttack);
            }
        }
    }
}