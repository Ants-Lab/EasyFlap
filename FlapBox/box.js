var net = require('net');
var port = 1627;

var server = net.createServer(function(socket) {
	console.log('New client connected : ' + socket.remoteAddress);

	socket.on('data', function(data) {
    if(typeof data === 'string')){
      var result = JSON.parse(data);
      console.log('Shutter ID : ' + result.path.split('.')[1]);
      console.log('Setting : ' + result.path.split('.')[2]);
      console.log('Value : ' + result.newVal);
    }
	});

	socket.on('end', function() {
    //TODO
	});

	socket.on('error', function(error) {
		console.log('Client got problems : ', error.message);
	});
});

server.on('error', function(error) {
	console.log('Server got problems : ', error.message);
});

server.listen(port, function() {
	console.log('Server listening at localhost:' + port);
});
