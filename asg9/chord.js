/*
 Sources of inspiration: 
    https://observablehq.com/@d3/chord-diagram
    https://observablehq.com/@d3/chord-dependency-diagram
    http://bl.ocks.org/nbremer/94db779237655907b907
*/

// Set height and width of svg
let width = 800, height = 500

//Creates a map for the names of each group for the tutorial data
//Mike Bostock uses this format because his example has a lot of groups
//https://observablehq.com/@d3/chord-dependency-diagram
let names = new Map;
for(let i =0; i <5; i++){
    names.set(i, `Group ${i}`)
}
//can also just do
// names2 = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5']

//Same tutorial data as from my presentation slide
let data = {
    matrix: [[1, 2, 3, 4, 5],
    [6, 7, 8, 9, 1],
    [2, 3, 4, 5, 6], //2+3+4+5+6 = 20
    [7, 8, 9, 1, 2], //7+8+9+1+2 = 27
    [3, 4, 5, 6, 7]],
    names: names
};

// Some real data from http://bl.ocks.org/nbremer/94db779237655907b907
// var NameProvider = ["Apple","HTC","Huawei","LG","Nokia","Samsung","Sony","Other"];
// var matrix = [
// [9.6899,0.8859,0.0554,0.443,2.5471,2.4363,0.5537,2.5471], /*Apple 19.1584*/
// [0.1107,1.8272,0,0.4983,1.1074,1.052,0.2215,0.4983], /*HTC 5.3154*/
// [0.0554,0.2769,0.2215,0.2215,0.3876,0.8306,0.0554,0.3322], /*Huawei 2.3811*/
// [0.0554,0.1107,0.0554,1.2182,1.1628,0.6645,0.4983,1.052], /*LG 4.8173*/
// [0.2215,0.443,0,0.2769,10.4097,1.2182,0.4983,2.8239], /*Nokia 15.8915*/
// [1.1628,2.6024,0,1.3843,8.7486,16.8328,1.7165,5.5925], /*Samsung 38.0399*/
// [0.0554,0.4983,0,0.3322,0.443,0.8859,1.7719,0.443], /*Sony 4.4297*/
// [0.2215,0.7198,0,0.3322,1.6611,1.495,0.1107,5.4264] /*Other 9.9667*/
// ];

console.log("data:", data) // to see our data!


// inner and outer radius of diagram
let outerRadius = Math.min(width, height) * 0.5 - 30
let innerRadius = outerRadius - 20

console.log("outer radius", outerRadius) // to see our radius values!
console.log("inner radius", innerRadius)

//color scale
var colors = d3.scaleOrdinal(d3.schemeCategory10);

// Create the ribbon generator
// the edges between each node is represented as a ribbon, weight of the edge
// is represented as the width of the ribbon near the source. 
// If two edges exist between 2 nodes, they are represented as a single ribbon
// So, chords i,j and j,i will only have one ribbon returned. 
let ribbon = d3.ribbon()
    .radius(innerRadius)

//declare the arc function for each group
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
// This is copied from Mike Bostock's example :)
//Computes the value and angle necessary for the tick marks to display neatly
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
// let chords = chord(matrix); // Real data example

console.log("chords: ", chords) //the chords
console.log("groups: ", chords.groups) //the groups
console.log("ribbon for the first chord: ", ribbon(chords[0])) //the ribbon for the first chord

//adds 0 digit of precision
// let formatValue = d3.formatPrefix(",.0", 1e0)


// Now everything is setup, we just need to draw the diagram!

// Create a group for the arcs, dividing the outer shell into the number of
// groups of the data
let group = svg.append("g")
    .selectAll("g")
    .data(chords.groups)
    .join("g");

//Color each group
group.append("path")
    .attr("fill", d => colors(d.index))//color of the arc
    .attr("stroke", d => d3.rgb(colors(d.index)).darker()) //stroke of the arc
    .attr("d", arc); //calls arc as the path, donut shape, since we have inner and outer radius specified

// text for each group
group.append("text")
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; }) //compute angle
    .attr("dy", ".35em") //some y offset, not really needed for our example
    .attr("transform", d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${innerRadius + 50})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
    `) // rotate and translate depending on the angle computed in the each() clause
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null) //text anchor based on the angle
    .text(d => data.names.get(d.index)); // the name of the group
    // .text((d,i) => {return names2[i]}); //this also works
    // .text((d,i) => {return NameProvider[i]}); //for the real data example

//tick group, calls groupTicks to get the value and angle 
let groupTick = group.append("g")
    .selectAll("g")
    .data(d => groupTicks(d, 1))
    .join("g")
    .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

//tick line
groupTick.append("line")
    .attr("stroke", "#000")
    .attr("x2", 4);

//tick text
groupTick
    .filter(d => d.value % 5 === 0)
    .append("text")
    .attr("x", 8)
    .attr("dy", ".35em")
    .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .text(d => d.value);

//draw the chords/ribbons!
svg.append("g")
    .attr("fill-opacity", 0.67)
    .selectAll("path")
    .data(chords) //the array of chords, passed to ribbon to draw the ribbons
    .join("path")
    .attr("d", ribbon) //ribbon has an array of paths, as shown in the console.log, so this just iterates through it for each entry in chords
    .attr("fill", d => colors(d.target.index))
    .attr("stroke", d => d3.rgb(colors(d.target.index)).darker());