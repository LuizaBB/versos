from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Listing, ListingStatus, Notification, NotificationType, Purchase, PurchaseStatus, User
from app.schemas import PurchaseCreate, PurchaseOut, PurchaseStatusUpdate
from app.routers.listings import listing_to_out

router = APIRouter(tags=["purchases"])


@router.post("/purchases", response_model=PurchaseOut)
def create_purchase(
    data: PurchaseCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == data.listing_id)
        .options(joinedload(Listing.book), joinedload(Listing.group_links))
    )
    if listing is None:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado")
    if listing.seller_id == user.id:
        raise HTTPException(status_code=400, detail="Você não pode comprar seu próprio anúncio")
    if listing.status not in (ListingStatus.ACTIVE, ListingStatus.NEGOTIATING):
        raise HTTPException(status_code=400, detail="Anúncio indisponível")

    purchase = Purchase(
        listing_id=listing.id,
        buyer_id=user.id,
        seller_id=listing.seller_id,
        amount=listing.price,
        status=PurchaseStatus.PENDING,
        delivery_status="Aguardando confirmação de pagamento",
        estimated_delivery_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    listing.status = ListingStatus.NEGOTIATING
    db.add(purchase)
    db.flush()
    db.add(
        Notification(
            user_id=listing.seller_id,
            type=NotificationType.SALE,
            title="Nova venda em andamento",
            message=f"{user.name} iniciou a compra de {listing.title}.",
            metadata_json={"purchase_id": purchase.id, "listing_id": listing.id},
        )
    )
    db.add(
        Notification(
            user_id=user.id,
            type=NotificationType.PURCHASE,
            title="Pedido registrado",
            message=f"Compra de {listing.title} criada.",
            metadata_json={"purchase_id": purchase.id},
        )
    )
    db.commit()
    purchase = db.scalar(
        select(Purchase)
        .where(Purchase.id == purchase.id)
        .options(joinedload(Purchase.listing).joinedload(Listing.book), joinedload(Purchase.listing).joinedload(Listing.group_links))
    )
    return _purchase_out(purchase)


def _purchase_out(p: Purchase) -> PurchaseOut:
    return PurchaseOut(
        id=p.id,
        listing_id=p.listing_id,
        buyer_id=p.buyer_id,
        seller_id=p.seller_id,
        amount=p.amount,
        status=p.status,
        delivery_status=p.delivery_status,
        estimated_delivery_at=p.estimated_delivery_at,
        completed_at=p.completed_at,
        listing=listing_to_out(p.listing),
    )


@router.get("/purchases/{purchase_id}", response_model=PurchaseOut)
def get_purchase(
    purchase_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    p = db.scalar(
        select(Purchase)
        .where(Purchase.id == purchase_id)
        .options(joinedload(Purchase.listing).joinedload(Listing.book), joinedload(Purchase.listing).joinedload(Listing.group_links))
    )
    if p is None or (p.buyer_id != user.id and p.seller_id != user.id):
        raise HTTPException(status_code=404, detail="Compra não encontrada")
    return _purchase_out(p)


@router.patch("/purchases/{purchase_id}/status", response_model=PurchaseOut)
def patch_purchase_status(
    purchase_id: int,
    data: PurchaseStatusUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    p = db.scalar(
        select(Purchase)
        .where(Purchase.id == purchase_id)
        .options(joinedload(Purchase.listing).joinedload(Listing.book), joinedload(Purchase.listing).joinedload(Listing.group_links))
    )
    if p is None or (p.buyer_id != user.id and p.seller_id != user.id):
        raise HTTPException(status_code=404, detail="Compra não encontrada")

    p.status = data.status
    if data.delivery_status is not None:
        p.delivery_status = data.delivery_status
    if data.estimated_delivery_at is not None:
        p.estimated_delivery_at = data.estimated_delivery_at
    if data.status == PurchaseStatus.COMPLETED:
        p.completed_at = datetime.now(timezone.utc)
        p.listing.status = ListingStatus.SOLD

    db.commit()
    db.refresh(p)
    return _purchase_out(p)


me_purchases_router = APIRouter(prefix="/me", tags=["me-purchases"])


@me_purchases_router.get("/purchases", response_model=list[PurchaseOut])
def my_purchases(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Purchase)
        .where(Purchase.buyer_id == user.id)
        .options(joinedload(Purchase.listing).joinedload(Listing.book), joinedload(Purchase.listing).joinedload(Listing.group_links))
        .order_by(Purchase.created_at.desc())
    ).unique().all()
    return [_purchase_out(x) for x in rows]
