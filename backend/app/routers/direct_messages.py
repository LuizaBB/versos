"""Chat privativo entre comprador e vendedor, vinculado a uma Purchase."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import DirectMessage, Purchase, User
from app.schemas import DirectMessageCreate, DirectMessageOut

router = APIRouter(prefix="/purchases", tags=["direct-messages"])


def _assert_participant(purchase: Purchase, user_id: int) -> None:
    if purchase.buyer_id != user_id and purchase.seller_id != user_id:
        raise HTTPException(status_code=403, detail="Você não participa desta negociação.")


def _get_purchase(db: Session, purchase_id: int) -> Purchase:
    p = db.scalar(
        select(Purchase)
        .where(Purchase.id == purchase_id)
        .options(joinedload(Purchase.listing))
    )
    if p is None:
        raise HTTPException(status_code=404, detail="Negociação não encontrada.")
    return p


# ── GET /purchases/{purchase_id}/messages ─────────────────────────────────────
@router.get("/{purchase_id}/messages", response_model=list[DirectMessageOut])
def list_messages(
    purchase_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    before_id: int | None = Query(default=None),
    limit: int = Query(default=40, le=100),
):
    p = _get_purchase(db, purchase_id)
    _assert_participant(p, user.id)

    stmt = (
        select(DirectMessage)
        .where(DirectMessage.purchase_id == purchase_id)
        .options(joinedload(DirectMessage.sender))
        .order_by(DirectMessage.created_at.desc())
        .limit(limit)
    )
    if before_id:
        ref = db.get(DirectMessage, before_id)
        if ref:
            stmt = stmt.where(DirectMessage.created_at < ref.created_at)

    msgs = list(db.scalars(stmt).all())
    msgs.reverse()
    return msgs


# ── POST /purchases/{purchase_id}/messages ────────────────────────────────────
@router.post("/{purchase_id}/messages", response_model=DirectMessageOut)
def send_message(
    purchase_id: int,
    data: DirectMessageCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    p = _get_purchase(db, purchase_id)
    _assert_participant(p, user.id)

    if not data.body.strip():
        raise HTTPException(status_code=422, detail="Mensagem não pode ser vazia.")

    msg = DirectMessage(
        purchase_id=purchase_id,
        sender_id=user.id,
        body=data.body.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # recarrega com sender
    msg = db.scalar(
        select(DirectMessage)
        .where(DirectMessage.id == msg.id)
        .options(joinedload(DirectMessage.sender))
    )
    return msg


# ── GET /listings/{listing_id}/buyers ─────────────────────────────────────────
buyers_router = APIRouter(prefix="/listings", tags=["direct-messages"])


@buyers_router.get("/{listing_id}/buyers", response_model=list[dict])
def list_buyers(
    listing_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Retorna lista de compradores interessados num anúncio (apenas para o vendedor)."""
    from app.models import Listing, Purchase
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado.")
    if listing.seller_id != user.id:
        raise HTTPException(status_code=403, detail="Apenas o vendedor pode ver os interessados.")

    purchases = db.scalars(
        select(Purchase)
        .where(Purchase.listing_id == listing_id)
        .options(joinedload(Purchase.buyer))
        .order_by(Purchase.created_at.desc())
    ).all()

    return [
        {
            "purchase_id": p.id,
            "buyer_id": p.buyer_id,
            "buyer_name": p.buyer.name,
            "buyer_avatar": p.buyer.avatar_url,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        }
        for p in purchases
    ]
