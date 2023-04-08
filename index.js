'use strict';

const {XMLParser} = require('fast-xml-parser');
const fs = require('fs').promises;

const markerBegin = '<x:xmpmeta';
const markerEnd = '</x:xmpmeta>';

function print(depth, ...what) {
	// console.log((new Array(depth)).join('-'), ...what);
}

function extractValue(val, depth) {
	if (Array.isArray(val)) {
		print(depth, 'array', val)
		const out = [];
		for (const item of val) {
			out.push(extractValue(item, depth + 1));
		}
		return out;
	} else if (typeof val === 'object') {
		print(depth, 'object')
		return parseObject(val, depth + 1);
	}
	print(depth, 'value', val)
	return val;
}

function parseObject(xmlRoot, depth) {
	print(depth, 'parseObject');
	const keys = Object.keys(xmlRoot);
	if (keys.length === 1) {
		print(depth, 'keys === 1', keys[0], JSON.stringify(xmlRoot));
		// object wrapper
		if (keys[0] === 'rdf:Bag') {
			return parseObject(xmlRoot[keys[0]], depth + 1);
		}
		// list wrapper
		if (keys[0] === 'rdf:li' || keys[0] === 'rdf:Alt') {
			return extractValue(xmlRoot[keys[0]], depth + 1);
		}
	}
	let obj = {};
	for (const k of keys) {
		if (!k) {
			continue;
		}
		const keyParts = k.split(':');
		const prefix = keyParts[0];
		const suffix = keyParts[1];
		if (!obj[prefix]) {
			obj[prefix] = {};
		}
		print(depth, 'keyloop', prefix, suffix);
		obj[prefix][suffix] = extractValue(xmlRoot[k], depth + 1);
	}
	if (Object.keys(obj).length === 0) {
		return null;
	}
	return obj;
}

/*
	Expects of a buffer of the XMP data directly
*/
function fromBuffer(buffer) {
	if (!Buffer.isBuffer(buffer)) {
		throw new Error('Not a Buffer');
	}
	// sharp can give us 0x0a at the start of buffer, which is whitespace..
	let offsetBegin = 0;
	if (buffer[0] === 0x0a) {
		offsetBegin++;
	}

	if (buffer.toString('ascii', offsetBegin, markerBegin.length + offsetBegin) !== markerBegin) {
		throw new Error(`Invalid XMP data. Buffer should start with ${markerBegin}`);
	}
	if (buffer.toString('ascii', buffer.length - markerEnd.length, buffer.length) !== markerEnd) {
		throw new Error(`Invalid XMP data. Buffer should end with ${markerEnd}`);
	}

	const parser = new XMLParser();
	const raw = parser.parse(buffer.toString('utf-8', offsetBegin, buffer.length));
	// https://printtechnologies.org/wp-content/uploads/2020/03/xmp-specification-sep05_fileticketd5JLj1avaKctabid158mid669.pdf
	// page 22
	// <x:xmpmeta><rdf:RDF>
	// 	then 0 or more <rdf:Description> objects
	if (!raw['x:xmpmeta'] || !raw['x:xmpmeta']['rdf:RDF']) {
		throw new Error('Invalid structure');
	}
	let descriptions = [];
	if (!Array.isArray(raw['x:xmpmeta']['rdf:RDF']['rdf:Description'])) {
		descriptions = [raw['x:xmpmeta']['rdf:RDF']['rdf:Description']];
	} else {
		descriptions = raw['x:xmpmeta']['rdf:RDF']['rdf:Description'];
	}
	const rows = [];
	for (const desc of descriptions) {
		const r = parseObject(desc, 0);
		if (!r) {
			continue;
		}
		rows.push(r);
	}
	return {
		raw,
		xmp: rows,
	};
}

function flatten(xmp) {
	return Object.assign({}, ...xmp);
}

async function fromFile(file) {
	const buffer = await fs.readFile(file);
	const start = buffer.indexOf(markerBegin);
	const end = buffer.indexOf(markerEnd);
	const s = buffer.subarray(start, end + markerEnd.length);
	return fromBuffer(s);
}


module.exports = {
	fromBuffer,
	fromFile,
	flatten,
};
