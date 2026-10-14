"""
using pydantic for data validation and structure
"""
from pydanic import BaseModel,Field
from typing import Optional, List
from datetime import datetime

class Product(BaseModel):
    """product model for store inventory"""
    name: str
    description: str
    price: int
    category: str
    size: List[str]
    color: List[str]
    image: str


class Order(BaseModel):
    """order placement model"""
    user_email: str
    product_name: str
    quantity: int

class CartItem(BaseModel):
    """cart model"""
    user_email: str
    product_name: str
    quantity: int