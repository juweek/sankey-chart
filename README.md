## Quick Start

### 1) Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies

```bash
python3 -m pip install -U pip
python3 -m pip install flask requests python-dotenv
```

### 3) Set environment variables

Create a `.env` file in the project root:

```bash
USDA_API_KEY=your_real_key_here
```

### 4) Run

```bash
python3 main.py
```

Open: `http://127.0.0.1:8000`

If the port is busy, change the port in `main.py`.

