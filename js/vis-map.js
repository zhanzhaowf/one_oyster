function makeMap(lineCollection, stationCollection, userStations) {

	var map = new L.Map("map", {center: [51.52, -0.15], zoom:11})
		.addLayer(new L.TileLayer("http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png", {
			maxZoom: 15,
			minZoom: 8,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}));

	var lineStyle = {
		"weight": 1
	};

	L.geoJson(lineCollection.features, {
		style: lineStyle
	}).addTo(map);

	var geojsonMarkerOptions = {
		radius: 1,
		fillColor: "#ff7800",
		color: "#000",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	};

	L.geoJson(stationCollection.features, {
		pointToLayer: function (feature, latlng) {
			return L.circleMarker(latlng, geojsonMarkerOptions);
			}
		}).addTo(map);

	var svg = d3.select(map.getPanes().overlayPane).append("svg");
	var g = svg.append("g").attr("class", "leaflet-zoom-hide");
	
	/*
	var lines = g.selectAll("#tfl-line")
		.data(lineCollection.features)
		.enter()
		.append("path")
		.attr("class", "tfl-line");

	var stations = g.selectAll("#tfl-station")
		.data(stationCollection.features)
		.enter()
		.append("circle")
		.attr("class", "#tfl-station");
	*/
	var stations = {};

	for (var i = 0; i < userStations.length; i++) {
		station = userStations[i].name.replace("_", " ");
		if (station.indexOf(" LU") > -1) {
			station = station.slice(0, station.length - 3);
		}
		stations[station] = userStations[i];
	}
	//console.log(stations);

	var filteredFeatures = stationCollection.features.filter(function(d) {
		console.log(d.properties.name);
		return stations.hasOwnProperty(d.properties.name);
	});

	filteredFeatures.forEach(function(d) {
		d.LatLng = new L.LatLng(d.geometry.coordinates[1],
			d.geometry.coordinates[0]);
		d.inCount = +stations[d.properties.name].inCount;
		d.outCount = +stations[d.properties.name].outCount;
		d.count = d.inCount + d.outCount;
	});
	//console.log(filteredFeatures);

	var rScale = d3.scale.log()
		.range([3, 30]);

	// Initialize tool-tip
	var tip = d3.tip().attr("class", "d3-tip");
	svg.call(tip);

	var circles = g.selectAll("#station")
		.data(filteredFeatures)
		.enter()
		.append("circle")
			.attr("class", "station")
			.style("fill", function(d) {
				return colors[stations[d.properties.name].name];
			})
			.on("mouseover", tip.show)
			.on("mouseout", tip.hide);

	updateRadius();

	function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
	}

	var transform = d3.geo.transform({point: projectPoint}),
		path = d3.geo.path().projection(transform);

	map.on("viewreset", reset);

	d3.select("#station-type").on("change", updateRadius);
	
	reset();

	function reset() {
		circles.attr("transform", function(d) {
			return "translate(" +
				map.latLngToLayerPoint(d.LatLng).x + "," +
				map.latLngToLayerPoint(d.LatLng).y + ")";
		});

		var bounds = path.bounds(stationCollection),
			topLeft = bounds[0],
			bottomRight = bounds[1];

		svg.attr("width", bottomRight[0] - topLeft[0])
			.attr("height", bottomRight[1] - topLeft[1])
			.style("left", topLeft[0] + "px")
			.style("top", topLeft[1] + "px");

		g.attr("transform", "translate(" + -topLeft[0] + ", " + -topLeft[1] + ")");
	}

	function updateRadius() {

		var selected = d3.select("#station-type").property("value");
		rScale.domain([1, 1000]);

		tip.html(function(d) {
			return "<div class='tooltip-title'><p>" + d.properties.name + ": " +
				d[selected] + "</p></div>";
		});

		circles.transition().duration(500)
			.attr("r", function(d) {
			if (d[selected] === 0)
				return 0;
			else
				return rScale(d[selected]);
		});
	}

}