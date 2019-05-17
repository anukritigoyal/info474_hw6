'use strict';

(function() {
    let data = "no data";
    let svgContainer = ""; 

  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 700)
      .attr('height', 700);
    d3.csv("dataEveryYear.csv")
      .then((data) => makePlot(data));
  }

  function makePlot(csvData) {
    data = csvData;

    let population = data.map((row) => parseFloat(row["pop_mlns"]));
    let time = data.map((row) => parseFloat(row['time']));

    let axesLimits = findMinMax(time, population);
    let map_functions = drawAxes(axesLimits, "time", "pop_mlns");
  
    plotGraph(map_functions);
    makeLabels();
  }

  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 350)
      .attr('y', 20)
      .style('font-size', '14pt')
      .text("Population Size Over Time");
    
    svgContainer.append('text')
      .attr('x', 320)
      .attr('y', 690)
      .style('font-size', '10pt')
      .text('Time (years)');

    svgContainer.append('text')
      .attr('transform', 'translate(10, 375)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population (millions)');
  }

  function findMinMax(x, y) {
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    let yMin = d3.min(y);
    let yMax = d3.max(y);

    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  function drawAxes(limits, x, y) {    
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5])
      .range([50, 650]);

    let xMap = function(d) {  return xScale(d); };

    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 650)')
      .call(xAxis);

    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5])
      .range([50, 650]);

    let yMap = function (d) { return yScale(d); };

    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);
     
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  function drawToolTipAxes(limits, x, y, div) {    
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5])
      .range([20, 250]);

    let xMap = function(d) {  return xScale(d); };

    let xAxis = d3.axisBottom().scale(xScale);
    div.append("g")
      .attr('transform', 'translate(10, 250)')
      .call(xAxis);

    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5])
      .range([20, 250]);

    let yMap = function (d) { return yScale(d); };

    let yAxis = d3.axisLeft().scale(yScale);
    div.append('g')
      .attr('transform', 'translate(30, 0)')
      .call(yAxis);
     
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  function makeToolTipLabels(div) {
    div.append('text')
      .attr('x', 5)
      .attr('y', 10)
      .style('font-size', '9pt')
      .text("Life Expectancy and Fertility Rate");
    
    div.append('text')
      .attr('x', 50)
      .attr('y', 290)
      .style('font-size', '7pt')
      .text('Fertility Rates (Avg Children per Woman)');

    div.append('text')
      .attr('transform', 'translate(6, 150)rotate(-90)')
      .style('font-size', '7pt')
      .text('Life Expectancy (years)');
  }

  function plotGraph(map) {
    let years = getFilters(data);
    
    let xMap = map.x;
    let yMap = map.y;

    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    let toolTipContainer = div.append('svg')
      .attr('width', 300)
      .attr('height', 300);
    

    let line = d3.line()
        .x(function(d) {return xMap(d['time']); })
        .y(function(d) { return yMap(d['pop_mlns']); });


    let draw = svgContainer.append('path').data(data.filter(function(d){return d.location==years[0]}))
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr('d', line(data.filter(function(d){return d.location==years[0]})))
    .on("mouseover", (d) => {
      makeScatterPlot(data, toolTipContainer);
      div.transition()
        .duration(200)
        .style("opacity", .9)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", (d) => {
      div.transition()
        .duration(2000)
        .style("opacity", 0);
    });
    
    let dropDown = d3.select('body')
    .append('select')
    .on('change', function() {
        let selected = this.value;
        let selectedLocation = data.filter(location => location.location == selected);
        draw.data(selectedLocation)
            .transition()
            .attr('d', line(selectedLocation))
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
    });

    dropDown.selectAll('option')
      .data(years)
      .enter()
        .append('option')
        .text((d) => { return d; });
  }

  function makeScatterPlot(data,div) {

    let fertility = data.map((row) => parseFloat(row["fertility_rate"]));
    let expectancy = data.map((row) => parseFloat(row["life_expectancy"]));
   
    
    let limits = findMinMax(fertility, expectancy);

    let mapFunctions = drawToolTipAxes(limits, "fertility_rate", "life_expectancy", div);

    plotToolTip(mapFunctions,div);

    makeToolTipLabels(div);
  }

  function plotToolTip(map, div) {
    let pop = data.map((row) => +row["pop_mlns"]);
    let lims = d3.extent(pop);

    d3.scaleLinear()
      .domain([lims[0], lims[1]])
      .range([3, 20]);
    
    let xMap = map.x;
    let yMap = map.y;
     
    div.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', function(d) { return xMap(d["fertility_rate"])})
        .attr('cy', function(d) { return yMap(d["life_expectancy"])})
        .attr('r', 1.5)
        .attr('fill', "#4286f4")
  }

  function getFilters(data){
      let years = data.map((row) => row["location"]);
     
      years = [... new Set(years)];
      return years;
  }

})();