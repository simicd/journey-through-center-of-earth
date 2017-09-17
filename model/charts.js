import * as d3 from 'd3';
import * as color from 'd3-scale-chromatic'; 

var size = { height: 500, width: 500 };
var margin = 20;

var scale = 120;
var globeSize = 250;
var velocity = 0.02;

var globeProjection;
var mapColor = "lightgray"
var positionColor = "rgb(204, 153, 0)";
var globeColor = color.interpolatePuOr(0.1);
var lakeColor = "lightblue";
var borderColor = "rgb(249,246,241)";

var coordJson = {
    "type": "Feature",
    "properties": {
        "name": "position",
    },
    "geometry": {
        "type": "Point",
        "coordinates": [8, 46]
    }
};
var coordAntipodeJson = {
    "type": "Feature",
    "properties": {
        "name": "antipode",
    },
    "geometry": {
        "type": "Point",
        "coordinates": antipode(coordJson.geometry.coordinates)
    }
};

function drawGlobe(geo) {
    // Spherical globe projection
    globeProjection = d3.geoOrthographic()
        .translate([scale, scale])
        .scale(scale)
        .clipAngle(90)
        // .rotate([20, -40]);

    // Path generator
    var path = d3.geoPath()
        .projection(globeProjection);

    // Create svg
    var svg = d3.select("#globe").append("svg")
        .attr("id", "globe")
        .attr("width", globeSize)
        .attr("height", globeSize)

    // Create water layer (sphere)
    svg.append("g").append("path")
        .datum({ type: "Sphere" })
        .attr("class", "water")
        .attr("d", path)
        .attr("fill", lakeColor)
        .attr("fill-opacity", 0.5);

    // Plot countries
    svg.append("g").selectAll("path")
        .data(geo.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", globeColor)
        .attr("fill-opacity", 1);   

    // Rotation scale 
    var lambda = d3.scaleLinear()
        .domain([0, size.width])
        .range([-180, 180]);

    // Reposition countries and position/antipode point every 20 miliseconds
    var current = 390;
    setInterval(() => {
        current += 1;
        globeProjection.rotate([lambda(current), 0]);
        svg.selectAll("path").attr("d", path);

        d3.select("#globe .position").attr("d", path(coordJson));
        d3.select("#globe .antipode").attr("d", path(coordAntipodeJson));
    }, 20);

    // Draw selected position and antipode on the globe
    var points = svg.append("g")
        .attr("class", "point")
        .selectAll("path")
        .data([coordJson, coordAntipodeJson])
        .enter();

    points.append("path")
        .attr("class", (d) => { return d.properties.name; })
        .attr("d", path)
        .attr("fill", positionColor)
        .attr("stroke", borderColor);

}

/**
 * Draw all possible projections provided by d3-geo
 * @param {*} geo GeoJson file
 */
function drawAllProjections(geo) {
    var projectionList = [d3.geoAlbers(), d3.geoAzimuthalEqualArea(), d3.geoAzimuthalEquidistant(),
        d3.geoConicConformal(), d3.geoConicEqualArea(), d3.geoConicEquidistant(),
        d3.geoEquirectangular(), d3.geoGnomonic(),
        d3.geoMercator(), d3.geoStereographic(), d3.geoTransverseMercator()];

    var id = 0;
    projectionList.forEach(proj => {
        drawPojection(geo, proj, id++)
    });
}

/**
 * Draw Mercator projection
 * @param {*} geo GeoJson file
 */
function drawMercatorProjection(geo) {
    drawPojection(geo, d3.geoMercator(), 0);
}

/**
 * Draws map based on passed projection
 * @param {*} geo GeoJson file
 * @param {*} proj Geoprojection
 * @param {*} id Map id
 */
function drawPojection(geo, proj, mapId) {
    // Provided projection
    // var projection = d3.geo()
    //     .fitExtent([[margin, margin], [size.width-margin, size.height-margin]], geo);
    var projection = proj
        .fitExtent([[margin, margin], [size.width-margin, size.height]], geo);

    // Path generator
    var path = d3.geoPath()
        .projection(projection);

    // Create svg
    var svg = d3.select("#map").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 " + size.width + " " + (size.height - 30))
        .attr("id", "projection" + mapId);
    
    // Draw graticules
    // var graticule = d3.geoGraticule();

    // var lines = svg.append("g")
    //     .attr("class", "lines")
    //     .datum(graticule)
    //     .append("path")
    //     .attr("d", path)
    //     .attr("stroke", "lightgray")
    //     .attr("stroke-width", "1px")
    //     .attr("fill", "none");
        
    // Plot countries
    var countryData = svg.append("g")
        .attr("class", "country")
        // .attr("transform", "translate(-100,0)")
        .selectAll("path")
        .data(geo.features);

    var colorScale = d3.scaleOrdinal(color.schemeYlGnBu[9]);
    var scale = d3.scaleLinear().domain([0,1]).range([0.2,0.25])
    countryData.enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", borderColor)
        .attr("stroke-width", 0.5)
        .attr("fill", (d,i) => { return color.interpolatePuOr(scale(Math.random())); })
        .attr("fill-opacity", 1);

    // Draw selected position and antipode on the map
    var point = svg.append("g")
        .attr("class", "point")
        // .attr("transform", "translate(-100,0)")
        .selectAll("path")
        .data([coordJson, coordAntipodeJson])
        .enter();

    point.append("path")
        .attr("class", (d) => { return d.properties.name; })
        .attr("d", path)
        .attr("fill", positionColor)
        .attr("stroke", borderColor)
        .call(d3.drag().on("drag", (d) => {dragged(d.geometry.coordinates, proj, path, mapId)})); // Makes points draggable

}

/**
 * Event function triggered on drag event. Calculate the coordinates, 
 * update position and antipode position and the points on the map
 * @param {*} d Selected data point
 * @param {*} proj Geo projection
 * @param {*} path Path constructor
 * @param {*} id Map id
 */
function dragged(d, proj, path, id) {
    var coord = proj.invert([d3.event.x, d3.event.y]);
    var coordAntipode = antipode(coord);

    coordJson.geometry.coordinates = coord;
    coordAntipodeJson.geometry.coordinates = coordAntipode;
    d3.select("#projection" + id + " .position").attr("d", path(coordJson));
    d3.select("#projection" + id + " .antipode").attr("d", path(coordAntipodeJson));
}

/**
 * Calculate the position on the opposite side of the world
 * @param {*} coordinates Array with [longitude, latitude]
 */
function antipode(coordinates) {
    var long = coordinates[0],
        lat = coordinates[1];
    var antiLong,
        antiLat;

    if (long >= 0) {
        antiLong = long - 180;
    } else {
        antiLong = long + 180;
    }

    antiLat = -lat;
    return [antiLong, antiLat];
}

/**
 * Read json object from data folder and draw map and globe
 */
function globe() {
    d3.json("./wwwroot/data/countries.geo.json", (file) => {
        drawGlobe(file);
        // drawAllProjections(file);
        drawMercatorProjection(file);
    })
}


export {
    globe
}