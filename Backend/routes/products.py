from fastapi import APIRouter,UploadFile,File,Form,HTTPException
from ..models import Product
from ..database import products_collection
import base64
from bson import ObjectId

router = APIRouter(prefix="/products",tags=["Products"])

# Verified fashion imagery from Unsplash for men, women, kids
FASHION_IMAGES = {
    "men": {
        "Shirt": [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
        ],
        "T-Shirt": [
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
        ],
        "Jeans": [
            "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=600&q=80",
        ],
        "Chinos": [
            "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
        ],
        "Blazer": [
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
        ],
        "Jacket": [
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80",
        ],
        "Polo": [
            "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=600&q=80",
        ],
        "Sweater": [
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80",
        ],
        "Hoodie": [
            "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
        ],
        "Shorts": [
            "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=80",
        ],
    },
    "women": {
        "Dress": [
            "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80",
        ],
        "Kurti": [
            "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80",
        ],
        "Saree": [
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80",
        ],
        "Lehenga": [
            "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80",
        ],
        "Blouse": [
            "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        ],
        "Top": [
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80",
        ],
        "Skirt": [
            "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=600&q=80",
        ],
        "Palazzo": [
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80",
        ],
        "Jumpsuit": [
            "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80",
        ],
        "Cardigan": [
            "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?auto=format&fit=crop&w=600&q=80",
        ],
    },
    "kids": {
        "T-Shirt": [
            "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=600&q=80",
        ],
        "Frock": [
            "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=600&q=80",
        ],
        "Dungaree": [
            "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80",
        ],
        "Shorts": [
            "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=600&q=80",
        ],
        "Jacket": [
            "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80",
        ],
        "Pajama": [
            "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=600&q=80",
        ],
        "Romper": [
            "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80",
        ],
        "Hoodie": [
            "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=600&q=80",
        ],
        "Sweater": [
            "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=600&q=80",
        ],
        "Shirt": [
            "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=600&q=80",
        ],
    },
}

DEFAULT_CATEGORY_IMAGES = {
    "men": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    "women": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80",
    "kids": "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=600&q=80",
}

def resolve_product_image(name: str = "", category: str = "men", seed: int = 0) -> str:
    cat = (category or "men").lower()
    cat_items = FASHION_IMAGES.get(cat, FASHION_IMAGES["men"])
    
    # Try to match the item name in product title (e.g. 'Shirt' in 'Classic Black Shirt')
    for item_name, urls in cat_items.items():
        if item_name.lower() in (name or "").lower():
            return urls[seed % len(urls)]
            
    # Default to category image
    return DEFAULT_CATEGORY_IMAGES.get(cat, DEFAULT_CATEGORY_IMAGES["men"])

@router.post("")
@router.post("/")
async def add_product(
    name:str = Form(...),
    description:str = Form(...),
    price:int = Form(...),
    category:str = Form(...),
    size:list[str] = Form("M,L"),
    color:list[str] = Form("black"),
    image:UploadFile = File(...)
):
    """
    Adding new product to the store with an image upload.
    The image is stored as base64 string in mongodb
    """
    # Check if file is actually an image
    image_data = await image.read()
    base64_image = base64.b64encode(image_data).decode("utf-8") 

    content_type = image.content_type or "image/jpeg"

    product = {
        "name" : name,
        "description" : description,
        "price" : price,
        "category" : category,
        "size" : size.split(","),
        "color" : color.split(","),
        "image_data" : base64_image,
        "image_content_type" : content_type
    }

    products_collection.insert_one(product)
    return {"message":"Product added successfully"}

@router.get("")
@router.get("/")
def get_products(category:str="",min_price:int=None,max_price:int=None):
    """Get products with optional category,min & max price"""
    products = []
    query = {
        "category":{
            "$regex":f"^{category}$",
            "$options":"i"
        }
    } if category else {}

    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["price"] = price_query

    for product in products_collection.find(query):
        product["id"] = str(product["_id"])
        product.pop("_id", None)
        
        if "inStock" not in product:
            product["inStock"] = True
        if "rating" not in product:
            product["rating"] = 4.5
        if "reviews" not in product:
            product["reviews"] = 0
        
        # Handling image for frontend display
        img = product.get("image")
        if img and isinstance(img, str):
            if "loremflickr.com" in img or "placeholder.com" in img:
                product["image"] = resolve_product_image(product.get("name", ""), product.get("category", "men"), hash(product.get("name", "")) % 10)
            elif img.startswith("http"):
                pass  # Keep valid URL
            elif "image_data" in product and "image_content_type" in product:
                product["image"] = (
                    f"data:{product['image_content_type']};base64,{product['image_data']}"
                )
        elif "image_data" in product and "image_content_type" in product:
            # Convert base64 image to data URL for frontend display
            product["image"] = (
                f"data:{product['image_content_type']};base64,{product['image_data']}"
            )
        else:
            product["image"] = resolve_product_image(product.get("name", ""), product.get("category", "men"), hash(product.get("name", "")) % 10)

        # Always clean up raw binary fields from response
        product.pop("image_data", None)
        product.pop("image_content_type", None)

        products.append(product)
    return products

@router.delete("")
@router.delete("/")
def delete_all_products():
    """
    Delete all products from the store.
    """
    result = products_collection.delete_many({})
    return {"message": f"{result.deleted_count} products deleted"}

@router.post("/bulk-generate-500")
def bulk_generate_500():
    """
    Generate 500 demo clothing products across 3 categories: men, women, kids.
    Items are consistent and keyword-searchable (e.g. "Classic Blue Jeans").
    Each category gets ~166 products cycling through real clothing item types.
    Images come from high-quality, verified Unsplash fashion CDN.
    """
    import random

    adjectives = ["Classic", "Modern", "Premium", "Casual", "Elegant", "Trendy",
                  "Vintage", "Sporty", "Bold", "Slim", "Relaxed", "Formal"]
    colors = ["Black", "White", "Navy Blue", "Red", "Olive", "Beige",
              "Burgundy", "Mustard", "Grey", "Pink", "Teal", "Brown"]

    categories = [
        {
            "name": "men",
            "items": ["Shirt", "T-Shirt", "Jeans", "Chinos", "Blazer",
                      "Jacket", "Polo", "Sweater", "Hoodie", "Shorts"],
        },
        {
            "name": "women",
            "items": ["Dress", "Kurti", "Saree", "Lehenga", "Blouse",
                      "Top", "Skirt", "Palazzo", "Jumpsuit", "Cardigan"],
        },
        {
            "name": "kids",
            "items": ["T-Shirt", "Frock", "Dungaree", "Shorts", "Jacket",
                      "Pajama", "Romper", "Hoodie", "Sweater", "Shirt"],
        },
    ]

    descriptions = [
        "A comfortable fit for everyday wear.",
        "Premium quality fabric, perfect for all occasions.",
        "Stylish and versatile — a must-have for your wardrobe.",
        "Crafted with care for maximum comfort and durability.",
        "Trendy design that keeps you looking sharp all day.",
        "Soft, breathable material ideal for the season.",
        "A timeless piece that pairs well with everything.",
        "Lightweight and easy to wear — perfect for daily use.",
        "A bold look that makes a statement.",
        "Expertly tailored for a modern silhouette.",
    ]

    sizes_pool = ["S", "M", "L", "XL", "XXL"]
    products = []

    for i in range(500):
        cat = categories[i % 3]          # cycle evenly: men, women, kids
        item = cat["items"][i % len(cat["items"])]   # cycle through item types
        adj  = adjectives[i % len(adjectives)]
        color = colors[i % len(colors)]
        image_url = resolve_product_image(f"{adj} {color} {item}", cat["name"], seed=i)

        products.append({
            "name": f"{adj} {color} {item}",
            "description": descriptions[i % len(descriptions)],
            "price": random.randint(299, 7999),
            "category": cat["name"],
            "size": random.sample(sizes_pool, k=random.randint(2, 4)),
            "color": [color],
            "image": image_url,
            "inStock": True,
            "rating": round(random.uniform(3.5, 5.0), 1),
            "reviews": random.randint(5, 300),
        })

    products_collection.insert_many(products)
    return {"message": "500 demo products generated successfully!"}
@router.post("/bulk")
def add_multiple_products(products_list: list[Product]):
    """
    Add multiple products at once via bulk operation.
    """
    product_list = [product.model_dump() if hasattr(product, "model_dump") else product.dict() for product in products_list]
    products_collection.insert_many(product_list)
    return {"message": "Multiple products added successfully"}



@router.delete("/{id}")
def delete_product(id: str):
    """
    Delete a specific product by its ID.
    """
    try:
        result = products_collection.delete_one({"_id": ObjectId(id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Deleted successfully"}


@router.put("/{id}")
async def update_product(
    id: str,
    name: str = Form(None),
    description: str = Form(None),
    price: int = Form(None),
    category: str = Form(None),
    size: str = Form(None),
    color: str = Form(None),
    image: UploadFile = File(None),
):
    """
    Update an existing product's fields. Only fields provided will be modified.
    """
    try:
        # Build update dictionary with provided fields
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        if price is not None:
            update_data["price"] = price
        if category is not None:
            update_data["category"] = category
        if size is not None:
            update_data["size"] = size.split(",")
        if color is not None:
            update_data["color"] = color.split(",")

        # Handle optional image upload
        if image:
            image_data = await image.read()
            base64_image = base64.b64encode(image_data).decode("utf-8")
            content_type = image.content_type or "image/jpeg"
            update_data["image_data"] = base64_image
            update_data["image_content_type"] = content_type

        result = products_collection.update_one(
            {"_id": ObjectId(id)}, {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product updated successfully"}
    

    
