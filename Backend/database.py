import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.getcwd(), '.env'))

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)

db = client['ai_bot']

#collections

users_collection = db['users']
products_collection = db['products']
orders_collection = db['orders']
carts_collection = db['carts']
