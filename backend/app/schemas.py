from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import (
    BookCondition,
    GroupRole,
    GroupType,       # ← adicionar
    ListingStatus,
    MessageKind,     # ← adicionar
    NotificationType,
    PlanType,
    PurchaseStatus,
    ReadingStatus,
)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None
    plan_type: PlanType

    model_config = {"from_attributes": True}


class BookCreate(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None

    model_config = {"from_attributes": True}


class UserBookCreate(BaseModel):
    book_id: Optional[int] = None
    new_book: Optional[BookCreate] = None
    status: ReadingStatus
    progress_page: Optional[int] = None
    progress_chapter: Optional[int] = None
    progress_percent: Optional[float] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None


class UserBookUpdate(BaseModel):
    status: Optional[ReadingStatus] = None
    progress_page: Optional[int] = None
    progress_chapter: Optional[int] = None
    progress_percent: Optional[float] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None


class UserBookOut(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: ReadingStatus
    progress_page: Optional[int] = None
    progress_chapter: Optional[int] = None
    progress_percent: Optional[float] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    book: BookOut

    model_config = {"from_attributes": True}


class ShelfStatsOut(BaseModel):
    total_books: int
    quero_ler: int
    lendo: int
    lido: int
    lidos_no_ano: int


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    is_public: bool = True
    #
    group_type: GroupType = GroupType.DISCUSSION 
    #


class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    is_public: bool
    created_by_user_id: int
    #
    group_type: GroupType = GroupType.DISCUSSION 
    #
    model_config = {"from_attributes": True}


class GroupDetailOut(GroupOut):
    member_count: int = 0
    my_role: Optional[GroupRole] = None


class MyGroupOut(BaseModel):
    group: GroupOut
    role: GroupRole
    alert_label: Optional[str] = None


class ListingCreate(BaseModel):
    book_id: int
    user_book_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    price: float = Field(gt=0)
    condition: BookCondition
    group_ids: list[int] = Field(min_length=1)


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    condition: Optional[BookCondition] = None
    status: Optional[ListingStatus] = None


class ListingOut(BaseModel):
    id: int
    seller_id: int
    book_id: int
    user_book_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    price: float
    condition: BookCondition
    status: ListingStatus
    book: BookOut
    group_ids: list[int] = []

    model_config = {"from_attributes": True}


class PurchaseCreate(BaseModel):
    listing_id: int


class PurchaseStatusUpdate(BaseModel):
    status: PurchaseStatus
    delivery_status: Optional[str] = None
    estimated_delivery_at: Optional[datetime] = None


class PurchaseOut(BaseModel):
    id: int
    listing_id: int
    buyer_id: int
    seller_id: int
    amount: float
    status: PurchaseStatus
    delivery_status: Optional[str] = None
    estimated_delivery_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    listing: ListingOut

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    title: str
    message: str
    read_at: Optional[datetime] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FavoriteCreate(BaseModel):
    book_id: int


class FreemiumInfo(BaseModel):
    max_groups_free: int
    groups_used: int
    can_join_more: bool

#
class GroupMessageCreate(BaseModel):
    body: Optional[str] = None
    listing_id: Optional[int] = None
    reply_to_id: Optional[int] = None

class GroupMessageSenderOut(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None
    model_config = {"from_attributes": True}

class GroupMessageReplyOut(BaseModel):
    id: int
    body: Optional[str] = None
    sender: GroupMessageSenderOut
    model_config = {"from_attributes": True}

class GroupMessageOut(BaseModel):
    id: int
    group_id: int
    sender_id: int
    kind: str
    body: Optional[str] = None
    listing_id: Optional[int] = None
    reply_to_id: Optional[int] = None
    created_at: datetime
    sender: GroupMessageSenderOut
    listing: Optional["ListingOut"] = None
    reply_to: Optional[GroupMessageReplyOut] = None
    model_config = {"from_attributes": True}
    #

#
class DirectMessageCreate(BaseModel):
    body: str


class DirectMessageSenderOut(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None
    model_config = {"from_attributes": True}


class DirectMessageOut(BaseModel):
    id: int
    purchase_id: int
    sender_id: int
    body: str
    created_at: datetime
    sender: DirectMessageSenderOut
    model_config = {"from_attributes": True}
#
