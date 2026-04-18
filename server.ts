import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load data dynamically helper
  const dataPath = path.join(__dirname, "data", "crime_data.json");
  const getCrimeData = () => {
    try {
      return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch (error) {
      console.error("Failed to read crime_data.json", error);
      return [];
    }
  };

  // API Endpoints
  app.get("/api/data", (req, res) => {
    res.json(getCrimeData());
  });

  app.get("/api/stats", (req, res) => {
    const data = getCrimeData();
    const totalCrimes = data.reduce((acc: number, curr: any) => acc + curr.count, 0);
    const mostCommonCrime = data.reduce((acc: any, curr: any) => {
      acc[curr.crime_type] = (acc[curr.crime_type] || 0) + curr.count;
      return acc;
    }, {});
    const commonType = Object.entries(mostCommonCrime).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';

    const stateWise = data.reduce((acc: any, curr: any) => {
      acc[curr.state] = (acc[curr.state] || 0) + curr.count;
      return acc;
    }, {});
    const sortedStates = Object.entries(stateWise).sort((a: any, b: any) => b[1] - a[1]);
    const dangerousState = sortedStates.length > 0 ? sortedStates[0][0] : 'N/A';
    const safestState = sortedStates.length > 0 ? sortedStates[sortedStates.length - 1][0] : 'N/A';

    // YoY Change (2021 to 2022)
    const crimes2021 = data.filter((d: any) => d.year === 2021).reduce((a: number, c: any) => a + c.count, 0);
    const crimes2022 = data.filter((d: any) => d.year === 2022).reduce((a: number, c: any) => a + c.count, 0);
    const yoyChange = ((crimes2022 - crimes2021) / crimes2021) * 100;

    res.json({
      totalCrimes,
      commonType,
      dangerousState,
      safestState,
      yoyChange: yoyChange.toFixed(2),
    });
  });

  app.get("/api/predict", (req, res) => {
    // Simple Linear Regression: y = mx + c
    const data = getCrimeData();
    const yearWise = data.reduce((acc: any, curr: any) => {
      acc[curr.year] = (acc[curr.year] || 0) + curr.count;
      return acc;
    }, {});

    const years = Object.keys(yearWise).map(Number);
    const counts = Object.values(yearWise).map(Number);

    const n = years.length;
    const sumX = years.reduce((a, b) => a + b, 0);
    const sumY = counts.reduce((a, b) => a + b, 0);
    const sumXY = years.reduce((a, i, idx) => a + i * counts[idx], 0);
    const sumX2 = years.reduce((a, b) => a + b * b, 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const c = (sumY - m * sumX) / n;

    const predictions = [];
    for (let i = 1; i <= 5; i++) {
      const nextYear = Math.max(...years) + i;
      predictions.push({
        year: nextYear,
        predicted_crime: Math.round(m * nextYear + c),
      });
    }

    res.json(predictions);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
