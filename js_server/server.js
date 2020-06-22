const express = require('express')
const app = express()
const port = 3000
const fs = require('fs');
const cors = require('cors')

app.use(cors())

//let data;

let cities_by_country = {};
let temp_by_city = {};
let firstDate;
let lastDate;



const csv = require('csv-parser')
let data = []

fs.createReadStream('../dataset/EXTRASMALLGlobalLandTemperaturesByCity.csv')
  .pipe(csv())
  .on('data', function (row) {
    data.push(row)
  })
  .on('end', function () {
      process_data(data);
      console.log('Data loaded')
  })



function process_data(cityData) {
    // Get first and last dates
    firstDate = cityData[0].dt;
    lastDate = firstDate;
    let firstDateAsDate = new Date(firstDate);
    let lastDateAsDate = firstDateAsDate;

    let cities = new Set();
    //cities_by_country = {};
    //temp_by_city = {};
    //temp_by_date_and_city = {};


    for(let i = 0; i < cityData.length; i++) {
        let entry = cityData[i];

        const dt = entry.dt;
        const dtAsDate = new Date(dt);
        if (dtAsDate < firstDateAsDate) {
            firstDate = dt;
            firstDateAsDate = dtAsDate;
        }
        if (dtAsDate > lastDateAsDate) {
            lastDate = dt;
            lastDateAsDate = dtAsDate;
        }


        const city = entry.City;
                const country = entry.Country;
                const year = dtAsDate.getFullYear();
                const month = dtAsDate.getMonth();

                if (!(country in cities_by_country)) {
                    cities_by_country[country] = []
                }

                if (!cities.has(city)) {
                    let lat = entry.Latitude;
                    if (lat.search("S") != -1) {
                        lat = "-" + lat.slice(0, -1);
                    } else {
                        lat = lat.slice(0, -1);
                    }

                    let lng = entry.Longitude;

                    if (lng.search("W") != -1) {
                        lng = "-" + lng.slice(0, -1);
                    } else {
                        lng = lng.slice(0, -1);
                    }

                    cities.add(city);
                    cities_by_country[country].push({name: city, lat: lat, lng: lng})

                    temp_by_city[city] = [];

                }

                const parsedTemp = parseFloat(entry.AverageTemperature);
                if (!isNaN(parsedTemp)) {
                    temp_by_city[city].push({dt: dt, temp: parsedTemp, year: year, month: month})
                }




    }
}


app.get('/', (req, res) => res.send('Hello World!'));

app.get("/get_first_last_dates", (req, res) => res.json({"first_date": firstDate, "last_date":lastDate}));


app.get("/get_country_temps_on_date", (req, res)=> {
    console.log("GET /get_country_temps_on_date")
    let date = req.query.dt;
    const dateAsDate = new Date(date);
            const year = dateAsDate.getFullYear();
            const month = dateAsDate.getMonth();

            // if (year in this.average_country_temp_by_date) {
            //     if (month in this.average_country_temp_by_date[year]) {
            //         return this.average_country_temp_by_date[year][month];
            //     }
            // }

            const average_country_temp = {};
            //const tempValues_by_city = this.temp_by_date_and_city[year][month];
            for (let entry of Object.entries(cities_by_country)) {
                const [country, cities] = entry;
                const cityTemps = cities.map(city => { return get_temps_on_date_for_cities(city.name, date) });


                let sum = 0;
                let hasValue = false;

                for (let temp of cityTemps) {
                    if (!(isNaN(temp))) {
                        sum += temp;
                        hasValue = true;
                    }
                }
                const average = sum / cityTemps.length;


                if(!isNaN(average)) {
                    average_country_temp[country] = average;
                }

            }
            // if (!(year in this.average_country_temp_by_date)) {
            //     this.average_country_temp_by_date[year] = {};
            // }
            //this.average_country_temp_by_date[year][month] = average_country_temp;
            res.json(average_country_temp);


    }
)

app.get("/get_city_temps_on_date", (req, res) => {
    const date = req.query.dt;
    const year = date.slice(0, 4);
        const month = date.slice(5,7);
        //console.log(year)
        const temps_by_year = get_temps_by_year(year);
        if (!temps_by_year || !temps_by_year[month]) {
            return {}
        }
        res.json(temps_by_year[month]);
})

function get_temps_by_year(year) {
    let temps_by_year = {}

    for (let city in temp_by_city) {
        for (let measurement of temp_by_city[city]) {
            if (measurement.dt.slice(0, 4) != year) {
                continue;
            }
            const month = measurement.dt.slice(5, 7);
            //console.log(month)

            if (!(month in temps_by_year)) {
                temps_by_year[month] = {}
            }
            temps_by_year[month][city] = measurement.temp;
        }
    }
    return temps_by_year;

}


function get_temps_on_date_for_cities(city, date) {
    const cityTemps = temp_by_city[city];
    for (let i = 0; i < cityTemps.length; i++) {
        const measurement = cityTemps[i];
        if (measurement.dt == date) {
            return measurement.temp;
        }
    }

}

app.get("/get_cities", (req, res) => {
    let cities = {}
    for (let cityList of Object.values(cities_by_country)) {
        for (let city of cityList) {
            cities[city.name] = {lat: city.lat, lng: city.lng};
        }
    }
    res.json(cities);
})

app.get("/get_average_yearly_temp_for_cities", (req, res) => {
    console.log("GET /get_average_yearly_temp_for_cities");
    const country = req.query.country;
    res.json(get_average_yearly_temp_for_cities(country));
})

function get_average_yearly_temp_for_cities(country) {
    const cities = get_cities_in_country(country);
        if (!cities) {
            return;
        }

        const data = [];
        let tempMax= Number.NEGATIVE_INFINITY;
        let tempMin = Number.POSITIVE_INFINITY;

        cities.forEach(city => {
            const cityData = get_average_yearly_temp_by_city(city.name);
            const measurements = cityData.data.map( m => {m.name = city.name; return m });
            const tempLimits = cityData.tempLimits;

            // Need to find min and max temps of all cities
            if (tempLimits[1] > tempMax) {
                tempMax = tempLimits[1];
            }
            if (tempLimits[0] < tempMin) {
                tempMin = tempLimits[0];
            }
            data.push(measurements);
        });

        const results = {tempLimits: [tempMin, tempMax], data: data};
        return results;
}

function get_cities_in_country(country) {
    return cities_by_country[country];
}

app.get("/get_average_yearly_temp_by_city", (req, res) => {
    console.log("GET /get_average_yearly_temp_by_city");
    console.log("function I'm working on")
    const city = req.query.city;
    res.json(get_average_yearly_temp_by_city(city));
})
function get_average_yearly_temp_by_city(city) {
        const data = get_temp_by_city(city)

        const tempSum_by_year = {}
        data.forEach(measurement => {
            const year = new Date(measurement.dt).getFullYear();
            const temperature = measurement.temp;
            if(!temperature || isNaN(temperature)) {
                return;
            }
            if (!(year in tempSum_by_year)) {
                tempSum_by_year[year] = {sum: 0, counter: 0};
            }
            tempSum_by_year[year].sum += temperature;
            tempSum_by_year[year].counter += 1;
        })

        let tempMax= Number.NEGATIVE_INFINITY;
        let tempMin = Number.POSITIVE_INFINITY;

        const average_temp_by_year = []
        Object.entries(tempSum_by_year).forEach(entry => {
            const [year, result] = entry;
            const mean = result.sum/result.counter;
            average_temp_by_year.push({dt: new Date(year), temp: mean});

            if (mean > tempMax) {
                tempMax = mean;
            }
            if (mean < tempMin) {
                tempMin = mean;
            }

        })
        const results = {tempLimits: [tempMin, tempMax], data: average_temp_by_year};
        return results;

    }


function get_temp_by_city(city) {
    return temp_by_city[city];
}
app.get("/get_cities_in_country", (req, res) => {
    res.json(cities_by_country);
})


app.get("/get_world_map", (req, res) => {
    let rawdata = JSON.parse(fs.readFileSync('../world.topojson'));
    res.json(rawdata);
})


app.get("/get_country_yearly_average_temp", (req, res) => {
    const country = req.query.country;
    res.json(get_country_yearly_average_temp(country));


})

function get_country_yearly_average_temp(country) {
    const monthly_temps = get_average_monthly_country_temp(country);

        const tempSum_by_year = {}
        for (let i = 0; i < monthly_temps.data.length; i++) {
            const measurement = monthly_temps.data[i];
            const year = new Date(measurement.dt).getFullYear();

            if (!(year in tempSum_by_year)) {
                tempSum_by_year[year] = {sum: 0, counter: 0};
            }
            tempSum_by_year[year].sum += measurement.temp;
            tempSum_by_year[year].counter++;
        }
        let tempMax= Number.NEGATIVE_INFINITY;
        let tempMin = Number.POSITIVE_INFINITY;


        const average_temp_by_year = [];
        for (let year in tempSum_by_year) {
            const result = tempSum_by_year[year];
            const mean = result.sum/result.counter

            if (mean > tempMax) {
                tempMax = mean;
            }
            if (mean < tempMin) {
                tempMin = mean;
            }
            average_temp_by_year.push({name: country, dt: new Date(year), temp: mean});
        }

        const yearly_temps = {tempLimits: [tempMin, tempMax], data: average_temp_by_year};
        return yearly_temps;
}


function get_average_monthly_country_temp(country) {
    const cities = get_cities_in_country(country);

    if (!cities) {
        return;
    }

    const sumTemp_by_date = {};
    const dates  = []

//cities.forEach(city => {
    for (let j = 0; j < cities.length; j++) {
        const city = cities[j];
        const cityData = get_temp_by_city(city.name);

        for (let i = 0; i < cityData.length; i++ ) {
            const measurement = cityData[i];
            const date = measurement.dt;
            const temp = measurement.temp;
            if (!temp || isNaN(temp)) {
                continue;
            }

            if (!(date in sumTemp_by_date)) {
                sumTemp_by_date[date] = {sum: 0, counter: 0};
                dates.push(date);
            }
            sumTemp_by_date[date].sum += temp;
            sumTemp_by_date[date].counter++;
        }

    }
    let tempMax= Number.NEGATIVE_INFINITY;
    let tempMin = Number.POSITIVE_INFINITY;

    dates.sort((a, b) => {
        if (a <= b) {
            return -1;
        }
        return 1;
     });

    const average_temp_by_date = [];
    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const result = sumTemp_by_date[date];
        const mean = result.sum/result.counter

        if (mean > tempMax) {
            tempMax = mean;
        }
        if (mean < tempMin) {
            tempMin = mean;
        }
        average_temp_by_date.push({name: country, dt: date, temp: mean});
    }

    const monthly_temps = {tempLimits: [tempMin, tempMax], data: average_temp_by_date};

    return monthly_temps;
}

app.get("/get_yearly_temp_curve_for_country", (req, res)=> {
    const country = req.query.country;

    const monthly_temps = get_average_monthly_country_temp(country);
    res.json(get_yearly_temp_curve(monthly_temps.data, country));
})


function get_yearly_temp_curve(monthly_temps, place) {
    const sumTemp_by_month = {};

    for (let i = 0; i < monthly_temps.length; i++) {
        const measurement = monthly_temps[i];
        const month = parseInt(new Date(measurement.dt).getMonth()) + 1;

        if (!(month in sumTemp_by_month)) {
            sumTemp_by_month[month] = {sum: 0, counter: 0};
        }

        if (measurement.temp && !isNaN(measurement.temp)) {
            sumTemp_by_month[month].sum += measurement.temp;
        sumTemp_by_month[month].counter++;
        }

    }

    let tempMax= Number.NEGATIVE_INFINITY;
    let tempMin = Number.POSITIVE_INFINITY;

    const average_temp_by_month = [];
    for (let month in sumTemp_by_month) {
        const result = sumTemp_by_month[month];
        const mean = result.sum/result.counter

        if (mean > tempMax) {
            tempMax = mean;
        }
        if (mean < tempMin) {
            tempMin = mean;
        }
        average_temp_by_month.push({name: place, dt:month, temp: mean});
    }

    const average_monthly_temps = {tempLimits: [tempMin, tempMax], data: average_temp_by_month};

    return average_monthly_temps;
}


app.get("/get_yearly_deviation_for_cities_from_country_mean", (req, res) => {
    const country = req.query.country;

    const yearly_cityTemps = get_average_yearly_temp_for_cities(country).data;
        const yearly_countryTemps = get_country_yearly_average_temp(country).data;

        let tempMax= Number.NEGATIVE_INFINITY;
        let tempMin = Number.POSITIVE_INFINITY;

        const data = []

        for(let cityData of yearly_cityTemps) {
            const diffTemp_by_city = [];
            const cityName = cityData[0].name;

            for (let cityTempIdx = 0; cityTempIdx < cityData.length; cityTempIdx++) {
                let countryTempIdx = cityTempIdx;
                const date = cityData[cityTempIdx].dt;

                // Find the next matching date for country. Countries can have more
                // dates than cities since their average temperatures are calculated from all
                // their cities, and some cities might not have a value for some dates.
                while (date.getTime() != yearly_countryTemps[countryTempIdx].dt.getTime()) {
                    countryTempIdx++;
                }

                const cityTemp = cityData[cityTempIdx].temp;
                const countryTemp = yearly_countryTemps[countryTempIdx].temp;

                const diffTemp = cityTemp - countryTemp;
                diffTemp_by_city.push({name: cityName, dt: date, temp: diffTemp});

                if (diffTemp > tempMax) {
                    tempMax = diffTemp;
                }
                if (diffTemp < tempMin) {
                    tempMin = diffTemp;
                }


            }
            data.push(diffTemp_by_city);
        }

        // return a list of values for countries. Also tempLimits
        const results = {tempLimits: [tempMin, tempMax], data: data};
        res.json(results);
})


app.get("/get_yearly_temp_curve_for_city", (req, res) => {
    const city = req.query.city;
    const monthly_temps = get_temp_by_city(city);
    res.json(get_yearly_temp_curve(monthly_temps, city));
})


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))