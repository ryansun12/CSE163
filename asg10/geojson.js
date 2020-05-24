var margin = { top: 10, right: 10, bottom: 10, left: 10 };
var width = 1200 - margin.left - margin.right;
var height = 900 - margin.top - margin.bottom;

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

//tooltip   
var tooltip = d3.select("div.tooltip");

//geomercator porjection, scaled and translated to fit on the screen
var projection = d3.geoMercator()
    .center([0, 0])
    .scale(4000)
    .translate([-1150, 3300])

// I could not find any relevant datasets, so I constructed this by hand
// For whatever reason, the topojson separates central macedonia into 
// 2 parts, and this is the order of the index that it is drawn in, which I 
// manually verified. 
let order = ['North Aegean', 'South Aegean', 'Central Macedonia',
    'Attica', 'Crete', 'Epirus', 'Western Macedonia', 'Central Macedonia',
    'Eastern Macedonia and Thrace', 'Ionian Islands', 'Peloponnese',
    'Western Greece', 'Central Greece', 'Thessaly']

let proj = d3.geoPath().projection(projection)

d3.json("final.json").then(data => {
    console.log(data)

    //Define Tooltip here, initially hidden
    var tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("opacity", 0)

    var x = d3.scaleSqrt()
        .domain([20, 1100])
        .rangeRound([440, 950]);

    // I made this csv based on wikipedia data from 2011 census 
    d3.csv('greece.csv').then(data2 => {
        console.log(data2)
        data2.forEach(d => {
            d['Population Density'] = +d['Population Density'];
        })

        var color = d3.scaleThreshold()
            .domain([0,20, 30, 50, 80, 100, 1000,1100])
            .range(d3.schemeYlGn[9]);

        var g = svg.append("g")
            .attr("class", "key")
            .attr("transform", "translate(-70,40)");

        g.selectAll("rect")
            .data(color.range().map(d =>{ return color.invertExtent(d)}))
            .enter().append("rect")
            .attr("height", 8)
            .attr("x", function (d) { return x(d[0]); })
            .attr("width", function (d) { return x(d[1]) - x(d[0]); })
            .attr("fill", function (d) { return color(d[0]); });

        g.append("text")
            .attr("class", "caption")
            .attr("x", 360)
            .attr("y", -6)
            .attr("fill", "#000")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("font-size", "14px")
            .text("Population (residents) per square kilometer");

        g.call(d3.axisBottom(x)
            .tickSize(13)
            .tickValues(color.domain()))
            .select(".domain")
            .remove(); //get rid of horizontal line

        var i = 0;
        svg.append("g")
            .selectAll("path")
            .data(topojson.feature(data, data.objects.gadm36_GRC_2).features)
            .enter()
            .each(d => {
                // Need to fill with relevant info, reading from the csv 
                d['index'] = i++;
                d.region = order[d.index]
                for (entry of data2) {
                    if (entry.Region == d.region) {
                        d.population = entry.Population;
                        d.area = entry.Area;
                        d.popdens = entry['Population Density']
                    }
                }
                console.log(d)
            })
            .append("path")
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("fill", d => color(d.popdens))
            .attr("d", proj)
            .on("mouseover", d => { //append tooltip and fill with relevant info
                tooltip
                    .transition()
                    .duration(1)
                    .style("opacity", 1)

                //Add tooltip html assigning left, middle, right ids for css
                tooltip.html(`${d.region}<br>
                    <span id="left">Population</span>
                    <span id="middle">:</span>
                    <span id="right">${d.population} Residents</span><br>
                    <span id="left">Area</span>
                    <span id="middle">:</span>
                    <span id="right">${d.area} km^2</span><br>
                    <span id="left">Population Density</span>
                    <span id="middle">:</span>
                    <span id="right">${d.popdens} residents/km^2</span>
                    `)
                    .style("left", `${d3.event.pageX}px`)
                    .style("top", `${d3.event.pageY}px`)
            })
            .on("mouseout", () => { //hide tooltip on mouseout
                tooltip.transition().duration(1).style("opacity", 0)
            })


    })

});