let axios = require('axios');
let e =  require('express');

let configs = {
    port: 4007,
};

/// start up
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

    qlock--;

    if (qe.length == 0) {
        console.log('empty beat');
        return;
    }

    for (var i = qe.shift(); i != undefined; i = qe.shift()) {
        axios.post(i.to, { letter: i.letter });
    }

}, 1000);


let app = e();

// uses
app.use(e.json());

app.get('/ping', (req, res) => {
    console.log('ping received');
    res.json('pong');
});

app.get('/status/q', (req, res) => {
    res.json({q:q.length});
});

// posts
app.post('/ping', (req, res) => {
    let { letter } = req.body;
    if (!letter) {
        res.send('missing ping object');
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
    
    console.log(`ping recieved [${letter.correlationId}]`);
});

app.listen(configs.port, () => console.log(`listening on port ${configs.port}`));
