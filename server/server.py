from flask import Flask
import pandas as pd
from flask_cors import CORS, cross_origin
from flask import request
from time import time

df = pd.read_csv('../dataset/EXTRASMALLGlobalLandTemperaturesByCity.csv', delimiter = ',')
df = df.dropna(subset=["AverageTemperature"])
df["year"] = df["dt"].str.extract(r'^(\d{4})')
df["month"] = df["dt"].str.extract(r'^\d{4}-(\d{2})')

with (open("../world.topojson")) as fh:
    world_map = fh.read()

print("data loaded")


app = Flask(__name__)
CORS(app)


@app.route("/get_first_last_dates")
def first_last_dates():
    dates = df.dt.unique()
    return {
        "first_date": dates[0], 
        "last_date": dates[len(dates)-1]
    }

@app.route("/get_country_temps_on_date")
@cross_origin()
def get_country_temps_on_date():
    dt = request.args["dt"]
    temps_for_date = df.loc[df["dt"] == dt]
    means = temps_for_date.groupby("Country").mean()
    return means["AverageTemperature"].to_dict()

@app.route("/get_city_temps_on_date")
@cross_origin()
def get_city_temps_on_date():
    dt = request.args["dt"]
    temps_for_date = df.loc[df["dt"] == dt]
    temps_for_date = temps_for_date["AverageTemperature"].rename(temps_for_date["City"])
    return temps_for_date.to_dict()

@app.route("/get_cities_in_country")
@cross_origin()
def get_cities_in_country():
    country = request.args["country"]
    cities = df.loc[df["Country"] == country]["City"].unique().tolist()
    return { "cities" : cities}

@app.route("/get_cities")
@cross_origin()
def get_cities():
    city_dict = {}

    city_rows = df.groupby("City").first()
    city_dict = city_rows.apply(lambda row: get_location_data(row), axis=1)
    return city_dict.to_dict()

@app.route("/get_cities_by_country")
@cross_origin()
def get_cities_by_country():
    country_rows = df.groupby("Country")
    country_dict = country_rows.apply(get_city_data)
    return country_dict.to_dict()

@app.route("/get_temps_by_cities")
@cross_origin()
def get_temps_by_cities():
    # Unfinished, but maybe not necessary
    temp_rows = df.apply(lambda row: {"temp": row["AverageTemperature"], "dt": row["dt"]}, axis=1)
    return "Hooray"

@app.route("/get_world_map")
@cross_origin()
def get_world_map():
    return world_map


@app.route("/get_country_yearly_average_temp")
@cross_origin()
def get_country_yearly_average_temp():
    country = request.args["country"]
    return extract_country_yearly_average_temp(country)



@app.route("/get_yearly_temp_curve_for_country")
@cross_origin()
def get_yearly_temp_curve_for_country():
    
    country = request.args["country"]
    country_df = df.loc[df["Country"] == country]
    
    means = country_df.groupby("month", as_index=False).mean()
    
    means_list = means.apply(lambda row: {"name" : country, "dt": row["month"], "temp": row["AverageTemperature"]}, axis=1).tolist()

    highest = means["AverageTemperature"].max()
    lowest = means["AverageTemperature"].min()

    return {"tempLimits" : [lowest, highest], "data": means_list}

@app.route("/get_yearly_temp_curve_for_city")
@cross_origin()
def get_yearly_temp_curve_for_city():
    city = request.args["city"]
    city_df = df.loc[df["City"] == city]

    means = city_df.groupby("month", as_index=False).mean()
    
    means_list = means.apply(lambda row: {"name" : city, "dt": row["month"], "temp": row["AverageTemperature"]}, axis=1).tolist()

    highest = means["AverageTemperature"].max()
    lowest = means["AverageTemperature"].min()

    return {"tempLimits" : [lowest, highest], "data": means_list}



@app.route("/get_average_yearly_temp_by_city")
@cross_origin()
def get_average_yearly_temp_by_city():
    city = request.args["city"]
    city_df = df.loc[df["City"] == city]

    means = city_df.groupby("year", as_index=False).mean()
    means_list = means[["year", "AverageTemperature"]].values.tolist()
    citylist = []
    for measurement in means_list:
        citylist.append({"dt": make_date(measurement[0], "01"), "temp": measurement[1]})

    highest = means["AverageTemperature"].max()
    lowest = means["AverageTemperature"].min()
    return {"tempLimits" : [lowest, highest], "data": citylist}

@app.route("/get_average_yearly_temp_for_cities")
@cross_origin()
def get_average_yearly_temp_for_cities():
    country = request.args["country"]
    country_df = df.loc[df["Country"] == country]

    means = country_df.groupby(["City", "year"]).mean().reset_index()[["City", "year", "AverageTemperature"]]

    means["dt"] = means["year"] + "-01-01"
    means_list = means.groupby("City").apply(lambda group: group.values.tolist()).tolist()

    # go through each list of temps for city and create the final data format
    final_list = []
    for city in means_list:
        citylist = []
        for temp_value in city:
            citylist.append({"name": temp_value[0], "dt": temp_value[3], "temp": temp_value[2]})
        final_list.append(citylist)

    
    highest = means["AverageTemperature"].max()
    lowest = means["AverageTemperature"].min()
    return {"tempLimits" : [lowest, highest], "data": final_list}

@app.route("/get_yearly_deviation_for_cities_from_country_mean")
@cross_origin()
def get_yearly_deviation_for_cities_from_country_mean():

    country = request.args["country"]
    country_df = df.loc[df["Country"] == country]
    # First average over months, then over years. This gives slightly different values than the implementation in DataHandler, TODO check
    #year_groups = country_df.groupby("year")

    monthly_groups = country_df.groupby(["year", "month"])
    monthly_means = country_df.groupby(["year", "month"]).mean()

    country_means = monthly_means.reset_index().groupby("year", as_index=False).mean()


    cities_in_country = get_cities_in_country(country)

    highest = float("-inf")
    lowest = float("inf")

    cities_deviation_list = []
    for city in cities_in_country:
        city_df = df.loc[df["City"] == city]
        means = city_df.groupby("year", as_index=False).mean()
        joined_df = country_means.merge(means, on=["year"], how="inner")
        joined_df["deviation"] = joined_df["AverageTemperature_y"] - joined_df["AverageTemperature_x"]

        city_highest = joined_df["deviation"].max()
        city_lowest = joined_df["deviation"].min()

        if city_highest > highest:
            highest = city_highest
        if city_lowest < lowest:
            lowest = city_lowest
        city_deviation_list = [{"name" : city, "dt": make_date(row[0], "01"), "temp": row[1]} for row in joined_df[["year", "deviation"]].values.tolist()]
        
        cities_deviation_list.append(city_deviation_list)

    return {"tempLimits" : [lowest, highest], "data": cities_deviation_list}

@app.route("/get_coords_for_city")
@cross_origin()
def get_coords_for_city():
    city = request.args["city"]
    city_location = get_location_data(df.loc[df["City"] == city].iloc[0])
    return city_location

# --- Helper functions ---
def make_date(year, month, day = "01"):
    return "{}-{:0<2}-{:0<2}".format(year, month, day)


def get_temp_data(city_group):
    return city_group.apply(lambda row: {"temp": row["AverageTemperature"], "dt": row["dt"]}, axis=1).to_list()


def get_city_data(country_group):
    # Create a new dataframe by grouping by city and taking only the first row for each city
    city_rows = country_group.groupby("City", as_index=False).first()

    # For each city, extract location data. Return as list
    city_list = city_rows.apply(lambda row: get_location_data(row, True), axis=1).to_list()
    return city_list

def get_location_data(city_row, with_name = False):
    lat = city_row["Latitude"]
    if lat[-1] == "S":
        lat = "-" + lat[:-1]
    else:
        lat = lat[:-1]

    lng = city_row["Longitude"]
    if lng[-1] == "W":
        lng = "-" + lng[:-1]
    else:
        lng = lng[:-1]

    if with_name:
        name = city_row["City"]
        return {"name": name, "lat": str(lat), "lng" : lng}
    else:
        return {"lat": str(lat), "lng" : lng}


def extract_country_yearly_average_temp(country):
    country_df = df.loc[df["Country"] == country]
    # First average over months, then over years. 
    #year_groups = country_df.groupby("year")

    monthly_groups = country_df.groupby(["year", "month"])

    #monthly_means = country_df.groupby(["year", "month"]).apply(lambda group: group["AverageTemperature"].mean())
    monthly_means = country_df.groupby(["year", "month"]).mean()

    means = monthly_means.reset_index().groupby("year", as_index=False).mean()
    means_list = means.apply(lambda row: {"name" : country, "dt": make_date(row["year"], "01"), "temp": row["AverageTemperature"]}, axis=1).tolist()

    highest = means["AverageTemperature"].max()
    lowest = means["AverageTemperature"].min()
    return {"tempLimits" : [lowest, highest], "data": means_list}

def get_cities_in_country(country):
    return df.loc[df["Country"] == country]["City"].unique()
