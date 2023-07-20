import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const DATASETS = {
  videogames: {
    TITLE: "Video Game Sales",
    DESCRIPTION: "Top 100 Most Sold Video Games Grouped by Platform",
    FILE_PATH:
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json",
  },
  movies: {
    TITLE: "Movie Sales",
    DESCRIPTION: "Top 100 Highest Grossing Movies Grouped By Genre",
    FILE_PATH:
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json",
  },
  kickstarter: {
    TITLE: "Kickstarter Pledges",
    DESCRIPTION:
      "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
    FILE_PATH:
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json",
  },
};

//change dataset according to current url
let urlParams = new URLSearchParams(window.location.search);
const DEFAULT_DATASET = "videogames";
const DATASET = DATASETS[urlParams.get("data") || DEFAULT_DATASET];

//decorate anchor element according to current dataset
const anchors = document.querySelectorAll(".anchor");
anchors.forEach((a) => {
  if (DATASET.TITLE === a.dataset.value) {
    d3.select(a).style("text-decoration", "underline");
		d3.select(a).style("color", "aliceblue");
  }
});

document.getElementById("title").innerHTML = DATASET.TITLE;
document.getElementById("description").innerHTML = DATASET.DESCRIPTION;

const body = d3.select("body");

const tooltip = body
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

const svg = d3.select("#tree-map"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

//creates an interpolation from 'color' to white	at 30%
const fader = function (color) {
	return d3.interpolateRgb(color, "#fff")(0.3);
};

//creates 20 new colors with fader function based on the colors given
const color = d3.scaleOrdinal().range(
	[
		"#1f77b4",
		"#aec7e8",
		"#ff7f0e",
		"#ffbb78",
		"#2ca02c",
		"#98df8a",
		"#d62728",
		"#ff9896",
		"#9467bd",
		"#c5b0d5",
		"#8c564b",
		"#c49c94",
		"#e377c2",
		"#f7b6d2",
		"#7f7f7f",
		"#c7c7c7",
		"#bcbd22",
		"#dbdb8d",
		"#17becf",
		"#9edae5",
	].map(fader)
);

const treemap = d3.treemap().size([width, height]).paddingInner(1);

d3.json(DATASET.FILE_PATH)
  .then((data) => {
		let root = d3.hierarchy(data)
								 .eachBefore((d) => {
									d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name
								 })
								 .sum(sumBySize)
								 .sort((a, b) => b.height - a.height || b.value - a.value);
						
		treemap(root);
		
		let cell = svg.selectAll('g')
								 	.data(root.leaves())
									.enter()
									.append('g')
									.attr('class', 'group')
									.attr('transform', (d) => 'translate(' + d.x0 + ',' + d.y0 + ')')


									
		cell
      .append("rect")
      .attr("id", (d) => d.data.id)
      .attr("class", "tile")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("data-name", (d) => d.data.name)
      .attr("data-category", (d) => d.data.category)
      .attr("data-value", (d) => d.data.value)
      .attr("fill", (d) => color(d.data.category))
      .on("mousemove", (e, d) => {
        tooltip.style("opacity", 0.9);
        tooltip
          .html(
            "Name: " +
              d.data.name +
              "<br>Category: " +
              d.data.category +
              "<br>Value: " +
              d.data.value
          )
          .attr("data-value", d.data.value)
          .style("left", e.pageX + 5 + "px")
          .style("top", e.pageY - 65 + "px");
      });

		cell
			.selectAll("rect")
			.on("mouseover", function () {
				d3.select(this).classed("rect-hover", true);
			})
			.on("mouseout", function () {
				d3.select(this).classed("rect-hover", false);
				tooltip.style("opacity", 0);
			});
			
		cell
      .append("text")
      .attr("class", "tile-text")
      .selectAll("tspan")
      .data((d) => d.data.name.split(/(?=[A-Z][^A-Z])/g))
      .enter()
      .append("tspan")
      .attr("x", 4)
      .attr("y", (d, i) => 13 + i * 10)
      .text((d) => d);	
    
		let categories = root.leaves().map((nodes) => nodes.data.category);
    categories = categories.filter((category, index, self) => self.indexOf(category) === index);
		
		let legend = d3.select("#legend");
    let legendWidth = +legend.attr("width");
    const LEGEND_OFFSET = 25;
    const LEGEND_RECT_SIZE = 15;
    const LEGEND_H_SPACING = 130;
    const LEGEND_V_SPACING = 6;
    const LEGEND_TEXT_X_OFFSET = 3;
    const LEGEND_TEXT_Y_OFFSET = -2;
    let legendElemsPerRow = Math.floor(legendWidth / LEGEND_H_SPACING);

		let legendElem = legend
      .append("g")
      .attr("transform", "translate(110," + LEGEND_OFFSET + ")")
      .selectAll("g")
      .data(categories)
      .enter()
      .append("g")
      .attr("transform", (d, i) => {
        return (
          "translate(" +
          (i % legendElemsPerRow) * LEGEND_H_SPACING +
          "," +
          (Math.floor(i / legendElemsPerRow) * LEGEND_RECT_SIZE +
            LEGEND_V_SPACING * Math.floor(i / legendElemsPerRow)) +
          ")"
        );
      });

		legendElem
      .append("rect")
      .attr("width", LEGEND_RECT_SIZE)
      .attr("height", LEGEND_RECT_SIZE)
      .attr("class", "legend-item")
      .attr("fill", (d) => color(d));

    legendElem
      .append("text")
      .attr("x", LEGEND_RECT_SIZE + LEGEND_TEXT_X_OFFSET)
      .attr("y", LEGEND_RECT_SIZE + LEGEND_TEXT_Y_OFFSET)
      .text((d) => d)
			.attr("fill", "white");	

	})
  .catch((err) => console.log(err));

function sumBySize(d) {
	return d.value;
}
