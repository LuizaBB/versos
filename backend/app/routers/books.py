from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Book, User
from app.schemas import BookCreate, BookOut, BookUpdate

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[BookOut])
def list_books(q: str | None = None, db: Session = Depends(get_db)) -> list[Book]:
    stmt = select(Book).order_by(Book.title)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Book.title.ilike(like) | Book.author.ilike(like))
    return list(db.scalars(stmt.limit(100)).all())


@router.get("/{book_id}", response_model=BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)) -> Book:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    return book


@router.post("", response_model=BookOut)
def create_book(
    data: BookCreate,
    _: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Book:
    book = Book(**data.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.patch("/{book_id}", response_model=BookOut)
def update_book(
    book_id: int,
    data: BookUpdate,
    _: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> Book:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(book, k, v)
    db.commit()
    db.refresh(book)
    return book
