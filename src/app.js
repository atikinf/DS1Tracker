// Copyright 2020 Nikita Filippov
// Nikita Filippov, 1242477, nikitaf@cs.washington.edu 
// Use however or something, idk

import * as d3 from 'd3';
import * as satellite from 'satellite.js';

/*
 * Functions for plotting a satellite's path on the Earth
 * NOTE: var json is passed in via php in this implementation, 
 * so you need to define it yourself normally
 */

// Potential ToDo: Tweak width
const width = window.innerWidth * 0.95;

// Ground track parameters
const size = 30;
const intervals = Array.from({length: size}, (x,i) => 2 * (i - size / 2));

// Add canvas and its container to DOM
const canvasContainer = d3.select('body').append('div')
    .attr('id', 'container');
const canvas = canvasContainer.append('canvas')
    .attr('width', width)
    .attr('height', width / 2);

const context = canvas.node().getContext('2d');

// Draw map and ground path
const projection = d3.geoEquirectangular()
    .fitSize([width, width/2], { type: 'Sphere' })
    .precision(0.1);
const path = d3.geoPath()
    .projection(projection)
    .context(context);


// var json is passed in through index.php
// Parse TLE
const tle = json.tle;
const tleSplit = tle.split(/\r?\n/);
const tle1 = tleSplit[0];
const tle2 = tleSplit[1];

const satrec = satellite.twoline2satrec(tle1, tle2);

const gmst = satellite.gstime(new Date());

// Generate ground path array
const currentDate = new Date();
const trackArr = intervals.map(function(x) {
    const positionEci = satellite.propagate(satrec, 
                                            datePlusInterval(currentDate, x)).position;
    const positionGeodetic = satellite.eciToGeodetic(positionEci, gmst);
    return [Number(satellite.degreesLong(positionGeodetic.longitude)), 
            Number(satellite.degreesLat(positionGeodetic.latitude))];
});

// Current altitude in kilometers
const altitude = satellite.eciToGeodetic(satellite.propagate(satrec, currentDate).position).height;

const earth_url = "https://gist.githubusercontent.com/atikinf/b3b50057151a30884b22949f448b7185/raw/1aff4fcfd6798e69223ee5e2405961b9a9c4557f/NE1_50M_SR_W.jpg";
const backup_url = "https://gist.githubusercontent.com/jake-low/d519e00853b15e9cec391c3dab58e77f/raw/6e796038e4f34524059997f8e1f1c42ea289d805/ne1-small.png";

const earth = d3.image(earth_url,
    {crossOrigin: "anonymous"})
    .then(function(img) {
        context.lineWidth = 1 + width / 2000;

        // Draw map
        context.drawImage(img, 0, 0, img.width, img.height,
                               0, 0, width, width / 2);

        drawGroundPath(context, path, trackArr);
        drawIntervalText(context, trackArr);

        const satCoords = [trackArr[size / 2 + 1][0], trackArr[size / 2 + 1][1]];
        drawSatellite(context, satCoords);
        drawVisibleArea(context, path, satCoords, altitude);
    })
    .catch((e) => {
        return console.log(e);
    });


// Draw satellite ground path
function drawGroundPath(context, path, trackArr) {
    const upperValue = Math.abs(-size / 2);
    context.strokeStyle = `rgba(${(1 - Math.abs(-size / 2) / upperValue) * 255}, 0, 
                                ${(Math.abs(-size / 2) / upperValue) * 255}, 1)`;
    let start = trackArr[0];
    for (let i = 1; i < trackArr.length; i++) {
        context.strokeStyle = `rgba(${(1 - Math.abs(i - size / 2) / upperValue) * 255}, 0,
                                    ${(Math.abs(i - size / 2) / upperValue) * 255}, 1)`;
        let end = trackArr[i];
        const segment = {
            type: 'LineString',
            coordinates: [start, end],
        };
        context.beginPath();
        path(segment);
        context.stroke();
        start = end;
    }
}

// Draw text specifying the time passed at both ends of the ground path
function drawIntervalText(context, trackArr) {
    const startCoordsProj = projection(trackArr[0]);
    const endCoordsProj = projection(trackArr[trackArr.length - 1]);
    context.beginPath();
    context.font = `${Math.floor(width / 60)}px Open Sans`;
    context.textAlign = 'left'
    context.textBaseline = "middle"
    context.fillText(`+${size} mins`, 
                        endCoordsProj[0] + width / 80, 
                        endCoordsProj[1]);
    context.fillText(`-${size} mins`, 
                        startCoordsProj[0] + width / 80, 
                        startCoordsProj[1]);
    context.fill();
}

// Draw a dot denoting the location of the satellite
function drawSatellite(context, satCoords) {
    const projCoords = projection(satCoords);
    context.strokeStyle = `rgba(0, 0, 0, 1)`;
    context.beginPath()
    context.arc(projCoords[0], projCoords[1], 5, 0, 2 * Math.PI);
    context.fill();
}

// Draw a curve denoting the ground visible by the satellite
function drawVisibleArea(context, path, satCoords, altitude) {
    context.strokeStyle = `rgba(255, 0, 0, 1)`;
    // Calculate visible angle
    const earthRadius = 6356;
    const angle = Math.acos(earthRadius / earthRadius + altitude);
    const area = d3.geoCircle().center(satCoords)
                               .radius(15)(angle);
    context.beginPath();
    path(area);
    context.stroke();
}

// Adds minutes to the given date, returning a new Date object
function datePlusInterval(date, minutes) {
    return new Date(date.getTime() + 60000 * minutes);
}
