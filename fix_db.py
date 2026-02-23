import os
from dotenv import load_dotenv

load_dotenv('.env')
print(os.getenv('DATABASE_URL'))
print(os.getenv('DB_NAME'))
