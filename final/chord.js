var slider = document.getElementById("myRange");
var output = document.getElementById("demo");

output.innerHTML = slider.value; // Display the default slider value

var curYear;
// Update the current slider value (each time you drag the slider handle)
slider.oninput = function () {
    curYear = this.value;
    output.innerHTML = curYear;
}


let width = 800, height = 500

let names = new Map;
for (let i = 0; i < 5; i++) {
    names.set(i, `Group ${i}`)
}

let data = {
    matrix: [[1, 2, 3, 4, 5],
    [6, 7, 8, 9, 1],
    [2, 3, 4, 5, 6], //2+3+4+5+6 = 20
    [7, 8, 9, 1, 2], //7+8+9+1+2 = 27
    [3, 4, 5, 6, 7]],
    names: names
};


console.log("data:", data) // to see our data!

let outerRadius = 220
let innerRadius = 200

console.log("outer radius", outerRadius) // to see our radius values!
console.log("inner radius", innerRadius)

//color scale
var colors = d3.scaleOrdinal(d3.schemeCategory10);

let ribbon = d3.ribbon()
    .radius(innerRadius)

let arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)


let chord = d3.chord()
    .padAngle(0.05)
    // .sortGroups(d3.ascending) //order by group sum
    .sortSubgroups(d3.ascending) //order subgroups
    .sortChords(d3.ascending) //z-order

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

//call the chord data
let chords = chord(data.matrix); //Generates an array of chords
// let chords = chord(matrix); // Real data example

console.log("chords: ", chords) //the chords
console.log("groups: ", chords.groups) //the groups
console.log("arc for the first group: ", arc(chords.groups[0])) //the arc for the first group
console.log("ribbon for the first chord: ", ribbon(chords[0])) //the ribbon for the first chord

let svg = d3.select('body')
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2 - 30, width, height + 100])
    .attr("font-size", 10)
    .attr("font-family", "sans-serif");

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
ticks.filter(d => d.value % 5 === 0) //only display text for every 5th tick
    .append("text")
    .attr("x", 7.5) //some offset
    .attr("y", ".75rem") //some offset
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