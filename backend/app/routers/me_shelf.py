from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Book, FavoriteBook, Notification, NotificationType, ReadingStatus, User, UserBook
from app.schemas import FavoriteCreate, ShelfStatsOut, UserBookCreate, UserBookOut, UserBookUpdate

router = APIRouter(prefix="/me", tags=["me-shelf"])


def _year_bounds_utc() -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    start = datetime(now.year, 1, 1, tzinfo=timezone.utc)
    end = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    return start, end


@router.get("/books", response_model=list[UserBookOut])
def my_books(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    stmt = (
        select(UserBook)
        .where(UserBook.user_id == user.id)
        .options(joinedload(UserBook.book))
        .order_by(UserBook.updated_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


@router.get("/books/stats", response_model=ShelfStatsOut)
def my_shelf_stats(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    start, end = _year_bounds_utc()
    total = db.scalar(select(func.count()).select_from(UserBook).where(UserBook.user_id == user.id)) or 0
    quero = (
        db.scalar(
            select(func.count())
            .select_from(UserBook)
            .where(UserBook.user_id == user.id, UserBook.status == ReadingStatus.QUERO_LER)
        )
        or 0
    )
    lendo = (
        db.scalar(
            select(func.count())
            .select_from(UserBook)
            .where(UserBook.user_id == user.id, UserBook.status == ReadingStatus.LENDO)
        )
        or 0
    )
    lido = (
        db.scalar(
            select(func.count())
            .select_from(UserBook)
            .where(UserBook.user_id == user.id, UserBook.status == ReadingStatus.LIDO)
        )
        or 0
    )
    lidos_ano = (
        db.scalar(
            select(func.count())
            .select_from(UserBook)
            .where(
                UserBook.user_id == user.id,
                UserBook.status == ReadingStatus.LIDO,
                UserBook.finished_at.isnot(None),
                UserBook.finished_at >= start,
                UserBook.finished_at < end,
            )
        )
        or 0
    )
    return ShelfStatsOut(
        total_books=total,
        quero_ler=quero,
        lendo=lendo,
        lido=lido,
        lidos_no_ano=lidos_ano,
    )


@router.post("/books", response_model=UserBookOut)
def add_to_shelf(
    data: UserBookCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    if data.book_id is None and data.new_book is None:
        raise HTTPException(status_code=400, detail="Informe book_id ou new_book")
    if data.book_id is not None and data.new_book is not None:
        raise HTTPException(status_code=400, detail="Use apenas book_id ou new_book")

    book_id: int
    if data.new_book is not None:
        book = Book(**data.new_book.model_dump())
        db.add(book)
        db.flush()
        book_id = book.id
    else:
        book = db.get(Book, data.book_id)
        if book is None:
            raise HTTPException(status_code=404, detail="Livro não encontrado")
        book_id = book.id

    ub = UserBook(
        user_id=user.id,
        book_id=book_id,
        status=data.status,
        progress_page=data.progress_page,
        progress_chapter=data.progress_chapter,
        progress_percent=data.progress_percent,
        started_at=data.started_at,
        finished_at=data.finished_at,
        rating=data.rating,
        notes=data.notes,
    )
    db.add(ub)
    db.flush()

    if data.status == ReadingStatus.LIDO:
        db.add(
            Notification(
                user_id=user.id,
                type=NotificationType.READING,
                title="Leitura registrada",
                message=f'Você marcou "{book.title}" como lido.',
                metadata_json={"user_book_id": ub.id},
            )
        )

    db.commit()
    db.refresh(ub)
    ub = db.scalar(
        select(UserBook)
        .where(UserBook.id == ub.id)
        .options(joinedload(UserBook.book))
    )
    return ub


@router.patch("/books/{user_book_id}", response_model=UserBookOut)
def update_shelf_item(
    user_book_id: int,
    data: UserBookUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    ub = db.get(UserBook, user_book_id)
    if ub is None or ub.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    prev_status = ub.status
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ub, k, v)
    if data.status == ReadingStatus.LIDO and prev_status != ReadingStatus.LIDO:
        book = db.get(Book, ub.book_id)
        db.add(
            Notification(
                user_id=user.id,
                type=NotificationType.READING,
                title="Leitura concluída",
                message=f'Você concluiu "{book.title if book else "seu livro"}".',
                metadata_json={"user_book_id": ub.id, "book_id": ub.book_id},
            )
        )
    db.commit()
    ub = db.scalar(
        select(UserBook)
        .where(UserBook.id == ub.id)
        .options(joinedload(UserBook.book))
    )
    return ub


@router.delete("/books/{user_book_id}", status_code=204)
def remove_shelf_item(
    user_book_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    ub = db.get(UserBook, user_book_id)
    if ub is None or ub.user_id != user.id:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    db.delete(ub)
    db.commit()
    return None


@router.post("/favorites", status_code=201)
def add_favorite(
    data: FavoriteCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    book = db.get(Book, data.book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    exists = db.scalar(
        select(FavoriteBook).where(
            and_(FavoriteBook.user_id == user.id, FavoriteBook.book_id == data.book_id)
        )
    )
    if exists:
        return None
    db.add(FavoriteBook(user_id=user.id, book_id=data.book_id))
    db.commit()
    return None


@router.delete("/favorites/{book_id}", status_code=204)
def remove_favorite(
    book_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    fav = db.scalar(
        select(FavoriteBook).where(
            and_(FavoriteBook.user_id == user.id, FavoriteBook.book_id == book_id)
        )
    )
    if fav:
        db.delete(fav)
        db.commit()
    return None


@router.get("/favorites", response_model=list[int])
def list_favorite_ids(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    rows = db.scalars(select(FavoriteBook.book_id).where(FavoriteBook.user_id == user.id)).all()
    return list(rows)
