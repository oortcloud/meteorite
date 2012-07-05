var Fiber = require('fibers');

function sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
    }, ms);
    Fiber.yield();
}

Fiber(function() {
    console.log('wait... ' + new Date);
    sleep(1000);
    console.log('ok... ' + new Date);
}).run();
console.log('back in main');
