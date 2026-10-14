"""
shopping cart routes for adding and retrieving items
"""

from fastapi import APIRouter
from ..models import CartItem
from ..database import carts_collection
from typing import List

router = APIRouter(prefix="/cart",tags=["cart"])

@router.post("/add")
def add_to_cart(item:CartItem):
    """
    adding items to user's shopping cart
    """
    item_data = item.model_dump() if hasattr(item,'model_dump') else item.dict()
    carts_collection.insert_one(item_data)
    return{"message":"Item added to cart successfully"}

@router.get("/{user_email}",response_model=List[CartItem])
def get_cart(user_email: str):
    """
    Get all shopping cart items for a specified user 
    """
    items = list(carts_collection.find({"user_email": user_email}))
    return items

@router.delete("/{user_email}")
def clear_cart(user_email: str):
    """
    Clearing user's entire shopping cart
    """
    carts_collection.delete_many({"user_email": user_email})
    return {"message": "Cart cleared successfully"}

@router.delete("/{user_email}/{product_name}")
def remove_from_cart(user_email: str,product_name:str):
    """
    removing items from user's shopping cart
    """
    carts_collection.delete_one({"user_email": user_email,"product_name":product_name})
    return{"message":"Item removed from cart successfully"}