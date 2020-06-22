import pandas as pd
import numpy as np

data = pd.read_csv('../dataset/GlobalLandTemperaturesByCity.csv', delimiter = ',')
print("data loaded")

small_data = np.array_split(data, 12)[0]
small_data.to_csv('../dataset/EXTRASMALLGlobalLandTemperaturesByCity.csv')