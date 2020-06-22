import CityMarkers from "./CityMarkers.js"
import Tooltip from "./Tooltip.js";

class TempMap {
    constructor(controller) {
        this.controller = controller;
    }

    initialize() {
        // Bind event listeners to this instance
        this.reset = this.reset.bind(this);
        this.country_clicked = this.country_clicked.bind(this);
        this.draw_map = this.draw_map.bind(this);
        this.draw_cities = this.draw_cities.bind(this);
        this.update_country_colors = this.update_country_colors.bind(this);
        this.update_city_colors = this.update_city_colors.bind(this);

        
        // Setup all vital parts of map function.
        this.setup_map_bounds();
        this.setup_color_gradient();
        this.setup_basic_map_elements();
        this.setup_projection();
        this.setup_zoom();

        this.markers_showing = false;

        
        this.cityMarkers = new CityMarkers(this);
        this.tooltip = new Tooltip();
    }

    setup_map_bounds() {
        this.margin = { top: 50, left: 50, right: 50, bottom: 50 };
        this.height = 800 - this.margin.top - this.margin.bottom,
        this.width = 1200 - this.margin.left - this.margin.right;
    }

    setup_color_gradient() {
        let numberRange = [-20, -10, 0, 10, 20, 30];
        let colorRange = ["#2b8cbe", "#a6bddb", "#ece7f2", "#fee8c8" , "#fdbb84" , "#e34a33"];
        this.color = d3.scaleLinear()
				.range(colorRange);
        this.color.domain(numberRange)
    }

    setup_projection() {
        this.projection = d3.geoMercator()
            .translate([ this.width / 2, this.height / 2 ])

        this.path = d3.geoPath()
            .projection(this.projection);
    }

    setup_basic_map_elements() {
        this.svg = d3.select("#map")
            .append("svg")
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("width", this.width + this.margin.left + this.margin.right)
            .on("click", this.reset)
            
        this.mapG = this.svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
            .attr("cursor", "pointer");

    }

    setup_zoom() {
        this.zoom = d3.zoom()
            .scaleExtent([1, 20])
            .on("zoom", () => {
                const {transform} = d3.event;
                this.mapG.attr("transform", transform);
                this.mapG.attr("stroke-width", 1 / transform.k);
                this.zoom_level = transform.k;
                if (transform.k > 7) {
                    if (!this.markers_showing) {
                        this.mapG.selectAll(".marker")
                            .style("visibility", "visible");

                        this.mapG.selectAll(".country")
                            .classed("country-faded", true);

                        this.markers_showing = true;
                    }
                    
                } else {
                    if (this.markers_showing) {
                        this.mapG.selectAll(".marker")
                            .style("visibility", "hidden");
                        this.mapG.selectAll(".country")
                            .classed("country-faded", false);

                        this.markers_showing = false;
                    }
                    
                }
            });
    }


    country_clicked(path, d) {
        let country = d.properties.name
            console.log("Clicked " + country);
                
            const [[x0, y0], [x1, y1]] = this.path.bounds(d);
            d3.event.stopPropagation();
            this.svg.transition().duration(750).call(
                this.zoom.transform,
                  d3.zoomIdentity
                    .translate(this.width / 2, this.height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                  d3.mouse(this.svg.node())
                )
        this.controller.change_linechart_to_country(country);
    }

    reset() {
        this.svg.transition().duration(750).call(
            this.zoom.transform,
                  d3.zoomIdentity,
                  d3.zoomTransform(this.svg.node()).invert([this.width / 2, this.height / 2])
                );
              }

    update_country_colors(data) {
        return new Promise((resolve, reject) => {
            this.mapG.selectAll(".country")
            .style("fill", d => {
                let countryName = d.properties.name;
                let temperature = data[countryName];

                if (!temperature || isNaN(temperature)) {
                    return "grey";
                } else {
                    //return "white";
                    return this.color(temperature)
                }
            });

            resolve();
        })
    }          

    async draw_map() {
        const mapInstance = this;

        d3.selectAll('.country').remove();
        let world_data = await this.controller.data2.get_world_map();
        let countries = topojson.feature(world_data, world_data.objects.countries).features;

        this.mapG.selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", this.path)
        .on("click", function(d) { mapInstance.country_clicked(this, d) })
        
        .on("mouseover", function(feature) {
            mapInstance.tooltip.show(feature.properties.name);
        })
        .on("mouseout", d => {
            this.tooltip.show();
        })

        this.svg.call(this.zoom);
    }

    draw_cities(cities, temp_by_city) {
        return new Promise((resolve, reject) => {
            //this.cities_by_country = cities;
            this.cityMarkers.add_markers(this.mapG, cities, temp_by_city);
            resolve();
        })
    }

    update_city_colors(temp_by_city) {
        this.cityMarkers.update_cities(this.mapG, temp_by_city);
    }
}

export default TempMap;