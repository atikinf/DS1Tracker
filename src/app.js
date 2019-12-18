import * as d3 from 'd3';
import * as satellite from 'satellite.js';

const width = window.innerWidth * 0.9;
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
const tle1 = '1 25544U 98067A   19351.88846509 -.00000132  00000-0  57270-5 0  9990'
const tle2 = '2 25544  51.6427 170.5927 0007523  47.2078  98.3169 15.50120838203759'

const satrec = satellite.twoline2satrec(tle1, tle2);
const gmst = satellite.gstime(new Date());

// Generate ground path array
const intervals = Array.from({length: 180}, (x,i) => 2 * (i - 90));
const trackArr = intervals.map(function(x) {
    const positionEci = satellite.sgp4(satrec, x).position;
    const positionGeodetic = satellite.eciToGeodetic(positionEci, gmst);
    const long = Number(satellite.degreesLong(positionGeodetic.longitude));
    const lat = Number(satellite.degreesLat(positionGeodetic.latitude));
    return [long, lat];
});
console.log(trackArr);

const canvas = d3.select('body').append('canvas')
    .attr('width', width)
    .attr('height', width / 2);

const context = canvas.node().getContext('2d');
context.strokeStyle = `rgba(255, 0, 0, 1)`;
context.lineWidth = 0.5;

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
        context.drawImage(img, 0, 0, img.width, img.height,
                               0, 0, width, width / 2);
        let start = trackArr[0];
        for (let i = 1; i < trackArr.length; i++) {
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
    });




