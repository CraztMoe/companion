// NovaStar-Controller
const tcp           = require('../../tcp');
const udp           = require('../../udp');
const instance_skel = require('../../instance_skel');
var actions         = require('./actions');
var ping = require('ping');
let debug;
let log;

function get_preset_load_cmd(index) {
	let preset_buf=[];
	let preset_buf_len = 0;
	let temp_index = index;
	let checksum = 0x6465;
	while(temp_index > 0)
	{
		preset_buf[preset_buf_len] = Math.floor(temp_index % 10) + 0x30;
		checksum = checksum + preset_buf[preset_buf_len];
		temp_index = Math.floor(temp_index / 10);
		preset_buf_len = preset_buf_len + 1;
		console.log(preset_buf[preset_buf_len])
	}
	let cmd_part1, cmd_part2, cmd_part3;
	let cmd_part_len, cmd_part_xx, cmd_part_sum;
	cmd_part1 = Buffer.from([0x55,0xAA,0x00,0x7D,0xFE,0x00,0x04,0x00,0x00,0x00,0x01,0x30,0x00,0x00,0x00,0x00]);
	cmd_part2 = Buffer.from([0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x15,0x00,0x00,0x00,0x00,0x00,0x5B,0x7B,0x22,0x66,0x69,0x6C,0x65,0x49,0x64,0x22,0x3A]);
	cmd_part3 = Buffer.from([0x2C,0x22,0x66,0x69,0x6C,0x65,0x54,0x79,0x70,0x65,0x22,0x3A,0x36,0x2C,0x22,0x61,0x70,0x70,0x6C,0x79,0x54,0x79,0x70,0x65,0x22,0x3A,0x36,0x7D,0x5D]);

	switch (preset_buf_len) {
		case 1:
			checksum = checksum + 0x3B;
			cmd_part_len = Buffer.from([0x3B, 00]);
			cmd_part_xx = Buffer.from([preset_buf[0]]);
			break;
		case 2:
			checksum = checksum + 0x3C;
			cmd_part_len = Buffer.from([0x3C, 00]);
			cmd_part_xx = Buffer.from([preset_buf[1], preset_buf[0]]);
			break;
		case 3:
			checksum = checksum + 0x3D;
			cmd_part_len = Buffer.from([0x3D, 00]);
			cmd_part_xx = Buffer.from([preset_buf[2], preset_buf[1], preset_buf[0]]);
			break;
	}
	cmd_part_sum = Buffer.from([(checksum & 0xFF), ((checksum >> 8) & 0xFF)]);

	let totalBytes = cmd_part1.length + cmd_part2.length + cmd_part3.length + cmd_part_len.length + cmd_part_xx.length + cmd_part_sum.length;
	let cmd = Buffer.concat([cmd_part1,cmd_part_len,cmd_part2,cmd_part_xx,cmd_part3,cmd_part_sum],totalBytes);

	console.log(cmd);
	return cmd;
}

class instance extends instance_skel {

	constructor(system,id,config) {
		super(system,id,config)

		Object.assign(this, {
			...actions
		});

		// F Series Display Modes
		this.CHOICES_BLACK = [
			{ id: '0', label: 'No fade to black', cmd: Buffer.from([0x55,0xAA,0x00,0xAF,0xFE,0x00,0x04,0x00,0x00,0x00,0x01,0x30,0x00,0x00,0x00,0x00,0x8B,0x00,0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x0A,0x13,0x00,0x00,0x00,0x00,0x00,0x5B,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x32,0x2C,0x22,0x46,0x54,0x42,0x22,0x3A,0x7B,0x22,0x65,0x6E,0x61,0x62,0x6C,0x65,0x22,0x3A,0x30,0x2C,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x30,0x7D,0x7D,0x2C,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x34,0x2C,0x22,0x46,0x54,0x42,0x22,0x3A,0x7B,0x22,0x65,0x6E,0x61,0x62,0x6C,0x65,0x22,0x3A,0x30,0x2C,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x30,0x7D,0x7D,0x5D,0x7A,0x7D]) },
			{ id: '1', label: 'Fade to black',    cmd: Buffer.from([0x55,0xAA,0x00,0x92,0xFE,0x00,0x04,0x00,0x00,0x00,0x01,0x30,0x00,0x00,0x00,0x00,0x8B,0x00,0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x0A,0x13,0x00,0x00,0x00,0x00,0x00,0x5B,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x32,0x2C,0x22,0x46,0x54,0x42,0x22,0x3A,0x7B,0x22,0x65,0x6E,0x61,0x62,0x6C,0x65,0x22,0x3A,0x31,0x2C,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x30,0x7D,0x7D,0x2C,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x34,0x2C,0x22,0x46,0x54,0x42,0x22,0x3A,0x7B,0x22,0x65,0x6E,0x61,0x62,0x6C,0x65,0x22,0x3A,0x31,0x2C,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x30,0x7D,0x7D,0x5D,0x5F,0x7D]) }
		];
		this.CHOICES_FREEZE = [
			{ id: '0', label: 'Unfreeze', cmd: Buffer.from([0x55,0xAA,0x00,0xE5,0xFE,0x00,0x04,0x00,0x00,0x00,0x01,0x30,0x00,0x00,0x00,0x00,0x69,0x00,0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x09,0x13,0x00,0x00,0x00,0x00,0x00,0x5B,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x32,0x2C,0x22,0x66,0x72,0x65,0x65,0x7A,0x65,0x22,0x3A,0x30,0x7D,0x2C,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x34,0x2C,0x22,0x66,0x72,0x65,0x65,0x7A,0x65,0x22,0x3A,0x30,0x7D,0x5D,0xAE,0x73]) },
			{ id: '1', label: 'Freeze',   cmd: Buffer.from([0x55,0xAA,0x00,0xCA,0xFE,0x00,0x04,0x00,0x00,0x00,0x01,0x30,0x00,0x00,0x00,0x00,0x69,0x00,0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x09,0x13,0x00,0x00,0x00,0x00,0x00,0x5B,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x32,0x2C,0x22,0x66,0x72,0x65,0x65,0x7A,0x65,0x22,0x3A,0x31,0x7D,0x2C,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x34,0x2C,0x22,0x66,0x72,0x65,0x65,0x7A,0x65,0x22,0x3A,0x31,0x7D,0x5D,0xF2,0x73]) }
		];
		
		this.CONFIG_MODEL = {

			f8: { id: 'f8', label: 'F8', black: this.CHOICES_BLACK, freeze: this.CHOICES_FREEZE},     

            f4: { id: 'f4', label: 'F4', black: this.CHOICES_BLACK, freeze: this.CHOICES_FREEZE},
            
            f4lite: { id: 'f4lite', label: 'F4 Lite', black: this.CHOICES_BLACK, freeze: this.CHOICES_FREEZE},
		};

		this.CHOICES_MODEL = Object.values(this.CONFIG_MODEL);
		// Sort alphabetical
		this.CHOICES_MODEL.sort(function(a, b){
			var x = a.label.toLowerCase();
			var y = b.label.toLowerCase();
			if (x < y) {return -1;}
			if (x > y) {return 1;}
			return 0;
		});

		if (this.config.modelID !== undefined){
			this.model = this.CONFIG_MODEL[this.config.modelID];
		}
		else {
			this.config.modelID = 'f8';
			this.model = this.CONFIG_MODEL['f8'];
		}

		this.actions();
	}

	actions(system) {
		this.setActions(this.getActions());
	}

	action(action) {
		let cmd;
		let element
		let id = action.action
		let options = action.options;

		switch(id) {
			case 'load_preset':
				cmd = get_preset_load_cmd(options.preset);
				break;
			case 'cut':
				cmd = Buffer.from([0x55,0xAA,0x00,0x71,0xFE,0x00,0x04,0x00,0x00,0x00,0x01,0x30,0x00,0x00,0x00,0x00,0xB5,0x00,0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x0E,0x13,0x00,0x00,0x00,0x00,0x00,0x5B,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x32,0x2C,0x22,0x73,0x77,0x69,0x74,0x63,0x68,0x45,0x66,0x66,0x65,0x63,0x74,0x22,0x3A,0x7B,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x31,0x2C,0x22,0x64,0x69,0x72,0x65,0x63,0x74,0x69,0x6F,0x6E,0x22,0x3A,0x30,0x2C,0x22,0x74,0x79,0x70,0x65,0x22,0x3A,0x30,0x7D,0x7D,0x2C,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x34,0x2C,0x22,0x73,0x77,0x69,0x74,0x63,0x68,0x45,0x66,0x66,0x65,0x63,0x74,0x22,0x3A,0x7B,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x31,0x2C,0x22,0x64,0x69,0x72,0x65,0x63,0x74,0x69,0x6F,0x6E,0x22,0x3A,0x30,0x2C,0x22,0x74,0x79,0x70,0x65,0x22,0x3A,0x30,0x7D,0x7D,0x5D,0x5E,0x8D]);
				break;
			case 'take':
				cmd = Buffer.from([0x55,0xAA,0x00,0x6A,0xFE,0x00,0x04,0x00,0x00,0x00,0x01,0x30,0x00,0x00,0x00,0x00,0xB5,0x00,0x00,0x00,0x02,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x0E,0x13,0x00,0x00,0x00,0x00,0x00,0x5B,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x32,0x2C,0x22,0x73,0x77,0x69,0x74,0x63,0x68,0x45,0x66,0x66,0x65,0x63,0x74,0x22,0x3A,0x7B,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x31,0x2C,0x22,0x64,0x69,0x72,0x65,0x63,0x74,0x69,0x6F,0x6E,0x22,0x3A,0x30,0x2C,0x22,0x74,0x79,0x70,0x65,0x22,0x3A,0x31,0x7D,0x7D,0x2C,0x7B,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x49,0x64,0x22,0x3A,0x32,0x35,0x35,0x2C,0x22,0x73,0x63,0x72,0x65,0x65,0x6E,0x54,0x79,0x70,0x65,0x22,0x3A,0x34,0x2C,0x22,0x73,0x77,0x69,0x74,0x63,0x68,0x45,0x66,0x66,0x65,0x63,0x74,0x22,0x3A,0x7B,0x22,0x74,0x69,0x6D,0x65,0x22,0x3A,0x31,0x2C,0x22,0x64,0x69,0x72,0x65,0x63,0x74,0x69,0x6F,0x6E,0x22,0x3A,0x30,0x2C,0x22,0x74,0x79,0x70,0x65,0x22,0x3A,0x31,0x7D,0x7D,0x5D,0x59,0x8D]);
				break;
			case 'change_black':
				element = this.model.black.find(element => element.id === options.black);
				if (element !== undefined) {
					cmd = element.cmd;
				}	
				break;
			case 'change_freeze':
				element = this.model.freeze.find(element => element.id === options.freeze);
				if (element !== undefined) {
					cmd = element.cmd;
				}	
				break;
		}

		if (cmd !== undefined) {
			if (this.socket !== undefined && this.socket.connected) {
				this.socket.send(cmd);
			} else {
				debug('Socket not connected, cmd send failed :(');
			}
		}
	}

	// Return config fields for web config
	config_fields() {

		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will allow you to control the following Pixelhue products: F8, F4, F4 Lite.'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				width: 6,
				default: '192.168.0.10',
				regex: this.REGEX_IP
			},
			{
				type: 'dropdown',
				id: 'modelID',
				label: 'Model',
				width: 6,
				choices: this.CHOICES_MODEL,
				default: 'f8'
			}
		]
	}

	// When module gets deleted
	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy();
		}
		if (this.udp !== undefined) {
			this.udp.destroy();
		}
		debug('destroy', this.id);
	}

	init() {
		debug = this.debug;
		log = this.log;	

		this.status(this.STATE_WARNING, 'Connecting');
		this.initUDP();
		this.initTCP();
		this.initPresets();

		var self = this;
		self.timer = setInterval(function () {
			ping.sys.probe(self.config.host, function(isAlive) {
				if (isAlive) {
					if (self.lastState !== self.STATE_OK && self.lastState !== self.STATE_ERROR) {
						self.status(self.STATE_OK);
						self.lastState = self.STATE_OK;
					}
				} else {
					if (self.lastState != self.STATE_WARNING) {
						self.status(self.STATE_WARNING, 'No ping response');
						self.lastState = self.STATE_WARNING;
					}
				}
			}, { timeout: 2 });
		}, 5000);
	}

	initTCP() {
		if (this.socket !== undefined) {
			this.socket.destroy();
			delete this.socket;
		}

		if (this.config.port === undefined) {
			this.config.port = 5400;
		}

		if (this.config.host)
		{
			this.socket = new tcp(this.config.host, this.config.port);

			this.socket.on('status_change', (status, message) => {
				this.status(status, message);
			});

			this.socket.on('error', (err) => {
				debug('Network error', err);
				this.status(this.STATE_ERROR);
				this.log('error','Network error: ' + err.message);
				this.status(this.STATUS_ERROR,"TCP Connection error, Try to reconnect.");
				console.log("TCP Connection error, Try to reconnect.");
				if (this.udp !== undefined) {
					let cmd_connect = Buffer.from([0x72,0x65,0x71,0x4E,0x4F,0x56,0x41,0x53,0x54,0x41,0x52,0x5F,0x4C,0x49,0x4E,0x4B,0x3A,0x00,0x00,0x03,0xFE,0xFF]); // Port FFFE
					this.udp.send(cmd_connect);
				} else {
					this.initUDP()
				}
				
			});

			this.socket.on('connect', () => {
				let cmd = Buffer.from([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x02,0x00,0x00,0x00,0x02,0x00,0x57,0x56]);
				this.socket.send(cmd);
				debug('Connected');
			});

			// if we get any data, display it to stdout
			this.socket.on('data', (buffer) => {
				//var indata = buffer.toString('hex');
				//future feedback can be added here
				//console.log(indata);
				console.log('Tcp recv:', buffer);
			});
		}
	}

	initUDP() {
		if (this.udp !== undefined) {
			this.udp.destroy();
			delete this.udp;
		}

		this.status(this.STATE_WARNING, 'Connecting')

        if (this.config.host !== undefined)
        {
            this.udp = new udp(this.config.host,3800);
			
			this.udp.on('error', (err) => {
				this.debug('Network error', err)
				this.status(this.STATE_ERROR, err)
				this.log('error', 'Network error: ' + err.message)
			})
			
			// If we get data, thing should be good
			this.udp.on('data', () => {
				// this.status(this.STATE_WARNING, 'Connecting...')
			})
			
			this.udp.on('status_change', (status, message) => {
				this.status(status, message)
			})
			
			let cmd_connect = Buffer.from([0x72,0x65,0x71,0x4E,0x4F,0x56,0x41,0x53,0x54,0x41,0x52,0x5F,0x4C,0x49,0x4E,0x4B,0x3A,0x00,0x00,0x03,0xFE,0xFF]); // Port FFFE
			this.udp.send(cmd_connect);
        }
	}

	updateConfig(config) {
		var resetConnection = false;

		if (this.config.host != config.host)
		{
			resetConnection = true;
		}

		this.config = config;

		this.actions();

		if (resetConnection === true || this.socket === undefined) {
			this.initUDP();
			this.initTCP();
		}
		this.initPresets();
	}

	initPresets(updates) {
		var presets = [];

		presets.push({
			category: 'Basics',
			bank: {
				style: 'text',
				text: 'TAKE',
				size: '24',
				color: 16777215,
				bgcolor: this.rgb(255,0,0),
			},
			actions: [
				{
					action: 'take',
				},
			],
		})
		presets.push({
			category: 'Basics',
			bank: {
				style: 'text',
				text: 'CUT',
				size: '24',
				color: 16777215,
				bgcolor: this.rgb(255,0,0),
			},
			actions: [
				{
					action: 'cut',
				},
			],
		})
		presets.push(
			{
				category: 'Display',
				bank: {
					bgcolor: 0,
					style: 'text',
					text: 'FTB',
					size: '18',
					color: 16777215,
					bgcolor: this.rgb(255,0,0),
					latch: true
				},
				actions: [{
					action: 'change_black',
					options: {
						black: "1",
					}
				}],
				release_actions: [{
					action: 'change_black',
					options: {
						black: "0",
					}
				}]
			}
		)
		presets.push(
			{
				category: 'Display',
				bank: {
					bgcolor: 0,
					style: 'text',
					text: 'FRZ',
					size: '18',
					color: 16777215,
					bgcolor: this.rgb(255,0,0),
					latch: true
				},
				actions: [{
					action: 'change_freeze',
					options: {
						freeze: "1",
					}
				}],
				release_actions: [{
					action: 'change_freeze',
					options: {
						freeze: "0",
					}
				}]
			}
		)

		presets.push({
			category: 'Presets to PVW',
			bank: {
				style: 'text',
				text: 'Preset',
				size: '24',
				color: this.rgb(0, 0, 0),
				bgcolor: this.rgb(255,0,255),
			},
			actions: [
				{
					action: 'load_preset',
					options:{
						preset: 0,
					}
				},
			],
		})

		let index;
		for (index = 1; index <= 128; index ++)
		{
			presets.push({
				category: 'Presets to PVW',
				bank: {
					style: 'text',
					text: 'Preset '+ index,
					size: '24',
					color: this.rgb(0, 0, 0),
					bgcolor: this.rgb(0,204,0),
				},
				actions: [
					{
						action: 'load_preset',
						options:{
							preset: index,
						}
					},
				],
			})
		}

		this.setPresetDefinitions(presets)
	}

}

exports = module.exports = instance;