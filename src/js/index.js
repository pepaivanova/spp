'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

// app
const app = require('./util/app');
const file = require('./util/file');
const audio = require('./util/audio');
const caret = require('./util/caret');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
const state$ = actions$
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.map(state => (console.log(state), state))
	.share();

// prototype code
const sampleFiles = ['beach-waves.ogg', 'fireplace.ogg', 'spring-birds.ogg',
	'typewriter/key1.ogg', 'typewriter/space1.ogg'];

let buffers = {};

// load samples
$.fromArray(sampleFiles)
	.flatMap(s =>
		file.load(`assets/samples/${s}`, 'arrayBuffer')
			.flatMap(b => $.fromCallback(audio.context.decodeAudioData, audio.context)(b))
			.map(b => obj.keyValue(s.replace('.ogg', ''), b))
	)
	.reduce((o, s) => Object.assign({}, o, s), {})
	.subscribe(b => {
		buffers = b;
		console.log(b);
		actions.toggle('finishedLoading');
	});

const vca = audio.vca({gain: 0.5});
audio.connect(vca, audio.context.destination);

// play
const play = (buffer, i = 0, def = false) => {
	console.log(buffer, i);
	let bufferSource = audio.context.createBufferSource();
	bufferSource.buffer = buffer;
	bufferSource.loop = false;
	bufferSource.connect(vca.node);
	if (!def)
		bufferSource.start(audio.context.currentTime + i * 10, 2, 14);
	else
		bufferSource.start(audio.context.currentTime + i * 10);
};

state$.distinctUntilChanged(state => state.playing).filter(state => state.finishedLoading && state.playing)
	.subscribe(() => {
		Object.keys(buffers).filter(k => !k.match('.*typewriter.*')).map(k => buffers[k])
			.forEach(play);
	});

// textarea effects

// input effects
state$.take(1).delay(200).subscribe(() => {
	let poem = document.querySelector('#poem');

	let keyDowns = $.fromEvent(poem, 'keydown')
		.filter(e => (e.key.length === 1));

	let pos = {
		col: 0, row: 0, length: 0
	};

	keyDowns.subscribe(e => {
		if (e.key !== ' ') {
			e.preventDefault();
			pos = caret.get(poem);
			pos.col += 1;
			let range = window.getSelection().getRangeAt(0);
			let offset = range.startOffset;
			let inp = document.createElement('SPAN');
			inp.textContent = e.key;
			// e.target.appendChild(inp);
			range.insertNode(inp);
			range.setStart(inp, 1);
			range.setEnd(inp, 1);
			play(buffers['typewriter/key1'], 0, true);
		} else {
			play(buffers['typewriter/space1'], 0, true);
		}
	});

	keyDowns
		.filter(e => (e.key !== ' '))
		.debounce(500).subscribe(e => {
			console.log(pos);
			poem.innerHTML = `<div>${poem.textContent}</div>`;
			caret.set(poem, pos);
		});
});

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '#ui');
