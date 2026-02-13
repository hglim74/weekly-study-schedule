# Linux Installation and Execution Guide

## Prerequisites

- Python 3.8 or higher
- `pip` (Python package installer)
- `virtualenv` (optional but recommended)

## Installation

1. **Create a Virtual Environment (Optional but Recommended)**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   pip install flet
   ```
   *Note: If you encounter issues installing `psycopg2-binary`, you may need to install development libraries first:*
   ```bash
   sudo apt-get install libpq-dev python3-dev
   ```

3. **Apply Database Migrations**
   ```bash
   python3 manage.py migrate
   ```

4. **Create a Superuser**
   ```bash
   python3 manage.py createsuperuser
   ```

## Running the Server

To start the development server with SSL support:

```bash
python3 manage.py runsslserver 0.0.0.0:8000
```
*Note: Make sure port 8000 is open in your firewall if accessing remotely.*
