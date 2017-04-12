/*
 #######################--- END DotPlots ---############################
 */
/**
 * Created by zr in January, 2017.
 */
/*
 #######################--- Methods for Generating DotPlots ---############################
 */

var matrix = []; // table data, globally accessible

/**
 * Function to set a default reaction when a cell is hovered over on the dotplot.
 * If the cell is not a header or if is in the upper triangle, it displays a small
 * overlay showing the cell's row number, column number and matrix entry.
 * @param x: hovered cell's row number
 * @param y: hovered cell's column number
 * @param z: hovered cell's matrix entry
 * @param pname: ID of the parent div
 */
function hover_default(x, y, z, pname){
    var tooltip = d3.select("#tooltip_"+pname);
    tooltip.style("position", "absolute")
        .style("display", "none")
        .style("margin", "0")
        .style("text-align", "center")
        .style("width", "60px")
        .style("height", "28px")
        .style("padding", "2px")
        .style("font", "12px sans-serif")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none");
    if (y !== 0 && x !== 0) {
        if (z.toFixed(4) > 0.0000){
            var e = window.event;
            var x_pos = e.pageX + 5;
            var y_pos = e.pageY + 5;

            tooltip.html("(" + x + ", " + y + ")<br/>" + z.toFixed(4))
                .style("left", x_pos + "px")
                .style("top", y_pos + "px");
            tooltip.transition()
                .duration(200)
                .style("display", "block");
        }
    }
}
/**
 * Default reaction function when a cell is clicked on the dotplot.
 * It displays a small overlay showing the cell's row number, column number and matrix entry.
 * @param x: hovered cell's row number
 * @param y: hovered cell's column number
 * @param z: hovered cell's matrix entry
 * @param pname: ID of the parent div
 */
function click_default(x, y, z, pname){
    var tooltip = d3.select("#tooltip_"+pname);
    tooltip.style("display", "none")
        .style("margin", "0")
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

    if (y !== 0 && x !== 0) {
        var e = window.event;
        var x_pos = e.pageX + 5;
        var y_pos = e.pageY + 5;

        tooltip.html("(" + x + ", " + y + ")<br/>" + z.toFixed(4))
            .style("left", x_pos + "px")
            .style("top", y_pos + "px");
        tooltip.transition()
            .duration(200)
            .style("display", "block");
    }
}
/**
 * Renders the dotplot svg using d3.js
 * @param sequence: RNA sequence for generating dotplot
 * @param table: matrix with values calculated using McCaskill algorithm
 * @param pname: ID of the parent div where dotplot svg will be added
 * @param hover_reaction: function for mouse hover on dotplot cells
 * If not specified, an overlay displays cell information while hovering
 * if the cell has a matrix entry
 * @param click_reaction: function for mouse click on dotplot cells.
 * If not specified, an overlay displays the cell information on click.
 */
function dotplot(sequence, table, pname, hover_reaction, click_reaction) {
    if(pname === undefined){
        alert("Provide the parent div's ID where the dotplot svg should be rendered")
    }

    if(hover_reaction === undefined || hover_reaction === null){
        hover_reaction = hover_default;
    }

    if(click_reaction === undefined || click_reaction === null){
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

    if(svg_dim === 0){
        document.getElementById(pname).style.width = 500 + "px";
        document.getElementById(pname).style.height = 500 + "px";
        svg_dim = 500;
    }
    else {
        document.getElementById(pname).style.width = svg_dim + "px";
        document.getElementById(pname).style.height = svg_dim + "px";
    }

    var bpm = maindic;
    var width = svg_dim,
        height = svg_dim;
    var x = d3.scale.ordinal().rangeBands([0, width]),
        z = d3.scale.linear().domain([0, 1]).clamp(true);

    /*
     ########## Zoom and Drag functionality code starts here ##########
     */
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    /**
     * d3 Zoom function
     */
    function zoomed() {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    /**
     * Function to detect start of drag operation on svg
     */
    function dragstarted() {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
    }

    /**
     * Function to transform svg during mouse dragging
     * @param d
     */
    function dragged(d) {
        d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
    }

    /**
     * Function to detect end of drag operation on svg
     */
    function dragended() {
        d3.select(this).classed("dragging", false);
    }
    /*
     ########## Zoom and Drag functionality code ends here ##########
     */


    // draw border of parent div
    var dev = document.getElementById(pname);
    d3.select(dev).style("border", "1px solid black").style("background", "white");

    if(d3.select("#"+pname+"_svg").empty()) {
        var svg = d3.select(dev).append("svg")
            .attr("id", pname + "_svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("border", 1)
            .attr("fill", "black")
            .call(zoom)
            .on("dblclick.zoom", function () {
                svg.attr("transform", "scale(1)")
            });
        var tooltip = d3.select(dev).append("div").attr("id", "tooltip_"+pname).style("display", "none");
    }
    else {
        d3.select("#tooltip_"+pname).remove();
        d3.select("#"+pname+"_svg").remove();

        var svg = d3.select(dev).append("svg")
            .attr("id", pname + "_svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("border", 1)
            .attr("fill", "black")
            .call(zoom)
            .on("dblclick.zoom", function () {
                svg.attr("transform", "scale(1)")
            });

        var tooltip = d3.select(dev).append("div").attr("id", "tooltip_"+pname).style("display", "none");
    }

    /**
     * Shades the two letters of sequence corresponding to a clicked cell
     * @param x: selected cell's row number
     * @param y: selected cell's column number
     * @param pname: parent div's ID
     */
    function color_headers(x, y, pname){
        d3.select("#" + pname).selectAll("rect").style("fill", "white");    // remove previous header shading, if any
        d3.select("#" + pname + "_border_" + x +"_0").style("fill", "lightcoral");
        d3.select("#" + pname + "_border_" + y +"_0").style("fill", "lightcoral");
    }

    /**
     * Draws an arc between the two letters of sequence corresponding to a clicked cell
     * @param x: selected cell's row number
     * @param y: selected cell's column number
     * @param pname: parent div's ID
     * @param rect_dim: dimension of the rectangles on the dotplot
     */
    function renderarc(x, y, pname, rect_dim) {

        d3.selectAll("#"+pname+"_arc_polyline").remove();    // remove previously drawn arc, if any

        if (x!==y && x!==0 && y!==0) {
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

    /**
     * Hover function which call the hover_reaction function
     * @param d
     */
    function onHover(d) {
        if (typeof d.z === 'number'){
            hover_reaction(d.x, d.y, d.z, pname);
        }
    }

    /**
     * Mouseout function on cells
     */
    function mouseout(){
        var tooltip = d3.select("#tooltip_"+pname);
        tooltip.transition()
            .duration(100)
            .style("display", "none");
    }

    /**
     * Click function:
     * 1) highlights the two headers letters
     * 2) draws an arc with "elementID_arc_polyline" ID
     * 3) calls the click_reaction function
     * @param d
     */
    function onClick(d) {
        color_headers(d.x, d.y, pname);
        renderarc(d.x, d.y, pname, rect_dim);
        click_reaction(d.x, d.y, d.z, pname);
    }

    var seq = bpm["sequence"];
    var isequence = bpm["sequence"];
    var n = seq.length + 1;
    isequence=seq.split("");

    x.domain(d3.range(n));

    // append sequence letters as row and column labels
    [null].concat(isequence).forEach(function(base, i) {
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

    var rect_dim = x.rangeBand();    // rectangle dimension, used for rendering arc on cell selection

    var row = svg.selectAll(".row")    // put matrix data into rows
        .data(matrix)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function (d, i) {
            return "translate(0," + x(i) + ")";
        })
        .each(row);

    /**
     * Draws rectangle, circle or row and column header for every cell
     * @param row
     */
    function row(row) {
        var cell = d3.select(this).selectAll(".cell")
            .data(row.filter(function (d) {
                return d.z;
            }))
            .enter().append("g")
            .attr("class", "dp_cell");

        cell.append("rect")    // draw rectangles, assign different id's to header rectangles
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

        cell.append("circle")    // draws circles in the cells with radius corresponding to z values
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

        cell.append("text")    // put sequence letters as row and column labels
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