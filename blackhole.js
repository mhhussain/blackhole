
function blackhole(h, app) {

    this.ptin = 0;

    app.get('/status/ptin', (req, res) => {
        res.json(this.ptin);
    });
    
    app.post('/ping', (req, res) => {
        if (h.status() != 'listening') {
            res.status(400).send(new Error('bad health status'));
            return;
        }
    
        let { data } = req.body;
        if (!data) {
            res.status(400).send(new Error('missing particle object'));
            return;
        }
    
        this.ptin++;
    
        res.json(data);
    });
};

module.exports = blackhole;
