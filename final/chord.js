var slider = document.getElementById("myRange");
var output = document.getElementById("demo");

output.innerHTML = slider.value; // Display the default slider value

var curYear;
// Update the current slider value (each time you drag the slider handle)
slider.oninput = function () {
    curYear = this.value;
    output.innerHTML = curYear;
}

var width = 960,
    height = 960,
    outerPadding = 150,
    labelPadding = 5,
    chordPadding = 0.03,
    arcThickness = 30,
    opacity = 0.5,
    fadedOpacity = 0.01,
    transitionDuration = 300,
    outerRadius = width / 2 - outerPadding,
    innerRadius = outerRadius - arcThickness,
    valueFormat = d3.format(",");

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
    ribbonsG = g.append("g"),
    groupsG = g.append("g");

var ribbon = d3.ribbon()
    .radius(innerRadius),
    chord = d3.chord()
        .padAngle(chordPadding)
        .sortSubgroups(d3.descending),
    arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius),
    color = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

var popoverOptions = {
    html : true,
    template: '<div class="popover" role="tooltip"><div class="popover-arrow"></div><div class="popover-content"></div></div>'
    };

    function render(data){

        var matrix = generateMatrix(data),
            chords = chord(matrix);

        color.domain(matrix.map(function (d, i){
          return i;
        }));

        // Render the ribbons.
        ribbonsG.selectAll("path")
            .data(chords)
          .enter().append("path")
            .attr("class", "ribbon")
            .attr("d", ribbon)
            .style("fill", function(d) {
              return color(d.source.index);
            })
            .style("stroke", function(d) {
              return d3.rgb(color(d.source.index)).darker();
            })
            .style("opacity", opacity)
            .on("mouseenter", function(d){
              var src = matrix.names[d.source.index];
              var dest = matrix.names[d.target.index];
              popoverOptions.content = [
                "<strong>" + src +" to " + dest +"</strong>",
                valueFormat(d.target.value),
                "<br><strong>" + dest +" to " + src +"</strong>",
                valueFormat(d.source.value)
              ].join("<br>");
              $(this).popover(popoverOptions);
              $(this).popover("show");
            }) 
            .on("mouseleave", function (d){
              $(this).popover("hide");
            })


        // Scaffold the chord groups.
        var groups = groupsG
          .selectAll("g")
            .data(chords.groups)
          .enter().append("g");

        // Render the chord group arcs.
        groups
          .append("path")
            .attr("class", "arc")
            .attr("d", arc)
            .style("fill", function(group) {
              return color(group.index);
            })
            .style("stroke", function(group) {
              return d3.rgb(color(group.index)).darker();
            })
            .style("opacity", opacity)
            .call(groupHover);

        // Render the chord group labels.
        var angle = d3.local(),
            flip = d3.local();
        groups
          .append("text")
            .each(function(d) {
              angle.set(this, (d.startAngle + d.endAngle) / 2)
              flip.set(this, angle.get(this) > Math.PI);
            })
            .attr("transform", function(d) {
              return [
                "rotate(" + (angle.get(this) / Math.PI * 180 - 90) + ")",
                "translate(" + (outerRadius + labelPadding) + ")",
                flip.get(this) ? "rotate(180)" : ""
              ].join("");
            })
            .attr("text-anchor", function(d) {
              return flip.get(this) ? "end" : "start";
            })
            .text(function(d) {
              return matrix.names[d.index];
            })
            .attr("alignment-baseline", "central")
            .style("font-family", '"Helvetica Neue", Helvetica')
            .style("font-size", "10pt")
            .style("cursor", "default")
            .call(groupHover);
      }

      // Sets up hover interaction to highlight a chord group.
      // Used for both the arcs and the text labels.
      function groupHover(selection){
        selection
          .on("mouseover", function (group){
            g.selectAll(".ribbon")
                .filter(function(ribbon) {
                  return (
                    (ribbon.source.index !== group.index) &&
                    (ribbon.target.index !== group.index)
                  );
                })
              .transition().duration(transitionDuration)
                .style("opacity", fadedOpacity);
          })
          .on("mouseout", function (){
            g.selectAll(".ribbon")
              .transition().duration(transitionDuration)
                .style("opacity", opacity);
          });
      }

      // Generates a matrix (2D array) from the given data, which is expected to
      // have fields {origin, destination, count}. The matrix data structure is required
      // for use with the D3 Chord layout.
      function generateMatrix(data){
        var nameToIndex = {},
            names = [],
            matrix = [],
            n = 0, i, j;
        

        function recordName(name){
          if( !(name in nameToIndex) ){
            nameToIndex[name] = n++;
            names.push(name);
          }
        }

        data.forEach(function (d){
          recordName(d.origin);
          recordName(d.destination);
        });

        for(i = 0; i < n; i++){
          matrix.push([]);
          for(j = 0; j < n; j++){
            matrix[i].push(0);
          }
        }

        data.forEach(function (d){
          i = nameToIndex[d.origin];
          j = nameToIndex[d.destination];
          matrix[j][i] = d.count;
        });

        matrix.names = names;

        return matrix;
      }
      d3.csv("migration.csv", type, function (dataForCountries){
        d3.json("hierarchy.json", function (hierarchy){

          // Aggretate country data into regional data.
          var dataForRegions = aggregate(dataForCountries, hierarchy)

            // Reduce clutter by filtering out links with relatively low counts.
            .filter(function (d){
              return d.count > 10000;
            });

          render(dataForRegions);
        });

      });

      // Parses a single row of the input table.
      function type(d){
        d.count = +d.count;
        return d;
      }

      // Aggregates data from countries to regions.
      function aggregate(data, hierarchy){
        var links = {},
            parent = {},
            descendants = d3.hierarchy(hierarchy).descendants();

        descendants.forEach(function (node){
          if(node.parent){
            parent[node.data.data.id] = node.parent.data.data.id;
          }
        });

        function getLink(origin, destination){
          var key = origin + "|" + destination;
          return (key in links) ? links[key] : (links[key] = {
            origin: origin,
            destination: destination,
            count: 0
          });
        }

        data.forEach(function (d){
          getLink(parent[d.origin], parent[d.destination]).count += d.count;

          //console.log(d.origin + " is in " + parent[d.origin]);
          //console.log(d.destination + " is in " + parent[d.destination]);
        });

        return Object.keys(links).map(function (key){
          return links[key];
        });

      }
// let width = 800, height = 500

// let names = new Map;
// for (let i = 0; i < 5; i++) {
//     names.set(i, `Group ${i}`)
// }

// let data = {
//     matrix: [[1, 2, 3, 4, 5],
//     [6, 7, 8, 9, 1],
//     [2, 3, 4, 5, 6], //2+3+4+5+6 = 20
//     [7, 8, 9, 1, 2], //7+8+9+1+2 = 27
//     [3, 4, 5, 6, 7]],
//     names: names
// };


// console.log("data:", data) // to see our data!

// let outerRadius = 220
// let innerRadius = 200

// console.log("outer radius", outerRadius) // to see our radius values!
// console.log("inner radius", innerRadius)

// //color scale
// var colors = d3.scaleOrdinal(d3.schemeCategory10);

// let ribbon = d3.ribbon()
//     .radius(innerRadius)

// let arc = d3.arc()
//     .innerRadius(innerRadius)
//     .outerRadius(outerRadius)


// let chord = d3.chord()
//     .padAngle(0.05)
//     // .sortGroups(d3.ascending) //order by group sum
//     .sortSubgroups(d3.ascending) //order subgroups
//     .sortChords(d3.ascending) //z-order

// //tick values 
// // This is copied from Mike Bostock's example :) 
// // Given the group data (index, startAngle, endAngle, value, angle)
// //Generates a value and angle, necessary for the tick marks to display neatly
// function groupTicks(d, step) {
//     // console.log(d)
//     const k = (d.endAngle - d.startAngle) / d.value;
//     return d3.range(0, d.value, step).map(value => {
//         return { value: value, angle: value * k + d.startAngle };
//     });
// }

// //call the chord data
// let chords = chord(data.matrix); //Generates an array of chords
// // let chords = chord(matrix); // Real data example

// console.log("chords: ", chords) //the chords
// console.log("groups: ", chords.groups) //the groups
// console.log("arc for the first group: ", arc(chords.groups[0])) //the arc for the first group
// console.log("ribbon for the first chord: ", ribbon(chords[0])) //the ribbon for the first chord

// let svg = d3.select('body')
//     .append("svg")
//     .attr("viewBox", [-width / 2, -height / 2 - 30, width, height + 100])
//     .attr("font-size", 10)
//     .attr("font-family", "sans-serif");

// let group = svg.append("g")
//     .selectAll("g")
//     .data(chords.groups)
//     .join("g");

// //Color each group
// group.append("path")
//     .attr("fill", d => colors(d.index))//color of the arc
//     .attr("stroke", d => d3.rgb(colors(d.index)).darker()) //stroke of the arc
//     .attr("d", arc); //calls arc as the path, donut shape, since we have inner and outer radius specified

// // text for each group
// group.append("text")
//     .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; }) //compute angle
//     .attr("dy", ".35em") //some y offset, not really needed for our example
//     .attr("transform", d => `
//       rotate(${(d.angle * 180 / Math.PI - 90)})
//       translate(${innerRadius + 50})
//       ${d.angle > Math.PI ? "rotate(180)" : ""}
//     `) // rotate and translate depending on the angle computed in the each() clause
//     .attr("text-anchor", d => d.angle > Math.PI ? "end" : null) //text anchor based on the angle
//     .text(d => data.names.get(d.index)); // the name of the group
// // .text((d,i) => {return names2[i]}); //this also works
// // .text((d,i) => {return NameProvider[i]}); //for the real data example

// //Create a tick group, calls groupTicks to get the value and angle 
// let ticks = group.append("g")
//     .selectAll("g")
//     .data(d => groupTicks(d, 1)) //call Mike Bostock's function to compute relevant angle
//     .join("g")
//     .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

// //tick line
// ticks.append("line") //type: a line
//     .attr("stroke", "rgb(55,23,23)") //color of tick
//     .attr("x2", 4); //length of tick

// //tick text
// ticks.filter(d => d.value % 5 === 0) //only display text for every 5th tick
//     .append("text")
//     .attr("x", 7.5) //some offset
//     .attr("y", ".75rem") //some offset
//     .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-15)" : null)
//     .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
//     .text(d => d.value);

// //draw the chords/ribbons on the svg.
// svg.append("g")
//     .attr("fill-opacity", 0.53) //so that ribbons are see-through
//     .selectAll("path")
//     .data(chords) //the array of chords, passed to ribbon to draw the ribbons
//     .join("path")
//     .attr("d", ribbon) //ribbon has an array of paths,a context, as shown in the console.log
//     .attr("fill", d => colors(d.target.index)) //color
//     .attr("stroke", d => d3.rgb(colors(d.target.index)).darker()); //darker shade for the outline