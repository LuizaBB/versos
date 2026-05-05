from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, books, groups, listings, me_shelf, notifications, purchases

app = FastAPI(title="Versos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(me_shelf.router)
app.include_router(groups.router)
app.include_router(groups.me_groups_router)
app.include_router(listings.router)
app.include_router(listings.me_listings_router)
app.include_router(purchases.router)
app.include_router(purchases.me_purchases_router)
app.include_router(notifications.router)


@app.get("/health")
def health():
    return {"status": "ok"}
