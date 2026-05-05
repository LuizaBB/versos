"""Popula o banco com dados de demonstração. Execute: python -m scripts.seed (a partir de backend/)."""

from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import (
    Book,
    Group,
    GroupMember,
    GroupRole,
    PlanType,
    ReadingStatus,
    User,
    UserBook,
)
from app.security import hash_password


def main() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.email == "demo@versos.com")):
            print("Seed já aplicado (demo@versos.com existe).")
            return

        u1 = User(
            name="Demo Leitor",
            email="demo@versos.com",
            password_hash=hash_password("demo123"),
            plan_type=PlanType.FREE,
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
        )
        u2 = User(
            name="Maria Vendedora",
            email="maria@versos.com",
            password_hash=hash_password("demo123"),
            plan_type=PlanType.FREE,
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
        )
        db.add_all([u1, u2])
        db.flush()

        books_data = [
            ("Dom Casmurro", "Machado de Assis", "https://picsum.photos/seed/domc/200/300"),
            ("O Pequeno Príncipe", "Antoine de Saint-Exupéry", "https://picsum.photos/seed/pequeno/200/300"),
            ("1984", "George Orwell", "https://picsum.photos/seed/1984/200/300"),
            ("Sapiens", "Yuval Noah Harari", "https://picsum.photos/seed/sapiens/200/300"),
            ("O Hobbit", "J.R.R. Tolkien", "https://picsum.photos/seed/hobbit/200/300"),
        ]
        books = [
            Book(title=t, author=a, cover_url=c, published_year=2000 + i) for i, (t, a, c) in enumerate(books_data)
        ]
        db.add_all(books)
        db.flush()

        g1 = Group(
            name="Clube Dom Casmurro",
            description="Discussões mensais sobre Machado.",
            cover_url="https://picsum.photos/seed/g1/200/200",
            is_public=True,
            created_by_user_id=u1.id,
        )
        g2 = Group(
            name="Fantasia & Sci-Fi",
            description="Ficção especulativa em geral.",
            cover_url="https://picsum.photos/seed/g2/200/200",
            is_public=True,
            created_by_user_id=u2.id,
        )
        g3 = Group(
            name="Leituras Rápidas",
            description="Metas curtas e check-ins semanais.",
            cover_url="https://picsum.photos/seed/g3/200/200",
            is_public=True,
            created_by_user_id=u1.id,
        )
        db.add_all([g1, g2, g3])
        db.flush()

        db.add_all(
            [
                GroupMember(group_id=g1.id, user_id=u1.id, role=GroupRole.OWNER),
                GroupMember(group_id=g2.id, user_id=u1.id, role=GroupRole.MEMBER),
                GroupMember(group_id=g3.id, user_id=u1.id, role=GroupRole.MEMBER),
                GroupMember(group_id=g2.id, user_id=u2.id, role=GroupRole.OWNER),
                GroupMember(group_id=g1.id, user_id=u2.id, role=GroupRole.MEMBER),
            ]
        )

        now = datetime.now(timezone.utc)
        db.add_all(
            [
                UserBook(
                    user_id=u1.id,
                    book_id=books[0].id,
                    status=ReadingStatus.LENDO,
                    progress_page=120,
                    progress_percent=35,
                    started_at=now,
                    notes="Capítulo marcante na capitu.",
                ),
                UserBook(
                    user_id=u1.id,
                    book_id=books[2].id,
                    status=ReadingStatus.QUERO_LER,
                    notes="Clássico distópico.",
                ),
                UserBook(
                    user_id=u1.id,
                    book_id=books[3].id,
                    status=ReadingStatus.LIDO,
                    progress_percent=100.0,
                    started_at=now,
                    finished_at=now,
                    rating=5,
                    notes="Releitura excelente.",
                ),
            ]
        )

        db.commit()
        print("Seed OK. Usuários: demo@versos.com / demo123, maria@versos.com / demo123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
