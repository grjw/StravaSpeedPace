// ==UserScript==
// @name         Strava Speed/Pace in Activity List
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Adds speed and pace columns in Strava activity list page
// @author       You
// @match        https://www.strava.com/athlete/training
// @grant        none
// @require http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==


function parseDistance(dist)
{
	// Get the distance number and unit from distance cell. Handily, they are all on different lines
	let distComponents = dist.split("\n");
	return [distComponents[1], distComponents[3]]; //  distance, unit
}

function getSpeed(dist, distUnit, time)
{
	let timeInHours = 0;
	let timeComponents = time.split(":");

	if (timeComponents.length == 1)
	{
		// Secs only
		timeInHours = (parseInt(timeComponents[0]) / 60) / 60;
	}
	else if (timeComponents.length == 2)
	{
		// Mins and secs
		timeInHours = (parseInt(timeComponents[0]) / 60) + (parseInt(timeComponents[1]) / 60) / 60;
	}
	else if (timeComponents.length == 3)
	{
		// Hours, mins and secs
		timeInHours = parseInt(timeComponents[0]) + (parseInt(timeComponents[1]) / 60) + (parseInt(timeComponents[2]) / 60) / 60;
	}

	let speed = (dist / timeInHours).toFixed(1) + (distUnit == "km" ? " kph" : " mph");

	return speed;
}

function getPace(dist, distUnit, time)
{
	let timeInMins = 0;
	let timeComponents = time.split(":");

	if (timeComponents.length == 1)
	{
		// Secs only
		timeInMins = parseInt(timeComponents[0]) / 60;
	}
	else if (timeComponents.length == 2)
	{
		// Mins and secs
		timeInMins = parseInt(timeComponents[0]) + (parseInt(timeComponents[1]) / 60);
	}
	else if (timeComponents.length == 3)
	{
		// Hours, mins and secs
		timeInMins = (parseInt(timeComponents[0]) * 60) + parseInt(timeComponents[1]) + (parseInt(timeComponents[2]) / 60);
	}

	let pace = (timeInMins / dist);
	let paceStr = Math.floor(pace) + ":" + ((pace % 1) * 60).toFixed(0) + (distUnit == "km" ? " min/km" : " min/mile");
	return paceStr;
}

(function() {
	'use strict';

	// Create an MutationObserver for when the table is loaded

	// Select the node that will be observed for mutations
	const targetNode = document.getElementById('search-results');

	// Options for the observer (which mutations to observe)
	const config = { childList: true, subtree: true };

	// Callback function to execute when mutations are observed
	const callback = function(mutationsList, observer)
	{
		// Disable observer so it doesn't trip again when we add to the table
		observer.disconnect();

		// If you load the table and then filter it, we don't want to add the header cells again
		if ($("#search-results th.col-speed").length == 0)
		{
			let distanceHeader = $("[data-order^='distance']").closest("th");
			$("<th class=\"btn-xs col-speed\">Avg Speed</th><th class=\"btn-xs col-speed\">Pace</th>").insertAfter(distanceHeader);
		}

		var rows = $("#search-results tbody tr.training-activity-row");
		rows.each(function () {
			let dist = $(this).children(".col-dist").first().html();
			let time = $(this).children(".col-time").first().text();

			let distanceComponents = parseDistance(dist);
			let speed = getSpeed(distanceComponents[0], distanceComponents[1], time);
			let pace = getPace(distanceComponents[0], distanceComponents[1], time);

			$("<td>" + speed + "</td><td>" + pace + "</td>").insertAfter($(this).children(".col-dist").first());
		});

		// Enable the observer again in case we filter the table and ti reloads
		observer.observe(targetNode, config);
	};

	// Create an observer instance linked to the callback function
	const observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);
})();

