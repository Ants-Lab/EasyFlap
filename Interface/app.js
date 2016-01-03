var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	fs = require('fs'),
	pub_ip = require('public-ip'),
	loc_ip = require('ip'),
	crypto = require('crypto');

var cfg, users;

//Get server's public and local ip
pub_ip.v4(function (err, pubIp) {

	var params = {};

	params.ip = {};

	if (err) throw err;

	params.ip.public = pubIp;

	params.ip.local = loc_ip.address();

	init(params);

});


var init = function (params) {

	console.log(params);

	//Read config.json
	fs.readFile('./public/config.json', 'utf8', function (err, data) {
			if (err) throw err;
			cfg = JSON.parse(data);

			//Read access.json
			fs.readFile('./access.json', 'utf8', function (err, data) {
				if (err) throw err;
				users = JSON.parse(data);

				if (!("admin" in Object.keys(users))) {
					users.admin = "raspberry";
				}

				//Use ejs
				app.set('view engine', 'ejs');

				app.use(express.static(__dirname + '/public'));

				app.get('/', function (req, res) {
					params.isLocalAccess = req.get('host') === params.ip.local + ':1621';
					res.render('pages/index', {
						params: params
					});
				});

				var sendError = function (socket, errorMsg) {
					console.log('Error: ' + errorMsg);
					socket.emit('err', errorMsg);
				};

				io.sockets.on('connection', function (socket) {
					
					socket.session = {};
					socket.session.isLocalAccess = params.isLocalAccess;

					//Send config data

					socket.on('config_req', function(){
						socket.emit('config', cfg);
					});

					socket.on('configUpdate', function (data) {
						var date = new Date();
						console.log('Config file got updated: ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());

						console.log({
							path: data.path,
							value: data.newVal
						});

						(function (obj, value, path) {
							path = path.split('.');
							for (i = 0; i < path.length - 1; i++)
								obj = obj[path[i]];

							obj[path[i]] = value;
						})(cfg, data.newVal, data.path);


						fs.writeFile('./public/config.json', JSON.stringify(cfg), function (err) {
							if (err) console.log(err);
						});

						socket.broadcast.emit('configUpdate', data);
					});

					socket.on('login_attempt', function (loginData) {
						
						var err = null,
							token = null,
							success = false;
						
						if (loginData === null) {
							if(socket.session.isLocalAccess){
								success = true;
							}
						} else if (loginData.user in users) {
							if (users[loginData.user] === loginData.pass) {
								success = true;
							} else {
								err = "Wrong password"; //Wrong password
							}
						} else {
							err = "Wrong username"; //Wrong username
						}

						if (success) {
							token = crypto.randomBytes(64).toString('hex');
							socket.session.token = token;
						}

						socket.emit('login_response', { err: err, token: token });
					});

				});

				server.listen(1621);

			});

		}

	)
};
