import React, { useState, useMemo } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/forecast/run/";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { Zap, Download } from "lucide-react";

/* ---------------- DATE HELPERS ---------------- */

const formatDate = (date) => date.toLocaleDateString("en-CA");
const todayString = formatDate(new Date());
const offsetDate  = (days) =>
  formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000));

const QUICK_DATES = [
  { label: "Today",      days: 0 },
  { label: "Tomorrow",   days: 1 },
  { label: "Day After",  days: 2 },
];


export default function EnergyForecastDashboard() {
  const [forecastType, setForecastType] = useState("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [energyData, setEnergyData] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState([]);

  /* ---------------- AXIS LABELS ---------------- */

  const xAxisLabel =
    forecastType === "single" ? "Time (Hours)" : "Date";

  const yAxisLabel = "Power (kW)";

  /* ---------------- VALIDATION ---------------- */

  const validateInputs = () => {
    if (forecastType === "single" && !singleDate) {
      setError("Please select a date.");
      return false;
    }

    if (forecastType === "range") {
      if (!startDate || !endDate) {
        setError("Please select start and end dates.");
        return false;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setError("End date cannot be earlier than start date.");
        return false;
      }
      const diffDays =
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      if (diffDays > 6) {
        setError("Date range cannot exceed 7 days (forecast limit).");
        return false;
      }
    }

    setError("");
    return true;
  };

  /* ---------------- API CALL ---------------- */

  const handleForecast = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError("");

    const payload = { mode: forecastType };
    if (forecastType === "single") {
      payload.single_date = singleDate;
    } else {
      payload.start_date = startDate;
      payload.end_date   = endDate;
    }

    try {
      const { data } = await axios.post(API_URL, payload);
      setEnergyData(data.energy_data);
      setWeatherSummary(data.weather_summary);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not reach the forecast server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- KPIs ---------------- */

  const totalEnergy = useMemo(() => {
    return energyData.reduce((sum, d) => sum + d.energy, 0);
  }, [energyData]);

  const peakEnergy = useMemo(() => {
    if (!energyData.length) return 0;
    return Math.max(...energyData.map((d) => d.energy));
  }, [energyData]);

  // Table rows: hourly energy for single day; daily weather+energy for range
  const tableRows = useMemo(() => {
    if (!energyData.length) return [];
    if (forecastType === "single") {
      return energyData; // [{label: "HH:00", energy}] × 24
    }
    const energyMap = Object.fromEntries(
      energyData.map((d) => [d.label, d.energy])
    );
    return weatherSummary.map((row) => ({
      ...row,
      energy: energyMap[row.date] ?? 0,
    }));
  }, [forecastType, energyData, weatherSummary]);

  /* ---------------- EXPORT ---------------- */

  const exportCSV = () => {
    if (!tableRows.length) return;

    let header, rows;
    if (forecastType === "single") {
      header = "Hour,Energy(kWh)\n";
      rows = tableRows
        .map((d) => `${d.label},${d.energy.toFixed(4)}`)
        .join("\n");
    } else {
      header =
        "Date,Temperature(°C),Humidity(%),Irradiance(W/m²),Wind(km/h),Energy(kWh)\n";
      rows = tableRows
        .map(
          (d) =>
            `${d.date},${d.temperature.toFixed(2)},${d.humidity.toFixed(
              2
            )},${d.irradiance.toFixed(2)},${d.wind.toFixed(2)},${d.energy.toFixed(4)}`
        )
        .join("\n");
    }

    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weather_summary_${Date.now()}.csv`;
    link.click();
  };

  const chartTitle =
    forecastType === "single"
      ? `Hourly Energy Forecast (${singleDate || "Select Date"})`
      : `Daily Energy Forecast (${startDate || "Start"} → ${
          endDate || "End"
        })`;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-emerald-100 to-slate-300 text-slate-900 p-8">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Zap className="text-yellow-500" />
          AI Energy Forecasting System
        </h1>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* CONFIG CARD */}
        <Card className="bg-white shadow-xl border border-gray-200 rounded-3xl">
          <CardContent className="p-6 space-y-4">

            <div className="flex gap-3">
              <Button
                onClick={() => setForecastType("single")}
                className="w-full rounded-2xl"
              >
                Single Day
              </Button>

              <Button
                onClick={() => setForecastType("range")}
                className="w-full rounded-2xl"
              >
                Date Range
              </Button>
            </div>

            {forecastType === "single" && (
              <>
                <div className="flex gap-2">
                  {QUICK_DATES.map(({ label, days }) => {
                    const val = offsetDate(days);
                    return (
                      <button
                        key={label}
                        onClick={() => setSingleDate(val)}
                        className={`flex-1 text-xs py-1.5 rounded-xl border transition-colors ${
                          singleDate === val
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white text-slate-600 border-gray-300 hover:border-emerald-400"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <Input
                  type="date"
                  value={singleDate}
                  min={todayString}
                  onChange={(e) => setSingleDate(e.target.value)}
                />
              </>
            )}

            {forecastType === "range" && (
              <>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <div className="text-xs text-blue-500 bg-blue-50 rounded-xl px-3 py-2">
                  Maximum range: 7 days (forecast limit).
                </div>
              </>
            )}

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <Button
              onClick={handleForecast}
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Generate Forecast
            </Button>

          </CardContent>
        </Card>

        {/* RESULTS CARD */}
        <Card className="md:col-span-2 bg-white shadow-xl border border-gray-200 rounded-3xl relative">

          {/* LOADING OVERLAY */}
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 rounded-3xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500"
              />
              <p className="mt-5 text-emerald-600 font-semibold tracking-wide">
                Generating...
              </p>
              <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
            </div>
          )}

          <CardContent className="p-6">

            <h2 className="text-xl font-semibold text-center mb-4">
              {chartTitle}
            </h2>

            {/* CHART */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={energyData}
                  margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    label={{
                      value: xAxisLabel,
                      position: "insideBottom",
                      offset: -10,
                      style: { fill: "#475569", fontSize: 14 },
                    }}
                  />

                  <YAxis
                    stroke="#64748b"
                    label={{
                      value: yAxisLabel,
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#475569", fontSize: 14 },
                    }}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* KPIs */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-emerald-50 p-4 rounded-2xl">
                <p className="text-sm text-gray-500">Total Energy</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {totalEnergy.toFixed(2)} kWh
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-2xl">
                <p className="text-sm text-gray-500">Peak Energy</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {peakEnergy.toFixed(2)} kWh
                </p>
              </div>
            </div>

            {/* RESULTS TABLE */}
            {tableRows.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">
                  {forecastType === "single"
                    ? "Hourly Energy Breakdown"
                    : "Daily Weather & Energy Summary"}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-600 border-b border-gray-200">
                      {forecastType === "single" ? (
                        <tr>
                          <th className="py-2">Hour</th>
                          <th>Energy (kWh)</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-2">Date</th>
                          <th>Temperature (°C)</th>
                          <th>Humidity (%)</th>
                          <th>Irradiance (W/m²)</th>
                          <th>Wind (km/h)</th>
                          <th>Energy (kWh)</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {tableRows.map((row, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          {forecastType === "single" ? (
                            <>
                              <td className="py-2">{row.label}</td>
                              <td className="font-medium text-emerald-600">
                                {row.energy.toFixed(4)}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2">{row.date}</td>
                              <td>{row.temperature.toFixed(2)}</td>
                              <td>{row.humidity.toFixed(2)}</td>
                              <td>{row.irradiance.toFixed(2)}</td>
                              <td>{row.wind.toFixed(2)}</td>
                              <td className="font-medium text-emerald-600">
                                {row.energy.toFixed(4)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={exportCSV}
                    variant="outline"
                    className="rounded-2xl flex items-center gap-2"
                  >
                    <Download size={16} /> Export CSV
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
