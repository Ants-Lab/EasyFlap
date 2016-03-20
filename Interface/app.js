'use strict'

var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	fs = require('fs'),
	pub_ip = require('public-ip'),
	loc_ip = require('ip'),
	crypto = require('crypto'),
	chalk = require('chalk');

var cfg, users, tokens = {}, sessionDuration = 10800000, program_list;

var log = function(msg, socket) {
	var date = new Date(),
		m = date.getMinutes(),
		s = date.getSeconds();
	console.log(chalk.green(date.getHours() + ':' + (m < 10 ? ("0" + m) : m) + ':' + (s < 10 ? ("0" + s) : s)  + ':') + ' ' + chalk.blue(JSON.stringify(msg)));
};

//Get server's public and local ip
pub_ip.v4(function (err, pubIp) {

	var params = {};

	params.ip = {};

	if (err) throw err;

	params.ip.public = pubIp;

	params.ip.local = loc_ip.address();
	
	params.sessionTimeLimit = sessionDuration;

	init(params);

});

var checkAuth = function(socket, token) {
	
	var date = new Date();
	
	if(!tokens.hasOwnProperty(token)) {
		socket.emit("logout_req", "Invalid session token");
		return false;	
	}
						
	if(date.getTime() > tokens[token].time) {
		socket.emit("logout_req", "Session timeout");
		delete tokens[token];
		return false;
	}
	
	var d = (tokens[token].time - date.getTime()) / 1000;
	log('Remaining session time: ' + Math.floor(d / 60) + 'm' + Math.floor(d % 60) + 's');
	
	return true;
};


var init = function (params) {

	log(params);

	//Read config.json
	fs.readFile('./public/config.json', 'utf8', function (err, data) {
			if (err) throw err;
			cfg = JSON.parse(data);

			//Read access.json
			fs.readFile('./access.json', 'utf8', function (err, data) {
				if (err) throw err;
				users = JSON.parse(data);

				if (!("admin" in users)) {
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

				//Program nav tab
				app.get('/Program', function(req, res) {
					params.isLocalAccess = req.get('host') === params.ip.local + ':1621';
					res.render('pages/blockly', { config : cfg, params : params });
				});				

				var sendError = function (socket, errorMsg) {
					log('Error: ' + errorMsg);
					socket.emit('err', errorMsg);
				};

				io.sockets.on('connection', function (socket) {
					
					socket.session = {};
					socket.session.isLocalAccess = params.isLocalAccess;

					//Send config data

					socket.on('config_req', function(){
						socket.emit('config', cfg);
					});

					//Custom programs

					var getCustomProgram = function(prog_name) {

						var searchForProg = function(files, resolve, reject) {
							for (var i = 0; i < files.length; i++) {
								if (files[i] === prog_name + '.json') {
									return fs.readFile('./public/custom_programs/' + prog_name + '.json', 'utf-8', function(err, data) {
										if (err) {
											reject("Can't read file : " + prog_name + '.json');
										} else {
											resolve(data);
										}
									});
								}
							}
						};

						return new Promise(function(resolve, reject) {

							if (program_list === undefined) {
								fs.readdir('public/custom_programs', function(err, files) {
									program_list = files;
									searchForProg(program_list, resolve, reject);
								});	
							} else {
								searchForProg(program_list, resolve, reject);
							}
						});					
					};

					var changeCustomProgram = function(prog_name, change) { //Returns a promise which tells wether the change has been successful

						return new Promise(function(resolve, reject)  {
							getCustomProgram(prog_name).then(function(prog) {
								prog = JSON.parse(prog);
								Object.keys(change).forEach(function(prop) {
									prog[prop] = change[prop];
								});

								fs.writeFile('./public/custom_programs/' + prog_name + '.json', JSON.stringify(prog), function(err) {
									if (err) { reject(false); }
									else { resolve(true); }
								});
							}, function(err) {
								reject(false);
							});
						});										
						
					};					

					socket.on('custom_progs_req', function() {

						var progs = [];				

						program_list =	fs.readdirSync('public/custom_programs');

						program_list.forEach(function(file, idx) {
							if (file.indexOf('.json') !== -1) {
								try {
									var parsedFile = JSON.parse(fs.readFileSync('./public/custom_programs/' + file, 'utf-8'));
									progs.push({name: parsedFile.name, description: parsedFile.description});
								} catch (e) {
									console.log('Caugth an expception while parsing ' + file + ' : ' + e);
								}
							} 
						});

						socket.emit('custom_progs', progs);						
					});

					socket.on('custom_prog_req', function(prog_name) {
						
						getCustomProgram(prog_name).then(function(prog) {
							socket.emit('custom_prog', prog);
						}, function(err) {
							socket.emit('custom_prog', new Error(err));
						});
					});

					socket.on('prog_change_req', function(data) {

						changeCustomProgram(data.prog_name, data.change).then(function() {
							socket.emit('prog_changed', {
								prog_name: data.prog_name,
								success: true
							});

							socket.broadcast.emit('prog_update', data);							
						}, function() {
							socket.emit('prog_changed', {
								prog_name: data.prog_name,
								success: false
							});
						});

					});

					socket.on('workspace_change', function(data) {
						if (!checkAuth(socket, data.token)) return;
						socket.broadcast.emit('workspace_changed', { prog_name: data.prog_name, xml: data.xml });
					});			

					socket.on('prog_save', function(data) {

						if (!checkAuth(socket, data.token)) return;

						var parsedJson = JSON.parse(data.json);

						fs.writeFile('./public/custom_programs/' + parsedJson.name + '.json', data.json, function(err) {
							if (err) {
								socket.emit('prog_save_status', {program: parsedJson.name, success: false});
								throw err;
							}

							console.log('Saved ' + parsedJson.name);

							if(!(function(arr, key) { //(parsedJson.name + '.json') in program_list doesn't seem to work
								for (var i = 0; i < arr.length; i++) {
									if (arr[i] === key) return true;
								}
								return false;
							})(program_list, parsedJson.name + '.json'))  {
								program_list.push(parsedJson.name + '.json');
							}						

							socket.emit('prog_save_status', {program: parsedJson.name, success: true});
						});
						
					});

					socket.on('delete_prog_req', function(prog_name) {

						var file = './public/custom_programs/' + prog_name + '.json';
						
						fs.exists(file, function(exists) {
							if (program_list.indexOf(prog_name + '.json') !== -1 &&  exists) {
								fs.unlink(file);
								socket.emit('prog_deleted', prog_name);
								program_list.splice(program_list.indexOf(prog_name + '.json'), 1);
								log('Deleted ' + file);
							}					
						});
					});	

					socket.on('config_update', function (data) {
						
						if(!checkAuth(socket, data.token))
							return;

						log({
							path: data.path,
							value: data.newVal
						});

						(function (obj, value, path) {
							path = path.split('.');
							for (var i = 0; i < path.length - 1; i++)
								obj = obj[path[i]];

							obj[path[i]] = value;
						})(cfg, data.newVal, data.path);


						fs.writeFile('./public/config.json', JSON.stringify(cfg), function (err) {
							if (err) log(err);
						});

						socket.broadcast.emit('config_update', { path: data.path, newVal: data.newVal });
					});

					socket.on('prog_update', function(prog) {
						console.log(prog);
					});				

					socket.on('login_attempt', function (loginData) {
						
						log(loginData);
						
						var err = null,
							token = null,
							success = false;
						
						if (loginData === null) {
							if(socket.session.isLocalAccess) {
								success = true;
							}
						} else if(loginData.hasOwnProperty('token') && checkAuth(socket, loginData.token)) {
							success = true;
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
							if(loginData === null || !tokens.hasOwnProperty(loginData.token)) {
								token = crypto.randomBytes(64).toString('hex');
							}else{
								token = loginData.token;
							}
							
							tokens[token] = {
								time: new Date().getTime() + sessionDuration
							};
							
							socket.session.timeout = tokens[token].time;
						}

						socket.emit('login_response', { err: err, token: token });
					});
					
					socket.on('end', function(){
						log('Client disconnected', true);
					});

				});

				server.listen(1621);

			});

		}

	)
};
