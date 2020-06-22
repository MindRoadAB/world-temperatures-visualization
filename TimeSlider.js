

class TimeSlider {
    constructor(controller) {
        this.controller = controller;
    }
    initialize() {
        this.update = this.update.bind(this);
        
        this.setup_elements();
    }

    setup_elements() {

        this.margin = {top:50, right:50, bottom:0, left:50};
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 100 - this.margin.top - this.margin.bottom;

        
        const startDate = new Date(this.controller.data2.firstDate);
        const endDate = new Date(this.controller.data2.lastDate);


        this.x = d3.scaleTime()
            .domain([startDate, endDate])
            .range([0, this.width])
            .clamp(true);

        this.toYearFormat = d3.timeFormat("%Y");
        this.timeFormat = d3.timeFormat('%Y %b');

        const sliderSVG = d3.select("#map").append("svg")
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("width", this.width + this.margin.left + this.margin.right);
        const sliderG = sliderSVG.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        sliderG.append("line")
            .attr("class", "track")
            .attr("x1", this.x.range()[0])
            .attr("x2", this.x.range()[1])
          .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-inset")
          .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function() { sliderG.interrupt(); })
                .on("start drag", () => {
                  const currentValue = d3.event.x;
                  this.update(this.x.invert(currentValue)); 
                })
            );

        sliderG.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
          .selectAll("text")
            .data(this.x.ticks(10))
            .enter()
            .append("text")
            .attr("x", this.x)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .text(d => { return this.toYearFormat(d); });

        this.handle = sliderG.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9);

        this.label = sliderG.append("text")  
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .text(this.timeFormat(startDate))
            .attr("transform", "translate(0," + (-25) + ")")
    }

    update(date) {
      //console.log(date.getMonth());
        // update position and text of label according to slider scale
        
        this.handle.attr("cx", this.x(date));
        this.label
          .attr("x", this.x(date))
          .text(this.timeFormat(date));

        //console.log(date);
        this.controller.change_tempMap_year(this.date_to_string(date));

      }

    date_to_string(date) {
        return date.getFullYear() + 
                "-" + (date.getMonth() + 1).toString().padStart(2, "0") + 
                "-01";
    }
}

export default TimeSlider;