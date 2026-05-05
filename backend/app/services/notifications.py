from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    FavoriteBook,
    Group,
    GroupMember,
    Listing,
    ListingGroup,
    Notification,
    NotificationType,
    User,
)


def notify_favorite_listing_match(db: Session, listing: Listing, seller: User) -> None:
    """Cria notificações para usuários que favoritaram o livro e podem ver o anúncio."""
    group_ids = [lg.group_id for lg in listing.group_links]
    if not group_ids:
        return

    groups = db.scalars(select(Group).where(Group.id.in_(group_ids))).all()
    public_group_ids = {g.id for g in groups if g.is_public}

    fav_users = db.scalars(
        select(FavoriteBook.user_id).where(FavoriteBook.book_id == listing.book_id)
    ).all()
    recipient_ids: set[int] = set()
    for uid in fav_users:
        if uid == seller.id:
            continue
        member_group_ids = set(
            db.scalars(
                select(GroupMember.group_id).where(
                    GroupMember.user_id == uid, GroupMember.group_id.in_(group_ids)
                )
            ).all()
        )
        if member_group_ids or public_group_ids:
            recipient_ids.add(uid)

    for uid in recipient_ids:
        db.add(
            Notification(
                user_id=uid,
                type=NotificationType.FAVORITE_LISTING_MATCH,
                title="Livro dos favoritos à venda",
                message=f'{listing.title} foi anunciado por {seller.name}.',
                metadata_json={"listing_id": listing.id, "book_id": listing.book_id},
            )
        )


def group_engagement_stub_notifications(db: Session, user: User) -> list[tuple[int, str]]:
    """Retorna rótulos de alerta mock para grupos do usuário (MVP)."""
    memberships = db.scalars(select(GroupMember).where(GroupMember.user_id == user.id)).all()
    labels: list[tuple[int, str]] = []
    for i, m in enumerate(memberships):
        stub = ["Discussão aberta", "Hoje 19h", "Votação", "Novidades"][i % 4]
        labels.append((m.group_id, stub))
    return labels
