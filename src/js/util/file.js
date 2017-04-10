'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {fn, obj} = require("iblokz-data");

const load = (file, readAs = 'text') => $.create(stream => {
	const fr = new FileReader();
	fr.onload = function(ev) {
		// console.log(readAs, ev.target.result);
		stream.onNext(
			readAs === 'json'
				? JSON.parse(ev.target.result)
				: ev.target.result
		);
		stream.onCompleted();
	};
	// console.log(file, readAs);
	((typeof file === 'string')
		? $.fromPromise(fetch(file)).flatMap(res => res.blob())
		: $.just(file))
		.subscribe(f => fn.switch(readAs, {
			arrayBuffer: f => fr.readAsArrayBuffer(f),
			default: f => fr.readAsText(f)
		})(f));
});

module.exports = {
	load
};
