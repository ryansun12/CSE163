// Set margins, axis, and scales
// Mostly reused from assignment 6
var margin = { top: 14, right: 100, bottom: 50, left: 80 },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var xScale = d3.scaleTime().range([0, width])
var yScale = d3.scaleLinear().range([height, 0]);
var xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y"));//format year
var yAxis = d3.axisLeft(yScale).ticks(7).tickFormat(function (d) { return d });

// Setup the svg: also reused from assignment 6
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

//color scale using category10
color = d3.scaleOrdinal(d3.schemeCategory10);

// List of countries required to parse for in the raw csv.
var countries = ["Brazil", "Russia", "India", "China", "South Africa", "United States"]
let tempData = [] //Stores temporary parsed csv data

var currentData = []; // This is for the radiobutton/vertical line implementation

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

// Set up the backwards transition for the checkboxes...
// the only difference is the switched 
// interpolate string values, otherwise it is identical to 'transition'
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

//Read the raw CSV and draw the multi-line graph
//Does this count for the super bonus? 
d3.csv("EPCSmallMillionBTU.csv").then(function (data) {
    // console.log(data)
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


    //Draws grid lines .. requires some css: refer to MultiLinestylesheet.css
    //Source: https://sureshlodha.github.io/CMPS263_Winter2018/CMPS263FinalProjects/PrescriptionDrugs/index.html
    svg.append("g")
        .attr("class", "grid") // such that the css is applied
        .attr("transform", "translate(0," + height + ")")
        // uses xScale w/ 15 ticks, -height such that points upwards instead of down
        .call(d3.axisBottom(xScale).ticks(15).tickSize(-height).tickFormat(""))

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(6).tickSize(-width).tickFormat(""))

    //Draws the multiple lines, uses d.country for color and d.values for the path.
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
        .attr("id", d => d.country.replace(/\s/g, ''))//for the checkbox function
        .attr("transform", function (d) { //translate by final x,y coords
            //parseTime because string "2014" needs to be converted
            return `translate(${xScale(parseTime(2014))},
            ${yScale(d.values[14].value)})`
        })
        .attr("x", "0.5rem")
        .attr("y", "0.3rem")
        .attr("font-family", "arial")
        .attr("font-size", "12px")
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

    currentData = data;
    vertLine(data)
});


// The following code adds the moving vertical line effect
// This is based on the source that is referenced below.
// Source: https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91

// The one problem with this current implmentation is that once a 
// radio button is checked, unchecking will not remove the datapoint
// for the country on this moving vertical line. I would have to pop the
// entry off the data for it to work. It's doable, but that would require major
// changes to the entire code, and I have not found time for that yet...

function vertLine (data){
    // console.log(data)

    // setup a mouse over element, added id so that it can be redrawn
    // when another country is added. 
    var mouseOver = svg.append("g").attr("id", "vert")

    // add a path (the vertical line) grey, 1px width
    mouseOver.append("path")
        .attr("class", "mouse-line")
        .style("stroke", "#3D4849") //charcoal grey
        .style("stroke-width", "1px")

    // Retrieves all elements with class name 'line'
    // I added this class name to each of the paths earlier
    var lines2 = document.getElementsByClassName('line');

    //Adds a mouse-per-line class to each of the data elements
    var mousePerLine = mouseOver.selectAll('.mouse-per-line')
        .data(data)
        .enter()
        .append("g")
        .attr("class", "mouse-per-line"); //adds class to each datapoint, 
                                          // so we can reference it later

    // Adds a rectangle to each of the elements of mousePerLine
    // This also means that there will always be 6 rect, regardless of whether 
    // the checkboxes are checked or not...
    mousePerLine.append("rect")
        .attr("width", "5")
        .attr("height", "5")
        .attr("x", "-2.5") //center the rect
        .attr("y", "-2.5")
        .style("stroke", function (d) {
            return color(d.country); //still using category10 
        })
        .style("fill", "transparent")
        .style("stroke-width", "1px")
        .attr("opacity", "0") //Such that it doesn't appear on page load.

    //Adds the text values that appear 5,-7 pixels away from each mousePerLine element
    // This way, when the line reaches the end, it isn't as cluttered
    // I added some font specifications to make it more unique
    // China and Brazil will inevitably overlap :( but after 2003, it looks nice
    mousePerLine.append("text")
        .attr("transform", "translate(5,-5)")
        .attr("font-size", "12px")
        .style('fill', '#3D4849')
        .attr("font-family", "courier")

    //Adds a rectangle to catch the mouse's position on the canvas, spanning the entire canvas
    mouseOver.append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none') //colorless
        .attr('pointer-events', 'all') //In CSS, this means that this SVG
                // element will be the target of the following pointer events

        .on('mouseout', function () {// on mouse out hide line, rectangles and text
            d3.select(".mouse-line") //The vertical line
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line rect") // The rectangles
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line text") // The text (numbers)
                .style("opacity", "0");
        })
        .on('mouseover', function () {// on mouse in show line, rectangles and text
            d3.select(".mouse-line")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line rect")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");
        })
        .on('mousemove', function () {// mouse moving over canvas
            
            //'this' references the current calling element
            var mouse = d3.mouse(this); //get mouse (with x,y coords)

            //Specifies the path, which is calculated based on the mouse position
            d3.select(".mouse-line") //selects the vertical line
                .attr("d", function () { // create the path for the vert. line
                    //M stands for moveto
                    var d = "M" + mouse[0] + "," + height; //The line is from mouseX, height 
                    d += " " + mouse[0] + "," + 0; // to mouseX, 0, such that it is vertical
                    return d;
                });

            //Selects all mouse-per-line classes, which was defined previously
            //for each of the 6 data points.
            d3.selectAll(".mouse-per-line")
                //applies the transform: translate property to each of the rectangles/text/line
                .attr("transform", function (d, i) {
                    var beginning = 0
                    end = lines2[i].getTotalLength()
                    //This reads the entire path length for each of the lines based on index i. 
                    target = -1; //some initial target value

                    // infinite loop until the position, pos, is "found"
                    // on the canvas. This is done by rounding a target
                    // to be half of beginning + end, based on the current
                    // values of end and beginning that will be dynamically
                    // updated based on the conditional statements and the current mouseX position
                    // I've removed some unnecessary conditions that was in the original 
                    // source code because I noticed that they will always/never occur. 
                    while (true) {
                        target = Math.floor((beginning + end) / 2);
                        pos = lines2[i].getPointAtLength(target); //get point at target
                        //This is the condition that breaks out of the loop,
                        // where the target is found, strictly equal to end or begining
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
}

// brute force checkbox/radio button solution
// These ugly boolean arrays are just to track whether or 
// not the radio buttons have been clicked :-)

// In hindsight, I could've done this dynamically with d3. 

var newPaths = [false,false,false,false,false,false]
var clicks = [true, true, true, true, true, true, 
    false, false, false, false, false, false]
function clicked(n) {
    // Add new path if the radio buttons are checked
    if (n >= 6 && !newPaths[n-6]){
        switch(n){
            case 6:
                countries[n] = "Ukraine"
                break;
            case 7:
                countries[n] = "Turkey"
                break;
            case 8:
                countries[n] = "Mexico"
                break;
            case 9:
                countries[n] = "Pakistan"
                break;
            case 10:
                countries[n] = "France"
                break;
            case 11:
                countries[n] = "Japan"
                break;
            default:
                break;
        }
        addPath(n);
        newPaths[n-6] = !newPaths[n-6]
    }
    clicks[n] = !clicks[n];
    // console.log(countries[n])
    if (!clicks[n]) {
        //ids cant have spaces. ex. "United States" -> "UnitedStates"
        svg.select(`path#${countries[n].replace(/\s/g, '')}`)
            .call(transition2)

        svg.select(`text#${countries[n].replace(/\s/g, '')}`)
            .attr("opacity", "0")
        
        // currentData.pop()
        svg.select("g#vert").remove()
        vertLine(currentData)
        
    }
    else {
        svg.select(`path#${countries[n].replace(/\s/g, '')}`)
            .call(transition)
        svg.select(`text#${countries[n].replace(/\s/g, '')}`)
            .attr("opacity", "1")
    }
    
}

// Scan csv for specified country and add to the graph
// This is pretty much reusing my previous code above. 
async function addPath(n){
    temp = []
    await d3.csv("EPCSmallMillionBTU.csv").then(function (data) {
        data.forEach(function (d) {
            for (const [key, value] of Object.entries(d)) {
                if (value == countries[n]) {
                    temp.push(d)
                    break;
                }
            }
        })
    })
    for (const [key, value] of Object.entries(temp[0])) {
        if ((key < 2000 || key >= 2015) && key != "Country Name") {
            delete temp[0][key]
        }
    }
    // console.log(temp)
    temp2 = [], final = []
    for (const [key, value] of Object.entries(temp[0])) {
        if (key != "Country Name") {
            temp2.push({ 'year': parseTime(parseInt(key)), 'value': value })
        }
    }
    final.push({ 'country': temp[0]["Country Name"], 'values': temp2 })
    // console.log(final)

    svg.selectAll(".paths")
    .data(final)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("class", "line")
    .attr("id", d => d.country.replace(/\s/g, ''))
    .attr("stroke", d => color(d.country))
    .attr("stroke-width", 1.5)
    .attr("d", d => lines(d.values))
    .call(transition) 

  svg.selectAll("labels")
      .data(final)
      .enter()
      .append("text")
      .attr("id", d => d.country.replace(/\s/g, ''))//for the checkbox function
      .attr("transform", function (d) {
          return `translate(${xScale(parseTime(2014))},
          ${yScale(d.values[14].value)})`
      })
      .attr("x", "0.5rem")
      .attr("y", "0.3rem")
      .attr("font-family", "arial")
      .attr("font-size", "12px")
      .attr("text-anchor", "start")
      .text(d => d.country)

    //updates the currentData values.. adds the country!
    currentData.push(final[0])
    // console.log(currentData)

    //Delete the current DOM element for the vertical line and redraw it
    svg.select("g#vert").remove()
    vertLine(currentData)
}