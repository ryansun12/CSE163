/* ----------------------------------------------------------------------------
File: BarGraphSample.js
Contructs the Bar Graph using D3
80 characters perline, avoid tabs. Indet at 4 spaces. See google style guide on
JavaScript if needed.
-----------------------------------------------------------------------------*/ 

// Search "D3 Margin Convention" on Google to understand margins.
// Add comments here in your own words to explain the margins below

/*
    The margin variable is a dictionary with keys top, right, bottom, and left.
    These keys have values, 10, 40, 150, and 50 pixels, respectively, to 
    indicate the margins associated with the graph to separate it from other 
    elements in the html file, just like in CSS. 
*/
var margin = {top: 10, right: 40, bottom: 150, left: 50},
    width = 760 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
    

// Define SVG. "g" means group SVG elements together. 
// Add comments here in your own words to explain this segment of code

/*
    The svg variable is set to a function that creates the svg element using 
    d3. The code here selects the document body and appends an <svg> element
    with width and height attributes specified by the variables created above.
    The width and height will be 760 and 500, since the margins are added back.
    The "g" tag groups the svg elements that will be added later together, and
    is not specific to d3. The transform attribute is set to translate 
    margin.left (50) and margin.top (10), which in CSS means simply to
    translate the element in the respective x and y direction. That also means
    that there needs to be a "transition" attribute set for it to work, just 
    like in standard CSS. This transformation makes it so that all the 
    elements eventually appened to this svg will appear to fall from the
    top left corner of the graph on load.
*/
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

/* --------------------------------------------------------------------
SCALE and AXIS are two different methods of D3. See D3 API Refrence and 
look up SVG AXIS and SCALES. See D3 API Refrence to understand the 
difference between Ordinal vs Linear scale.
----------------------------------------------------------------------*/ 

// Define X and Y SCALE.
// Add comments in your own words to explain the code below

/*
    Scaling in d3 refers to mapping an input (domain) value to a visualizable 
    ouput (range) value. Linear scale is used when a linear relationship 
    between input and output is needed. Ordinal scale (scaleBand in d3 after 
    v4) is used  when the relationship between input and output is discrete 
    (ordinal). In this case, xScale is set to scaleBand with no initial domain,
    and has a range of [0, width] rounded to the nearest integer. A padding of 
    0.1 is used to specify the distance between the bands or columns, such that
    the visuals are separated. The y scale is set to a linear scale with an 
    output range of [height, 0] also with no initial domain. The domains are 
    set later on when reading from the csv.
*/
var xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1);

var yScale = d3.scaleLinear().range([height, 0]);

// Define X and Y AXIS
// Define tick marks on the y-axis as shown on the output with an interval of 5 and $ sign
var xAxis = d3.axisBottom(xScale);

var yAxis = d3.axisLeft(yScale).ticks(5).tickFormat( function(d) { return "$" + d });

/* --------------------------------------------------------------------
To understand how to import data. See D3 API refrence on CSV. Understand
the difference between .csv, .tsv and .json files. To import a .tsv or
.json file use d3.tsv() or d3.json(), respectively.
----------------------------------------------------------------------*/ 

// data.csv contains the country name(key) and its GDP(value)
// d.key and d.value are very important commands
// You must provide comments here to demonstrate your understanding of these commands

/*
    In the csv, country and GDP are the two associated column names.
    So, d.country and d.gdp are the values in the csv file for country name 
    and GDP, respectively. This code loops over each entry of the data
    using forEach and assigns two new (k,v) pair called "key" and "value",
    where "key" is assigned to be the country name and "value" to be the 
    GDP, binded to 'data', so that we can reference it using d.key and d.value.
    The '+' operator changes the read in string from csv to a numerical 
    value that we can work with and visualize. 

    Side note: I changed this to a promise ( .then() notation) 
    because the originally provided bracket notation would require 
    more changes to the code structure. Maybe this is because the code 
    was originally written in older Javascript (ES5) ?
*/
d3.csv("GDP2020TrillionUSDollars.csv").then(function(data){
    data.forEach(function(d) {
        d.key = d.country;
        d.value = +d.gdp;
    });
    
    // Return X and Y SCALES (domain). See Chapter 7:Scales (Scott M.) 
    /*
        As mentioned, before, there needs to be a domain specified for the
        mapping of the scale to work, so this is done here. The domain 
        for the xScale is set to the keys, or the country names for each 
        country. The Y scale is set to the interval [0, max(data.value)], 
        which makes sense because it is simply from 0 to the maximum value 
        in the csv data, like how a standard graph would look. 
    */
    xScale.domain(data.map(function(d){ return d.key; }));
    yScale.domain([0,d3.max(data, function(d) {return d.value; })]);


    /* 
        Created this to use later for assigning colors to the d.values 
        Creates a linear scale with the same domain as yScale, which
        has the interval 0 to the max of d.value for d in data. The range
        is blue to dark blue so that the d.value will be mapped correspondingly
        to a darker blue shade if the value is higher, and vice versa. 
        source: d3 documentation under d3-scale
    */
    var colors = d3.scaleLinear()
    .domain(yScale.domain()) //same as yScale's domain
    .range(['blue','darkblue']); //blue to dark blue

    // Creating rectangular bars to represent the data. 
    // Add comments to explain the code below
    /*
        This uses the previously created svg variable that adds the svg
        element to the html, and selects all "rect" elements, where 
        there are none, and so it binds the data from the csv to this empty
        set. The enter() call then will automatically detect that there
        are no previous 'rect' elements associated, so it creates a rect 
        element for every entry in data and applies all the associated 
        attributes to each rectangle, based on the key, value pair for each
        entry. The transition of 1000 ms is associated with the transform
        property declared earlier, and each subsequent rectangle appeneded
        is delayed by an additional 200 ms compared to the previous one. 
        Attributes x, y, width, height, were provided, and they reference
        and correspond to the xScale, yScale, as defined previously. 
        I also added the color scale such that higher d.values will have darker
        shades of blue using my colors variable defined above.
    */

    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .transition().duration(1000)
        .delay(function(d,i) {return i * 200;})
        .attr("x", function(d) {
            return xScale(d.key);
        })
        .attr("y", function(d) {
            return yScale(d.value);
        })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) {
			 return height- yScale(d.value);
        })
        /* 
           create increasing to decreasing shade of blue as shown on the output

            I added this to define the colors for each rectangle in the graph. 
            "colors" is defined previously. This maps the d.value to the
            range from blue to dark blue.
        */
        // .attr("fill", d => d3.color('blue').darker([d.value]))
        .attr("fill", d => colors(d.value));

    /*
        Label the data values(d.value)

        loop over the data again to assign labels for each rect.
        labeled with data values (d.value)
    */
    svg.selectAll("rectLabels") // some empty set to append text to
    .data(data) //loop over data
    .enter()
    .append("text")
    .attr("fill", "white")
    .attr("dx", d => xScale(d.key) + margin.right/2) //copied from above but added 
                                         //constants to make it more aligned
    .attr("dy", d => yScale(d.value) + margin.top + 3) 
    .attr("text-anchor", "middle") //centers the corresponding text with bars
    .text( d => d.value);
    
    
    // Draw xAxis and position the label at -60 degrees as shown on the output 
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("dx", "-.8em")
        .attr("dy", ".25em")
        .style("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("transform", "rotate(-60)");

    /*
        Draw yAxis and position the label

        Draws the yAxis. I separated it from the label because combining the 
        label with this got pretty messy
    */
    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)

    /*
        Adds the label to the Y-axis. 
        Not sure entirely if there is a better way, but the way I chose was
        to append text to the svg. The attributes are all standard css
        attributes, and I chose these dx and dy values because they
        worked the best compared to other em values that I tried.
    */
    svg.append("text")
    .text("Trillions of US Dollars ($)")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("transform", "rotate(-90)") //rotate to align with y-axis
    .style("text-anchor", "middle") // end and start dont work here
    .attr("dx", -height/2)
    .attr("dy", -margin.left/1.5);
      
});