/**
 * Created by zr on 27.01.17.
 */
/*
 #######################--- Methods for Generating DotPlots ---############################
 */

function hover_cell_function(p) {       //provide x & y & table data and get a string // use some other library
    var par = "#" + this.parentElement.parentElement.parentElement.parentElement.id; // get svg name
    var rowText = par + ' .rowtext';
    var colText = par + ' .coltext';
    var rect    = par + ' .row .dp_cell rect';
    var text    = par + ' .row .dp_cell text';

    d3.selectAll(rowText).classed("active", function(d, i) { return i == p.y; });
    d3.selectAll(colText).classed("active", function(d, i) { return i == p.x; });
    d3.selectAll(rect).classed("active", function(d, i) { return d.y == p.y && d.x == p.x; });
    d3.selectAll(text).attr("display",function(d, i) { if (d.y == p.y && d.x == p.x) return "true"; else return "none" });
}

function mouseout() {
    var par = "#" + this.parentElement.parentElement.parentElement.parentElement.id;
    var rect    = par + ' .row .dp_cell rect';

    d3.selectAll("text").classed("active", false);
    d3.selectAll(rect).classed("active", false);
    d3.selectAll(".row .dp_cell text").attr("display","none");
}

function select_cell_function() {     //zaid
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
    //console.log('hi', sequence, table, pname);

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

    var bpm=maindic;
    var cell_length = 50;
    var margin = {top: 50, right: 100, bottom: 50, left: 100},
        width = 350,//cell_length * sequence.length,
        height = 300;//cell_length * sequence.length;
    var x = d3.scale.ordinal().rangeBands([0, width]),
        z = d3.scale.linear().domain([0, 1]).clamp(true),
        c = d3.scale.category10().domain(d3.range(10));

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
    //zoom functionality code ends

    //var svg = d3.select("#output").append("svg")
    var dev = document.createElement("div");
    d3.select(dev).style("width", "550px").style("height","420px").style("border", "1px solid black");      //zaid
    // var desc = d3.select(dev).append("div").style("margin-top", "10%").style("font-size", "120%");


    if (pname === "pd") {
        //desc.text("Dotplot for paired base pair probabilities");      //zaid
    } else
    if (pname === "ud") {
        //desc.text("Dotplot for unpaired probabilities");
    }

    if (pname === "up1") {
        //desc.text("Dotplot for unpaired probabilities of $S^1$");
    } else
    if (pname === "up2") {
        //desc.text("Dotplot for unpaired probabilities of $S^2$");
    }
    var svg = d3.select(dev).append("svg")
        .attr("id", pname)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        // .style("margin-left", -margin.left/2 + "px")     //zaid
        .append("g")
        .attr("border",1)
        .attr("fill", "black")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);        //zaid

    var borderPath = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        // .attr("height", height + margin.top + margin.bottom)
        // .attr("width", width + margin.left + margin.right)
        .style("stroke", "blue")
        .style("fill", "none")
        // .style("stroke-width", bor);

    var matrix = [];

    /*var seq = [bpm.sequence],
        isequence = bpm.sequence.split(""),
        n = isequence.length;
    */

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
        //matrix[link.source-1][link.target-1].z += link.value;
        matrix[link.source-1][link.target-1].z = link.value;
        //console.log(link.source, link.target, link.value);
        //matrix[link.target-1][link.source-1].z += link.value;
    });

    //bpm["optimal-structure"].forEach(function(link) {
    //    matrix[link.target-1][link.source-1].z = link.value;
    //});


    var column = svg.selectAll(".column")
        .data(matrix)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    column.append("line")
        .attr("x1", -width);

    column.append("text")
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

        cell.append("rect")
            .attr("x", function(d) { return x(d.x) ; })
            //.attr("cy", 26)
            .attr("width", x.rangeBand())
            .attr("height",x.rangeBand())
            //.attr("r", function(d) { return x.rangeBand() * Math.pow(z(d.z), 0.2)/2;})
            //.attr("ry", function(d) { return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            .attr("border", "1px solid")
            .style("stroke", "lightgrey")       //zaid
            .style("stroke-width", 1)
            .style("fill", "white" )
            .style("fill-opacity", 1 )
            //.style("fill-opacity", function(d) { return Math.pow(z(d.z), 0.5); })
            .on("mouseover", hover_cell_function)       //hover function which gets the string
            .on("mouseout", mouseout)
            .on("mouseclick", select_cell_function);
        cell.append("circle")
            .attr("cx", function(d) { return x(d.x) + x.rangeBand() / 2; })     //zaid
            .attr("cy", function(d) { return x.rangeBand() / 2;})       //zaid
            //.attr("width", function(d) {return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            //.attr("height", function(d) {return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            .attr("r", function(d) { return 0.9*x.rangeBand() * Math.pow(z(d.z), 0.5)/2;})
            //.attr("ry", function(d) { return x.rangeBand() * Math.pow(z(d.z), 0.5);})
            //.attr("border", "1px solid red")
            //.style("stroke", "rgb(0, 165, 255)")
            .style("stroke-width", 2)
            //.style("fill-opacity", function(d) { return z(d.z); })
            .style("fill-opacity", function(d) { return Math.pow(z(d.z), 0.5); })
            .on("mouseover", hover_cell_function)
            .on("mouseout", mouseout)
            .on("mouseclick", select_cell_function);      //zaid
        cell.append("text")
            .attr("x", function(d) { return x(d.x)+10; })
            .attr("y", x.rangeBand()/2)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .attr("display", "none")
            .attr("fill", "red")
            .style("font-size", "50%")      //zaid
            .text(function(d) {     //don't display zeros //zaid
                if ((d.z).toFixed(4) >= 0.0001) {
                    return "(" + (d.x + 1) +  ", " + (d.y + 1) + "); " + (d.z).toFixed(4);
                }
            })
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
