var config, copyconfig, updates = -1, lastWidth = window.innerWidth,
	colors = ['#27ae60', '#2980b9', '#c0392b', '#8e44ad'],
	socket, tabs = ['Control-Panel', 'Captors', 'Program', 'Log'], workspace, blockly_loaded = false;

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

//Hanlders

var configBox_applyChangesHandler;

var init = function () {

	//Request config.json
	socket.emit('config_req', null);
	
	socket.on('connect_error', function (message) {
		console.log('Failed to connect to ' + params.ip.public + ':1621' + ' trying to contact ' + params.ip.local + ':1621' + '.');
		socket.io.uri = params.ip.local + ':1621';
	});

	socket.on('config', function (cfg) {

		updates++;

		config = cfg;
		copyconfig = (JSON.parse(JSON.stringify(config)));

		$(window).bind('hashchange', navbarHandler);

		$(window).trigger('hashchange');

	});

	socket.on('config_update', function (data) {

		console.log(data);

		copyconfig = (JSON.parse(JSON.stringify(config)));

		updates++;

		(function (obj, value, path) {
			path = path.split('.');
			for (i = 0; i < path.length - 1; i++)
				obj = obj[path[i]];

			obj[path[i]] = value;
		})(config, data.newVal, data.path);


		navbarHandler();

	});

	socket.on('prog_update', function(data)  {
		console.log(data);
	});

	var emitConfigChange = function () {

		var diffs = DeepDiff(copyconfig, config);

		if (diffs) {

			diffs.forEach(function (diff) {
				if (diff.kind === 'E') { //Property edited
					socket.emit('config_update', {
						path: diff.path.join('.'),
						newVal: diff.rhs ,
						token: localStorage.getItem('token')
					});
				}
			});

		}

		copyconfig = (JSON.parse(JSON.stringify(config)));

	};

	var editShutterSettings = function (id) {

		//Update the form
		$('#configBox_input_1').val(config.shutters[id - 1].loc);

		configBox_applyChangesHandler = function () {
			var loc = $('#configBox_input_1').val();
			$('#configBox_title').text('Configure ' + loc.toLowerCase() + ' shutters');
			config.shutters[id - 1].loc = loc;
			$('#table-loc-' + id).text(loc);
			emitConfigChange();
			$('#configBox_applyChanges').unbind('click', configBox_applyChangesHandler);
		};

		$('#configBox_title').text('Configure ' + config.shutters[id - 1].loc.toLowerCase() + ' shutters');

		$('#configBox_applyChanges').bind('click', configBox_applyChangesHandler);

		$('#configBox').modal();

		$('#configBox').on('hide.bs.modal', function () {
			$('#configBox_applyChanges').unbind('click', configBox_applyChangesHandler);
		});
	};

	var navbarHandler = function () {

		if (workspace) workspace.dispose();

		$('#save_prog_btn').fadeOut(200);

		$('#ctnr').empty();		

		var page = location.hash.substr(1);
		page = page !== '' ? page : 'Control-Panel';
		
		$('.navbar-default li:nth-child(' + (tabs.indexOf(page) + 1) + ')').addClass('active');

		switch (page) {

			case "Control-Panel":

				$('#ctnr').html("<table class='ef-table' id='table'></table>");

				$('#table').html(
					'<tr><th>id</th><th>Location</th><th>Opening angle</th><th>Configure</th></tr>'
				);

				config.shutters.forEach(function (shutter) {
					
					var isSlider = window.innerWidth > 767;
					var sliderOrSwitch = 
						isSlider ? '<div id="slider-' + shutter.id + '" class="slider"></div>' :
						'<input type="checkbox" id="switch-' + shutter.id + '" ' + (copyconfig.shutters[shutter.id - 1].targetAngle > 90 ? "checked" : "") + ' data-toggle="toggle" data-onstyle="success" data-offstyle="primary">';

					$('#table').append('<tr>' + '<td>' + shutter.id + '</td>' + '<td id="table-loc-' + shutter.id + '">' + shutter.loc + '</td>' + '<td>' + sliderOrSwitch + '</td>' + '<td><button id="openConfig-' + shutter.id + '" type="button" class="btn btn-default" aria-label="Configure">' + '<span class="glyphicon glyphicon-wrench" aria-hidden="true"></span></button>' + '</td></tr>');

					$('#openConfig-' + shutter.id).on('click', function(){
						editShutterSettings(shutter.id);
					});
					
					if(isSlider) {
						$('#slider-' + shutter.id).roundSlider({
							radius: 60,
							width: 14,
							circleShape: 'half-top',
							handleSize: "24, 12",
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
					} else {
						
						$('#switch-' + shutter.id).bootstrapToggle({
							on: 'Opened',
							off: 'Closed'
						});
						
						if(updates === 0 || ((copyconfig.shutters[shutter.id - 1].targetAngle > 90) !== (shutter.targetAngle > 90))){
							$('#switch-' + shutter.id).bootstrapToggle(shutter.targetAngle > 90 ? 'on' : 'off');	
						}
						
						$('#switch-' + shutter.id).change(function(){
							shutter.targetAngle = $(this).prop('checked') ? 180: 0;
							emitConfigChange();
						});
					}

					$('#slider-' + shutter.id + ' .rs-range-color').css('background-color', colors[(shutter.id - 1) % colors.length]);

					$('#slider-' + shutter.id).roundSlider('option', 'animation', false);
					$('#slider-' + shutter.id).roundSlider('option', 'value', updates > 0 ? copyconfig.shutters[shutter.id - 1].targetAngle : 0);
					$('#slider-' + shutter.id).roundSlider('option', 'animation', true);
					$('#slider-' + shutter.id).roundSlider('option', 'value', shutter.targetAngle);
						
					$('tr:nth-child(odd) .rs-inner').css('background-color', 'whitesmoke');
					
				});

				break;

			case "Captors":

				config.shutters.forEach(function (shutter) {

					var attributes = [];

					$('#ctnr').append('<h3>' + shutter.loc + '</h3>');
					$('#ctnr').append(
						"<table class='ef-table' id='table-shutter-" + shutter.id + "'></table>"
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
							'<tr><th>' + attrib[0].toUpperCase() + attrib.substr(1) + '</th>' + vals + '</tr>'
						);

						var value;

						for (var i = 0; i < shutter.captors.length; i++) {
							if (shutter.captors[i].type === 'position') {
								value = parseInt(shutter.captors[i].value);
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

					});

				});

				break;

			case "Program":				

				var currentProgName = '';				

				var workspaceChangeListener = function(event) {
					console.log(event);
					socket.emit('workspace_change', {
						prog_name: currentProgName,
						xml: Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace)),
						token: localStorage.getItem('token')
					})
				};

				var workspace_changed_handler = function(data) {
					console.log(data);

					if (data.prog_name === currentProgName) {
						workspace.removeChangeListener(workspaceChangeListener);
						workspace.clear();
						Blockly.Xml.domToWorkspace(workspace, Blockly.Xml.textToDom(data.xml));
						workspace.addChangeListener(workspaceChangeListener);
					}					
				};				
				

				var initBlocklyWorkspace = function() {					
					console.log('init');			
					
					$('#ctnr')
						.html('<div id="blocklyDiv" style="position: absolute; top: 50px; bottom: 0; left: 0; right: 0;"></div>')
						.append('<xml id="toolbox" style="display: none"> <category name="EasyFlap" colour="#16a085"> <block type="ef_runevery"></block> <block type="ef_shutters"></block> <block type="ef_shutter_list"></block> <block type="ef_getcaptorvalue"> <value name="SHUTTER"> <block type="ef_shutters"></block> </value> </block> <block type="ef_setangle"> <value name="SHUTTER"> <block type="ef_shutters"></block> </value> <value name="angle"> <block type="math_number"> <field name="NUM">180</field> </block> </value> </block> <block type="ef_close_shutter"> <value name="SHUTTER"> <block type="ef_shutters"></block> </value> </block> </category> <category name="Date" colour="#27ae60"> <block type="ef_getdate"></block> <block type="ef_today"></block> <block type="ef_weekdays"></block> </category> <category name="Logic" colour="#2980b9"> <block type="controls_if"></block> <block type="controls_switch"></block> <block type="logic_compare"></block> <block type="logic_operation"></block> <block type="logic_negate"></block> <block type="logic_boolean"></block> <block type="logic_null"></block> </category> <category name="Loops" colour="#C88330"> <block type="controls_repeat"></block> <block type="controls_repeat_ext"> <value name="TIMES"> <shadow type="math_number"> <field name="NUM">10</field> </shadow> </value> </block> <block type="controls_whileUntil"></block> <block type="controls_for"> <field name="VAR">i</field> <value name="FROM"> <shadow type="math_number"> <field name="NUM">1</field> </shadow> </value> <value name="TO"> <shadow type="math_number"> <field name="NUM">10</field> </shadow> </value> <value name="BY"> <shadow type="math_number"> <field name="NUM">1</field> </shadow> </value> </block> <block type="controls_forEach"></block> <block type="controls_flow_statements"></block> </category> <category name="Math" colour="#c0392b"> <block type="math_number"></block> <block type="math_arithmetic"></block> <block type="math_single"></block> <block type="math_trig"></block> <block type="math_constant"></block> <block type="math_number_property"></block> <block type="math_change"> <value name="DELTA"> <block type="math_number"> <field name="NUM">1</field> </block> </value> </block> <block type="math_round"></block> <block type="math_on_list"></block> <block type="math_modulo"></block> <block type="math_constrain"> <value name="LOW"> <block type="math_number"> <field name="NUM">1</field> </block> </value> <value name="HIGH"> <block type="math_number"> <field name="NUM">100</field> </block> </value> </block> <block type="math_random_int"> <value name="FROM"> <block type="math_number"> <field name="NUM">1</field> </block> </value> <value name="TO"> <block type="math_number"> <field name="NUM">100</field> </block> </value> </block> <block type="math_random_float"></block> </category> <category name="Lists" colour="#8e44ad"> <block type="lists_create_empty"></block> <block type="lists_create_with"></block> <block type="lists_repeat"> <value name="NUM"> <block type="math_number"> <field name="NUM">5</field> </block> </value> </block> <block type="lists_length"></block> <block type="lists_isEmpty"></block> <block type="lists_indexOf"></block> <block type="lists_getIndex"></block> <block type="lists_setIndex"></block> </category> <category name="Variables" custom="VARIABLE" colour="#34495e"></category> <category name="Functions" custom="PROCEDURE" colour="#000000"></category> </xml>');

						//$('#blocklyDiv').css('z-index', 100);

						$('.glyphicon').fadeOut(200);

						$('#save_prog_btn').fadeIn(200);

						workspace = Blockly.inject('blocklyDiv', {
							toolbox: document.getElementById('toolbox'),
							grid: {
								spacing: 25,
								length: 3,
								colour: '#ccc',
								snap: true
							},
							zoom: {
								controls: true,
								wheel: true,
								startScale: 1.0,
								maxScale: 3,
								minScale: 0.3,
								scaleSpeed: 1.2
							},
							trashcan: true
						});

						//workspace.addChangeListener(workspaceChangeListener);											

						$('.blocklyToolboxDiv').hide();
						//$('.blocklyToolboxDiv').css('z-index', 100);
						$('.blocklyToolboxDiv').fadeIn(200);

						$('#blocklyDiv').fadeIn(200);


				};

				var load_blockly = function(callback, context) {

					context = context ? context : this;
					
					if (!blockly_loaded) {

						console.log('Loading blockly');

						basket.require(
							{ url: 'blockly/blockly_compressed.js' },
							{ url: 'blockly/javascript_compressed.js' },

							{ url: 'blockly/blocks/easyFlap.js' },
							{ url: 'blockly/blocks/logic.js' },
							{ url: 'blockly/blocks/loops.js' },
							{ url: 'blockly/blocks/math.js' },
							{ url: 'blockly/blocks/lists.js' },
							{ url: 'blockly/blocks/procedures.js' },
							{ url: 'blockly/blocks/variables.js' },
							{ url: 'blockly/blocks/variables.js' },

							{ url: 'blockly/generators/javascript/easyFlap.js' },
							{ url: 'blockly/generators/javascript/logic.js' },
							{ url: 'blockly/generators/javascript/loops.js' },
							{ url: 'blockly/generators/javascript/math.js' },
							{ url: 'blockly/generators/javascript/lists.js' },
							{ url: 'blockly/generators/javascript/procedures.js' },
							{ url: 'blockly/generators/javascript/variables.js' },

							{ url: 'blockly/msg/js/en.js' }
						).then(function()  {
							console.log('Blockly loaded successfully');
							blockly_loaded = true;
							callback.call(context);
						});

					} else {
						callback.call(context);
					}
				};

				var edit_prog_handler = function() {

					load_blockly(function() {

						//socket.on('workspace_changed', workspace_changed_handler);

						initBlocklyWorkspace();

						currentProgName = $(this).attr('name');					

						//Load XML
						socket.emit('custom_prog_req', currentProgName);

						var custom_req_handler = function(json) {

							socket.removeListener('custom_prog', custom_req_handler);

							json = JSON.parse(json);

							$('#save_prog_btn').click({ json: json }, save_prog_handler);

							if (json instanceof Error) {
								alertify.error(json.message);
							} else {
								Blockly.Xml.domToWorkspace(workspace, Blockly.Xml.textToDom(json.xml));
							}
						};

						socket.on('custom_prog', custom_req_handler);	
					}, this);				
							
				};

				var config_prog_handler = function() {
					currentProgName = $(this).attr('name');
					var configBox_backup = $('#configBox').html();

					$('#configBox_input_1_title').text('Name');
					$('#configBox_input_1').attr('placeholder', 'Handle rain');
					$('#configBox_form_1').append(
						"<div class='form-group' id='configBox_form_group_2'>" + 
						"<label class='control-label' id='configBox_input_2_title'>Description</label>" +
						"<textarea class='form-control' rows='3' placeholder='Close all shutters when it rains' " +
						" id='configBox_input_2'></textarea>" +
						"</div>"
					);
					$('#configBox_footer').append('<button type="button" class="btn btn-danger" id="configBox_delete_prog" data-dismiss="modal">Delete</button>');					

					$('#configBox_delete_prog').click(function() {
						alertify.confirm('Are you sure you want to delete "' + currentProgName.replace(/_/g, ' ') + '" ?',
							function() { //Ok
								socket.emit('delete_prog_req', currentProgName);

								var on_prog_deleted_handler = function(prog_name) {
									if (prog_name === currentProgName)  {
										$('.prog_tr').find('.prog_name').each(function() {
											var tr = $('#' + prog_name);
											if (tr.length) { //tr exists
												alertify.success('Program successfully deleted');
												tr.parent().remove();
											}
										});
									}

									socket.removeListener('prog_deleted', on_prog_deleted_handler);									
								};

								socket.on('prog_deleted', on_prog_deleted_handler);
							},
							function() { //Cancel
								
							}
						);
						return true;
					});

					var on_applyChanges_handler = function(event) {

						var change = {}, data = event.data, tr = $('#' + currentProgName);						

						if ($('#configBox_input_1').val() !== data.name) {
							change.name = $('#configBox_input_1').val();
							tr.text(change.name);
						}

						if ($('#configBox_input_2').val() !== data.description) {
							change.description = $('#configBox_input_2').val();
							tr.parent().find('.description').text(change.description)
						}

						if (Object.keys(change).length !== 0) {						
							socket.emit('prog_change_req', {prog_name: currentProgName, change: change});
						}			
						
						$('#configBox_applyChanges').unbind('click', on_applyChanges_handler);						
					};

					var tr = $('#' + currentProgName);				

					if (tr.length) {
						var name = currentProgName.replace(/_/g, ' '),
							description = tr.parent().find('.description').text();
						$('#configBox_title').text('Edit "' + name + '"');
						$('#configBox_input_1').val(name);
						$('#configBox_input_2').val(description);
						$('#configBox').bind('hidden.bs.modal', { restore_configBox: configBox_backup }, hide_modal_handler);
						$('#configBox_applyChanges').bind('click', {name: name, description: description}, on_applyChanges_handler);
						$('#configBox').modal();
					}					
									
				};			

				var create_prog_handler = function(event) {

					var data = event.data;

					if ($('#configBox_input_1').val().trim() === '') {
						alertify.alert('Incorrect program name');
						return false;
					}

					if ($('#configBox_input_2').val().trim() === '') {
						alertify.alert('Please enter a description');
						return false;
					}					

					
					load_blockly(function() {				
						$('#configBox').modal('hide');

						socket.on('workspace_changed', workspace_changed_handler);

						initBlocklyWorkspace();

						var json = {
							name: $('#configBox_input_1').val().replace(/ /g, '_'),
							description: $('#configBox_input_2').val()
						};

						$('#configBox').html(event.data.restore_configBox);							

						$('#save_prog_btn').click({json: json}, save_prog_handler);						

						//Add a default "RunEvery" block:
						Blockly.Xml.domToWorkspace(workspace, Blockly.Xml.textToDom('<xml xmlns="http://www.w3.org/1999/xhtml"><block type="ef_runevery" id="NAkR0SuL7mfHn[G8yvr{" x="288" y="63"><field name="seconds">86400</field></block></xml>'));
					});
					

				
				};

				var hide_modal_handler = function(event) {

					$('#configBox').unbind('hidden.bs.modal', hide_modal_handler);
					$('#configBox').html(event.data.restore_configBox);				
				};				

				var show_progs_table = function() {

					$('#ctnr').empty();

					socket.emit('custom_progs_req', null);

					on_custom_progs_handler = function(progs) {
						console.log('Progs list received');

						$('#ctnr').html("<table class='ef-table' id='table'></table>");

						$('#table').html(
							'<tr><th>Edit</th><th>Name</th><th>Description</th><th>Configure</th></tr>'
						);

						progs.forEach(function(prog) {

							$('#table').append('<tr class="prog_tr"><td><button type="button" name="' + prog.name + '" class="btn btn-default edit_prog" aria-label="Edit"><span class="glyphicon glyphicon-console" aria-hidden="true"></span></button></td><td id="' + prog.name + '" class="prog_name">' + prog.name.replace(/_/g, ' ') + '</td><td class="description">' + prog.description + '</td><td><button type="button" name="' + prog.name + '" class="btn btn-default config_prog" aria-label="Configure"><span class="glyphicon glyphicon-wrench" aria-hidden="true"></span></button></td></tr>');
						});

						$('.edit_prog').click(edit_prog_handler);

						$('.config_prog').click(config_prog_handler);						

						$('#ctnr').append('<br><button type="button" class="btn btn-danger" id="new_prog_btn">New program</button>');



						$('#new_prog_btn').click(function() {

							var configBox_backup = $('#configBox').html();							

							if (configBox_applyChangesHandler)
								$('#configBox_applyChanges').unbind('click', configBox_applyChangesHandler);							
						
							$('#configBox_applyChanges').text('Create');

							$('#configBox_title').text('Create a new program');
							
							$('#configBox_input_1_title').text('Name');

							$('#configBox_input_1').val('');

							$('#configBox_input_1').attr('placeholder', "Handle rain");							

							$('#configBox_form_1').append(
								"<div class='form-group' id='configBox_form_group_2'>" + 
								"<label class='control-label' id='configBox_input_2_title'>Description</label>" +
								"<textarea class='form-control' rows='3' placeholder='Close all shutters when it rains' " +
								" id='configBox_input_2'></textarea>" +
								"</div>"
							);							

							$('#configBox_applyChanges').bind('click', { restore_configBox: configBox_backup }, create_prog_handler);
							$('#configBox').bind('hidden.bs.modal', { restore_configBox: configBox_backup }, hide_modal_handler);
							
							$('#configBox').modal();							
		
						});

						socket.removeListener('custom_progs', on_custom_progs_handler);
					};

					socket.on('custom_progs', on_custom_progs_handler);					
				};

				var save_prog_handler = function(event) {

					socket.removeListener('workspace_changed', workspace_changed_handler);

					var json = event.data.json;
					var progName = json.name;				
					
					json.xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace)).replace(/"/g, "'");
					json.js = Blockly.JavaScript.workspaceToCode(workspace).replace(/\n/g, '').trim();

					socket.emit('prog_save', {
						json: JSON.stringify(json),
						token: localStorage.getItem('token')
					});

					socket.on('prog_save_status', function(data) {
						console.log(data);
						if (data.program === progName) {
							if (data.success) {
								show_progs_table();
								alertify.success('Program successfully saved');
								$('#blocklyDiv').remove();
								$('#toolbox').remove();
								$('.blocklyToolboxDiv').remove();
								$('#save_prog_btn').unbind('click', save_prog_handler);
								$('#save_prog_btn').fadeOut(200);
							} else  {
								alertify.error('Cannot save the program');
							}
						}
					});

					return false;
				};

				show_progs_table();				
								
				break;
		}

	};
	
	$(window).resize(function(){
		if((lastWidth <= 767 && window.innerWidth > 767) || (lastWidth > 767 && window.innerWidth <= 767)){
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
		} else {
			if(localStorage.getItem('token') !== null) {
				socket.emit('login_attempt', { "token": localStorage.getItem('token') });
			} else {
				$('#loginBox').show();
				$('#particles').show();
			}
			
			$('#loginButton').on('click', function () {
				socket.emit('login_attempt', { "user": $('#user').val(), "pass": $('#pass').val() });
			});
			
		}
	});
	
	socket.on('login_response', function(res) {
		
		if(res.err === null && res.token !== null){
            $('body').css('background-color', 'white');
			token = res.token;
			$('#loginBox').empty();
			$('#navbar').fadeIn(700);
			localStorage.setItem('token', res.token);
			localStorage.setItem('timeout', new Date().getTime() + params.sessionTimeLimit);
			init();
		}else{
			alertify.error(res.err);
		}
	});
	
	socket.on('logout_req', function(err) {
		localStorage.removeItem('token');
		localStorage.removeItem('timeout');
		
		if(err !== null){
			alertify.error(err);
			setTimeout(2000, location.reload());
		}
	});

})();

window.onload = (function(){
	
	$('#configBox').on('keypress', function(e) {
		if(e.keyCode === 13){
			$('#configBox_applyChanges').trigger('click');
		}
	});
});
