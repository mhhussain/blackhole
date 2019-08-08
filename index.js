let axios = require('axios');
let e =  require('express');

let configs = require('./config');

/// start up
// health object
let health = {
    status: 'startup',
    msg: ''
};

// q setup
var qlock = 0;
let q = [];

// pingin
let pingin = 0;

// create consumer
setInterval(() => {
    // retrieve lock
    while (true) {
        if (qlock == 0) {
            qlock++;
            break;
        } else if (qlock == 1) {
            continue;
        } else {
            throw 'deadlock';
        }
    }

    let qe = Array.from(q);
    q = [];
    // release lock
    qlock--;

    // process q items
    if (qe.length > 0) {
        for (var i = qe.shift(); i != undefined; i = qe.shift()) {
            axios.post(i.to, { letter: i.letter })
                .catch((err) => {
                    // need to log this
                    console.log(err);
                });
        }
    }

}, 1000);


let app = e();

// uses
app.use(e.json());

// gets
app.get('/health', (req, res) => {
    res.json(health);
});

app.get('/status/q', (req, res) => {
    res.json(q.length);
});

app.get('/status/pingin', (req, res) => {
    res.json(pingin);
});

// posts
app.post('/ping', (req, res) => {
    if (health.status != 'listening') {
        res.error('bad health status');
        return;
    }

    let { letter } = req.body;
    if (!letter) {
        res.error('missing particle object');
        return;
    }

    pingin++;

    // retrieve lock
    while (true) {
        if (qlock == 0) {
            qlock++;
            break;
        }
    }
    q.push({
        to: letter.back,
        "letter": letter
    });
    // release lock
    qlock--;

    res.send(`ping recieved [${letter.correlationId}]`);
});

// kill and rez
app.post('/poison', (req, res) => {
    health.status = 'poisoned';
    health.msg = 'app poisoned';
    
    res.send('app poisoned');
});

app.post('/replenish', (req, res) => {
    health.status = 'listening';
    health.msg = `listening on port [${configs.port}]`;
    
    res.send('app replenished');
})

app.listen(configs.port, () => { 
    health.status = 'listening';
    health.msg = `listening on port [${configs.port}]`;
});
