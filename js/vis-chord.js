//*******************************************************************
//  DRAW THE CHORD DIAGRAM
//*******************************************************************
function drawChords(matrix, mmap) {
	var w = 900, h = 700, r1 = h / 2, r0 = r1 - 100;

	var chord = d3.layout.chord()
		.padding(0.02)
		.sortSubgroups(d3.descending)
		.sortChords(d3.descending);

	var arc = d3.svg.arc()
		.innerRadius(r0)
		.outerRadius(r0 + 20);

	var svgCanvas = d3.select("#chord-holder").append("svg:svg")
		.attr("class", "viz-holder")
		.attr("width", w)
		.attr("height", h);

	var rect = svgCanvas.append("svg:rect")
			.attr("width", w)
			.attr("height", h)
			.attr("fill", "transparent");
	
	var svg = svgCanvas.append("svg:g")
			.attr("id", "circle")
			.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

	svg.append("circle")
		.attr("r", r0 + 20 + 80);

	var rdr = chordRdr(matrix, mmap);
	chord.matrix(matrix);

	var g = svg.selectAll("g.group")
		.data(chord.groups())
		.enter()
		.append("svg:g")
			.attr("class", "group")
			.on("mouseover", function(d, i) {
				d3.select("#tooltip")
					.style("visibility", "visible")
					.html(groupTip(rdr(d)))
					.style("top", function () { return (d3.event.pageY - 80)+"px"; })
					.style("left", function () { return (d3.event.pageX - 130)+"px";});

				chordPaths.classed("fade", function(p) {
					return p.source.index != i && p.target.index != i;
				});
			})
			.on("mouseout", function(d) {
				d3.select("#tooltip").style("visibility", "hidden");
			});

	g.append("svg:path")
		.style("stroke", "black")
		.style("fill", function(d) {
			return colors[rdr(d).gname];
		})
		.attr("d", arc);

	g.append("svg:text")
		.each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
		.attr("dy", ".35em")
		.style("font-family", "helvetica, arial, sans-serif")
		.style("font-size", "10px")
		.attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
		.attr("transform", function(d) {
			return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
				"translate(" + (r0 + 26) + ")" +
				(d.angle > Math.PI ? "rotate(180)" : "");
		})
		.text(function(d) { return rdr(d).gname; });

	var chordPaths = svg.selectAll("path.chord")
		.data(chord.chords())
		.enter()
		.append("svg:path")
			.attr("class", "chord")
			.style("stroke", function(d) {
				return d3.rgb(colors[rdr(d).sname]).darker();
			})
			.style("fill", function(d) {
				return colors[rdr(d).sname];
			})
			.attr("d", d3.svg.chord().radius(r0))
			.on("mouseover", function (d) {
				d3.select("#tooltip")
					.style("visibility", "visible")
					.html(chordTip(rdr(d)))
					.style("top", function () { return (d3.event.pageY - 100)+"px"; })
					.style("left", function () { return (d3.event.pageX - 100)+"px"; });
			})
			.on("mouseout", function (d) {
				d3.select("#tooltip").style("visibility", "hidden");
			});

	rect.on("mouseover", function(d) {
		chordPaths.attr("class", "chord");
	});

	function chordTip (d) {
		var p = d3.format(".1%"), q = d3.format(",.0f");
		return "Chord Info:<br/>" +
			p(d.svalue/d.stotal) + " (" + q(d.svalue) + ") of users tap-in at " +
			d.sname + " tap-out at " + d.tname +
			(d.sname === d.tname ? "": ("<br/>while...<br/>" +
				p(d.tvalue/d.ttotal) + " (" + q(d.tvalue) + ") of users tap-in at " +
				d.tname + " tap-out at " + d.sname));
	}

	function groupTip (d) {
		var p = d3.format(".1%"), q = d3.format(",.0f");
		return "Group Info:<br/>" +
			"Trips originating from " + d.gname + " : " + q(d.gvalue) + "<br/>" +
			p(d.gvalue/d.mtotal) + " of total trips (" + q(d.mtotal) + ")";
	}
	//console.log(chordPaths);

}


//*******************************************************************
//  CHORD MAPPER 
//*******************************************************************
function chordMpr (data) {
	var mpr = {}, mmap = {}, n = 0,
		matrix = [], filter, accessor;

	mpr.setFilter = function (fun) {
		filter = fun;
		return this;
	},
	mpr.setAccessor = function (fun) {
		accessor = fun;
		return this;
	},
	mpr.getMatrix = function () {
		matrix = [];
		_.each(mmap, function (a) {
			if (!matrix[a.id]) matrix[a.id] = [];
			_.each(mmap, function (b) {
				var recs = _.filter(data, function (row) {
					return filter(row, a, b);
				});
				matrix[a.id][b.id] = accessor(recs, a, b);
		  	});
		});
		return matrix;
	},
	mpr.getMap = function () {
		return mmap;
	},
	mpr.printMatrix = function () {
		_.each(matrix, function (elem) {
			console.log(elem);
		});
	},
	mpr.addToMap = function (value, info) {
		if (!mmap[value]) {
			mmap[value] = { name: value, id: n++, data: info };
		}
	},
	mpr.addValuesToMap = function (varName, info) {
		var values = _.uniq(_.pluck(data, varName));
		_.map(values, function (v) {
			if (!mmap[v]) {
				mmap[v] = { name: v, id: n++, data: info };
			}
		});
		return this;
	};
	return mpr;
}
//*******************************************************************
//  CHORD READER
//*******************************************************************
function chordRdr (matrix, mmap) {
	return function (d) {
		var i,j,s,t,g,m = {};
		if (d.source) {
			i = d.source.index; j = d.target.index;
			s = _.where(mmap, {id: i });
			t = _.where(mmap, {id: j });
			m.sname = s[0].name;
			m.sdata = d.source.value;
			m.svalue = +d.source.value;
			m.stotal = _.reduce(matrix[i], function (k, n) { return k + n; }, 0);
			m.tname = t[0].name;
			m.tdata = d.target.value;
			m.tvalue = +d.target.value;
			m.ttotal = _.reduce(matrix[j], function (k, n) { return k + n; }, 0);
		} else {
			g = _.where(mmap, {id: d.index });
			m.gname = g[0].name;
			m.gdata = g[0].data;
			m.gvalue = d.value;
		}
		m.mtotal = _.reduce(matrix, function (m1, n1) { 
			return m1 + _.reduce(n1, function (m2, n2) { return m2 + n2; }, 0);
		}, 0);
		return m;
  };
}
