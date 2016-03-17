function colores_google(n) {
  var colores_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
  return colores_g[n % colores_g.length];
}

function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

var colors = { "end": "#bbbbbb" };

// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
queue()
	.defer(d3.json, "json/tfl_lines.json")
	.defer(d3.json, "json/tfl_stations.json")
	.defer(d3.csv, "data/sampleUser_stations.csv")
	.defer(d3.csv, "data/sampleUser_ODpairs.csv")
	.defer(d3.text, "data/sampleUser_sequences.csv")
	.await(function(error, json1, json2, csv, csv2, text) {
		stations = csv;

		for (var i = 0; i < stations.length; i++) {
			if (i < 10) {
				colors[stations[i].name] = colores_google(i);
			}
			else {
				colors[stations[i].name] = getRandomColor();
			}
		}

		makeMap(json1, json2, stations);
		
		var mpr = chordMpr(csv2);
		mpr.addValuesToMap('origin')
			//.addValuesToMap('destination')
			.setFilter(function (row, a, b) {
				return (row.origin === a.name && row.destination === b.name);
			})
			.setAccessor(function (recs, a, b) {
				if (!recs[0]) return 0;
				return +recs[0].count;
			});
		drawChords(mpr.getMatrix(), mpr.getMap());

		seqs = buildHierarchy(d3.csv.parseRows(text));
		drawSunburst(seqs);
	});