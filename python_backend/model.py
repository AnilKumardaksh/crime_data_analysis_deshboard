import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

class CrimePredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
        self.last_year = 2022

    def train(self, df):
        year_wise = df.groupby("year")["count"].sum().reset_index()
        X = year_wise[["year"]]
        y = year_wise["count"]
        self.model.fit(X, y)
        self.is_trained = True
        self.last_year = int(year_wise["year"].max())

    def predict_future(self, years_ahead=5):
        if not self.is_trained:
            # Fallback if not trained (mock training for demo)
            X = np.array([[2018], [2019], [2020], [2021], [2022]])
            y = np.array([65000, 68000, 62000, 67000, 72000])
            self.model.fit(X, y)
        
        predictions = []
        for i in range(1, years_ahead + 1):
            year = self.last_year + i
            pred = self.model.predict([[year]])[0]
            predictions.append({
                "year": year,
                "predicted_crime": int(pred)
            })
        return predictions
