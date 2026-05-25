"""Router de mensagens de grupo (chat + histórico de anúncios)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import Group, GroupMember, GroupMessage, GroupType, Listing, MessageKind, User
from app.schemas import GroupMessageCreate, GroupMessageOut

router = APIRouter(prefix="/groups", tags=["group-messages"])


def _assert_member(db: Session, group_id: int, user_id: int) -> GroupMember:
    m = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        )
    )
    if m is None:
        raise HTTPException(status_code=403, detail="Você não é membro deste grupo.")
    return m


def _load_message(db: Session, msg_id: int) -> GroupMessage:
    msg = db.scalar(
        select(GroupMessage)
        .where(GroupMessage.id == msg_id)
        .options(
            selectinload(GroupMessage.sender),
            selectinload(GroupMessage.listing),
            selectinload(GroupMessage.reply_to).selectinload(GroupMessage.sender),
        )
    )
    if msg is None:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")
    return msg


# ── GET /groups/{group_id}/messages ──────────────────────────────────────────
@router.get("/{group_id}/messages", response_model=list[GroupMessageOut])
def list_messages(
    group_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    before_id: int | None = Query(default=None, description="Paginação: retorna mensagens anteriores a este ID"),
    limit: int = Query(default=40, le=100),
):
    """Retorna as últimas mensagens do grupo (polling). Suporta paginação por cursor."""
    _assert_member(db, group_id, user.id)

    stmt = (
        select(GroupMessage)
        .where(GroupMessage.group_id == group_id)
        .options(
            selectinload(GroupMessage.sender),
            selectinload(GroupMessage.listing),
            selectinload(GroupMessage.reply_to).selectinload(GroupMessage.sender),
        )
        .order_by(GroupMessage.created_at.desc())
        .limit(limit)
    )
    if before_id:
        ref = db.get(GroupMessage, before_id)
        if ref:
            stmt = stmt.where(GroupMessage.created_at < ref.created_at)

    msgs = list(db.scalars(stmt).all())
    msgs.reverse()  # ordem cronológica para o frontend
    return msgs


# ── POST /groups/{group_id}/messages ─────────────────────────────────────────
@router.post("/{group_id}/messages", response_model=GroupMessageOut)
def send_message(
    group_id: int,
    data: GroupMessageCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Envia mensagem de texto ou referência de anúncio."""
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Grupo não encontrado.")
    _assert_member(db, group_id, user.id)

    # Valida payload
    if data.listing_id:
        # Apenas grupos MARKETPLACE aceitam LISTING_REF
        if group.group_type != GroupType.MARKETPLACE:
            raise HTTPException(status_code=400, detail="Este grupo não aceita anúncios.")
        listing = db.get(Listing, data.listing_id)
        if listing is None:
            raise HTTPException(status_code=404, detail="Anúncio não encontrado.")
        kind = MessageKind.LISTING_REF
    else:
        if not data.body or not data.body.strip():
            raise HTTPException(status_code=422, detail="Mensagem de texto não pode ser vazia.")
        kind = MessageKind.TEXT

    msg = GroupMessage(
        group_id=group_id,
        sender_id=user.id,
        kind=kind,
        body=data.body.strip() if data.body else None,
        listing_id=data.listing_id,
        reply_to_id=data.reply_to_id,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _load_message(db, msg.id)


# ── GET /groups/{group_id}/history ────────────────────────────────────────────
@router.get("/{group_id}/history", response_model=list[GroupMessageOut])
def listing_history(
    group_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Histórico de anúncios (LISTING_REF) de um grupo MARKETPLACE, ordem cronológica."""
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Grupo não encontrado.")
    if group.group_type != GroupType.MARKETPLACE:
        raise HTTPException(status_code=400, detail="Histórico disponível apenas para grupos de venda.")
    _assert_member(db, group_id, user.id)

    msgs = list(
        db.scalars(
            select(GroupMessage)
            .where(
                GroupMessage.group_id == group_id,
                GroupMessage.kind == MessageKind.LISTING_REF,
            )
            .options(
                selectinload(GroupMessage.sender),
                selectinload(GroupMessage.listing),
                selectinload(GroupMessage.reply_to).selectinload(GroupMessage.sender),
            )
            .order_by(GroupMessage.created_at.asc())
        ).all()
    )
    return msgs
