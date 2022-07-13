var START = "start";
var TRANS = "transcript";
var transcript = null;

var status_line = null;
var moves_line = null;
var score_line = null;

var moves = 0;
var score = {};
var visited = {};

window.addEventListener("load", function () {
	"use strict";
	
	status_line = document.getElementById("status");
	moves_line = document.getElementById("moves");
	score_line = document.getElementById("score");
	transcript = document.getElementById(TRANS);
	var start = document.getElementById(START);
	transcript.innerHTML = "";
	advanceStory(start);
});

function advanceStory(fragment) {
	var clone = fetchFragment(fragment);
	if (status_line !== null && clone.title !== "") {
		status_line.innerText = clone.title;
		clone.removeAttribute("title");
	}
	transcript.appendChild(clone);
	clone.scrollIntoView({behavior: "smooth"});
}

function fetchFragment(fragment) {
	var clone = fragment.cloneNode(true);
	setVisited(clone);
	countScore(clone);
	runScripts(clone);
	setupLinks(clone.getElementsByTagName("a"));
	clone.removeAttribute("id"); // No duplicates in document.
	return clone;
}

function setVisited(fragment) {
	if (fragment.classList === undefined) {
		// Do nothing.
	} else if (fragment.classList.add === undefined) {
		// Do nothing.
	} else if (visited[fragment.id]) {
		fragment.classList.add("visited");
	} else {
		fragment.classList.add("unvisited");
	}
	visited[fragment.id] = true;
}

function countScore(fragment) {
	if (fragment.dataset === undefined) {
		return;
	} else if (fragment.dataset.score === undefined) {
		return;
	} else {
		score[fragment.id] = parseInt(fragment.dataset.score);
		var total = 0;
		for (var i in score)
			total += score[i];
		if (score_line !== null)
			score_line.innerText = total;
	}
}

function setupLinks(links) {
	for (var i = 0; i < links.length; i++) {
		if (links[i].rel !== "external") {
			links[i].addEventListener("click", linkCallback);
			links[i].addEventListener("keydown", linkCallback);
		}
	}
}

function clearLinks(links) {
	for (var i = 0; i < links.length; i++) {
		if (links[i].rel !== "external") {
			clearOneLink(links[i]);
			i--;
		}
	}
}

function clearOneLink(element) {
	element.outerHTML = element.innerHTML;
}

function linkCallback(event) {
	if (event.keyCode !== undefined)
		if (event.keyCode !== 13 && event.keyCode !== 32)
			return;
	event.preventDefault();
	var target_id = this.hash.slice(1);
	var target = document.getElementById(target_id);
	if (target === null) {
		alert("Broken link!");
		return;
	}
	if (this.rel === "clear") {
		transcript.innerHTML = "";
	} else if (this.rel === "continue") {
		clearLinks(transcript.getElementsByTagName("a"));
		transcript.appendChild(document.createElement("hr"));
	} else if (this.rel === "reset") {
		if (status_line !== null) status_line.innerHTML = "";
		if (moves_line !== null) moves_line.innerHTML = "0";
		if (score_line !== null) score_line.innerHTML = "0";
		
		transcript.innerHTML = "";
		moves = 0;
		score = {};
		visited = {};
	} else if (this.rel === "replace") {
		var clone = fetchFragment(target);
		while (clone.childNodes.length > 0)
			this.parentNode.insertBefore(clone.firstChild, this);
		this.parentNode.removeChild(this);
		return;
	} else {
		clearOneLink(this);
	}
	moves++;
	if (moves_line !== null)
		moves_line.innerText = moves;
	advanceStory(target);
}

// Micro-interpreter for a very simple template language.

var commands = {};

function runScripts(fragment) {
	var lines = fragment.innerHTML.split("\n");
	fragment.innerHTML = lines.map(substLine).join("\n");
}

function substLine(text) {
	var text2 = text.replace(/^\s*#(\S+)(.*)$/, substCall);
	return (text !== text2) ? text2 : substEval(text);
}

function substEval(text) {
	try {
		var subst = function (_, code) { return eval(code); };
		return text.replace(/{{(.*?)}}/g, subst);
	} catch (e) {
		console.error("Error in expression: " + text);
		console.error(e);
		return "";
	}
}

function substCall(line, name, args) {
	if (name in commands) {
		try {
			return commands[name](args);
		} catch (e) {
			console.error("Error in command: " + line);
			console.error(e);
			return "";
		}
	} else {
		return line;
	}
}

var _test;

commands.test = function (code) { _test = eval(code); return ""; };
commands.iftrue = function (code) { return _test ? substEval(code) : ""; };
commands.iffalse = function (code) { return _test ? "" : substEval(code); };

commands["do"] = function (code) { eval(code); return ""; };
commands["include"] = function (code) {	return include(eval(code)); };

function include(id) {
	var target = document.getElementById(id);
	if (target !== null) {
		return fetchFragment(target).outerHTML;
	} else {
		console.warn("Bad include: " + id);
		return "";
	}
}

commands.literal = function (code) { return (code); };

// Utility functions for use by authors in their scripts.

function inline(id) {
	var target = document.getElementById(id);
	if (target !== null) {
		return fetchFragment(target).innerHTML;
	} else {
		console.warn("Bad inline: " + id);
		return "";
	}
}

function and(a, b) { return a && b; };
function lt(a, b) { return a < b; };
function lte(a, b) { return a <= b; };
function gt(a, b) { return a > b; };
function gte(a, b) { return a >= b; };