/**
 * Created by moni on 30.05.16.
 */


// Save the recursion formulas in a Global list called formula_array.

function rerendermath(idval) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
}

//function showRecursion() {
//    console.log("val:", $("#formula").val());
//    setTimeout(function () {      //introduces a little delay, so that the thing will close slowly and neatly
//        document.getElementById("recursion").innerHTML =  availableAlgorithms[$("#formula").val()].getRecursionInLatex();
//        rerendermath();
//        $(".animate1").empty();
//    }, 450);
//
//}

function getFormula_structCount(){
    document.getElementById("recursion").innerHTML = availableAlgorithms[$(rec_select).text()].Tables[$(rec_id).text()].getRecursionInLatex();//.getRecursionInLatex();
    //document.getElementById("recursion_qb").innerHTML = availableAlgorithms[$(rec_select_qb).text()].getRecursionInLatex();

    rerendermath();
}

function validate(evt) {
    var theEvent = evt || window.event;
    var key = theEvent.keyCode || theEvent.which;
    var buKey = key;
    //console.log(key);

    key = String.fromCharCode( key );
    var regex = /[^gcauGCAU]|\./;
    if( regex.test(key) && buKey != 8 && buKey != 13 && buKey != 37 && buKey != 39 && buKey != 9) {
        //console.log(regex.test(key));
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
        return;
    }
}

/*
#######################--- Methods for Downloading Tables ---############################
 */
var csv = "";

function generate_tables() {
    var file = new File([csv], "table.csv", {type: "text/plain;charset=utf-8"});
    saveAs(file);
}

// Convert Matrix to CSV
function matrixToCSV(sequence, matrices) {

    var sequence_column = true;
    var res = "";
    //console.log((matrices));
    for (var idx in matrices)
    {
        if (res.length != 0) {
            res += "\n\n";
        }
        var matrix = matrices[idx];

        if (sequence_column)
            res += ",";
        // add first row: sequence
        for (var j in sequence) {
            res += "," + sequence[j];
        }
        res += "\n";
        for (var i = 1; i < matrix.cells.length; ++i) {
            if (sequence_column && i > 0)
                res += sequence[i - 1];

            // adding row
            for (var j in matrix.cells[i]) {
                if (sequence_column || j > 0)
                    res += ",";
                if (!isNaN(matrix.cells[i][j].value) && matrix.cells[i][j].value != null)
                    res += matrix.cells[i][j].value;
            }
            res += "\n";
        }
    }
    //console.log(csv);
    csv = res;
    return res;
}



function allor3dots(str) {
    if (10 < str.length) {
        return str.substr(0, 3) + "..." + str.substr(str.length - 4);
    } else {
        return str;
    }
}

function repres(res) {
    ret = "";
    for (var i = 0; i < res.length; ++i) {
        ret += "\t";
        for (var j in res[i]) {
            ret += res[i][j];
        }
        ret += "\n";
        //ret += "<br>"
    }
    return ret;
}


/**
 * 4d Visualization
 * ps is a set of pairs of indices from str1 and str2 respectively.
 * The indiceies represent alignment between between both characters.
 * Indicies are 1-based.
 *
 * if (a1, b1) and (a2, b2) are allignments (in ps)
 *  then a1 < a2 if and only if b2 < b1, to ensure it's a valid alignment.
 * test using console.log(repres(visualize4d("axxbxxcxxdxxexxfxxgxx", "cyydyyhyyjyykyylyymyyoyy", [[16, 16], [17, 11], [19, 7]])));
 */

function visualize4d(str1, str2, ps) {
/*
    return JSON.stringify(ps) + "\n" +
        JSON.stringify(str1) + "\n" +
        JSON.stringify(str2) + "\n" +
    "axx...xexx        x     xx" + "\n" +
    "          f    x   g" + "\n" +
    "          |    |   |" + "\n" +
    "          l    y   h" + "\n" +
    "yyoyymyy   yyky jyy   yydyyc";

*/
    if (ps.length == 0) {
        return [""];
    }
    var marked1 = new Array(str1.length + 1);
    var marked2 = new Array(str2.length + 1);

    var st1i = 0, st1f = 0, st2i = 0, st2f = 0;
    for (var i = 0; i < str1.length; ++i) {
        marked1[i] = false;
    }
    for (var i = 0; i < str2.length; ++i) {
        marked2[i] = false;
    }

    for (var i in ps) {
        marked1[ps[i][0]] = true;
        marked2[ps[i][1]] = true;
        if (st1i == 0 || ps[i][0] < st1i) {
            st1i = ps[i][0];
        }
        if (st1f == 0 || ps[i][0] > st1f) {
            st1f = ps[i][0];
        }
        if (st2i == 0 || ps[i][1] < st2i) {
            st2i = ps[i][1];
        }
        if (st2f == 0 || ps[i][1] > st2f) {
            st2f = ps[i][1];
        }
    }

    var gapBegin = Math.max(Math.min(10, st1i - 1), Math.min(10, str2.length - st2f));
    var gapEnd = Math.max(Math.min(10, str1.length - st1f), Math.min(10, st2i - 1));
    var portion = Math.max(0, Math.max(st1f - st1i, st2f - st2i) + 1);
//    var portion = Math.max(3, Math.max(st1f - st1i, st2f - st2i) + 1);
    var portionOffset = 0;

    var res = new Array(6);
    for (var i = 0; i < res.length; ++i) {
        res[i] = new String();
        for (var j = 0; j < portion + gapBegin + gapEnd + portionOffset; ++j) {
            //res[i] += '.';
            res[i][j] = ' ';
            //res[i][j] = '_';//'&nbsp;';
        }
    };
    // Fill portion
    var st_idx = gapBegin + portionOffset;
    for (var pt1 = st1i, pt2 = st2f, i = 0; (pt1 <= st1f || pt2 >= st2i) && i < portion; ++i) {

        if (marked1[pt1] && marked2[pt2]) {
            res[2][st_idx + i] = str1[pt1 - 1];
            res[4][st_idx + i] = str2[pt2 - 1];
            res[3][st_idx + i] = '|';
            ++pt1;
            --pt2;
        } else {
            if (!marked2[pt2]) {
                res[5][st_idx + i] = str2[pt2 - 1];
                --pt2;
            }
            if (!marked1[pt1]) {
                res[1][st_idx + i] = str1[pt1 - 1];
                pt1++;
            }
        }
        /*
         res[1][st_idx + i] = '_';
         res[5][st_idx + i] = '_';
         */
    }


    // Fill GapBegin Str1

    var gapB1 = allor3dots(str1.substr(0, st1i - 1)); //[0, st1i)
    var st_idx = gapBegin - gapB1.length;
    for (var i = 0; i < gapB1.length; ++i) {
        res[1][st_idx + i] = gapB1[i];
    }
    // Fill GapBegin Str2
    var st_idx = gapBegin - 1;

    var gapB2 = allor3dots(str2.substr(st2f)); // (st2f, str2.length)
    for (var i = 0; i < gapB2.length; ++i) {
        res[5][st_idx - i] = gapB2[i];
    }



    // Fill GapEnd Str1
    var st_idx = gapBegin + portion + portionOffset * 2;

    var gapE1 = allor3dots(str1.substr(st1f)); //(st1f, str1.length)
    for (var i = 0; i < gapE1.length; ++i) {
        res[1][st_idx + i] = gapE1[i];
    }
    // Fill GapEnd Str2

    var gapE2 = allor3dots(str2.substr(0, st2i - 1)); // [0, st2f)
    var st_idx = gapBegin + portion + portionOffset * 2 + gapE2.length - 1;

    for (var i = 0; i < gapE2.length; ++i) {
        res[5][st_idx - i] = gapE2[i];
    }


    return res;
}


/*
 #######################--- END Download Tables ---############################
 */

