# Smart Attendance System

## Requirements
- Python 3.14+

### Install Python using MiniConda
1. Download and install MiniConda from [here](https://docs.conda.io/en/latest/miniconda.html).
2. Create and activate a Python 3.14 environment:
    ```bash
    conda create -n smart_attendance python=3.14
    conda activate smart_attendance
    ```

## Installation
### Install the required packages
```bash
python3 -m pip install -r requirements.txt
```

### Set up environment variables
Create a `.env` file in the root directory and add the following variables:
```bash
cp .env.example .env
```
Set your environment variables in the `.env` file, such as `OPENAI_API_KEY`.

## Run the FastAPI server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```
