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

// particlein
let ptin = 0;

let app = e();

// uses
app.use(e.json());

// gets
app.get('/health', (req, res) => {
    res.json(health);
});

app.get('/status/ptin', (req, res) => {
    res.json(ptin);
});

// posts
app.post('/ping', (req, res) => {
    if (health.status != 'listening') {
        res.status(400).send(new Error('bad health status'));
        return;
    }

    let { data } = req.body;
    if (!data) {
        res.status(400).send(new Error('missing particle object'));
        return;
    }

    ptin++;

    res.json(data);
});

// kill and rez
app.post('/poison', (req, res) => {
    health.status = 'poisoned';
    health.msg = 'app poisoned';
    
    res.send('app.poison');
});

app.post('/replenish', (req, res) => {
    health.status = 'listening';
    health.msg = `listening on port [${configs.port}]`;
    
    res.send('app.replenish');
})

app.listen(configs.port, () => { 
    health.status = 'listening';
    health.msg = `listening on port [${configs.port}]`;
});
