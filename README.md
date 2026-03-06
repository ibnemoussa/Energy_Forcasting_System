# AI Energy Forecasting System

A full-stack AI application that forecasts solar energy output using a trained Artificial Neural Network (ANN) and real-time weather data from Open-Meteo.

---

## How It Works

1. You select a date (or date range up to 7 days).
2. The backend fetches 7-day hourly weather data from Open-Meteo for **Kigali, Rwanda**.
3. Weather data is interpolated to 10-minute resolution.
4. The ANN model predicts power output (kW) for every 10-minute interval.
5. Results are aggregated to hourly (single day) or daily (date range) energy (kWh) and displayed in the dashboard.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite 7, React 19, Tailwind CSS v3, Recharts, Framer Motion |
| Backend | Django 6, Django REST Framework, django-cors-headers |
| ML Model | TensorFlow / Keras 3.13, scikit-learn (StandardScaler) |
| Weather | Open-Meteo API (free, no key required) |

---

## Project Structure

```text
AI_Energy_System/
├── ANN/
│   └── models/
│       ├── ann_standard_model.keras   ← trained ANN model
│       ├── standard_scaler.pkl        ← feature scaler
│       └── ann_features.pkl           ← feature list
├── backend/
│   ├── energy_project/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── forecast/
│   │   ├── views.py
│   │   └── services/
│   │       └── ann_service.py         ← ML inference pipeline
│   ├── requirements.txt               ← Python dependencies
│   └── manage.py
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── EnergyForecastDashboard.jsx   ← main UI
│       │   └── ui/  (card, button, input)
│       ├── App.jsx
│       └── index.css
├── start.sh                           ← macOS one-click launcher
└── README.md
```

---

## Prerequisites

### 1 — Conda (Python environment manager)

Install **Miniconda** if you don't have it.
Choose the **macOS Apple Silicon** or **macOS Intel** installer from:

```text
https://docs.conda.io/en/latest/miniconda.html
```

### 2 — Node.js

Install Node.js (v18 or later) from `https://nodejs.org`, or via Homebrew:

```bash
brew install node
```

---

## Running the System

### One command — does everything

From the project root:

```bash
bash start.sh
```

**On the very first run**, the script automatically:

1. Creates the `ML_2` conda environment with Python 3.12 (if not present)
2. Installs all Python packages from `backend/requirements.txt`
3. Installs all Node.js packages (`npm install`) for the frontend

**On every subsequent run**, it skips installation (already done) and launches immediately.

After setup it will:

- Open a **Backend terminal window** running Django on `http://localhost:8000`
- Open a **Frontend terminal window** running Vite on `http://localhost:5173`
- Automatically open the dashboard in your browser

### Stopping the system

Close the two Terminal windows that were opened, or press `Ctrl+C` in each.

---

## Python Dependencies (`backend/requirements.txt`)

```text
Django
djangorestframework
django-cors-headers
tensorflow-cpu
keras==3.13.2
pandas
numpy
joblib
requests
scikit-learn==1.7.2
```

> **Apple Silicon (M1/M2/M3) note:** For native GPU performance, replace `tensorflow-cpu` with `tensorflow-macos` + `tensorflow-metal` in `requirements.txt` before running `start.sh`:
>
> ```text
> tensorflow-macos
> tensorflow-metal
> ```

---

## Manual Start (alternative)

**Backend:**

```bash
conda activate ML_2
cd AI_Energy_System/backend
python manage.py runserver
```

**Frontend (separate terminal):**

```bash
cd AI_Energy_System/frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Using the Dashboard

| Feature | Description |
| --- | --- |
| **Single Day** | Select a specific date and get 24 hourly energy forecasts |
| **Date Range** | Select up to 7 days and get daily energy totals |
| **Quick Dates** | Buttons for Today / Tomorrow / Day After for fast selection |
| **Language** | Dropdown to switch between English, Français, and العربية |
| **Chart** | Interactive line chart of energy output over time |
| **Table** | Paginated table (10 rows/page) with temperature, humidity, irradiance, wind, and energy |
| **Export CSV** | Downloads forecast data with column headers in the selected language |

---

## API Reference

**Endpoint:** `POST http://localhost:8000/api/forecast/run/`

**Single day request:**

```json
{
  "mode": "single",
  "single_date": "2026-03-06"
}
```

**Date range request:**

```json
{
  "mode": "range",
  "start_date": "2026-03-06",
  "end_date": "2026-03-10"
}
```

**Response:**

```json
{
  "energy_data": [
    { "label": "08:00", "energy": 0.1234 }
  ],
  "weather_summary": [
    {
      "label": "08:00",
      "temperature": 22.5,
      "humidity": 65.0,
      "irradiance": 450.3,
      "wind": 12.1,
      "energy": 0.1234
    }
  ]
}
```

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| `ModuleNotFoundError: No module named 'tensorflow'` | Re-run `bash start.sh` — it will install missing packages automatically |
| `conda: command not found` | Restart your terminal after installing Miniconda, or run `source ~/miniconda3/etc/profile.d/conda.sh` |
| Conda env `ML_2` not found | Re-run `bash start.sh` — it creates the environment automatically |
| `CORS` error in browser | Ensure the backend is running on port 8000 |
| No data returned | Dates must be within the next 7 days (Open-Meteo forecast limit) |
| `npm: command not found` | Install Node.js from `https://nodejs.org` |
| Port 8000 already in use | Run `lsof -ti:8000 \| xargs kill` then restart the backend |
| Port 5173 already in use | Run `lsof -ti:5173 \| xargs kill` then restart the frontend |
