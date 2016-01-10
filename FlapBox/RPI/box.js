/*
 * Author : Valentin FRITZ
 * Project : EasyFlap
 * File : box.js
 * Description : Management box
 * Date : January 4, 2016
 */

//Import modules
var net = require('net');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

//Global variable
var port = 1627;
var payload = 32;
var sp = new SerialPort("/dev/ttyACM0", { parser: serialport.parsers.byteLength(payload) });

sp.on("data", function (data) {
  //receive from arduino nano (wireless interface)
});

var server = net.createServer(function(socket) {

  //When new client connect
  console.log('New client connected : ' + socket.remoteAddress);

  //When receive data from client
  socket.on('data', function(data) {
    if(typeof data === 'string'){
      //Parsing data
      var result = JSON.parse(data);
      var id = result.path.split('.')[1],
        setting = result.path.split('.')[2],
        value = result.newVal;

      //Log information on console
      console.log('Shutter ID : ' + id);
      console.log('Setting : ' + setting);
      console.log('Value : ' + value);

      //Send target angle to shutter to the arduino
      if(setting == 'targetAngle'){
        //var message = toBS(3) + toBS(id) + toBS(1) + toBS(value);
        var shutterAddress = idToAddress(id);
        
      }

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

function idToAddress(id){
  var idNumber = parseInt(id);
  if (idNumber >= 0 && idNumber <= 9)
    return "sh00" + id;
  else if (idNumber >= 10 && idNumber <= 99)
    return "sh0" + id;
  else if (idNumber >= 100 && idNumber <= 999)
    return "sh" + id;
  return null;
}

/*
  Data sample : {path: "shutters.2.targetAngle", newVal: 159}
*/
