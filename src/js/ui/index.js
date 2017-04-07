'use strict';

// dom
const {h1, section, textarea, button, span} = require('iblokz-snabbdom-helpers');
// components

module.exports = ({state, actions}) => section('#ui', [
	h1('Sounding Poetry of Perception'),
	textarea('[placeholder="Enter your poem here ..."]'),
	button('Compose')
]);
