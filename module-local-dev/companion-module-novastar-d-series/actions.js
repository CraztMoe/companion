exports.getActions  = function() {

	let actions = {};
	
	actions['take'] = {
		label: 'TAKE'
	};

	actions['cut'] = {
		label: 'CUT'
	};

	actions['change_black'] = {
		label: 'Change Black Screen',
		options: [
			{
				type: 'dropdown',
				label: 'Black Screen',
				id: 'black',
				default: '0',
				choices: this.model.black
			}
		]
	};

	actions['change_freeze'] = {
		label: 'Change Freeze Screen',
		options: [
			{
				type: 'dropdown',
				label: 'Freeze Screen',
				id: 'freeze',
				default: '0',
				choices: this.model.freeze
			}
		]
	};

	actions['load_preset'] = {
		label: 'Load Preset to Preview',
		options: [
			{
				type: 'dropdown',
				label: 'Preset',
				id: 'preset',
				default: '0',
				choices: [...Array(128)].map((_, index) => ({
					id: index+1,
					label: `Preset ${index + 1}`,
				})),

			}
		]
	};

	return actions
}
