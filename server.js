/**
 * Created by dhwani on 2/26/17.
 */
// call the packages we need
var express = require('express');        // call express
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
Character = require('./app/models/characters');
request = require('request');
var app = express();                 // define our app using express
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
require('./app/controllers/charactersCtrl')(app);

app.set('port', process.env.PORT || 3000);       // set our port
var uristring =
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/character';

mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
    }
});

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var onlineUsers = 0;

io.sockets.on('connection', function(socket) {
    onlineUsers++;

    io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });

    socket.on('disconnect', function() {
        onlineUsers--;
        io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });
    });
});

server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});