"""
Chatbot API - Text2NoSQL shopping assistant using Pydantic AI.

How it works:
- Normal conversation (greetings, questions): agent replies with plain text.
- Product queries (show me X, find Y under Z price): agent calls `search_products`
    tool which queries MongoDB and returns matching products.
- The endpoint figures out which type of response to send to the frontend.
"""
from pydantic_ai import RunContext
from fastapi import APIRouter,Body
from backend.database import products_collection
from pydantic_ai import Agent,Tool,AgentMessage,HumanMessage
from pydantic_ai import BaseModel
from typing import List,Optional,Dict,Any
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix='/chat',tags=['Chatbot'])



# ──────────────────────────────────────────────
# Agent Dependencies: carries the product search
# results back out of the tool call
# ──────────────────────────────────────────────


class StoreDeps(BaseModel):
    """Holds list of products found during this run"""
    found_products: List[Dict[str, Any]] = []
    class Config:
        arbitrary_types_allowed = True

# ──────────────────────────────────────────────
# Agent - plain string output (simple & reliable)
# We detect product queries from tool usage, NOT
# by forcing a rigid output schema on the LLM.
# ──────────────────────────────────────────────

agent = Agent(
    model="groq:openai/gpt-oss-20b",
    name="store_chatbot",
    description="Shopping assistant for clothing store",
    deps_type=StoreDeps,
    system_prompt=(
        "You are a friendly shopping assistant for ClothStore — an online clothing store. "
        "The store has 3 categories: men, women, and kids."
        "\n\n"
        "RULES:\n"
        "1. If the user greets you or asks who you are → reply naturally and warmly.\n"
        "2. If the user wants to browse, find, or buy products → ALWAYS call the `search_products` tool with the right filters. Never describe products yourself.\n"
        "3. After calling `search_products`, confirm to the user what you searched for (e.g. 'Here are men's shirts under ₹2000!').\n"
        "4. If the user asks something completely unrelated to shopping or clothes, reply: "
        "'Sorry, I can't help with that. For assistance, contact our customer care at 546464434.'\n"
        "5. DO NOT make up product names, prices, or details ever."
    ),
)


@agent.tool
def search_products(
    ctx:RunContext[StoreDeps],
    category:Optional[str] = None,
    keyword:Optional[str] = None,
    max_price:Optional[int]=None,
    min_price:Optional[int]=None,
)-> str:

    """
    Searches products in MongoDB based on optional filters.
    """
    query = {}
    if category:
        query["category"] = {"$regex":f"^{category.strip()}$","$options":"i"}
    if keyword:
        query["name"] = {"$regex":f"^{keyword.strip()}$","$options":"i"}
    price_filter = {}
    if max_price is not None:
        price_filter["$lte"] = max_price
    if min_price is not None:
        price_filter["$gte"] = min_price
    if price_filter:
        query["price"] = price_filter   
    

    raw_results = products_collection.find(query).limit(8)
    products = list(raw_results)

    processed = []
    for p in products:
        p["id"] = str(p["_id"])
        p.pop("_id",None)
        p.pop("image_data",None)
        p.pop("image_content_type",None)
        processed.append(p)
        
    ctx.deps.found_products = processed

    if not processed:
        return "No products found matching your criteria."
    return f"OK. I found {len(processed)} products. I will show them now."

@router.post("")
async def chatbot(
    data:Dict = Body(...)
):
    """
    Main chat endpoint. Accepts a user message and returns either
    a plain text reply or a list of matching products.
    """
    user_message = data.get("message","").strip()
    if not user_message:
        return {"type":"text","message":"Please type a message","data":None}
    deps = StoreDeps()

    try:
        result = await agent.run(user_message,deps=deps)
        text_reply = result.output

        if deps.found_products:
            return {"type":"products","message":text_reply,"data":deps.found_products}
        return {"type":"text","message":text_reply,"data":None}

    except Exception as e:
        return {"type":"text","message":"Apologies - something went wrong. Please try again.","data":None}

    