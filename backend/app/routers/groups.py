from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session

from app.constants import FREE_PLAN_MAX_GROUPS
from app.database import get_db
from app.deps import get_current_user
from app.models import Book, Group, GroupMember, GroupRole, Listing, ListingGroup, PlanType, User
from app.schemas import FreemiumInfo, GroupCreate, GroupDetailOut, GroupOut, MyGroupOut
from app.services.notifications import group_engagement_stub_notifications

router = APIRouter(prefix="/groups", tags=["groups"])


def _member_count(db: Session, group_id: int) -> int:
    return db.scalar(select(func.count()).select_from(GroupMember).where(GroupMember.group_id == group_id)) or 0


@router.get("", response_model=list[GroupOut])
def search_groups(
    _: Annotated[User, Depends(get_current_user)],
    q: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Group).order_by(Group.name)
    if q:
        like = f"%{q}%"
        listing_in_group = (
            exists()
            .select_from(ListingGroup)
            .join(Listing, Listing.id == ListingGroup.listing_id)
            .join(Book, Book.id == Listing.book_id)
            .where(
                ListingGroup.group_id == Group.id,
                or_(
                    Listing.title.ilike(like),
                    Book.title.ilike(like),
                    Book.author.ilike(like),
                ),
            )
        )
        stmt = stmt.where(
            or_(
                Group.name.ilike(like),
                Group.description.ilike(like),
                listing_in_group,
            )
        )
    return list(db.scalars(stmt.limit(80)).all())


@router.get("/{group_id}", response_model=GroupDetailOut)
def get_group(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    g = db.get(Group, group_id)
    if g is None:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    role = db.scalar(
        select(GroupMember.role).where(GroupMember.group_id == group_id, GroupMember.user_id == user.id)
    )
    return GroupDetailOut(
        id=g.id,
        name=g.name,
        description=g.description,
        cover_url=g.cover_url,
        is_public=g.is_public,
        created_by_user_id=g.created_by_user_id,
        member_count=_member_count(db, g.id),
        my_role=role,
    )


@router.post("", response_model=GroupOut)
def create_group(
    data: GroupCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    g = Group(
        name=data.name,
        description=data.description,
        cover_url=data.cover_url,
        is_public=data.is_public,
        created_by_user_id=user.id,
    )
    db.add(g)
    db.flush()
    db.add(GroupMember(group_id=g.id, user_id=user.id, role=GroupRole.OWNER))
    db.commit()
    db.refresh(g)
    return g


@router.post("/{group_id}/join", response_model=GroupOut)
def join_group(
    group_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    g = db.get(Group, group_id)
    if g is None:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    exists = db.scalar(
        select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user.id)
    )
    if exists:
        return g

    if user.plan_type == PlanType.FREE:
        count = (
            db.scalar(select(func.count()).select_from(GroupMember).where(GroupMember.user_id == user.id)) or 0
        )
        if count >= FREE_PLAN_MAX_GROUPS:
            raise HTTPException(
                status_code=403,
                detail=f"Limite do plano grátis: {FREE_PLAN_MAX_GROUPS} grupos.",
            )

    db.add(GroupMember(group_id=group_id, user_id=user.id, role=GroupRole.MEMBER))
    db.commit()
    db.refresh(g)
    return g


@router.post("/{group_id}/leave", status_code=204)
def leave_group(
    group_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    m = db.scalar(
        select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user.id)
    )
    if m is None:
        raise HTTPException(status_code=404, detail="Você não está neste grupo")
    if m.role == GroupRole.OWNER:
        raise HTTPException(status_code=400, detail="Transfira a posse antes de sair (MVP: não suportado)")
    db.delete(m)
    db.commit()
    return None


me_groups_router = APIRouter(prefix="/me", tags=["me-groups"])


@me_groups_router.get("/groups", response_model=list[MyGroupOut])
def my_groups(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    stubs = dict(group_engagement_stub_notifications(db, user))
    rows = db.execute(
        select(GroupMember, Group)
        .join(Group, Group.id == GroupMember.group_id)
        .where(GroupMember.user_id == user.id)
        .order_by(Group.name)
    ).all()
    out: list[MyGroupOut] = []
    for m, g in rows:
        out.append(
            MyGroupOut(
                group=GroupOut.model_validate(g),
                role=m.role,
                alert_label=stubs.get(g.id),
            )
        )
    return out


@me_groups_router.get("/freemium", response_model=FreemiumInfo)
def freemium(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    used = db.scalar(select(func.count()).select_from(GroupMember).where(GroupMember.user_id == user.id)) or 0
    max_g = FREE_PLAN_MAX_GROUPS if user.plan_type == PlanType.FREE else 999
    return FreemiumInfo(
        max_groups_free=FREE_PLAN_MAX_GROUPS,
        groups_used=used,
        can_join_more=user.plan_type != PlanType.FREE or used < FREE_PLAN_MAX_GROUPS,
    )
