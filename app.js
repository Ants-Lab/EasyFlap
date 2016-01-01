var express = require('express'),
	app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), //like htmlentities in PHP
    fs = require('fs');
  
var cfg;

//Read config.json

fs.readFile('./public/config.json', 'utf8', function (err, data) {
	  if (err) throw err;
	  cfg = JSON.parse(data);
  
	app.use(express.static(__dirname + '/public'));

	app.get('/', function (req, res) {
		res.sendfile(__dirname + '/index.html');
	});

	var sendError = function(socket, errorMsg){
		console.log('Error: ' + errorMsg);
		socket.emit('err', errorMsg);
	};

  io.sockets.on('connection', function (socket) {

	//Send config data
	
	socket.emit('config', cfg);
	
	socket.on('configUpdate', function(data){
		var date = new Date();
		console.log('Config file got updated: ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
		
		console.log({ path: data.path, value: data.newVal });
		
		(function(obj, value, path) {
			path = path.split('.');
			for (i = 0; i < path.length - 1; i++)
				obj = obj[path[i]];

			obj[path[i]] = value;
		})(cfg, data.newVal, data.path);
	
		
		fs.writeFile('./public/config.json', JSON.stringify(cfg), function(err){
			if(err) console.log(err);
		});
		
		socket.broadcast.emit('configUpdate', data);
	});
	
  });

  server.listen(1621);
  
});
