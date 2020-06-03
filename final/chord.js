/*

Adding a dropdown to toggle multiple other datasets for other years since the one built in is only for 2015.
 https://www.un.org/en/development/desa/population/migration/data/estimates2/estimates19.asp

Adding nice transitions for rendering/switching between these datasets
Position the tooltips more consistently, potentially static somewhere, since it appears somewhat randomly when hovering over many ribbons currently. 
A timelapse slider for how the data changes over time


*/
var slider = document.getElementById("myRange");
var output = document.getElementById("demo");

output.innerHTML = slider.value; // Display the default slider value
var curYear = 2015;
slider.step = 5;
var display;
var threshold = 10000;

var curFile = "migration.csv"
// Update the current slider value (each time you drag the slider handle)
// This just makes 2019 display instead of 2020, since data is for 2019, and I don't want to deal with
// the slider step.
slider.oninput =function () {
    display = +this.value;
    if (this.value == 2020) {
        display = 2019
    }
    output.innerHTML = display;
}

slider.onmouseup = function () {
    switch(display){
        case 1990:
            curFile = "migration1.csv"
            break;
        case 1995:
            curFile = "migration2.csv"
            break;
        case 2000:
            curFile = "migration3.csv"
            break;
        case 2005:
            curFile = "migration4.csv"
            break;
        case 2010:
            curFile = "migration5.csv"
            break;
        case 2015:
            curFile = "migration.csv"
            break;
        case 2019:
            curFile = "migration6.csv"
            break;
    }
    d3.selectAll("svg").remove();
    console.log(display, curFile)
    main();

}

let reg = ['Northern Europe', 'Eastern Europe', 'Southern Europe', 'Western Europe',
 'Northern America', 'South America', 'Central America', 'Northern Africa', 'Southern Africa', 
 'Western Africa', 'Eastern Africa', 'Middle Africa', 'Western Asia', 'South-Eastern Asia', 'Southern Asia',
'Eastern Asia', 'Central Asia', 'Polynesia', 'Melanesia', 'Micronesia', 'Caribbean', 'Australia and New Zealand']
let nums = [13035652, 19260736, 15700215, 27202982, 50930692, 5624648, 1973625,
 2064631,2963361, 5943547, 5547344, 2088711, 36211042, 9170873, 13437554, 379678, 5300776, 41887, 77927 
, 100617, 1236540, 7558270]

// console.log(nums)

//tick values 
// This is copied from Mike Bostock's example :) 
// Given the group data (index, startAngle, endAngle, value, angle)
//Generates a value and angle, necessary for the tick marks to display neatly
function groupTicks(d, step) {
    // console.log(d)
    const k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, step).map(value => {
        return { value: value, angle: value * k + d.startAngle };
    });
}

var t = d3.transition()
    .duration(1500)
    .ease(d3.easeLinear);

let formatValue = d3.formatPrefix(",.0", 1e6)

var width = 960,
    height = 960,
    outerPadding = 200,
    labelPadding = 5,
    chordPadding = 0.03,
    arcThickness = 30,
    opacity = 0.5,
    fadedOpacity = 0.01,
    transitionDuration = 300,
    outerRadius = width / 2 - outerPadding,
    innerRadius = outerRadius - arcThickness,
    valueFormat = d3.format(",");

var ribbon = d3.ribbon()
    .radius(innerRadius),

    chord = d3.chord()
        .padAngle(chordPadding)
        // .sortGroups(d3.descending)
        .sortSubgroups(d3.descending)

    arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius),

    color = d3.scaleOrdinal()
        // .range(d3.schemeCategory10);
        .range(d3.schemeSpectral[11])
var popoverOptions = {
    html: true,
    template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><div class="popover-content"></div></div>'
};

function render(data) {
    var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    
    g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
    ribbonsG = g.append("g"),
    groupsG = g.append("g");

    var matrix = generateMatrix(data),
    chords = chord(matrix);

    console.log(matrix)
    // let i = 0
    // for (e of matrix){
    //    console.log(e.reduce((a,b) => a+b, 0), matrix.names[i++])
    // }
    
    color.domain(matrix.map(function (d, i) {
        return i;
    }));

    // Render the ribbons.
    ribbonsG.selectAll("path")
        .data(chords)
        .enter()
        .append("path")
        .attr("class", "ribbon")
        .attr("d", ribbon)
        .style("fill", function (d) {
            return color(d.source.index);
        })
        .style("stroke", function (d) {
            return d3.rgb(color(d.source.index)).darker();
        })
        .style("opacity", opacity)
        .on("mouseenter", function (d) {
            var src = matrix.names[d.source.index];
            var dest = matrix.names[d.target.index];
            popoverOptions.content = [
                "<strong>" + src + " to " + dest + "</strong>",
                valueFormat(d.target.value),
                "<br><strong>" + dest + " to " + src + "</strong>",
                valueFormat(d.source.value)
            ].join("<br>");
            $(this).popover(popoverOptions);
            $(this).popover("show");
        })
        .on("mouseleave", function (d) {
            $(this).popover("hide");
        });

    // ribbonsG.transition(t)


    // Scaffold the chord groups.
    var groups = groupsG
        .selectAll("g")
        .data(chords.groups)
        .enter()
        .append("g")
    // Render the chord group arcs.
    groups
        .append("path")
        .attr("class", "arc")
        .attr("d", arc)
        .style("fill", function (group) {
            return color(group.index);
        })
        .style("stroke", function (group) {
            return d3.rgb(color(group.index)).darker();
        })
        .transition(t)
        .style("opacity", opacity);
        groups
        .call(groupHover);

    // Render the chord group labels.
    var angle = d3.local(),
        flip = d3.local();

    groups
    .append("text")
    .transition(t)
        .each(function (d) {
            angle.set(this, (d.startAngle + d.endAngle) / 2)
            flip.set(this, angle.get(this) > Math.PI);
        })
        .attr("transform", function (d) {
            return [
                "rotate(" + (angle.get(this) / Math.PI * 180 - 90) + ")",
                "translate(" + (outerRadius + labelPadding) + ")",
                flip.get(this) ? "rotate(180)" : ""
            ].join("");
        })
        .attr("text-anchor", function (d) {
            return flip.get(this) ? "end" : "start";
        })
        .text(function (d) {
            // console.log(d)
            return matrix.names[d.index];
        })
        .attr("alignment-baseline", "central")
        //i added this 
        .attr("dx", d => {return (d.startAngle + d.endAngle) / 2 > Math.PI ? "-2.3em" : "2.3em"}) 
        .style("font-family", '"Helvetica Neue", Helvetica')
        .style("font-size", "10pt")
        .style("cursor", "default")

        groups
        .call(groupHover);
        
    // console.log(chords.groups)
    //Create a tick group, calls groupTicks to get the value and angle 
    let ticks = 
        groups.append("g")
        .selectAll("g")
        // .data(chord.groups)
        .data(d => groupTicks(d,3000000)) //call Mike Bostock's function to compute relevant angle
        .join("g")
        .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

    //tick line
    ticks.append("line") //type: a line
        .transition(t)
        .attr("stroke", "rgb(55,23,23)") //color of tick
        .attr("x2", 3); //length of tick

    //tick text
    ticks.filter(d => d.value % 3000000 === 0 && d.value > 0) //only display text for every 5th tick
        .append("text")
        .transition(t)
        .attr("font-size", "10px")
        .attr("x", 7.5) //some offset
        .attr("y", ".25rem") //some offset
        .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-15)" : null)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .text(d =>  formatValue(d.value));
}

// Sets up hover interaction to highlight a chord group.
// Used for both the arcs and the text labels.
function groupHover(selection) {
    selection
        .on("mouseover", function (group) {
            g.selectAll(".ribbon")
                .filter(function (ribbon) {
                    return (
                        (ribbon.source.index !== group.index) &&
                        (ribbon.target.index !== group.index)
                    );
                })
                .transition().duration(transitionDuration)
                .style("opacity", fadedOpacity);
        })
        .on("mouseout", function () {
            g.selectAll(".ribbon")
                .transition().duration(transitionDuration)
                .style("opacity", opacity);
        });
}

// Generates a matrix (2D array) from the given data, which is expected to
// have fields {origin, destination, count}. The matrix data structure is required
// for use with the D3 Chord layout.
function generateMatrix(data) {
    var nameToIndex = {},
        names = [],
        matrix = [],
        n = 0, i, j;


    function recordName(name) {
        if (!(name in nameToIndex)) {
            nameToIndex[name] = n++;
            names.push(name);
        }
    }

    data.forEach(function (d) {
        recordName(d.origin);
        recordName(d.destination);
    });

    for (i = 0; i < n; i++) {
        matrix.push([]);
        for (j = 0; j < n; j++) {
            matrix[i].push(0);
        }
    }

    data.forEach(function (d) {
        i = nameToIndex[d.origin];
        j = nameToIndex[d.destination];
        matrix[j][i] = d.count;
    });

    matrix.names = names;

    return matrix;
}

let main = () => {
    d3.csv(curFile).then(data => {
        data.forEach(d => {
            d.count = +d.count;
        })
        d3.json('hierarchy.json').then(h => {
            var dataForRegions = aggregate(data, h)
    
                // Reduce clutter by filtering out links with relatively low counts.
                .filter(function (d) {
                    return d.count > threshold;
                });
    
            render(dataForRegions);
        });
    })
}

// Aggregates data from countries to regions.
function aggregate(data, hierarchy) {
    var links = {},
        parent = {},
        descendants = d3.hierarchy(hierarchy).descendants();

    descendants.forEach(function (node) {
        if (node.parent) {
            parent[node.data.data.id] = node.parent.data.data.id;
        }
    });

    function getLink(origin, destination) {
        var key = origin + "|" + destination;
        return (key in links) ? links[key] : (links[key] = {
            origin: origin,
            destination: destination,
            count: 0
        });
    }

    data.forEach(function (d) {
        getLink(parent[d.origin], parent[d.destination]).count += d.count;

        // console.log(d.origin + " is in " + parent[d.origin]);
        // console.log(d.destination + " is in " + parent[d.destination]);
    });

    return Object.keys(links).map(function (key) {
        return links[key];
    });

}

let toggle = () => {
    var x = document.getElementById("select").value;
    // console.log(x)
    switch (x) {
        case 'default':
            d3.selectAll("svg").remove();
            chord = d3.chord()
            .padAngle(chordPadding)
            .sortSubgroups(d3.descending)
            main();
            break;
        case 'region':
            d3.selectAll("svg").remove();
            regs();
            break;
        case 'desc':
            d3.selectAll("svg").remove();
            desc();
            break;
        case 'asc':
            d3.selectAll("svg").remove();
            asc();
            break;
    }
}

let i = 0;
let regSort = (a,b) => {
    // console.log(a, nums.indexOf(a), reg[nums.indexOf(a)], b)
    return nums.indexOf(a) - nums.indexOf(b)
}

let regs = () =>{
    chord = d3.chord()
    .padAngle(chordPadding)
    .sortGroups(regSort)
    .sortSubgroups(d3.descending),

    main();
}

let desc = () =>{
    chord = d3.chord()
    .padAngle(chordPadding)
    .sortGroups(d3.descending)
    .sortSubgroups(d3.descending),

    main();
}


let asc = () =>{
    chord = d3.chord()
    .padAngle(chordPadding)
    .sortGroups(d3.ascending)
    .sortSubgroups(d3.descending),

    main();
}

main();