import pandas as pd
from model import CrimePredictor
import pickle

def train_and_save():
    # Load dataset
    df = pd.read_csv("data/crime_data.csv")
    
    # Initialize and train
    predictor = CrimePredictor()
    predictor.train(df)
    
    # Save model (optional, for persistence)
    with open("crime_model.pkl", "wb") as f:
        pickle.dump(predictor, f)
    
    print("Model trained and saved successfully!")

if __name__ == "__main__":
    train_and_save()
