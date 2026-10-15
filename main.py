from fastapi import FastAPI
from Backend.routes import orders,cart,chatbot,products

import os
import uvicorn
import logfire

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logfire.configure(send_to_logfire="if-token-present")
logfire.instrument_fastapi(app)
logfire.instrument_pydantic()

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(cart.router)
app.include_router(chatbot.router)

# Serve upload files statically
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

#Serve frontend natively
app.mount("/",StaticFiles(directory="Frontend",html=True),name="frontend")

if __name__ == "__main__":
    print("Starting backend server (FastAPI)")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)