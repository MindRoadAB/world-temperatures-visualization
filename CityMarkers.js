import Tooltip from "./Tooltip.js";

class CityMarkers {
    constructor(tempMap) {
        this.tempMap = tempMap;
        this.path = "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z";

        this.add_markers = this.add_markers.bind(this);
        this.update_cities = this.update_cities.bind(this);
        this.city_clicked = this.city_clicked.bind(this);

        this.tooltip = new Tooltip();
        this.setup_color_gradient();
    }

    setup_color_gradient() {
        this.numberRange = [-20, -10, 0, 10, 20, 30];
        this.colorRange = ["#2b8cbe", "#a6bddb", "#ece7f2", "#fee8c8" , "#fdbb84" , "#e34a33"];
        this.color = d3.scaleLinear()
				.range(this.colorRange);
        this.color.domain(this.numberRange)
    }

    async add_markers(parent, cityData, temperatureData) {
        let cityMarkerInstance = this;
        parent.selectAll(".marker")
                .data(Object.keys(cityData))
                .enter()
                .append("svg:path")
                .attr("class", "marker")
                .style("visibility", "hidden")
                .on("click", function(city) {
                    cityMarkerInstance.city_clicked(this, city);
                })   
            .on("mouseover", city => {
                this.tooltip.show(city);                                     
            })
            .on("mouseout", () => {
                this.tooltip.hide();
            })   
            .attr("d", this.path)
            .attr("transform", city => {
                const cityInfo = cityData[city];
                const coords = this.tempMap.projection([cityInfo.lng, cityInfo.lat]); 
                return "translate(" + coords[0] + "," + coords[1] + ") scale(.08)"
            })

        await this.update_cities(parent, temperatureData);
    }

    async update_cities(parent, temperatureData) {
        parent.selectAll(".marker")
            .style("fill", city => {
                const temperature = temperatureData[city];
                return this.get_color(temperature);
            })
            
             
    }

    /**
     * Alternative to using the this.color variable, checking to see if this leads to faster results.
     * @param {float} temperature 
     * 
     * @returns a hex color value
     */
    get_color(temperature) {
        let idx = Math.floor((temperature + 20) / 10)
        if (isNaN(idx)) {
            return "gray";
        }
        else if (idx < 0) {
            idx = 0;
        } else if (idx > 5) {
            idx = 5;
        }
        return this.colorRange[idx];
    }

    city_clicked(path, city) {
        console.log("Clicked " + city)
        this.tempMap.controller.change_linechart_to_city(city);
        d3.event.stopPropagation();
    }
}

export default CityMarkers;