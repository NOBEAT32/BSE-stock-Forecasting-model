# =========================================================
# app.py — BSE Stock Forecasting Flask Backend
# =========================================================
from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import pickle
import joblib
import warnings
warnings.filterwarnings('ignore')

from tensorflow.keras.models import load_model
from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMAResults

app = Flask(__name__)

# =========================================================
# LOAD ALL MODELS ON STARTUP
# =========================================================
print("Loading models...")

with open('models/prophet_model.pkl', 'rb') as f:
    prophet_model = pickle.load(f)

arima_model = ARIMAResults.load('models/arima_model.pkl')
xgb_model   = joblib.load('models/xgboost_model.pkl')
xgb_scaler  = joblib.load('models/xgboost_scaler.pkl')
lstm_model  = load_model('models/lstm_fixed_model.keras')
lstm_scaler = joblib.load('models/lstm_fixed_scaler.pkl')

print("All models loaded.")

# =========================================================
# HELPERS
# =========================================================
def load_data():
    df = pd.read_csv('data/bse_stock_features.csv', parse_dates=['Date'], index_col='Date')
    return df.asfreq('B').ffill()

def load_anomaly_data():
    df = pd.read_csv('data/bse_stock_anomaly.csv', parse_dates=['Date'], index_col='Date')
    return df.asfreq('B').ffill()

# =========================================================
# PAGES
# =========================================================
def get_dashboard_context():
    df           = load_anomaly_data()
    latest_close = float(df['close'].iloc[-1])
    prev_close   = float(df['close'].iloc[-2])
    change       = round(latest_close - prev_close, 2)

    stats = {
        'last_updated': df.index[-1].strftime('%Y-%m-%d'),
        'current_price': round(latest_close, 2),
        'price_change': change,
        'price_change_pct': round((change / prev_close) * 100, 2),
        'yearly_high': round(float(df['close'].tail(252).max()), 2),
        'yearly_low': round(float(df['close'].tail(252).min()), 2),
        'data_points': len(df)
    }

    try:
        results = pd.read_csv('data/model_results.csv').fillna('—').to_dict(orient='records')
    except Exception:
        results = []
        
    return {'stats': stats, 'results': results}

@app.route('/')
def index():
    context = get_dashboard_context()
    return render_template('index.html', **context)

@app.route('/dashboard')
def dashboard():
    context = get_dashboard_context()
    return render_template('index.html', **context)

@app.route('/forecast')
def forecast():
    context = get_dashboard_context()
    return render_template('index.html', **context)

# =========================================================
# API 1 — Historical Stock Data
# GET /api/historical?period=1Y
# =========================================================
@app.route('/api/historical')
def api_historical():
    period = request.args.get('period', '1Y')
    mapping = {'1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095, 'ALL': 10000}
    days = mapping.get(period, 365)
    
    df   = load_anomaly_data()
    sl   = df[['close', 'volume', 'Daily_Return']].tail(days).reset_index()
    sl['Date'] = sl['Date'].dt.strftime('%Y-%m-%d')
    return jsonify({
        'dates':   sl['Date'].tolist(),
        'prices':  sl['close'].round(2).tolist(),
        'close':   sl['close'].round(2).tolist(),
        'volume':  sl['volume'].tolist(),
        'returns': sl['Daily_Return'].round(4).tolist()
    })

# =========================================================
# API 2 — Model Comparison Metrics
# GET /api/metrics
# =========================================================
@app.route('/api/metrics')
def api_metrics():
    results = pd.read_csv('data/model_results.csv').fillna('—')
    return jsonify(results.to_dict(orient='records'))

# =========================================================
# API 3 — Prophet Future Forecast
# GET /api/forecast/prophet?days=30
# =========================================================
@app.route('/api/forecast/prophet')
def api_forecast_prophet():
    days = int(request.args.get('days', 30))
    df   = load_anomaly_data().reset_index()
    pdf  = df[['Date', 'close']].rename(columns={'Date': 'ds', 'close': 'y'})

    future   = prophet_model.make_future_dataframe(periods=days, freq='B')
    forecast = prophet_model.predict(future)
    
    hist = pdf.tail(90)
    
    fut      = forecast[forecast['ds'] > pdf['ds'].max()].copy()
    fut['ds'] = fut['ds'].dt.strftime('%Y-%m-%d')

    return jsonify({
        'model':        'Prophet',
        'forecast_days': days,
        'hist_dates':   hist['ds'].dt.strftime('%Y-%m-%d').tolist(),
        'hist_prices':  hist['y'].round(2).tolist(),
        'fut_dates':    fut['ds'].tolist(),
        'fut_yhat':     fut['yhat'].round(2).tolist(),
        'fut_lower':    fut['yhat_lower'].round(2).tolist(),
        'fut_upper':    fut['yhat_upper'].round(2).tolist(),
    })

# =========================================================
# API 4 — ARIMA Future Forecast
# GET /api/forecast/arima?days=30
# =========================================================
@app.route('/api/forecast/arima')
def api_forecast_arima():
    days   = int(request.args.get('days', 30))
    df     = load_anomaly_data()
    fc     = arima_model.forecast(steps=days)
    dates  = pd.bdate_range(start=df.index[-1] + pd.Timedelta(days=1), periods=days)
    return jsonify({
        'model':        'ARIMA',
        'forecast_days': days,
        'dates':        [d.strftime('%Y-%m-%d') for d in dates],
        'predicted':    [round(v, 2) for v in fc.tolist()],
    })

# =========================================================
# API 5 — LSTM Recursive Future Forecast
# GET /api/forecast/lstm?days=30
# =========================================================
@app.route('/api/forecast/lstm')
def api_forecast_lstm():
    days         = int(request.args.get('days', 30))
    SEQUENCE_LEN = 30

    df    = load_data()
    close = df[['close']].dropna()
    scaled = lstm_scaler.transform(close.values)

    seq  = scaled[-SEQUENCE_LEN:].flatten().tolist()
    preds_scaled = []

    for _ in range(days):
        x    = np.array(seq[-SEQUENCE_LEN:]).reshape(1, SEQUENCE_LEN, 1)
        pred = lstm_model.predict(x, verbose=0)[0][0]
        preds_scaled.append(pred)
        seq.append(pred)

    predictions = lstm_scaler.inverse_transform(
        np.array(preds_scaled).reshape(-1, 1)
    ).flatten().tolist()

    dates = pd.bdate_range(start=close.index[-1] + pd.Timedelta(days=1), periods=days)

    return jsonify({
        'model':        'LSTM',
        'forecast_days': days,
        'dates':        [d.strftime('%Y-%m-%d') for d in dates],
        'predicted':    [round(v, 2) for v in predictions],
    })

# =========================================================
# API 6 — XGBoost: Actual vs Predicted (test set)
# GET /api/forecast/xgboost
# =========================================================
@app.route('/api/forecast/xgboost')
def api_predictions_xgboost():
    TEST_SIZE = 60
    df        = load_data()

    DROP_COLS    = ['Target_NextClose', 'Target_Direction', 'Trend', 'Seasonal',
                    'Residual', 'Anomaly_zscore', 'Anomaly_residual',
                    'Anomaly_isoforest', 'Return_zscore', 'close']
    feature_cols = [c for c in df.columns if c not in DROP_COLS and df[c].dtype != 'object']

    X      = df[feature_cols].dropna()
    y      = df.loc[X.index, 'close']
    X_test = X.iloc[-TEST_SIZE:]
    y_test = y.iloc[-TEST_SIZE:]

    y_pred = xgb_model.predict(xgb_scaler.transform(X_test))

    return jsonify({
        'model':     'XGBoost',
        'dates':     [d.strftime('%Y-%m-%d') for d in X_test.index],
        'actual':    y_test.round(2).tolist(),
        'predicted': [round(v, 2) for v in y_pred.tolist()]
    })

# =========================================================
# API 7 — Summary Stats (homepage cards)
# GET /api/summary
# =========================================================
@app.route('/api/summary')
def api_summary():
    df           = load_anomaly_data()
    latest_close = float(df['close'].iloc[-1])
    prev_close   = float(df['close'].iloc[-2])
    change       = round(latest_close - prev_close, 2)

    return jsonify({
        'ticker':        'RELIANCE.NS',
        'latest_close':  round(latest_close, 2),
        'prev_close':    round(prev_close, 2),
        'change':        change,
        'change_pct':    round((change / prev_close) * 100, 2),
        'high_52w':      round(float(df['close'].tail(252).max()), 2),
        'low_52w':       round(float(df['close'].tail(252).min()), 2),
        'avg_volume_30': int(df['volume'].tail(30).mean()),
        'data_start':    df.index[0].strftime('%Y-%m-%d'),
        'data_end':      df.index[-1].strftime('%Y-%m-%d'),
    })

# =========================================================
# API 8 — Anomaly Dates (chart annotations)
# GET /api/anomalies
# =========================================================
@app.route('/api/anomalies')
def api_anomalies():
    df  = load_anomaly_data()
    anom = (df[df['Anomaly_isoforest'] == 1][['close', 'Daily_Return']]
            .copy()
            .sort_values('Daily_Return', key=abs, ascending=False)
            .head(20)
            .reset_index())
    anom['Date'] = anom['Date'].dt.strftime('%Y-%m-%d')
    return jsonify(anom.to_dict(orient='records'))

# =========================================================
# RUN
# =========================================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)