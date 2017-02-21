/**
 * Created by zr on 27.01.17.
 */
/*
 #######################--- Methods for Generating DotPlots ---############################
 */
//Note to self, keep everything simple
function hover_cell_function(p) {       //provide x & y & table data and get a string // use some other library
    // var par = "#" + this.parentElement.parentElement.parentElement.parentElement.id; // get svg name
    // var rowText = par + ' .rowtext';
    // var colText = par + ' .coltext';
    // var rect    = par + ' .row .dp_cell rect';
    // var text    = par + ' .row .dp_cell text';
    //
    // d3.selectAll(rowText).classed("active", function(d, i) { return i == p.y; });
    // d3.selectAll(colText).classed("active", function(d, i) { return i == p.x; });
    // d3.selectAll(rect).classed("active", function(d, i) { return d.y == p.y && d.x == p.x; });
    // d3.selectAll(text).attr("display",function(d, i) { if (d.y == p.y && d.x == p.x) return "true"; else return "none" });

    // tooltip.transition()
    //     .duration(200)
    //     .style("opacity", .9);
    // tooltip.html("(" + (d.x + 1) +  ", " + (d.y + 1) + ")<br/>" + (d.z).toFixed(4))
    //     .style("left", (d3.event.pageX) + "px")
    //     .style("top", (d3.event.pageY - 28) + "px");

    //calls hovertooltip(i,j);
    //and calls col_header_highlight(i,j) which also gets the arcs for subsequences
}

function mouseout() {
    var par = "#" + this.parentElement.parentElement.parentElement.parentElement.id;
    var rect    = par + ' .row .dp_cell rect';

    d3.selectAll("text").classed("active", false);
    d3.selectAll(rect).classed("active", false);
    d3.selectAll(".row .dp_cell text").attr("display","none");
}

function select_cell_function() {
    // var par = "#" + this.parentElement.parentElement.parentElement.parentElement.id; // get svg name
    // var rowText = par + ' .rowtext';
    // var colText = par + ' .coltext';
    // var rect    = par + ' .row .dp_cell rect';
    // var text    = par + ' .row .dp_cell text';
    //
    // d3.selectAll(rowText).classed("active", function(d, i) { return i == p.y; });
    // d3.selectAll(colText).classed("active", function(d, i) { return i == p.x; });
    // d3.selectAll(rect).classed("active", function(d, i) { return d.y == p.y && d.x == p.x; });
    // d3.selectAll(text).attr("display",function(d, i) { if (d.y == p.y && d.x == p.x) return "true"; else return "none" });
}

function showtext() {
    var par = "#" + this.parentElement.parentElement.parentElement.parentElement.id;
    var text    = par + ' .row .dp_cell text';
    d3.selectAll(text)
        .attr("display","true")
}

function hidetext() {
    var par = "#" + this.parentElement.parentElement.parentElement.parentElement.id;
    var text    = par + ' .row .dp_cell text';
    d3.selectAll(text)
        .attr("display","none")
}

function dotplot(sequence, table, pname) {
    // console.log('hi', sequence, table, pname);

    // validate input sequence
    for (var i=0; i<sequence.length; i++){
        if (sequence[i] != "A" && sequence[i] != "C" && sequence[i] != "G" && sequence[i] != "U"){
            alert("Sequence must contain only RNA nucleotide letters");
            return "<p>Invalid input sequence</p>";
        }
    }

    // validate table size
    if(table.length -1 != sequence.length || table[0].length -1 != sequence.length){
        alert("Invalid matrix dimensions")
        return "<p>Invalid table entries</p>"
    }
    var maindic = {};


    var bpp = [];
    var mlp = [];
    var keys=["source","target","value"];

    for(var i=1; i<table.length; i++){
        for(var j=1; j<table[i].length; j++){
            var a = table[i][j].i;
            var b = table[i][j].j;
            //var c = Math.pow(parseFloat(table[i][j].value), 0.5);
            var c = parseFloat(table[i][j].value);
            c = parseFloat(c.toFixed(3));
            if(c > 1 || c < 0){ //todo: allow null
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

    var parent_width = $("#"+pname).width();
    var parent_height = $("#"+pname).height();
    var svg_dim = Math.min(parent_width, parent_height);

    var bpm=maindic;
    var cell_length = 50;
    var margin = {top: 0, right: 0, bottom: 0, left: 0}, //30 50 25 50
        width = svg_dim,// - margin.left - margin.right, //350
        height = svg_dim;// - margin.bottom - margin.top; //300
    var x = d3.scale.ordinal().rangeBands([0, width]),
        z = d3.scale.linear().domain([0, 1]).clamp(true),
        c = d3.scale.category10().domain(d3.range(10));

    //svg should be centered, calculate origin for centering
    var calc_origin = function(parent_width, parent_height){
        if(parent_height === parent_width){
            return [0,0];
        } else if(parent_height > parent_width){
            return [0, (parent_height - parent_width)/2];
        } else {
            return [(parent_width - parent_height)/2, 0];
        }
    }
    var origin = calc_origin(parent_width, parent_height);


    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);

    /*
    Zoom functionality code
     */
    var zoom = d3.behavior.zoom()       //double click for re-zooming
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

    function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
        d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
    }

    function dragended(d) {
        d3.select(this).classed("dragging", false);
    }


    //var svg = d3.select("#output").append("svg")
    var dev = document.createElement("div"); //todo: remove this div, re-size the parent div to quadratic, skip translation
    d3.select(dev).style("width", parent_width+"px").style("height", parent_height+"px").style("border", "1px solid black");
    // var desc = d3.select(dev).append("div").style("margin-top", "10%").style("font-size", "120%");

    //hover information
    var tooltip = d3.select(dev).append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "60px")
        .style("height","28px")
        .style("padding", "2px")
        .style("font","12px sans-serif")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none");

    var svg = d3.select(dev).append("svg")  //put row/col letters in rects, which have id's, can be accessed
        .attr("id", pname)
        .attr("width", width + origin[0])
        .attr("height", height + origin[1])
        .append("g")
        .attr("border",1)
        .attr("fill", "black")
        // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")    //commented to prevent zoom translate bug
        // TODO: translate origin for zoom, don't use margins
        .attr("transform", "translate(" + origin[0] + "," + origin[1] + ")")
        .call(zoom)
        .on("dblclick.zoom", function(d) {svg.attr("transform", "translate(" + origin[0] + "," + origin[1] + ")scale(1)")}); //todo: call a function for center and use it for initial load

    var borderPath = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        // .attr("height", height + margin.top + margin.bottom)
        // .attr("width", width + margin.left + margin.right)
        .style("stroke", "blue")
        .style("fill", "none");

    var matrix = [];

    var seq = bpm["sequence"];
    var isequence = bpm["sequence"];
    var n = seq.length;
    isequence=seq.split("");

    x.domain(d3.range(n));
    isequence.forEach(function(base, i) {
        base.index = i;
        matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
    });
    bpm["base-pairing-probabilities"].forEach(function(link) {
        matrix[link.source-1][link.target-1].z = link.value;
    });


    var column = svg.selectAll(".column")
        .data(matrix)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    column.append("line")
        .attr("x1", -width);

    column.append("text") //todo: remove rotation of letters
        .attr("class","coltext")
        .attr("x", 6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .style("font-size", "140%")
        .text(function(d, i) { return isequence[i]; });

    var row = svg.selectAll(".row")
        .data(matrix)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
        .each(row);

    row.append("line")
        .attr("x2", width);

    row.append("text")
        .attr("class","rowtext")
        .attr("x", -6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .style("font-size", "140%")
        .text(function(d, i) { return isequence[i]; });

    function row(row) {
        var cell = d3.select(this).selectAll(".cell")
            .data(row.filter(function(d) { return d.z; }))
            .enter().append("g")
            .attr("class", "dp_cell");

        cell.append("rect") //todo: mouseover for non-zero
            .attr("x", function(d) { return x(d.x) ; })
            //.attr("cy", 26)
            .attr("width", x.rangeBand())
            .attr("height",x.rangeBand())
            //.attr("r", function(d) { return x.rangeBand() * Math.pow(z(d.z), 0.2)/2;})
            //.attr("ry", function(d) { return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            .attr("border", "1px solid")
            .style("stroke", "lightgrey")
            .style("stroke-width", 1)
            .style("fill", "white" )
            .style("fill-opacity", 1 )
            //.style("fill-opacity", function(d) { return Math.pow(z(d.z), 0.5); })
            // .on("mouseover", hover_cell_function)       //hover function which gets the string
            // .on("mouseout", mouseout)
            // .on("mouseover", function(d) {
            //     tooltip.transition()
            //         .duration(200)
            //         .style("opacity", .9);
            //     tooltip.html("(" + (d.x + 1) +  ", " + (d.y + 1) + ")<br/>" + (d.z).toFixed(4))
            //         .style("left", (d3.event.pageX) + "px")
            //         .style("top", (d3.event.pageY - 28) + "px");
            // })
            // .on("mouseout", function(d) {
            //     div.transition()
            //         .duration(500)
            //         .style("opacity", 0);
            // })
            .on("mouseclick", select_cell_function);

        cell.append("circle")
            .attr("cx", function(d) { return x(d.x) + x.rangeBand() / 2; })
            .attr("cy", function(d) { return x.rangeBand() / 2;})
            //.attr("width", function(d) {return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            //.attr("height", function(d) {return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            .attr("r", function(d) { return 0.9*x.rangeBand() * Math.pow(z(d.z), 0.5)/2;})
            //.attr("ry", function(d) { return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            //.attr("border", "1px solid red")
            //.style("stroke", "rgb(0, 165, 255)")
            .style("stroke-width", 2)
            //.style("fill-opacity", function(d) { return z(d.z); })
            .style("fill-opacity", function(d) { return Math.pow(z(d.z), 0.5); })
            // .on("mouseover", hover_cell_function)
            // .on("mouseout", mouseout)

            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html("(" + (d.x + 1) +  ", " + (d.y + 1) + ")<br/>" + (d.z).toFixed(4))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            // .on("mouseout", mouseout)
            // .on("mouseclick", select_cell_function);
    }
    return dev;
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
