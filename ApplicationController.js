import TempMap from "./TempMap.js";
import LineChart from "./LineChart.js";
import DataHandler from "./DataHandler.js";
import DataHandlerFromServer from "./DataHandlerFromServer.js";
import TimeSlider from "./TimeSlider.js";

class ApplicationController {
    async initialize() {
        const start = new Date;
        this.change_linechart_to_city = this.change_linechart_to_city.bind(this);
        this.change_tempMap_year = this.change_tempMap_year.bind(this);
        this.change_linechart_to_country = this.change_linechart_to_country.bind(this);

        this.tempMap    = new TempMap(this);
        this.data2    = new DataHandler();
        await this.data2.initialize();
        this.timeSlider = new TimeSlider(this);

        
        

        this.lineChart  = new LineChart(this);
        
        this.tempMap.initialize();
        
        this.timeSlider.initialize();
        this.lineChart.initialize();
        const startDate = this.data2.firstDate;

        
        
        const load_and_draw = [
            this.data2.get_average_country_temp(startDate), 
            this.data2.get_city_temp_by_date(startDate), 
            this.tempMap.draw_map()
        ];

        Promise.all(load_and_draw).then(async results => {
            const startTemps = results[0];
            await this.tempMap.update_country_colors(startTemps);
            await this.tempMap.draw_cities(await this.data2.get_cities(), results[1]);
            const finish = new Date;
            const time_to_finish = finish - start;
            console.log("Time to finish task: " + time_to_finish + "ms");
        });

        

    }

    change_linechart_to_city(city) {
        this.lineChart.change_linechart_to_city_view(city);
    }

    change_linechart_to_country(country) {
        this.lineChart.change_linechart_to_country(country);
    }

    async change_tempMap_year(date) {
        const start = new Date;
        const country_data = await this.data2.get_average_country_temp(date);
        this.tempMap.update_country_colors(country_data)
        let data = await this.data2.get_city_temp_by_date(date);
        this.tempMap.update_city_colors(data);
        
        const finish = new Date;
        const time_to_finish = finish - start;
        console.log("Time to update tempMap: " + time_to_finish + "ms");

    }
}

export default ApplicationController;