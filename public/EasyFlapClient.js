var cfg, copyCfg, updates = -1,
	colors = ['#27ae60', '#2980b9', '#c0392b', '#8e44ad'];

var socket = io.connect('http://88.177.41.248:1621');

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
					newVal: diff.rhs 
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
		cfg.shutters[id - 1].loc = loc;
		$('#table-loc-' + id).text(loc);
		emitConfigChange();
	};

	$('#configBoxTitle').text('Configure shutter #' + id);

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

				$('#table').append('<tr id="tr-' + shutter.id + '">' + '<td>' + shutter.id + '</td>' + '<td id="table-loc-' + shutter.id + '">' + shutter.loc + '</td>' + '<td><div id="slider-' + shutter.id + '" class="slider"></div></td>' + '<td><button type="button" onclick="editShutterSettings(' + shutter.id + ');"' + 'class="btn btn-default" aria-label="Configure">' + '<span class="glyphicon glyphicon-wrench" aria-hidden="true"></span></button>' + '</td></tr>');

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

					change: function (e) {
						shutter.targetAngle = e.value;
						emitConfigChange();
					}
				});

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
