 # BSE Stock Market Forecasting Dashboard
  <img width="1723" height="488" alt="image" src="https://github.com/user-attachments/assets/2668d65d-45a3-4d57-a0ea-50ae3b3436f3" />
  <img width="1507" height="791" alt="image" src="https://github.com/user-attachments/assets/4b8844a4-7492-4ebd-857a-0262d5df8707" />
  <img width="1478" height="791" alt="image" src="https://github.com/user-attachments/assets/9d9b6f5b-fec7-48d6-b7b2-46d8a6cf2d49" />
  <img width="1497" height="480" alt="image" src="https://github.com/user-attachments/assets/b69b0936-60e2-4164-a7db-a5f21691367a" />
  <img width="1512" height="627" alt="image" src="https://github.com/user-attachments/assets/f910d283-c877-4715-b350-bc743cc74dd4" />
  <img width="1526" height="527" alt="image" src="https://github.com/user-attachments/assets/52c2bad4-5291-47ee-8b19-77082ec20c60" />
  #..

> An end-to-end machine learning pipeline that forecasts BSE stock prices using 5 models — ARIMA, SARIMA, Prophet, XGBoost, and LSTM — served through an interactive Flask web dashboard.
 
---
 
##  Live Demo
 
🔗 View Live Dashboard-:https://bse-stock-forecasting-model-1.onrender.com/
---
 
##  Project Overview
 
This project builds a complete time series forecasting system for **Reliance Industries (RELIANCE.NS)** using 10 years of BSE stock data (2015–2024). It covers the full ML pipeline — from raw data collection and feature engineering to model training, evaluation, and deployment as a dark-themed interactive web dashboard.
 
The goal was to answer a key question:
 
> *"Which model best predicts BSE stock price movements — in terms of both price accuracy and directional accuracy?"*
 
---
 
##  Key Results
 
| Model | RMSE | MAE | MAPE | Directional Accuracy |
|-------|------|-----|------|----------------------|
| ARIMA | 583.83 | 542.51 | 14.02% | — |
| SARIMA | 952.40 | 894.85 | 22.92% | 57.63% |
| **Prophet** | **175.13** | **152.67** | **3.95%** | 59.32% |
| XGBoost | 801.42 | 734.96 | 18.69% | **71.19%** |
| LSTM | 297.75 | 281.97 | 7.37% | 57.63% |
 
**Key findings:**
- **Prophet** achieved the best price accuracy with just **3.95% MAPE**
-  **XGBoost** predicted market direction correctly **71.19%** of the time — well above the 50% random baseline
-  **LSTM** performed as the best all-rounder with 7.37% MAPE on a univariate Close-price setup
-  SARIMA underperformed — confirming that BSE stocks have weak weekly seasonality
---
 
## 🗂️ Project Pipeline
 
```
Data Collection (yfinance)
        ↓
Data Cleaning & Preprocessing
        ↓
Exploratory Data Analysis
        ↓
Feature Engineering (RSI, MACD, Bollinger Bands, Lag Features)
        ↓
Stationarity Analysis (ADF Test, ACF/PACF)
        ↓
Time Series Decomposition (STL)
        ↓
Anomaly Detection (Isolation Forest + Z-score)
        ↓
Model Training (ARIMA → SARIMA → Prophet → XGBoost → LSTM)
        ↓
Evaluation & Comparison
        ↓
Future Forecast (30-day ahead)
        ↓
Flask Web Dashboard
```
 
---
 
##  Dashboard Features
 
- 📊 **Historical price chart** with 1M / 3M / 6M / 1Y / 3Y / ALL period filters
- 🤖 **Model comparison** — RMSE, MAE, MAPE, and Directional Accuracy bar charts
- 🔮 **Forecast tab** — switch between Prophet, LSTM, and XGBoost predictions
- 📅 **Prophet future forecast** — 15 / 30 / 60 / 90 day horizon selector with 95% confidence interval
- 🚨 **Anomaly detection overlay** — highlights major market events
- 📋 **Results table** — color-coded best values per metric
- 🌙 Dark finance theme — built with vanilla CSS + Chart.js
---
 
##  Tech Stack
 
| Layer | Tools |
|-------|-------|
| Data Collection | `yfinance` |
| Data Processing | `pandas`, `numpy` |
| Statistical Models | `statsmodels` (ARIMA, SARIMA), `prophet` |
| ML / DL Models | `xgboost`, `tensorflow` / `keras` |
| Feature Engineering | `scikit-learn`, `ta` |
| Anomaly Detection | `scikit-learn` (Isolation Forest) |
| Web Framework | `Flask` |
| Frontend | HTML, CSS, JavaScript, Chart.js |
| Deployment | Render |
 
---
 
## 📁 Project Structure
 
```
bse-stock-forecast/
│
├── app.py                     # Flask backend — all routes & APIs
│
├── templates/
│   └── index.html             # Main dashboard page
│
├── static/
│   ├── style.css              # Dark finance theme
│   └── main.js                # Chart.js visualizations & API calls
│
├── models/
│   ├── prophet_model.pkl
│   ├── arima_model.pkl
│   ├── xgboost_model.pkl
│   ├── xgboost_scaler.pkl
│   ├── lstm_fixed_model.keras
│   └── lstm_fixed_scaler.pkl
│
├── data/
│   └── model_results.csv      # Evaluation metrics for all 5 models
│
├── notebooks/                 # Jupyter notebooks (EDA, modeling chunks)
│   ├── 01_data_collection.py
│   ├── 02_data_cleaning.py
│   ├── 03_eda.py
│   ├── 04_feature_engineering.py
│   ├── 05_stationarity.py
│   ├── 06_decomposition.py
│   ├── 07_anomaly_detection.py
│   ├── 08_arima.py
│   ├── 09_sarima.py
│   ├── 10_prophet.py
│   ├── 11_xgboost.py
│   ├── 12b_lstm_fixed.py
│   └── 13_final_comparison_forecast.py
│
├── requirements.txt
└── .gitignore
```
 
---

 
## Feature Engineering
 
The following technical indicators were engineered from raw OHLCV data:
 
| Feature | Description |
|---------|-------------|
| SMA 7/14/30/50/200 | Simple Moving Averages |
| EMA 7/14/30 | Exponential Moving Averages |
| RSI 14 | Relative Strength Index |
| MACD + Signal | Moving Average Convergence Divergence |
| Bollinger Bands | Upper, Mid, Lower bands (20-day) |
| Lag Features | Close price lagged 1, 2, 3, 5, 7 days |
| Daily Return | Percentage change in Close |
| Volatility 14 | 14-day rolling standard deviation of returns |
| Daily Range | High − Low |
| Volume SMA 14 | 14-day rolling average volume |
 
---
 
##  Model Architecture
 
### LSTM (Fixed)
- Architecture: `LSTM(64) → Dropout(0.2) → LSTM(32) → Dropout(0.2) → Dense(16) → Dense(1)`
- Input: 30-day univariate Close price sequences
- Loss: Mean Squared Error
- Optimizer: Adam (lr=0.001)
- Callbacks: EarlyStopping (patience=20), ReduceLROnPlateau
### XGBoost
- Estimators: 500 trees, learning rate 0.05, max depth 4
- Features: All 30+ engineered technical indicators
- Regularization: L1 (α=0.1) + L2 (λ=1.0)
- Best use: Directional/momentum prediction
### Prophet
- Mode: Multiplicative seasonality
- Custom seasonality: Quarterly earnings cycle (63 trading days)
- Changepoint prior scale: 0.05
- Best use: Price level forecasting with confidence intervals
---
 
## Anomaly Detection
 
Three methods were applied and compared:
 
- **Z-score** — flags returns beyond 3 standard deviations
- **Residual-based** — flags decomposition residuals beyond 3σ
- **Isolation Forest** — multivariate anomaly detection on Close, Volume, Return, Volatility
Top anomaly dates align with real-world events: COVID-19 crash (Mar 2020), RIL rights issue (May 2020), and major quarterly earnings surprises.
 
---
 
##  API Endpoints
 
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/historical?days=365` | GET | OHLCV historical data |
| `/api/metrics` | GET | All 5 model evaluation metrics |
| `/api/summary` | GET | Current price, 52W high/low, volume |
| `/api/forecast/prophet?days=30` | GET | Prophet future forecast |
| `/api/forecast/arima?days=30` | GET | ARIMA future forecast |
| `/api/forecast/lstm?days=30` | GET | LSTM recursive forecast |
| `/api/predictions/xgboost` | GET | XGBoost test set predictions |
| `/api/anomalies` | GET | Top anomaly dates |
 
---
 
##  Disclaimer
 
This project is built for **educational and portfolio purposes only**. It is not financial advice. Stock market predictions are inherently uncertain — past model performance does not guarantee future results. Do not make investment decisions based on this tool.
 
---
 

