let axios = require('axios');
let e =  require('express');
let moment = require('moment');

let configs = require('./config');

/// start up
// health object
let health = {
    status: 'startup',
    msg: ''
};

// q setup
var qlock = 0;
var qc = 0;
let q = [];

// particlein
let ptin = 0;

// interval tracker
let intervals = [];

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
    qc += qe.length;
    q = [];
    // release lock
    qlock--;

    // process q items
    if (qe.length > 0) {
        for (var i = qe.shift(); i != undefined; i = qe.shift()) {
            axios.post(i.to, { particle: i.particle })
                .catch((err) => {
                    // need to log this
                    console.log(err);
                });
        }
    }

    intervals.push({ time: moment.now(), qc });
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

app.get('/status/ptin', (req, res) => {
    res.json(ptin);
});

app.get('/status/latency', (req, res) => {
    let int = intervals.splice(intervals.length-2);
    res.json( `${(int[1].qc-int[0].qc) / ((int[1].time - int[0].time) / 1000.0)} particles per second` );
});

// posts
app.post('/ping', (req, res) => {
    if (health.status != 'listening') {
        res.status(400).send(new Error('bad health status'));
        return;
    }

    let { particle } = req.body;
    if (!particle) {
        res.status(400).send(new Error('missing particle object'));
        return;
    }

    ptin++;

    // retrieve lock
    while (true) {
        if (qlock == 0) {
            qlock++;
            break;
        }
    }
    q.push({
        to: particle.back,
        "particle": particle
    });
    // release lock
    qlock--;

    res.send(`particle recieved [${particle.correlationId}]`);
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
