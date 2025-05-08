import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database connection details from environment variables
DATABASE_URL = os.getenv('DATABASE_URL')

# Parse the DATABASE_URL into components
DATABASE_URL = DATABASE_URL.replace('postgresql://', '')  # Remove prefix
user_pass, host_port_db = DATABASE_URL.split('@')  # Split user info and host info
user, password = user_pass.split(':')  # Split username and password
host_port, database = host_port_db.split('/')  # Split host and database name
host, port = host_port.split(':')  # Split host and port

# Create a reusable database connection
conn = psycopg2.connect(
    database=database,
    user=user,
    password=password,
    host=host,
    port=port
)