from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import StringIO
import pandas as pd
from model import CrimePredictor
from universal_model import UniversalPredictor
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = CrimePredictor()
universal_predictor = UniversalPredictor()

# Load data for stats
DATA_PATH = "data/crime_data.csv"

@app.get("/data")
def get_data():
    df = pd.read_csv(DATA_PATH)
    return df.to_dict(orient="records")

@app.get("/stats")
def get_stats():
    df = pd.read_csv(DATA_PATH)
    total_crimes = int(df["count"].sum())
    common_type = df.groupby("crime_type")["count"].sum().idxmax()
    dangerous_state = df.groupby("state")["count"].sum().idxmax()
    safest_state = df.groupby("state")["count"].sum().idxmin()
    
    # YoY
    crimes_2021 = df[df["year"] == 2021]["count"].sum()
    crimes_2022 = df[df["year"] == 2022]["count"].sum()
    yoy = ((crimes_2022 - crimes_2021) / crimes_2021) * 100 if crimes_2021 > 0 else 0
    
    return {
        "totalCrimes": total_crimes,
        "commonType": common_type,
        "dangerousState": dangerous_state,
        "safestState": safest_state,
        "yoyChange": round(yoy, 2)
    }

@app.get("/predict")
def predict():
    predictions = predictor.predict_future(5)
    return predictions

@app.post("/auto-train")
async def auto_train(file: UploadFile = File(...), target_column: str = Form(None)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    contents = await file.read()
    csv_string = contents.decode('utf-8')
    df = pd.read_csv(StringIO(csv_string))
    
    # Dynamically melt and transform data for dashboard usage if it matches districtwise schema
    try:
        if "STATE/UT" in df.columns and "DISTRICT" in df.columns:
            df_totals = df[df["DISTRICT"] == "TOTAL"].drop(columns=["DISTRICT", "TOTAL IPC CRIMES", "OTHER IPC CRIMES"], errors='ignore')
            df_melted = df_totals.melt(id_vars=["STATE/UT", "YEAR"], var_name="crime_type", value_name="count")
            df_melted = df_melted.rename(columns={"STATE/UT": "state", "YEAR": "year"})
            
            # Find the path to the main data folder and overwrite crime_data.json
            current_dir = os.path.dirname(os.path.abspath(__file__))
            data_file = os.path.join(current_dir, "..", "data", "crime_data.json")
            if os.path.exists(os.path.dirname(data_file)):
                df_melted.to_json(data_file, orient="records")
    except Exception as e:
        print(f"Warning: Failed to auto-melt dataset for dashboard: {e}")
    
    try:
        result = universal_predictor.train(df, target_column)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auto-predict")
def auto_predict(input_data: list[dict]):
    try:
        predictions = universal_predictor.predict(input_data)
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
