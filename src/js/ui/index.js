'use strict';

// dom
const {h1, label, div, section, textarea, button, span} = require('iblokz-snabbdom-helpers');
// components

module.exports = ({state, actions}) => section('#ui', [
	h1('Sounding Poetry of Perception'),
	textarea('[placeholder="Enter your poem here ..."]'),
	section('.controls', [
		!state.finishedLoading ? label('Loading samples ...') : div([
			label('Done Loading'),
			button({
				on: {
					click: ev => actions.toggle('playing')
				}
			}, state.playing ? 'Stop' : 'Compose')
		])
	])
]);
