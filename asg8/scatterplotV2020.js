/*

Hover over a circle to show tooltip, need to give it a couple milliseconds to render

Pan and drag: Click and hold anywhere within the svg and move cursor 
                in whatever direction to pan the chart

Zoom: Mouse over anywhere within the svg and scroll backward(finger coming towards you)
        to zoom out, scroll forward (finger going away from you) to zoom in

*/

//Define Margin   
var margin = { left: 80, right: 80, top: 50, bottom: 50 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

//Define Color
var colors = d3.scaleOrdinal(d3.schemeCategory10);
var tool_x, tool_y;

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

var temp = svg.append("g") // to fix a panning issue i ran into

d3.csv('scatterdata.csv').then((data) => {
    //convert strings to numbers. could have used parseFloat as well.
    data.forEach((d) => {
        d.gdp = +d.gdp;
        d.population = +d.population;
        d.ecc = +d.ecc;
        d.ec = + d.ec
    })
    console.log(data)

    //Define Scales   
    var xScale = d3.scaleLinear()
        .domain([0, d3.max(data.map(d => { return d.gdp })) + 1.05])// map iterates through each child json entry
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data.map(d => { return d.ecc })) + 30]) //max of ecc values
        .range([height, 0]);

    //Define Tooltip here, initially hidden
    var tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("opacity", 0)

    //Define Axis
    var xAxis = d3.axisBottom(xScale)
    var yAxis = d3.axisLeft(yScale)

    //setup a square root scale that takes input of total energy consumption, scaled by 
    //the max of the energy consumption in the data and maps to a radius between 0 and 30.
    var sqrtScale = d3.scaleSqrt()
        .domain([0, d3.max(data.map(d => { return d.ec }))])
        .range([0, 30]);

    var rect = temp.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all");

    //get 3 circle sizes
    let circs = [{value: 1, x:130}, {value: 10, x:100}, {value:100, x:50}]
    console.log(circs)
    temp.append("rect")
        .attr("width", width / 4)
        .attr("height", height / 2 - 10)
        .style("fill", "silver")
        .style("pointer-events", "none")
        .attr("x", width - 210)
        .attr("y", height - 200)
    
    temp.append("text")
        .attr("x", width - 191)
        .attr("y", height - 170)
        .attr("font-size", "0.8rem")
        .attr("font-weight", "bold")
        .attr("fill", "green")
        .text("Total Energy Consumption")

    temp.selectAll("circs")
        .data(circs)
        .enter().append("circle")
        .attr("r", d => { return sqrtScale(d.value) })
        .attr("cx", () => { return width - 50; })
        .attr("cy", function (d) { return height - d.x})
        .style("fill","white")

    temp.selectAll("circ_lables")
    .data(circs)
    .enter()
    .append("text")
    .style("text-anchor", "end")
    .style("fill", "black")
    .attr("font-weight", "bold")
    .attr("y", (d) => {return height - d.x + 5})
    .attr("x", () => {return width - 90})
    .text(d => `${d.value} Trillion BTUs`)

    //Draw Scatterplot
    var scatter = temp.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", d => { return sqrtScale(d.ec) })
        .attr("cx", function (d) { return xScale(d.gdp); })
        .attr("cy", function (d) { return yScale(d.ecc); })
        .style("fill", function (d) { return colors(d.country); })
        .on("mouseover", d => { //append tooltip and fill with relevant info
            tooltip
                .transition()
                .duration(10) // setting the duration too high would mess with the opacity values if switching too fast
                .style("opacity", 1)
                // .style("left", function () { //make US tooltip appear on the left
                //     if (d.country == "United States") return `${xScale(d.gdp) - 150}px`
                //     return `${xScale(d.gdp) + 150}px`
                // }) //absolute positioned, so requires left/right and top/bottom
                // .style("top", () => `${yScale(d.ecc) + 50}px`)

            //Add tooltip html assigning left, middle, right ids for css
            tooltip.html(`${d.country}<br>
                <span id="left">Population</span>
                <span id="middle">:</span>
                <span id="right">${d.population} Million</span><br>
                <span id="left">GDP</span>
                <span id="middle">:</span>
                <span id="right">$${d.gdp} Trillion</span><br>
                <span id="left">EPC</span>
                <span id="middle">:</span>
                <span id="right">${d.ecc} Million BTUs</span><br>
                <span id="left">Total</span>
                <span id="middle">:</span>
                <span id="right">${d.ec} Trillion BTUs</span>
                `)
                .style("left", `${d3.event.pageX}px`) //this works a lot better than using 
                .style("top", `${d3.event.pageY}px`)
        })
        .on("mouseout", () => { //hide tooltip on mouseout
            tooltip.transition().duration(10).style("opacity", 0)
        })


    //Add .on("mouseover", .....
    //Add Tooltip.html with transition and style
    //Then Add .on("mouseout", ....

    //Draw Country Names
    temp.selectAll(".text")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "text")
        .style("text-anchor", "start")
        .attr("x", function (d) { return xScale(d.gdp); })
        .attr("y", function (d) { return yScale(d.ecc) - sqrtScale(d.ec) - 2; })
        .style("fill", "black")
        .style("font-size", "0.7rem")
        .text(d => `${d.country}`);

    //x-axis
    var gX = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("text")
        .attr("transform", "translate(0," + height + ")")
        .attr("fill", "black")
        .attr("class", "label")
        .attr("y", 50)
        .attr("x", width / 2)
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("GDP (in Trillion US Dollars) in 2010");


    //Y-axis
    var gY = svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    svg.append("text")
        .attr("fill", "black")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -50)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .attr("font-size", "12px")
        .text("Energy Consumption per Capita (in Million BTUs per person)");

    // Call the function d3.behavior.zoom to Add zoom
    update = () => {
        temp.attr('transform', d3.event.transform);
        gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)))
        gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)))
    }

    // Scale Changes as we Zoom
    var zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width + 150, height + 200]])
        .on("zoom", update);

    svg.call(zoom);



})
