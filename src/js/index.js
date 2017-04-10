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
const sampleFiles = ['beach-waves.ogg', 'fireplace.ogg', 'spring-birds.ogg'];

let buffers = {};

// load samples
$.fromArray(sampleFiles)
	.flatMap(s =>
		file.load(`/assets/samples/${s}`, 'arrayBuffer')
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
state$.distinctUntilChanged(state => state.playing).filter(state => state.finishedLoading && state.playing)
	.subscribe(() => {
		Object.keys(buffers).map(k => buffers[k])
			.forEach(buffer => {
				let bufferSource = audio.context.createBufferSource();
				bufferSource.buffer = buffer;
				bufferSource.loop = true;
				bufferSource.connect(vca.node);
				bufferSource.start();
			});
	});

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '#ui');
