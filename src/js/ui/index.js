'use strict';

// dom
const {h1, label, div, section, textarea, button, span} = require('iblokz-snabbdom-helpers');
// util
const caret = require('../util/caret');

module.exports = ({state, actions}) => section('#ui', [
	h1('Sounding Poetry of Perception'),
	div('#poem[contenteditable="true"][placeholder="Enter your poem here ..."]', {
		on: {
			focus: ev => {
				const poem = ev.target;
				// input effects
				let timeout = null;
				document.addEventListener('keydown', e => {
				  if (e.key.length === 1 && e.key !== ' ') {
				    e.preventDefault();
						let pos = caret.get(poem);
				    let range = window.getSelection().getRangeAt(0);
				    let offset = range.startOffset;
				    let inp = document.createElement('SPAN');
				    inp.textContent = e.key;
				    //e.target.appendChild(inp);
				    range.insertNode(inp);
				    range.setStart(inp, 1);
						range.setEnd(inp, 1);
						if (timeout) {
							window.clearTimeout(timeout);
					    timeout = window.setTimeout(() => {
					    	e.target.innerHTML = e.target.textContent
								caret.set(poem, pos);
								window.clearTimeout(timeout);
								timeout = null;
					    }, 2000)
						}
				  }
				});
			}
		}
	}),
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
