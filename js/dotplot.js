/**
 * Created by zr in January, 2017.
 */
/*
 #######################--- Methods for Generating DotPlots ---############################
 */

var matrix = []; // table data, globally accessible //todo: should become obselete

function hover_default(x, y, z){
    var tooltip = d3.select("#tooltip");
    tooltip.style("position", "absolute")    //todo: define in stylesheet
        .style("text-align", "center")
        .style("width", "60px")
        .style("height", "28px")
        .style("padding", "2px")
        .style("font", "12px sans-serif")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none");
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    if (y !== 0 && x !== 0) {
        if (z.toFixed(4) > 0.0000){
            tooltip.html("(" + x + ", " + y + ")<br/>" + z.toFixed(4))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            // return "(" + x + ", " + y + ")<br/>" + z.toFixed(4);
        }
    }
}

function click_default(x, y, z){
    var tooltip = d3.select("#tooltip");
    tooltip.style("opacity", 0)    //todo: define in stylesheet
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "60px")
        .style("height","28px")
        .style("padding", "2px")
        .style("font","12px sans-serif")
        .style("background", "lightgreen")
        .style("border", "0px")
        .style("border-radius", "16px")
        .style("pointer-events", "none");
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    if (y !== 0 && x !== 0) {
        tooltip.html("(" + x + ", " + y + ")<br/>" + z.toFixed(4))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }
}

function dotplot(sequence, table, pname, hover_reaction, click_reaction) {

    if(hover_reaction === undefined){
        hover_reaction = hover_default;
    }

    if(click_reaction === undefined){
        click_reaction = click_default;
    }

    // validate input sequence
    for (var s=0; s<sequence.length; s++){
        if (sequence[s] != "A" && sequence[s] != "C" && sequence[s] != "G" && sequence[s] != "U"){
            alert("Sequence must contain only RNA nucleotide letters");
            return "<p>Invalid input sequence</p>";
        }
    }

    // validate table size
    if(table.length -1 != sequence.length || table[0].length -1 != sequence.length){
        alert("Invalid matrix dimensions");
        return "<p>Invalid table entries</p>"
    }

    var maindic = {};
    var bpp = [];
    var mlp = [];
    var keys=["source", "target", "value"];

    for(var i=1; i<table.length; i++){
        for(var j=1; j<table[i].length; j++){
            var a = table[i][j].i;
            var b = table[i][j].j;
            //var c = Math.pow(parseFloat(table[i][j].value), 0.5);
            var c = parseFloat(table[i][j].value);
            c = parseFloat(c.toFixed(3));
            if(c > 1 || c < 0){
                alert("Invalid probability value found in the data.");
                return;
            }
            var roww = {};
            roww[keys[0]]=a;
            roww[keys[1]]=b;
            roww[keys[2]]=Math.max(c, 0.000001);
            bpp.push(roww);
            mlp.push(roww);
        }
    }

    maindic['sequence'] = sequence;
    maindic["base-pairing-probabilities"] = bpp;
    maindic["optimal-structure"] = mlp;

    // resize parent div to quadratic dimensions
    var parent_width = $("#"+pname).width();
    var parent_height = $("#"+pname).height();
    var svg_dim = Number(Math.min(parent_width, parent_height));
    document.getElementById(pname).style.width = svg_dim + "px";
    document.getElementById(pname).style.height = svg_dim + "px";

    var bpm = maindic;
    var width = svg_dim,
        height = svg_dim;
    var x = d3.scale.ordinal().rangeBands([0, width]),
        z = d3.scale.linear().domain([0, 1]).clamp(true);

    // Zoom functionality code
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    function zoomed() {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function dragstarted() {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
        d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
    }

    function dragended() {
        d3.select(this).classed("dragging", false);
    }

    // draw border of parent div
    var dev = document.getElementById(pname);
    d3.select(dev).style("border", "1px solid black");

    var tooltip = d3.select(dev).append("div").attr("id", "tooltip");

    var svg = d3.select(dev).append("svg")
        .attr("id", pname+"_svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("border",1)
        .attr("fill", "black")
        .call(zoom)
        .on("dblclick.zoom", function() {
            svg.attr("transform", "scale(1)")
        });

    function color_headers(x, y, pname){
        d3.selectAll("rect").style("fill", "white");    // remove previous header shading, if any
        d3.select("#" + pname + "_border_" + x +"_0").style("fill", "lightcoral");
        d3.select("#" + pname + "_border_" + y +"_0").style("fill", "lightcoral");
    }

    function renderarc(x, y, pname, rect_dim) {
        d3.selectAll("#"+pname+"_arc_polyline").remove();    // remove previously drawn arc, if any

        if (x!==y) {
            var x1 = (rect_dim / 2) + (rect_dim * x), // vertical tick
                y1 = rect_dim / 4,
                x2 = (rect_dim / 2) + (rect_dim * x), // actual arc/line start point
                y2 = rect_dim / 6,
                x3 = (rect_dim / 2) + (rect_dim * y), // arc/line end point
                y3 = rect_dim / 6,
                x4 = (rect_dim / 2) + (rect_dim * y), // vertical tick
                y4 = rect_dim / 4;
            d3.select("#" + pname + "_svg").select("g").append("polyline")
                .attr("id", pname + "_arc_polyline")
                .style("stroke-width", "2")
                .style("stroke", "royalblue")
                .style("fill", "none")
                .attr("points",
                    x1 + "," + y1 + ", " +
                    x2 + "," + y2 + ", " +
                    x3 + "," + y3 + ", " +
                    x4 + "," + y4);
        }
    }

    function onHover(d) {
        if (typeof d.z === 'number'){
            hover_reaction(d.x, d.y, d.z);
        }
    }

    function mouseout(){
        tooltip.transition()
            .duration(100)
            .style("opacity", 0);
    }

    function onClick(d) {
        color_headers(d.x, d.y, pname);
        renderarc(d.x, d.y, pname, rect_dim);
        click_reaction(d.x, d.y, d.z);
    }

    var seq = bpm["sequence"];
    var isequence = bpm["sequence"];
    var n = seq.length + 1;
    isequence=seq.split("");

    x.domain(d3.range(n));
    [null].concat(isequence).forEach(function(base, i) {
        // base.index = i;
        matrix[i] = d3.range(n).map(function(j) {
            if(j===0 && i!==0){
                return {x: j, y:i, z:isequence[i-1]};
            } else if(i===0 && j!==0) {
                return {x: j, y: i, z: isequence[j-1]};
            } else if(i===0 && j===0) {
                return {x:j, y:i, z:null};
            } else {
                return {x: j, y: i, z: 0};
            }});
        });
    bpm["base-pairing-probabilities"].forEach(function(link) {
        matrix[link.source][link.target].z = link.value;
    });

    var rect_dim = x.rangeBand();    //rectangle dimension, used for rendering arc on cell selection

    var row = svg.selectAll(".row")
        .data(matrix)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function (d, i) {
            return "translate(0," + x(i) + ")";
        })
        .each(row);

    function row(row) {
        var cell = d3.select(this).selectAll(".cell")
            .data(row.filter(function (d) {
                return d.z;
            }))
            .enter().append("g")
            .attr("class", "dp_cell");

        cell.append("rect")
            .attr("x", function (d) {
                return x(d.x);
            })
            .attr("width", x.rangeBand())
            .attr("height", x.rangeBand())
            .attr("border", "1px solid")
            .attr("id", function (d) {
                if (d.x === 0 || d.y === 0) {
                    return pname + "_border_" + d.x + "_" + d.y;
                } else {
                    return pname + "_cell_" + d.x + "_" + d.y;
                }
            })
            .style("stroke", function (d) {
                if (d.x === 0 || d.y === 0) {
                    return null;
                } else {
                    return "lightgrey";
                }
            })
            .style("stroke-width", 1)
            .style("fill", "white")
            .style("fill-opacity", 1)
            .on("mouseover", onHover)
            .on("mouseout", mouseout)
            .on("click", onClick);

        cell.append("circle")
            .attr("cx", function (d) {
                return x(d.x) + x.rangeBand() / 2;
            })
            .attr("cy", function () {
                return x.rangeBand() / 2;
            })
            .attr("r", function (d) {
                if (typeof d.z === 'number') {
                    return 0.9 * x.rangeBand() * Math.pow(z(d.z), 0.5) / 2;
                }
            })
            .attr("id", function (d) {
                if (typeof d.z === 'number') {
                    return pname + "_circle_" + d.x + "_" + d.y;
                }
            })
            .style("stroke-width", 2)
            .style("fill-opacity", function (d) {
                return Math.pow(z(d.z), 0.5);
            })
            .on("mouseover", onHover)
            .on("mouseout", mouseout)
            .on("click", onClick);

        cell.append("text")
            .attr("x", function (d) {
                return x(d.x) + x.rangeBand() / 2;
            })
            .attr("y", x.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "middle")
            .style("font-size", "140%")
            .text(function (d) {
                if (typeof d.z === 'string') {
                    return d.z;
                }
            });
    }
}

function getHybridSequence( seq1, seq2, minLoopLength ) {
    // add first sequence
    var hybrid = seq1;
    // add minLoopLength+1 spacers
    for (var i=minLoopLength; i>-1; i--) {
        hybrid += 'X';
    }
    // add second sequence
    hybrid += seq2;
    return hybrid;
}


/*
 #######################--- END DotPlots ---############################
 */