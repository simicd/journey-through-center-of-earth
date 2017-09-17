var express = require('express');
var app = express();
var path = require('path');

app.use('/wwwroot', express.static('wwwroot'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/grid', function(req, res) {
    res.sendFile(path.join(__dirname + '/grid.html'));
});

app.listen(8080);


