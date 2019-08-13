let axios = require('axios');
let e =  require('express');
let moment = require('moment');

let configs = require('./config');
let health = require('./health');
let blackhole = require('./blackhole');

/// start up
let app = e();

// uses
app.use(e.json());

// instantiate health
let h = new health(app);

// create blackhole
new blackhole(h, app);

app.listen(configs.port, () => { 
    h.updateStatus({
        status: 'listening',
        msg: `listening on port [${configs.port}]`
    });
});
