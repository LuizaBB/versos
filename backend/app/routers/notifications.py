from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Notification, User
from app.schemas import NotificationOut

router = APIRouter(prefix="/me", tags=["notifications"])


def _notif_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=n.id,
        type=n.type,
        title=n.title,
        message=n.message,
        read_at=n.read_at,
        metadata=n.metadata_json,
        created_at=n.created_at,
    )


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(200)
    ).all()
    return [_notif_out(x) for x in rows]


@router.patch("/notifications/{notif_id}/read", response_model=NotificationOut)
def mark_read(
    notif_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    from datetime import datetime, timezone

    n = db.get(Notification, notif_id)
    if n is None or n.user_id != user.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    n.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(n)
    return _notif_out(n)


@router.post("/notifications/read-all", status_code=204)
def mark_all_read(user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    from datetime import datetime, timezone

    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()
    return None
