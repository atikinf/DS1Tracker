const request = require('request');
const express = require('express');

const app = express();

const satID = 25544; // ISS
// Visit n2yo.com to get an apikey
const apiKey = '*****-******-******-****';


app.get('/api/tle', function (req, res) {
    // res.send('Hello World!');
    const url = `https://www.n2yo.com/rest/v1/satellite/tle/${satID}&apiKey=${apiKey}`;

    // Get TLE
    let tle = '';
    request(url, {json: true}, (err, response, body) => {
        if (err) { return console.log(err); }
        res.send(body);
    });
});

app.listen(3000, function () {
    console.log('tle API listening on port 3000');
});