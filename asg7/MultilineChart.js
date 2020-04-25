// Set margins, axis, and scales
// Mostly reused from assignment 6
var margin = { top: 10, right: 100, bottom: 50, left: 80 },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var xScale = d3.scaleTime().range([0, width]).domain([2000,2014])
var yScale = d3.scaleLinear().range([height, 0]);
var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
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
    .x( d => xScale(d.year))
    .y( d => yScale(d.value));

//To parse the data from string to date
var parseTime = d3.timeParse("%Y")

// List of countries required to parse for in the raw csv.
const countries = ["Brazil", "Russia", "India", "China", "South Africa", "United States"]
let tempData = [] //Stores temporary parsed csv data


//Set up the transition 
// Source: https://bl.ocks.org/mbostock/5649592
function transition(path) {
    path.transition()
        .duration(2000)
        .attrTween("stroke-dasharray", tweenDash)
    }
function tweenDash() {
var l = this.getTotalLength(),
    i = d3.interpolateString("0," + l, l + "," + l);
return function(t) { return i(t); };
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
    // console.log(yScale.domain()) //it works!
    
    //Now to draw the lines, reshaping the data seems necessary :(
    //Here I am brute forcing it and storing into data[] as normalized
    // k,v pairs with 'year' and 'value'. 
    newData = []
    data = []
    for (entry in tempData){
        for (const [key, value] of Object.entries(tempData[entry])) {
            if (key != "Country Name"){
                newData.push({'year':key, 'value': value})
            }
        }
        data.push({'country' : tempData[entry]["Country Name"], 'values': newData})
        newData = [];
    }
    tempData=data //this is for use in the checkbox function
    console.log(data) //New data shape!

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
        .attr("id", d => d.country.replace(/\s/g,'')) //for the checkbox function
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
        .attr("transform", function(d){ //translate by final x,y coords
            return `translate(${xScale(2014)}, ${yScale(d.values[14].value)})`
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
        .attr("dx", -height/2)
        .attr("dy", -margin.left/1.5);

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
    i = d3.interpolateString(l + "," + l,"0," + l);
return function(t) { return i(t); };
}


// brute force checkbox solution
var clicks = [true,true,true,true,true,true]
function clicked(n){
    clicks[n] = !clicks[n];
    // console.log(countries[n])
    if (!clicks[n]){
        svg.select(`path#${countries[n].replace(/\s/g,'')}`)
        .call(transition2)
    }
    else{
        svg.select(`path#${countries[n].replace(/\s/g,'')}`)
        .call(transition)
    }
}