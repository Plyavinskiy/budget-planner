const dimensions = { height: 300, width: 300, radius: 150 };

const center = {
  x: dimensions.width / 2 + 5,
  y: dimensions.height / 2 + 5,
};

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dimensions.width + 150)
  .attr("height", dimensions.height + 150);

const graph = svg
  .append("g")
  .attr("transform", `translate(${center.x}, ${center.y})`);

const pie = d3
  .pie()
  .sort(null)
  .value((d) => d.cost);

const arcPath = d3
  .arc()
  .outerRadius(dimensions.radius)
  .innerRadius(dimensions.radius / 2);

const color = d3.scaleOrdinal(d3["schemeSet3"]);

const legendGroup = svg
  .append("g")
  .attr("transform", `translate(${dimensions.width + 40}, 10)`);

const legend = d3
  .legendColor()
  .shape("path", d3.symbol().type(d3.symbolCircle)())
  .shapePadding(10)
  .scale(color);

const tip = d3
  .tip()
  .attr("class", "tip card")
  .html((d) => {
    let content = `<div class="name">${d.data.name}</div>`;

    content += `<div class="cost">${d.data.cost}</div>`;
    content += '<div class="delete">Click slice to delete</div>';

    return content;
  });

graph.call(tip);

const update = (data) => {
  color.domain(data.map((d) => d.name));

  legendGroup.call(legend);
  legendGroup.selectAll("text").attr("fill", "#fff");

  const paths = graph.selectAll("path").data(pie(data));

  paths.exit().transition().duration(750).attrTween("d", arcTweenExit).remove();

  paths
    .attr("d", arcPath)
    .transition()
    .duration(750)
    .attrTween("d", arcTweenUpdate);

  paths
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("stroke", "#fff")
    .attr("stroke-width", 3)
    .attr("fill", (d) => color(d.data.name))
    .each(function (d) {
      this._current = d;
    })
    .transition()
    .duration(750)
    .attrTween("d", arcTweenEnter);

  graph
    .selectAll("path")
    .on("mouseover", (d, i, n) => {
      tip.show(d, n[i]);
      handleMouseOver(i, n);
    })
    .on("mouseout", (d, n, i) => {
      tip.hide();
      handleMouseOut(d, n, i);
    })
    .on("click", handleClick);
};

let data = [];

db.collection("expenses").onSnapshot((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case "added":
        data = [...data, doc];
        break;
      case "modified":
        data = data.map((item) => (item.id === doc.id ? doc : item));
        break;
      case "removed":
        data = data.filter((item) => item.id !== doc.id);
        break;
      default:
        break;
    }
  });

  update(data);
});

const arcTweenEnter = (d) => {
  const i = d3.interpolate(d.endAngle, d.startAngle);

  return function (t) {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

const arcTweenExit = (d) => {
  const i = d3.interpolate(d.startAngle, d.endAngle);

  return function (t) {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

function arcTweenUpdate(d) {
  const i = d3.interpolate(this._current, d);

  this._current = d;

  return function (t) {
    return arcPath(i(t));
  };
}

const handleMouseOver = (i, n) => {
  d3.select(n[i])
    .transition("changeSliceFill")
    .duration(300)
    .attr("fill", "#fff");
};

const handleMouseOut = (d, i, n) => {
  d3.select(n[i])
    .transition("changeSliceFill")
    .duration(300)
    .attr("fill", color(d.data.name));
};

const handleClick = (d) => {
  const id = d.data.id;
  db.collection("expenses").doc(id).delete();
};
