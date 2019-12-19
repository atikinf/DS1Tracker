import * as d3 from 'd3';
import * as satellite from 'satellite.js';

// ToDo: Tweak width
const width = window.innerWidth * 0.95;
const url = 'https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/NORAD_CAT_ID/25544/orderby/TLE_LINE1%20ASC/format/tle';

// Get TLE
let tle = '';
d3.text(url)
.then(function(text) { 
    console.log(text);
    tle = text;
    return console.log(tle);
})
.catch(e => {
    return console.warn(e);
});

// Temporarily hardcoded:
const tle1 = '1 25544U 98067A   19352.59085716 -.00000266  00000-0  33982-5 0  9996';
const tle2 = '2 25544  51.6429 167.1127 0007479  50.0306  57.7349 15.50120604203863';

const satrec = satellite.twoline2satrec(tle1, tle2);
const gmst = satellite.gstime(new Date());

// Generate ground path array
const size = 30;
const intervals = Array.from({length: size}, (x,i) => 2 * (i - size / 2));
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

const earth = d3.image(
    "https://gist.githubusercontent.com/jake-low/d519e00853b15e9cec391c3dab58e77f/raw/6e796038e4f34524059997f8e1f1c42ea289d805/ne1-small.png",
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
        drawVisibleArea(context, path, satCoords);
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
function drawVisibleArea(context, path, satCoords) {
    context.strokeStyle = `rgba(255, 0, 0, 1)`;
    // Calculate visible angle
    const earthRadius = 6356;
    const angle = Math.acos(earthRadius / earthRadius + altitude);
    const area = d3.geoCircle().center(satCoords)
                               .radius(15)(angle);
    console.log(area);
    context.beginPath();
    path(area);
    context.stroke();
}

// Adds minutes to the given date, returning a new Date object
function datePlusInterval(date, minutes) {
    return new Date(date.getTime() + 60000 * minutes);
}
