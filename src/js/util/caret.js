'use strict';

const find = (q, el = document) => Array.from(el.querySelectorAll(q));

const getParent = (el, tagName) => ([].concat(tagName).indexOf(el.tagName) > -1)
	? el
	: getParent(el.parentNode, tagName);

const getRangePoint = (el, offset) =>
	(el.nodeType === 3 || el.childNodes.length === 0)
		? ({el, offset: (el.textContent.length < offset) ? el.textContent.length : offset})
		: Array.from(el.childNodes).reduce(
			(rp, child, index) => (rp.el !== el)
				? rp
				: (child.textContent.length >= rp.offset)
					? getRangePoint(child, rp.offset)
					: (index < el.childNodes.length - 1)
						? {el, offset: rp.offset - child.textContent.length}
						: {el: child, offset: child.textContent.length},
			{el, offset}
		);

const get = el => {
	let rows = find('p, li, div', el);
	let range = window.getSelection().getRangeAt(0);
	let parentRow = getParent(range.startContainer, ['LI', 'P', 'DIV']);
	let colRange = document.createRange();
	colRange.setStart(parentRow, 0);
	colRange.setEnd(range.startContainer, range.startOffset);
	const row = rows.indexOf(parentRow);
	const col = colRange.toString().length;
	return {
		row: (row === -1) ? 0 : row,
		col,
		length: range.toString().length
	};
};

const	set = (el, pos) => {
	const parentRow = find('p, li, div', el)[pos.row];
	console.log(parentRow);
	if (parentRow) {
		const rp = getRangePoint(parentRow, pos.col);
		const ep = pos.length === 0 ? rp : getRangePoint(parentRow, pos.col + pos.length);
		let range = document.createRange();
		range.setStart(rp.el, rp.offset);
		range.setEnd(ep.el, ep.offset);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}
};

module.exports = {
	get,
	set
};
