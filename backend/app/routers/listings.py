from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import (
    Book,
    GroupMember,
    Listing,
    ListingGroup,
    ListingStatus,
    Notification,
    NotificationType,
    User,
    UserBook,
)
from app.schemas import ListingCreate, ListingOut, ListingUpdate
from app.services.notifications import notify_favorite_listing_match


def listing_to_out(listing: Listing) -> ListingOut:
    group_ids = [lg.group_id for lg in listing.group_links]
    return ListingOut(
        id=listing.id,
        seller_id=listing.seller_id,
        book_id=listing.book_id,
        user_book_id=listing.user_book_id,
        title=listing.title,
        description=listing.description,
        price=listing.price,
        condition=listing.condition,
        status=listing.status,
        book=listing.book,
        group_ids=group_ids,
    )


router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=list[ListingOut])
def list_listings(q: str | None = None, db: Session = Depends(get_db)):
    stmt = (
        select(Listing)
        .where(Listing.status.in_([ListingStatus.ACTIVE, ListingStatus.NEGOTIATING]))
        .options(joinedload(Listing.book), joinedload(Listing.group_links))
        .order_by(Listing.created_at.desc())
        .limit(100)
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.join(Book, Book.id == Listing.book_id).where(
            or_(Listing.title.ilike(like), Book.title.ilike(like), Book.author.ilike(like))
        )
    rows = db.scalars(stmt).unique().all()
    return [listing_to_out(x) for x in rows]


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == listing_id)
        .options(joinedload(Listing.book), joinedload(Listing.group_links))
    )
    if listing is None:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado")
    return listing_to_out(listing)


@router.post("", response_model=ListingOut)
def create_listing(
    data: ListingCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    book = db.get(Book, data.book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    if data.user_book_id is not None:
        ub = db.get(UserBook, data.user_book_id)
        if ub is None or ub.user_id != user.id or ub.book_id != data.book_id:
            raise HTTPException(status_code=400, detail="user_book_id inválido")

    for gid in data.group_ids:
        m = db.scalar(select(GroupMember).where(GroupMember.group_id == gid, GroupMember.user_id == user.id))
        if m is None:
            raise HTTPException(status_code=403, detail=f"Você precisa participar do grupo {gid} para publicar")

    listing = Listing(
        seller_id=user.id,
        book_id=data.book_id,
        user_book_id=data.user_book_id,
        title=data.title,
        description=data.description,
        price=data.price,
        condition=data.condition,
        status=ListingStatus.ACTIVE,
    )
    db.add(listing)
    db.flush()
    for gid in data.group_ids:
        db.add(ListingGroup(listing_id=listing.id, group_id=gid))
    notify_favorite_listing_match(db, listing, user)
    db.add(
        Notification(
            user_id=user.id,
            type=NotificationType.SALE,
            title="Anúncio publicado",
            message=f'Seu anúncio "{listing.title}" está no ar.',
            metadata_json={"listing_id": listing.id},
        )
    )
    db.commit()
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == listing.id)
        .options(joinedload(Listing.book), joinedload(Listing.group_links))
    )
    return listing_to_out(listing)


@router.patch("/{listing_id}", response_model=ListingOut)
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == listing_id)
        .options(joinedload(Listing.book), joinedload(Listing.group_links))
    )
    if listing is None or listing.seller_id != user.id:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(listing, k, v)
    db.commit()
    db.refresh(listing)
    return listing_to_out(listing)


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, listing_id)
    if listing is None or listing.seller_id != user.id:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado")
    listing.status = ListingStatus.CANCELLED
    db.commit()
    return None


me_listings_router = APIRouter(prefix="/me", tags=["me-listings"])


@me_listings_router.get("/listings", response_model=list[ListingOut])
def my_listings(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Listing)
        .where(Listing.seller_id == user.id)
        .options(joinedload(Listing.book), joinedload(Listing.group_links))
        .order_by(Listing.created_at.desc())
    ).unique().all()
    return [listing_to_out(x) for x in rows]
