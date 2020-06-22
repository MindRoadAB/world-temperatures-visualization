class DataHandlerFromServer {
    constructor() {
        // Bind contexts
        this.get_first_last_date = this.get_first_last_date.bind(this);
        this.get_temps_by_cities = this.get_temps_by_cities.bind(this);
        this.get_city_temp_by_date = this.get_city_temp_by_date.bind(this)


        //this.average_country_temp_by_date = {}
        //this.server_address = "http://localhost:3000/"
        this.server_address = "http://localhost:5000/"
        
    }

    async initialize() {
        const dates = await this.get_first_last_date();
        this.firstDate = dates.first_date;
        this.lastDate = dates.last_date;
    }

    async get_world_map() {
        const url = "get_world_map";
        return d3.json(this.server_address + url);
    }


    async get_first_last_date() {
        const url = "get_first_last_dates";
        return $.get(this.server_address + url, function(data) {
            return data;
        });

    }

    async get_average_country_temp(date) {
        return $.ajax({
            url : this.server_address + "get_country_temps_on_date",
            contentType: 'application/json',
            dataType : 'json',
            data: {"dt": date},
            success: results => {
                return results;
            },
            error: (request, status, error) => {
                console.log(error);

            }
        })
    }

    async get_city_temp_by_date(date) {
        return $.ajax({
            url : this.server_address + "get_city_temps_on_date",
            contentType: 'application/json',
            dataType : 'json',
            data: {"dt": date},
            success: results => {
                return results
            }
        })
    }

    async get_yearly_temp_curve_for_country(country) {
        const result = await $.ajax({
            url : this.server_address + "get_yearly_temp_curve_for_country",
            contentType: 'application/json',
            dataType : 'json',
            data: {"country": country},
            success: results => {
                return results;
            }
        })
        return result
    }

    async get_average_yearly_temp_for_cities(country) {
        const result = await $.ajax({
            url : this.server_address + "get_average_yearly_temp_for_cities",
            contentType: 'application/json',
            dataType : 'json',
            data: {"country": country},
            success: results => {
                return results;
            }
        })
        const start = new Date;
        result.data.map(city_data => city_data.map(measurement => { measurement.dt = new Date(measurement.dt); }));
        const finish = new Date;
        const time_to_finish = finish - start;
        console.log("Time to finish mapping of temperatures: " + time_to_finish + "ms");
        return result;
    }

    async get_yearly_deviation_for_cities_from_country_mean(country) {
        const result = await $.ajax({
            url : this.server_address + "get_yearly_deviation_for_cities_from_country_mean",
            contentType: 'application/json',
            dataType : 'json',
            data: {"country": country},
            success: results => {
                return results;
            }
        })
        const start = new Date;
        result.data.map(city_data => city_data.map(measurement => { measurement.dt = new Date(measurement.dt); }));
        const finish = new Date;
            const time_to_finish = finish - start;
            console.log("Time to finish mapping of temperatures: " + time_to_finish + "ms");
        return result;
    }

    async get_average_yearly_temp_by_city(city) {
        const result = await $.ajax({
            url : this.server_address + "get_average_yearly_temp_by_city",
            contentType: 'application/json',
            dataType : 'json',
            data: {"city": city},
            success: results => {
                return results;
            },
            error: (request, status, error) => {
                console.log(error);
            }
        })
        
        result.data.map(measurement => { measurement.dt = new Date(measurement.dt); });
        return result;
    }

    async get_yearly_temp_curve_for_city(city) {
        const result = await $.ajax({
            url : this.server_address + "get_yearly_temp_curve_for_city",
            contentType: 'application/json',
            dataType : 'json',
            data: {"city": city},
            success: results => {
                return results;
            }
        })
        return result
    }

    async get_coords_for_city(city) {
        const result = await $.ajax({
            url : this.server_address + "get_coords_for_city",
            contentType: 'application/json',
            dataType : 'json',
            data: {"city": city},
            success: results => {
                return results;
            }
        })
        return result
    }

    async get_cities_in_country(country) {
        const result = await $.ajax({
            url : this.server_address + "get_cities_in_country",
            contentType: 'application/json',
            dataType : 'json',
            data: {"country": country},
            success: results => {
                return results.cities
            }
        })
        return result.cities

    }

    async get_cities() {
        const url = "get_cities";
        return $.get(this.server_address + url, function(data) {
            return data;
        });
    }

    async get_cities_by_country() {
        const url = "get_cities_by_country";
        return $.get(this.server_address + url, function(data) {
            return data;
        });
    }

    async get_temps_by_cities() {
        const url = "get_temps_by_cities";
        return $.get(this.server_address + url, function(data) {
            return data;
        });
    }

    async get_country_yearly_average_temp(country) {
        let results = await $.ajax({
            url : this.server_address + "get_country_yearly_average_temp",
            contentType: 'application/json',
            dataType : 'json',
            data: {"country": country},
            success: results => {
                return results
            }
        })
        results.data.map(measurement => { measurement.dt = new Date(measurement.dt); })
        return results;
    }
}

export default DataHandlerFromServer;