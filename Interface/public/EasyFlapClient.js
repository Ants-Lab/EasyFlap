var cfg, copyCfg, updates = -1, lastWidth = window.innerWidth,
	colors = ['#27ae60', '#2980b9', '#c0392b', '#8e44ad'],
	socket;

var checkPublicAccess = function (callback) {

	if (params.isLocalAccess) {
		callback(true);
		return;
	}

	var sock = io.connect(params.ip.public + ':1621');
	sock.on('connect', function () {
		sock.disconnect();
		sock.close();
		callback(true);
		return;
	});

	sock.on('connect_error', function () {
		sock.disconnect();
		sock.close();
		callback(false);
		return;
	});
};

var init = function () {

	//Request config.json
	socket.emit('config_req', null);
	
	socket.on('connect_error', function (message) {
		console.log('Failed to connect to ' + params.ip.public + ':1621' + ' trying to contact ' + params.ip.local + ':1621' + '.');
		socket.io.uri = params.ip.local + ':1621';
	});

	socket.on('config', function (config) {

		updates++;

		cfg = config;
		copyCfg = (JSON.parse(JSON.stringify(cfg)));

		$(window).bind('hashchange', navbarHandler);

		$(window).trigger('hashchange');

	});

	socket.on('configUpdate', function (data) {

		console.log(data);

		copyCfg = (JSON.parse(JSON.stringify(cfg)));

		updates++;

		(function (obj, value, path) {
			path = path.split('.');
			for (i = 0; i < path.length - 1; i++)
				obj = obj[path[i]];

			obj[path[i]] = value;
		})(cfg, data.newVal, data.path);


		navbarHandler();

	});

	var emitConfigChange = function () {

		var diffs = DeepDiff(copyCfg, cfg);

		if (diffs) {

			diffs.forEach(function (diff) {
				if (diff.kind === 'E') { //Property edited
					socket.emit('configUpdate', {
						path: diff.path.join('.'),
						newVal: diff.rhs ,
						token: localStorage.getItem('token')
					});
				}
			});

		}

		copyCfg = (JSON.parse(JSON.stringify(cfg)));

	};

	var editShutterSettings = function (id) {

		//Update the form
		$('#shutterName').val(cfg.shutters[id - 1].loc);

		var applyChangesHandler = function () {
			var loc = $('#shutterName').val();
			$('#configBoxTitle').text('Configure ' + loc.toLowerCase() + ' shutters');
			cfg.shutters[id - 1].loc = loc;
			$('#table-loc-' + id).text(loc);
			emitConfigChange();
		};

		$('#configBoxTitle').text('Configure ' + cfg.shutters[id - 1].loc.toLowerCase() + ' shutters');

		$('#applyChanges').bind('click', applyChangesHandler);

		$('#configBox').modal();

		$('#configBox').on('hide.bs.modal', function () {
			$('#applyChanges').unbind('click', applyChangesHandler);
		});
	};

	var navbarHandler = function () {
		
		$('#container').empty();

		var page = location.hash.substr(1);
		page = page !== '' ? page : 'Control-Panel';

		switch (page) {

			case "Control-Panel":

				$('#container').html("<table class='table table-bordered table-hover' id='table'></table>");

				$('#table').html(
					'<tr><th>id</th><th>Location</th><th>Opening angle</th><th>Configure</th></tr>'
				);

				cfg.shutters.forEach(function (shutter) {
					
					var isSlider = window.innerWidth > 600;
					var sliderOrSwitch = 
						isSlider ? '<div id="slider-' + shutter.id + '" class="slider"></div>' :
						'<input type="checkbox" id="switch-' + shutter.id + '" ' + (copyCfg.shutters[shutter.id - 1].targetAngle > 90 ? "checked" : "") + ' data-toggle="toggle" data-onstyle="success" data-offstyle="primary">';

					$('#table').append('<tr id="tr-' + shutter.id + '">' + '<td>' + shutter.id + '</td>' + '<td id="table-loc-' + shutter.id + '">' + shutter.loc + '</td>' + '<td>' + sliderOrSwitch + '</td>' + '<td><button id="openConfig-' + shutter.id + '" type="button" class="btn btn-default" aria-label="Configure">' + '<span class="glyphicon glyphicon-wrench" aria-hidden="true"></span></button>' + '</td></tr>');

					$('#openConfig-' + shutter.id).on('click', function(){
						editShutterSettings(shutter.id);
					});
					
					if(isSlider){
						$('#slider-' + shutter.id).roundSlider({
							radius: 60,
							width: 14,
							circleShape: 'half-top',
							handleSize: "24,12",
							handleShape: "square",
							sliderType: "min-range",
							showTooltip: 'true',
							min: 0,
							max: 180,

							change: function (e) {
								shutter.targetAngle = e.value;
								emitConfigChange();
							}
						});
					}else{
						
						$('#switch-' + shutter.id).bootstrapToggle({
							on: 'Opened',
							off: 'Closed'
						});
						
						if(updates === 0 || ((copyCfg.shutters[shutter.id - 1].targetAngle > 90) !== (shutter.targetAngle > 90))){
							$('#switch-' + shutter.id).bootstrapToggle(shutter.targetAngle > 90 ? 'on' : 'off');	
						}
						
						$('#switch-' + shutter.id).change(function(){
							shutter.targetAngle = $(this).prop('checked') ? 180: 0;
							emitConfigChange();
						});
					}

					$('#slider-' + shutter.id + ' .rs-range-color').css('background-color', colors[(shutter.id - 1) % colors.length]);

					$('#slider-' + shutter.id).roundSlider('option', 'animation', false);
					$('#slider-' + shutter.id).roundSlider('option', 'value', updates > 0 ? copyCfg.shutters[shutter.id - 1].targetAngle : 0);
					$('#slider-' + shutter.id).roundSlider('option', 'animation', true);
					$('#slider-' + shutter.id).roundSlider('option', 'value', shutter.targetAngle);

					$('#tr-' + shutter.id).hover(

						function () { //in
							$('#slider-' + shutter.id + ' .rs-inner').css('background-color', 'whitesmoke');
						},

						function () { //out
							$('#slider-' + shutter.id + ' .rs-inner').css('background-color', 'white');
						}

					);

				});

				break;

			case "Captors":

				cfg.shutters.forEach(function (shutter) {

					var attributes = [];

					$('#container').append('<h3>' + shutter.loc + '</h3>');
					$('#container').append(
						"<table class='table table-bordered table-hover' id='table-shutter-" + shutter.id + "'></table>"
					);

					shutter.captors.forEach(function (captor) {
						Object.keys(captor).forEach(function (attrib) {
							if (attributes.indexOf(attrib) === -1) {
								attributes.push(attrib);
							}
						});
					});

					attributes.forEach(function (attrib) {

						var vals = '';

						shutter.captors.forEach(function (cpt) {

							var format;

							if (attrib === 'value' && cpt.type === 'position') {
								format = '<div id="slider-' + shutter.id + '" class="slider"></div>';
							} else {
								format = cpt[attrib].length > 1 ? cpt[attrib][0].toUpperCase() + cpt[attrib].substr(1) : cpt[attrib];
							}

							vals += '<td>' + format + '</td>';

						});

						$('#table-shutter-' + shutter.id).append(
							'<tr ' + (attrib === 'value' ? 'id="tr-' + shutter.id + '"' : '') + '><th>' + attrib[0].toUpperCase() + attrib.substr(1) + '</th>' + vals + '</tr>'
						);

						var value;

						for (var i = 0; i < shutter.captors.length; i++) {
							if (shutter.captors[i].type === 'position') {
								value = Number.parseInt(shutter.captors[i].value);
								break;
							}
						}

						$('#slider-' + shutter.id).roundSlider({
							radius: 60,
							width: 14,
							circleShape: 'half-top',
							handleSize: "24,12",
							handleShape: "square",
							sliderType: "min-range",
							showTooltip: 'false',
							min: 0,
							max: 180,
							animation: false,
							value: value,
							disabled: true
						});

						$('#slider-' + shutter.id + ' .rs-range-color').css('background-color', colors[(shutter.id - 1) % colors.length]);

						$('#tr-' + shutter.id).hover(

							function () { //in
								$('#slider-' + shutter.id + ' .rs-inner').css('background-color', 'whitesmoke');
							},

							function () { //out
								$('#slider-' + shutter.id + ' .rs-inner').css('background-color', 'white');
							}

						);

					});

				});

				break;

			case "Program":

				break;
		}

	};
	
	$(window).resize(function(){
		if((lastWidth <= 600 && window.innerWidth > 600) || (lastWidth > 600 && window.innerWidth <= 600)){
			navbarHandler();
			lastWidth = window.innerWidth;
		}
	});
};

(function () {
	
	if(localStorage.getItem('timeout') !== null){
		if(new Date().getTime() > localStorage.getItem('timeout')){
			localStorage.removeItem('timeout');
			localStorage.removeItem('token');
		}
	}
	
	if (params.isLocalAccess) {
		socket = io.connect(params.ip.local + ':1621');
	} else { //Whatever the host is, try to connect to the public ip of the server
		socket = io.connect(params.ip.public + ':1621');
	}

	socket.on('connect', function () {
		console.log("Connected to : " + socket.io.uri);

		if (params.isLocalAccess) {
			socket.emit('login_attempt', null);
		} else{
			if(localStorage.getItem('token') !== null){
				socket.emit('login_attempt', { "token": localStorage.getItem('token') });
			}else{
				$('#loginBox').show();
				$('#particles').show();
			}
			
			$('#loginButton').on('click', function () {
				socket.emit('login_attempt', { "user": $('#user').val(), "pass": $('#pass').val() });
			});
			
			$(window).on('keypress', function(e){
				if(e.keyCode === 13){
					$('#loginButton').trigger('click');
				}
			});
		}
	});
	
	socket.on('login_response', function(res){
		
		if(res.err === null && res.token !== null){
            $('body').css('background-color', 'white');
			token = res.token;
			$('#loginBox').empty();
			$('#navbar').show();
			localStorage.setItem('token', res.token);
			localStorage.setItem('timeout', new Date().getTime() + params.sessionTimeLimit);
			init();
		}else{
			alertify.error(res.err);
		}
	});
	
	socket.on('logout_req', function(err){
		localStorage.removeItem('token');
		localStorage.removeItem('timeout');
		
		if(err !== null){
			alertify.error(err);
			setTimeout(2000, location.reload());
		}
	});

})();
