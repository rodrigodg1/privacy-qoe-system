# PoQeMoN QoE Dataset Analysis

This repository contains analysis scripts for the PoQeMoN QoE dataset, focusing on privacy-preserving Quality of Experience measurements.

## Notebook Contents

The `notebook_evaluation.ipynb` contains the following analyses:

### 1. Data Loading and Initial Setup
- Imports required libraries (pandas, seaborn, matplotlib)
- Loads the QoE dataset from the source

### 2. Exploratory Analysis
- Visualization of MOS (Mean Opinion Score) distributions
- Analysis of QoE factors across different:
  - Mobile Networks
  - Buffering Times
  - Device Models

### 3. Performance Metrics
- Encryption Performance Analysis
  - Encryption Time (ms)
  - CPU Usage (ms)
  - Memory Usage (MB)

### 4. Network Comparisons
- Local Network Analysis
- Testnet Analysis
- Transaction Confirmation Time Comparisons

### 5. Statistical Analysis
- Correlation Analysis
- MOS Distribution Statistics
- Performance Metrics Summary

## Requirements

```python
pip install pandas
pip install seaborn
pip install matplotlib
pip install lux-api
```

## Usage

1. Clone the repository
2. Open `notebook_evaluation.ipynb` in Jupyter Notebook or Google Colab
3. Run the cells sequentially to reproduce the analysis

## Dataset Source

The original PoQeMoN QoE dataset is available at:
https://github.com/Lamyne/Poqemon-QoE-Dataset/tree/master

## Output Files

The notebook generates several PDF visualizations:
- `MOS_analysis.pdf`
- `encryption_analysis.pdf`
- `transaction_confirmation_time_analysis.pdf`
- `encryption_performance_analysis.pdf`