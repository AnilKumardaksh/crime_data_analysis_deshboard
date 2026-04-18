# CrimeWatch India: Crime Rate Analysis Dashboard

A professional, real-world dashboard built for analyzing Indian crime rates with predictive insights using Machine Learning.

## 🚀 Features
- **Interactive Dashboard**: Real-time stats, trends, and distribution charts.
- **Predictive Engine**: Forecasts crime trends for the next 5 years using Linear Regression.
- **Location Analysis**: State-wise risk assessment and breakdown.
- **Auto-Generated Insights**: Smart summaries of crime data.
- **Modern UI**: Clean, responsive design with Tailwind CSS and Motion.

---

## 📁 Project Structure
```text
crime-dashboard/
├── frontend/             # React (Vite) + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx       # Main Dashboard UI
│   │   └── main.tsx
│   └── package.json
├── backend/              # Node.js (Express) - Used for Live Preview
│   ├── server.ts         # API Endpoints & ML Logic
│   └── data/
│       └── crime_data.json
├── python_backend/       # FastAPI + Scikit-Learn (For Submission)
│   ├── main.py           # FastAPI Server
│   ├── model.py          # ML Prediction Logic
│   ├── train.py          # Model Training Script
│   └── requirements.txt  # Python Dependencies
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **pip** (Python package manager)

### 2. Running the Live Preview (Node.js Backend)
This version is already configured to run in the AI Studio environment.
1. Install dependencies: `npm install`
2. Run the app: `npm run dev`
3. Open `http://localhost:3000`

### 3. Running the Python Backend (For Submission)
If you want to use the FastAPI + Scikit-Learn backend:
1. Navigate to the folder: `cd python_backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Train the model: `python train.py`
4. Start the server: `python main.py`
5. The API will be available at `http://localhost:8000`

---

## 📊 Machine Learning Logic
The project uses **Linear Regression** to predict future crime volumes.
- **Input**: Historical years (2018-2022)
- **Output**: Predicted crime count for 2023-2027
- **Formula**: `y = mx + c` (where `y` is crime count and `x` is the year)

---

## 🌍 Dataset Source
The data used in this project is based on the **National Crime Records Bureau (NCRB)** reports.
- **Real Dataset Link**: [Kaggle: Crime in India](https://www.kaggle.com/datasets/rajanand/crime-in-india)
- **Preprocessing**: The data is aggregated by State, Year, and Crime Type to ensure fast dashboard performance.

---

## 🎨 UI Design Principles
- **Red Palette**: Used for high-risk alerts and crime volume.
- **Green Palette**: Used for safety metrics and low-risk zones.
- **Bento Grid**: Modern layout for summary statistics.
- **Glassmorphism**: Subtle backdrop blurs for a premium feel.

---

## 🎯 Final Submission Tips
- Use the **Python Backend** for your final presentation to demonstrate FastAPI skills.
- Highlight the **Predictive Analysis** section as it adds a "Smart" element to the project.
- Mention that the UI is **Responsive** and works on mobile devices.

Developed with ❤️ for College Project Submission.
