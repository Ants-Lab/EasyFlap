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
var sp = new SerialPort('/dev/ttyACM0', { parser: serialport.parsers.byteLength(payload) });
var netClient;

sp.on('data', function (data) {
    var buffer = new Buffer(data);
    var shutterName = buffer.toString('ascii', 0, 5);
    var shutterID;
    if(shutterName[0] == 's' || shutterName[1] == 'h'){
        shutterID = parseInt(shutterName[2] + shutterName[3] + shutterName[4]);
    }
    
    if(buffer[5] == 1){
        var temp = buffer[6];
        var hum = buffer[7];
        var lum = buffer[8];
        
        // Put values in config file
        
        //Send a message to Nathan
        netClient.write();
        
    }    
});

var server = net.createServer(function(socket) {
    
    //When new client connect
    console.log('New client connected : ' + socket.remoteAddress);
    
    netClient = socket;
    
    //When receive data from client
    socket.on('data', function(data) {
        if(typeof data === 'string'){
            //Parsing data
            var result = JSON.parse(data);
            var id = result.path.split('.')[1],
                setting = result.path.split('.')[2],
                value = result.newVal;

            //Send target angle to shutter to the arduino
            if(setting == 'targetAngle'){
                var shAddress = idToAddress(id);
                var bytes = [];
                bytes.push(1);
                for (var i = 0; i < shAddress.length; ++i) {
                    bytes.push(shAddress.charCodeAt(i));
                }
                bytes.push(value);
                sp.write(bytes);
            }
        }
    });
    
    //When client disconnect
	socket.on('end', function() {
        netClient = null;
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
