/*
 Sources: 
    https://observablehq.com/@d3/chord-diagram
    https://observablehq.com/@d3/chord-dependency-diagram
    http://bl.ocks.org/nbremer/94db779237655907b907
*/

// Set height and width of svg
let width = 800, height = 500

//Creates a map for the names of each group for the tutorial data
//Mike Bostock uses this format because his example has a lot of groups
//https://observablehq.com/@d3/chord-dependency-diagram

// let names = new Map;
// for(let i =0; i <5; i++){
//     names.set(i, `Group ${i}`)
// }

//random data
// let x = 15
// let names = [];
// let matrix = [];
// for (let i = 0; i < x; i++){
//     names.push(`Group ${i}`)
//     let t = [];
//     for (let j = 0; j < x; j++){
//         t.push(Math.random() * 10)
//     }  
//     matrix.push(t)
// }

// can also hard code it
names = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5']

//Same tutorial data as from my presentation slide
let matrix = [[1, 2, 3, 4, 5], // 15
              [6, 7, 8, 9, 1], // 31
              [2, 3, 4, 5, 6], // 20
              [7, 8, 9, 1, 2], // 27
              [3, 4, 5, 6, 7]];// 25


// Some real data from http://bl.ocks.org/nbremer/94db779237655907b907
// var names = ["Apple","HTC","Huawei","LG","Nokia","Samsung","Sony","Other"];
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

console.log("data:", names, matrix)// to see our data!


// inner and outer radius of diagram, if height and width were dynamic
// let outerRadius = Math.min(width, height) * 0.5 - 30
// let innerRadius = outerRadius - 20

//could also just do the following, if width and height are static
let outerRadius = 220
let innerRadius = 200

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
// of a circle. Specifying differing an inner radius less than an outer radius
//creates a donut shape :)
let arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)

/* 
    Tutorial: d3.chord()
    Constructs a new chord layout with the default settings

    Declaration: 
        let chord = d3.chord() 
    Parameters:
        chord.padAngle(angle) -- the padding, specified in radians between each group
        chord.sortGroups(comparator) -- sort the group positions around the circumference of the circle, or null if nothing is specified
        chord.sortSubgroups(comparator) -- sort the subgroups of each group, or null if nothing is specified, this will determine the order of the ribbons
        chord.sortChords(comparator) -- sort the z-index, e.g. which ribbon appears on top
        chord.matrix(data) Deprecated in V5

    To pass in the matrix data:
    
    const chords = chord(matrix)
        Returns: Array of chords (objects) of (N/2)(N+1) chords, where N = number of groups

    Note: The matrix must be a squared matrix
          Each row corresponds to an entity (group)
          The same index in each row corresponds to the same reference node for the flow

    Each chord combines the bidirectional flow between the source and target (source can equal target), where each object has properties:
          index (source node index)
          subindex ( target node index)
          startAngle (starting angle in radians)
          endAngle (ending angle in radians)
          value (weight or matrix flow value)

    Seen in the console.log statements
    
    Declare ribbon and arc generators
    d3.arc() and d3.ribbon()

    Typically, the chords array result is passed to d3.ribbon(), a path generator to actually draw the path
    So, the "d" attribute will be the ribbon generator, as stated in the ribbon documentation,
    given a context, the ribbon genreator will render to this context a sequence of path method calls.

    Meanwhile, the chords.groups is passed to d3.arc() to draw the outer donut shape of the circle, 
    denoting the groups for the data.

    Pass matrix into chord layout to generate chords
        const chords = chord(matrix)
    Create the SVG
        Draw groups with arc and chords.groups
        Draw ribbons with ribbon and chords

    This is shown in the last part of this javascript code.
*/


//declare the chord
//After an array of chords has been declared later, we can render the ribbons
// for the chords by passing it to d3.ribbon().
let chord = d3.chord()
    .padAngle(0.05)
    .sortGroups(d3.descending) //order by group sum
    .sortSubgroups(d3.ascending) //order subgroups
    .sortChords(d3.descending) //z-order


//call the chord data
let chords = chord(matrix); //Generates an array of chords

console.log("chords: ", chords) //the chords
console.log("groups: ", chords.groups) //the groups
console.log("arc for the first group: ", arc(chords.groups[0])) //the arc for the first group
console.log("ribbon for the first chord: ", ribbon(chords[0])) //the ribbon for the first chord

// helper function to generate angles for the ticks 
// This is based on Mike Bostock's example, I just added 1 so there's an end tick :) 
// Given the group data (index, startAngle, endAngle, value, angle)
// Generates a value and angle, necessary for the tick marks to display neatly
function groupTicks(d, step) {
    // console.log(d)
    const k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value + 1, step).map(value => {
        return { value: value, angle: value * k + d.startAngle };
    });
}

//Formats the digits of precision
// let formatValue = d3.formatPrefix(",.0", 1e3)

// Now everything is setup, we just need to draw the svg!

//create the svg
// Use a viewbox instead of height/width to avoid dealing with transform translate
// and automatically scales, and preservers the aspect ratio.
let svg = d3.select('body')
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2 - 30, width, height + 100])
    .attr("font-size", 10)
    .attr("font-family", "sans-serif");

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
    
    .attr("transform", d => ` rotate(${(d.angle * 180 / Math.PI - 90)}) translate(${innerRadius + 50}) ${d.angle > Math.PI ? "rotate(180)" : ""}`) 
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null) //text anchor based on the angle
    .text((d,i) => {return names[i]}); //the names of the groups

//Create a tick group, calls groupTicks to get the value and angle 
let ticks = group.append("g")
    .selectAll("g")
    .data(d => groupTicks(d, 1)) //call Mike Bostock's function to compute relevant angle
    .join("g")
    .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

//tick line
ticks.append("line") //type: a line
    .attr("stroke", "rgb(55,23,23)") //color of tick
    .attr("x2", 4); //length of tick

//tick text
ticks.filter(d => d.value % 8 === 0) //only display text for every 8th tick
    .append("text")
    .attr("x", 8) //some offset
    .attr("y", ".25rem") //some offset
    .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-15)" : null)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .text(d => d.value);

//draw the chords/ribbons on the svg.
svg.append("g")
    .attr("fill-opacity", 0.53) //so that ribbons are see-through
    .selectAll("path")
    .data(chords) //the array of chords, passed to ribbon to draw the ribbons
    .join("path")
    .attr("d", ribbon) //ribbon has an array of paths,a context, as shown in the console.log
    .attr("fill", d => colors(d.target.index)) //color
    .attr("stroke", d => d3.rgb(colors(d.target.index)).darker()); //darker shade for the outline