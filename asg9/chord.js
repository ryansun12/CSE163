/*
 Sources of inspiration: 
    https://observablehq.com/@d3/chord-diagram
    https://observablehq.com/@d3/chord-dependency-diagram
    http://bl.ocks.org/nbremer/94db779237655907b907
*/

// Set height and width of svg
let width = 800, height = 500

//Just creating a map for the names of each group. 
let names = new Map;
for(let i =0; i <5; i++){
    names.set(i, `Group ${i}`)
}

//Same data as from the slide
let data = {
    matrix: [[1, 2, 3, 4, 5],
    [6, 7, 8, 9, 1],
    [2, 3, 4, 5, 6], //2+3+4+5+6 = 20
    [7, 8, 9, 1, 2], //7+8+9+1+2 = 27
    [3, 4, 5, 6, 7]],
    names: names
};

console.log(data)

// inner and outer radius of diagram
let outerRadius = Math.min(width, height) * 0.5 - 30
let innerRadius = outerRadius - 20

//color scale
var colors = d3.scaleOrdinal(d3.schemeCategory10);

// Create the ribbon generator
// the edges between each node is represented as a ribbon, weight of the edge
// is represented as the width of the ribbon near the source. 
// If two edges exist between 2 nodes, they are represented as a single ribbon
let ribbon = d3.ribbon()
    .radius(innerRadius)

//declare the arc
//Nodes or groups are represented as arcs, separated by a padding, on the circumference
// of a circle. 
let arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)

//declare the chord
//After an array of chords has been declared later, we can render the ribbons
// for the chords by passing it to d3.ribbon().
let chord = d3.chord()
    .padAngle(0.05)
    // .sortGroups(d3.ascending) //order by group sum
    .sortSubgroups(d3.ascending) //order subgroups

//tick values 
// TODO
function groupTicks(d, step) {
    const k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, step).map(value => {
        return { value: value, angle: value * k + d.startAngle };
    });
}

//create the svg
// Use a viewbox instead of height/width to avoid dealing with transform translate
// and automatically scales, and preservers the aspect ratio.
let svg = d3.select('body')
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2 - 30, width, height + 100])
    .attr("font-size", 10)
    .attr("font-family", "sans-serif");

//call the chord data
let chords = chord(data.matrix); //Generates an array of chords

console.log(chords) //the chords
console.log(chords.groups) //the groups

//adds 0 digit of precision
// let formatValue = d3.formatPrefix(",.0", 1e0)

let group = svg.append("g")
    .selectAll("g")
    .data(chords.groups)
    .join("g");

group.append("path")
    .attr("fill", d => colors(d.index))
    .attr("stroke", d => d3.rgb(colors(d.index)).darker())
    .attr("d", arc);

group.append("text")
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr("dy", ".35em")
    .attr("transform", d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${innerRadius + 50})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
    `)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .text(d => data.names.get(d.index));

//ticks
let groupTick = group.append("g")
    .selectAll("g")
    .data(d => groupTicks(d, 1))
    .join("g")
    .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

//tick line
groupTick.append("line")
    .attr("stroke", "#000")
    .attr("x2", 4);

//tick parameters
groupTick
    .filter(d => d.value % 2 === 0)
    .append("text")
    .attr("x", 8)
    .attr("dy", ".35em")
    .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .text(d => d.value);

//draw the diagram!
svg.append("g")
    .attr("fill-opacity", 0.67)
    .selectAll("path")
    .data(chords) //the array of chords, passed to ribbon to draw the arcs
    .join("path")
    .attr("d", ribbon)
    .attr("fill", d => colors(d.target.index))
    .attr("stroke", d => d3.rgb(colors(d.target.index)).darker());