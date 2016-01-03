var net = require('net');
var rc = require('piswitch');

var port = 1627;

rc.setup({
  mode: 'gpio',
  pulseLength: 330,
  protocol: 1,
  pin: 17
});

var server = net.createServer(function(socket) {

  //When new client connect
  console.log('New client connected : ' + socket.remoteAddress);

  //When receive data from client
  socket.on('data', function(data) {
    if(typeof data === 'string'){
      var result = JSON.parse(data);
      console.log('Shutter ID : ' + result.path.split('.')[1]);
      console.log('Setting : ' + result.path.split('.')[2]);
      console.log('Value : ' + result.newVal);
    }
  });

  //When client disconnect
	socket.on('end', function() {
    //TODO
	});

  //When client got an error
	socket.on('error', function(error) {
		console.log('Client got problems : ', error.message);
	});

});

//When server got an error
server.on('error', function(error) {
	console.log('Server got problems : ', error.message);
});

//Listen for new client
server.listen(port, function() {
	console.log('Server listening at localhost:' + port);
});
