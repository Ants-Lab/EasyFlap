var express = require('express'),
	app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs'),
	pub_ip = require('public-ip'),
	loc_ip = require('ip');
  
var cfg;

//Get server's public and local ip
pub_ip.v4(function(err, pubIp){
	
	var params = {};
	
	if (err) throw err;
	
	params.public = pubIp;
	
	params.local = loc_ip.address();
	
	init(params);
	
});


var init = function(params){
	
	console.log(params);
	
	//Read config.json
	fs.readFile('./public/config.json', 'utf8', function (err, data) {
		  if (err) throw err;
		  cfg = JSON.parse(data);

		//Use ejs
		app.set('view engine', 'ejs');

		app.use(express.static(__dirname + '/public'));

		app.get('/', function (req, res) {
			res.render('pages/index', { params : params });
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
	
}
