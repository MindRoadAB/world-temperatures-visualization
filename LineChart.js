import Tooltip from "./Tooltip.js";

class LineChart {
    constructor(controller) {
        this.controller = controller;
    }
    
    initialize() {
        this.drawLine = this.drawLine.bind(this)
        this.change_linechart_to_city_view = this.change_linechart_to_city_view.bind(this);
        this.setup_axes = this.setup_axes.bind(this);
        this.change_linechart_to_country = this.change_linechart_to_country.bind(this);
        this.cleanup_linechart = this.cleanup_linechart.bind(this);
        this.show_linechart_for_cities = this.show_linechart_for_cities.bind(this);
        this.show_linechart_for_city = this.show_linechart_for_city.bind(this);
        this.show_city_yearly_curve = this.show_city_yearly_curve.bind(this);
        this.show_yearly_temp_curve = this.show_yearly_temp_curve.bind(this);
        this.show_yearly_deviation_for_cities_from_country_mean = this.show_yearly_deviation_for_cities_from_country_mean.bind(this);
        this.show_average_linechart_for_country = this.show_average_linechart_for_country.bind(this);

        this.setup_map_bounds();
        this.setup_basic_map_elements();

        this.tooltip = new Tooltip();


        this.setup_settings_listeners();

        this.settings = {
            type: "cities",
            country: {
                "show-country-selection": "show-cities"
            },
            city: {
                "show-city-selection": "show-city"
            }
        }

        this.country_shown;
        this.city_shown;
        this.cumulative_time = 0;
        
       }

    setup_settings_listeners() {
        const linechartInstance = this;
        d3.select("#country-settings")
            .selectAll("input")
            .on("change", function(d) {
                linechartInstance.settings.country[this.name] = this.value;
                linechartInstance.change_linechart_to_country(linechartInstance.country_shown);
            })

        d3.select("#city-settings")
            .selectAll("input")
            .on("change", function(d) {
                //linechartInstance.settings.country[this.name] = this.value;
                linechartInstance.settings.city[this.name] = this.value;
                linechartInstance.change_linechart_to_city_view(linechartInstance.city_shown);
            })

        
    }

    setup_map_bounds() {
        this.margin = {top: 10, right: 30, bottom: 70, left: 60};
	    this.width = 920 - this.margin.left + this.margin.right;
        this.height = 600 - this.margin.top - this.margin.bottom;
    }

    setup_basic_map_elements() {
        this.svg = d3.select("#linechart")
            .append("svg")
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("width", this.width + this.margin.left + this.margin.right)
            
        this.linechartG = this.svg.append("g")
            .attr("transform", 
                "translate(" + this.margin.left +"," + this.margin.top +")");

        
    }

    async bench(func, inputs) {
        const start = new Date;
        await func(...inputs);
        const finish = new Date;
        const time_to_finish = finish - start;
        console.log("Time to finish task: " + time_to_finish + "ms");
        this.cumulative_time += time_to_finish;
        console.log("Cumulative time: " + this.cumulative_time + "ms");
    }

    async show_linechart_for_city(city) {
        const data = await this.controller.data2.get_average_yearly_temp_by_city(city);
        const cityData = data.data;
        const tempLimits = data.tempLimits;

        this.setup_axes("time", [tempLimits[0] - 1, tempLimits[1] + 1]);

        this.drawLine(cityData);
    }

    change_linechart_to_city_view(city) {
        this.settings.type = "cities";
        this.city_shown = city;
        this.show_linechart_settings("city");
        
        d3.select("#linechart-title")
            .text(city);

        this.cleanup_linechart();

        // TODO fix for cities instead of country
        if (this.settings.city["show-city-selection"] == "show-city") {
            this.bench(this.show_linechart_for_city, [city]);
        } else if (this.settings.city["show-city-selection"] == "show-city-and-country") {
            //this.show_average_linechart_for_country(country);
        } else if (this.settings.city["show-city-selection"] == "show-city-deviation") {
            //this.show_yearly_deviation_for_cities_from_country_mean(country);
        } else if (this.settings.city["show-city-selection"] == "show-city-yearly-curve") {
            this.bench(this.show_city_yearly_curve, [city]);
        }

    }

    show_city_and_country(city) {
        //TODO, how to find country?
        console.log("NOT IMPLEMENTED");
    }

    show_city_deviation(city) {
        //TODO, how to find country?
        console.log("NOT IMPLEMENTED");
    }

    async show_city_yearly_curve(city) {
        const data = await this.controller.data2.get_yearly_temp_curve_for_city(city);
        const cityData = data.data;
        const tempLimits = data.tempLimits;

        this.setup_axes("linear", [tempLimits[0] - 1, tempLimits[1] + 1], [1, 12]);

        this.drawLine(cityData);
    }

    async show_linechart_for_cities(country) {
        const data = await this.controller.data2.get_average_yearly_temp_for_cities(country);
        if (!data) { // TODO handle situation where DataHandlerFromServer is used and no data exists for country
            console.log("No data for " + country + ".");
            return;
        }
        const tempLimits = data.tempLimits;
        const measurements = data.data;


        d3.select("#linechart-settings")
            .style("visibility", "visible");

        this.setup_axes("time", [tempLimits[0] - 1, tempLimits[1] + 1]);
        

        measurements.forEach(cityData => {
            this.drawLine(cityData);
        })
    }

    /**
     * Need to consider how to calculate this..
     * @param {String} country 
     */
    async show_average_linechart_for_country(country) {
        const result = await this.controller.data2.get_country_yearly_average_temp(country);
        const tempLimits = result.tempLimits;
        const average_temp_by_year = result.data;
        this.setup_axes("time", [tempLimits[0] - 1, tempLimits[1] + 1]);
        this.drawLine(average_temp_by_year);
    }

    change_linechart_to_country(country) {
        this.settings.type = "country"
        this.country_shown = country;
        this.show_linechart_settings("country");
        this.cleanup_linechart();
        
        if (this.settings.country["show-country-selection"] == "show-cities") {
            this.bench(this.show_linechart_for_cities, [country]);
        } else if (this.settings.country["show-country-selection"] == "show-country") {
            this.bench(this.show_average_linechart_for_country, [country]);
        } else if (this.settings.country["show-country-selection"] == "show-deviation") {
            this.bench(this.show_yearly_deviation_for_cities_from_country_mean, [country]);
        } else if (this.settings.country["show-country-selection"] == "show-yearly-curve") {
            this.bench(this.show_yearly_temp_curve, [country]);
        }
        
        

        d3.select("#linechart-title")
            .text(country);
    }

    show_linechart_settings(type) {
        d3.select("#linechart-settings")
            .style("visibility", "visible");
        if (type == "city") {
            d3.select("#city-settings")
            .style("visibility", "visible");
            d3.select("#country-settings")
            .style("visibility", "hidden");
        } else if (type == "country") {
            d3.select("#country-settings")
            .style("visibility", "visible");
            d3.select("#city-settings")
            .style("visibility", "hidden");
        }
        
    }

    async show_yearly_temp_curve(country) {
        const result = await this.controller.data2.get_yearly_temp_curve_for_country(country);
        const tempLimits = result.tempLimits;
        const yearly_temp_curve = result.data;
        this.setup_axes("linear", [tempLimits[0] - 1, tempLimits[1] + 1], [1, 12]);
        this.drawLine(yearly_temp_curve);
    }

    async show_yearly_deviation_for_cities_from_country_mean(country) {
        const data = await this.controller.data2.get_yearly_deviation_for_cities_from_country_mean(country);
        const tempLimits = data.tempLimits;
        const measurements = data.data;

        this.setup_axes("time", [tempLimits[0] - 1, tempLimits[1] + 1]);

        this.add_horizontal_line([ new Date(this.controller.data2.firstDate), new Date(this.controller.data2.lastDate)], 0);
    
        measurements.forEach(cityData => {
            this.drawLine(cityData);
        })
    }

    add_horizontal_line(x_values, y_value) {
        const line = d3.line()
        .x(point => { return this.x(point.x)})
        .y(point => { return this.y(point.y); })

    this.linechartG.append("path")
        .datum([{x: x_values[0], y: y_value}, {x: x_values[1], y: y_value}])
        .attr("class", "horizontal-line")
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-width", 2)
            .attr("d", line)
    }
    

    cleanup_linechart() {
        d3.selectAll(".countryX").remove();
        d3.selectAll(".countryY").remove();
        d3.selectAll(".countryLine").remove();
        d3.selectAll(".horizontal-line").remove();
    }

    setup_axes(x_axis_type, minMaxY, domain) {
        if (!domain) {
            const startDate = new Date(this.controller.data2.firstDate);
            const endDate = new Date(this.controller.data2.lastDate);
            domain = [startDate, endDate];
        }
        this.setup_x_axis(x_axis_type, domain);
        this.setup_y_axis(minMaxY);
    }

    setup_y_axis(minMaxY) {
        this.y = d3.scaleLinear()
        .domain(minMaxY)
        .range([this.height, 0])
        .nice();

        this.linechartG.append("g")
                .attr("class", "countryY")
                .style("font-size", "18px")
                .call(d3.axisLeft(this.y))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -55)
                .attr("x", -250)
                .attr("dy", "1em")
                .style("text-anchor", "middle")  
                .style("fill", "black")
                .style("font-size", "18px")
                .text("Temperature in °C");
    }

    setup_x_axis(axis_type, domain) {
        const typeMapping = {"time": d3.scaleUtc, "linear": d3.scaleLinear};
        this.x = typeMapping[axis_type]()
                /*
                .domain(d3.extent(this.controller.data.temp_by_city[city], d => { 
                    return d.dt; 
                }))*/
                .domain(domain)
                .range([0, this.width])
                .nice();

        this.linechartG.append("g")
                .attr("class", "countryX")
                .style("font-size", "17px")
                .attr("transform","translate(0," + this.height + ")")
                .call(d3.axisBottom(this.x))
                    .append("text")
                    .attr("x", this.width / 2)
                    .attr("y", 50 )
                    .style("fill", "black")
                    .style("font-size", "18px")
                    .text("Timepoint");
    }

    setup_axes2(minMaxY) {
        // TODO change to datalayer function
        const startDate = new Date(this.controller.data2.firstDate);
        const endDate = new Date(this.controller.data2.lastDate);
        this.x = d3.scaleUtc()
                /*
                .domain(d3.extent(this.controller.data.temp_by_city[city], d => { 
                    return d.dt; 
                }))*/
                .domain([startDate, endDate])
                .range([0, this.width])
                .nice();

        this.linechartG.append("g")
                .attr("class", "countryX")
                .style("font-size", "17px")
                .attr("transform","translate(0," + this.height + ")")
                .call(d3.axisBottom(this.x))
                    .append("text")
                    .attr("x", this.width / 2)
                    .attr("y", 50 )
                    .style("fill", "black")
                    .style("font-size", "18px")
                    .text("Timepoint");


        this.y = d3.scaleLinear()
                    .domain(minMaxY)
                    .range([this.height, 0])
                    .nice();

        this.linechartG.append("g")
                    .attr("class", "countryY")
                    .style("font-size", "18px")
                    .call(d3.axisLeft(this.y))
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -55)
                    .attr("x", -250)
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")  
                    .style("fill", "black")
                    .style("font-size", "18px")
                    .text("Temperature in °C");
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

    drawLine(data)
	{	
        let line = d3.line()
            .defined(measurement => { return !isNaN(measurement.temp)})
		    .x(measurement       => { return this.x(measurement.dt)})
            .y(measurement       => { return this.y(measurement.temp); })
                    
        const linechartInstance = this;
            
		//Append the path
		
		this.linechartG.append("path")
				.datum(data)
				.attr("class", "countryLine")
				//.attr("id", function(d){return activeCountries[0]})
				.attr("fill", "none")
				.attr("stroke", d => { return this.getRandomColor() })
				.attr("stroke-width", 2.5)
                .attr("d", line)
                
				//.on("click", onLineClick)
				.on("mouseover", function(measurement) {
						d3.selectAll(".countryLine")
							.style("opacity", 0.2);
						d3.select(this)
                            .style("opacity", 1)
                            .attr("stroke-width", 5);
                        linechartInstance.tooltip.show(measurement[0].name);
					})
				.on("mouseout", function(d) {
						d3.selectAll(".countryLine")
							.style("opacity", 1);
						d3.select(this)
                            .style("opacity", 1)
                            .attr("stroke-width", 2.5);
                            linechartInstance.tooltip.hide();
					});
	
	}
}

export default LineChart;