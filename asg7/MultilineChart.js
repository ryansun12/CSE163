// Set margins, axis, and scales
// Mostly reused from assignment 6
var margin = { top: 14, right: 100, bottom: 50, left: 80 },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var xScale = d3.scaleTime().range([0, width])
var yScale = d3.scaleLinear().range([height, 0]);
var xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y"));//format year
var yAxis = d3.axisLeft(yScale).ticks(7).tickFormat(function (d) { return d });

// Setup the svg: also copied from assignment 6
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define lines for use. This was defined after I reshaped the raw data
// to match the key:value pairs. 
var lines = d3.line() // "display line shape"
    .curve(d3.curveBasis) // "to interpolate the curve"
    .x(d => xScale(d.year))
    .y(d => yScale(d.value));

//To parse the data from string to date, used later.
var parseTime = d3.timeParse("%Y")

// List of countries required to parse for in the raw csv.
const countries = ["Brazil", "Russia", "India", "China", "South Africa", "United States"]
let tempData = [] //Stores temporary parsed csv data

//Set up the transition 
// Given the path element, this will setup a 2 second transition
// and apply the tween attribute, which should take in an interpolator,
// given by the function tweenDash
// Source: https://bl.ocks.org/mbostock/5649592
function transition(path) {
    path.transition()
        .duration(2000)
        .attrTween("stroke-dasharray", tweenDash)
}
// This string interpolator will begin at 0,length and end at 
// length, length, such that it is interpolating the X-values. 
// interpolateString takes two strings and detects numbers in them
function tweenDash() {
    var l = this.getTotalLength(),
        i = d3.interpolateString("0," + l, l + "," + l);
    return function (t) { return i(t); };
}

//Read the raw CSV and draw chart
d3.csv("EPCSmallMillionBTU.csv").then(function (data) {
    //Retrieve only required countries and push to tempData
    data.forEach(function (d) {
        for (const [key, value] of Object.entries(d)) {
            if (key == "Country Name") {
                if (countries.includes(d[key])) {
                    tempData.push(d)
                }
            }
        }
    });
    //Clean up the data: 2000-2014 and country names only
    for (entry in tempData) {
        for (const [key, value] of Object.entries(tempData[entry])) {
            if ((key < 2000 || key >= 2015) && key != "Country Name") {
                delete tempData[entry][key]
            }
        }
    }
    // console.log(tempData)
    //Set up Y domain
    //find max in parsed data -- tempData includes country names, so
    //parsing a string as int will yield NaN, and will return false no matter
    //what when comparing with numbers, so the != NaN is necessary.
    var max = -1;
    for (entry in tempData) {
        for (const [key, value] of Object.entries(tempData[entry])) {
            if (parseInt(value) > max && parseInt(value) != NaN) {
                max = value
            }
        }
    }
    yScale.domain([0, max]);

    //Now to draw the lines, reshaping the data seems necessary :(
    //Here I am brute forcing it and storing into data[] as normalized
    // k,v pairs with 'year' and 'value'. 
    // This will allow the data to work with d3 functions :)
    newData = []
    data = []
    for (entry in tempData) {
        for (const [key, value] of Object.entries(tempData[entry])) {
            if (key != "Country Name") {
                newData.push({ 'year': parseTime(parseInt(key)), 'value': value })
            }
        }
        data.push({ 'country': tempData[entry]["Country Name"], 'values': newData })
        newData = [];
    }
    console.log(data) //New data shape!

    //Scale X domain with extent, which finds min and max.
    xScale.domain(d3.extent(data[0].values, d => d.year))
    color = d3.scaleOrdinal(d3.schemeCategory10);//color scale using category10

    //Draws grid lines
    //Source: https://sureshlodha.github.io/CMPS263_Winter2018/
    //CMPS263FinalProjects/PrescriptionDrugs/index.html
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(15).tickSize(-height).tickFormat(""))

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(6).tickSize(-width).tickFormat(""))

    //Draws the multiple lines
    svg.selectAll(".paths")
        .data(data)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("class", "line")
        .attr("id", d => d.country.replace(/\s/g, ''))//for the checkbox function
        // ids cant have space, so replaced with ''
        .attr("stroke", d => color(d.country))
        .attr("stroke-width", 1.5)
        .attr("d", d => lines(d.values))
        .call(transition) // calls the transition function defined above

    //Labels the countries
    svg.selectAll("labels")
        .data(data)
        .enter()
        .append("text")
        .attr("transform", function (d) { //translate by final x,y coords
            return `translate(${xScale(parseTime(2014))}, 
            ${yScale(d.values[14].value)})`
        })
        .attr("x", "0.5rem")
        .attr("y", "0.3rem")
        .attr("text-anchor", "start")
        .text(d => d.country)

    //Draws standard x, y axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("transform", "rotate(0)");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    //Adds label to Y axis
    svg.append("text")
        .text("Energy Consumption in Million BTUs")
        .attr("font-weight", "bold")
        .attr("transform", "rotate(-90)") //rotate to align with y-axis
        .style("text-anchor", "middle")
        .attr("dx", -height / 2)
        .attr("dy", -margin.left / 1.5);

    // The following code adds the moving vertical line effect
    // This is entirely from the source that is referenced below. 
    // I tried to explain it the best I can, but I could be missing some concepts
    // Source: https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91

    // setup a mouse over element 
    var mouseG = svg.append("g")
        .attr("class", "mouse-over-effects");

    // add a path (the vertical line) black, 1px width, 
    // with initial opacity 0.
    mouseG.append("path")
        .attr("class", "mouse-line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", "0");

    // Retrieves all elements with class name 'line'
    // I added this class name to each of the paths.
    var lines2 = document.getElementsByClassName('line');

    //Adds a mouse-per-line class to each of the data elements
    var mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(data)
        .enter()
        .append("g")
        .attr("class", "mouse-per-line");

    //Adds a circle to each of the elements of mousePerLine
    //Which basically adds a circle for each of the 6 paths
    //This also means that there will always be 6 circles, 
    //regardless of whether the checkboxes are checked or not
    mousePerLine.append("circle")
        .attr("r", 7)
        .style("stroke", function (d) {
            return color(d.country);
        })
        .style("fill", "none")
        .style("stroke-width", "1px")
        .style("opacity", "0");

    //Adds the text values that appear 10,-2 pixels away from the circle
    // I added some font specifications to make it more unique
    mousePerLine.append("text")
        .attr("transform", "translate(10,-2)")
        .attr("font-size", "14px")
        .attr("font-family", "courier")

    //Adds a rectangle to represent the mouse's current position on the canvas
    mouseG.append('svg:rect')
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none') //colorless
        .attr('pointer-events', 'all') //In CSS, this means that this SVG
                // element will be the target of the following pointer events

        .on('mouseout', function () {// on mouse out hide line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "0");
        })
        .on('mouseover', function () {// on mouse in show line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");
        })
        .on('mousemove', function () {// mouse moving over canvas
            var mouse = d3.mouse(this); //get mouse element(with x,y coords)

            //Specifies the path, which is calculated based on the mouse position
            d3.select(".mouse-line") //selects the previously created path
                .attr("d", function () {
                    //M stands for moveto
                    var d = "M" + mouse[0] + "," + height;
                    d += " " + mouse[0] + "," + 0;
                    return d;
                });
            //Selects all mouse-per-line classes, which was defined previously
            //for each of the 6 paths.
            d3.selectAll(".mouse-per-line")
                //applies the transformation to the vertical line path
                .attr("transform", function (d, i) {
                    // console.log(width / mouse[0])
                    var beginning = 0,
                    //This reads the entire path length for each of the lines
                    //based on index i. 
                        end = lines2[i].getTotalLength(),
                        target = null;
                    // infinite loop until the position, pos, is "found"
                    // on the svg canvas. This is done by rounding a target
                    // to be half of beginning + end, based on the current
                    // values of end and beginning that will be dynamically
                    // updated based on those conditional statements. 
                    // I've removed some conditions that was in the original 
                    // source code because I noticed that they will always/never occur. 
                    while (true) {
                        target = Math.floor((beginning + end) / 2);
                        pos = lines2[i].getPointAtLength(target);
                        //This is the condition that breaks out of the loop,
                        // where the target is found
                        // console.log(pos, mouse[0], target, end, beginning)
                        if ((target === end || target === beginning)) {
                            break;
                        }
                        else if (pos.x > mouse[0]) end = target;
                        else beginning = target;
                    }
                    // Appends the text values based on the y-scale value
                    // rounded to 2 decimal places, using the discovered 'pos'
                    // from the previous while (true) loop.
                    // Invert does the opposite of scale, so given
                    // a range value, returns the corresponding domain. 
                    d3.select(this).select('text')
                        .text(yScale.invert(pos.y).toFixed(2));
                    //Finally, return the translate coordinates for each path
                    return "translate(" + mouse[0] + "," + pos.y + ")";
                });
        })
});

//Set up the backwards transition.. the only difference is the 
// switched interpolate string values.
function transition2(path) {
    path.transition()
        .duration(2000)
        .attrTween("stroke-dasharray", tweenDash2)
}
function tweenDash2() {
    var l = this.getTotalLength(),
        i = d3.interpolateString(l + "," + l, "0," + l);
    return function (t) { return i(t); };
}

// brute force checkbox solution
var clicks = [true, true, true, true, true, true]
function clicked(n) {
    clicks[n] = !clicks[n];
    // console.log(countries[n])
    if (!clicks[n]) {
        //ids cant have spaces. ex. "United States" -> "UnitedStates"
        svg.select(`path#${countries[n].replace(/\s/g, '')}`)
            .call(transition2)
    }
    else {
        svg.select(`path#${countries[n].replace(/\s/g, '')}`)
            .call(transition)
    }
}