"""Popula o banco com dados de demonstração. Execute: python -m scripts.seed (a partir de backend/)."""

from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import (
    Book,
    Group,
    GroupMember,
    GroupRole,
    GroupType,
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
            password_hash=hash_password("demo1234"),
            plan_type=PlanType.FREE,
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
        )
        u2 = User(
            name="Maria Vendedora",
            email="maria@versos.com",
            password_hash=hash_password("demo1234"),
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
            Book(title=t, author=a, cover_url=c, published_year=2000 + i)
            for i, (t, a, c) in enumerate(books_data)
        ]
        db.add_all(books)
        db.flush()

        # ── Grupos de discussão ──────────────────────────────────────────────
        g_classicos = Group(
            name="Clássicos Literários Brasileiros",
            description="Debates sobre Machado de Assis, Clarice Lispector, Guimarães Rosa e outros pilares da literatura brasileira.",
            cover_url="https://picsum.photos/seed/classicos/200/200",
            is_public=True,
            group_type=GroupType.DISCUSSION,
            created_by_user_id=u1.id,
        )
        g_hp = Group(
            name="HP & Lovecraft — Mundos do Impossível",
            description="De Hogwarts aos horrores cósmicos de Arkham. Discussões sobre Harry Potter, H.P. Lovecraft e universos de fantasia e horror.",
            cover_url="https://picsum.photos/seed/hplovecraft/200/200",
            is_public=True,
            group_type=GroupType.DISCUSSION,
            created_by_user_id=u2.id,
        )

        # ── Grupos de compra/venda ───────────────────────────────────────────
        g_tecnicos = Group(
            name="Livros Técnicos de Exatas",
            description="Compra e venda de livros acadêmicos e técnicos de matemática, física, computação, engenharia e áreas afins.",
            cover_url="https://picsum.photos/seed/tecnicos/200/200",
            is_public=True,
            group_type=GroupType.MARKETPLACE,
            created_by_user_id=u1.id,
        )
        g_quadrinhos = Group(
            name="Quadrinhos & HQs",
            description="Marketplace para quadrinhos, mangás, graphic novels e HQs nacionais e importadas.",
            cover_url="https://picsum.photos/seed/quadrinhos/200/200",
            is_public=True,
            group_type=GroupType.MARKETPLACE,
            created_by_user_id=u2.id,
        )

        db.add_all([g_classicos, g_hp, g_tecnicos, g_quadrinhos])
        db.flush()

        db.add_all([
            # Clássicos Brasileiros
            GroupMember(group_id=g_classicos.id, user_id=u1.id, role=GroupRole.OWNER),
            GroupMember(group_id=g_classicos.id, user_id=u2.id, role=GroupRole.MEMBER),
            # HP & Lovecraft
            GroupMember(group_id=g_hp.id, user_id=u2.id, role=GroupRole.OWNER),
            GroupMember(group_id=g_hp.id, user_id=u1.id, role=GroupRole.MEMBER),
            # Livros Técnicos
            GroupMember(group_id=g_tecnicos.id, user_id=u1.id, role=GroupRole.OWNER),
            GroupMember(group_id=g_tecnicos.id, user_id=u2.id, role=GroupRole.MEMBER),
            # Quadrinhos
            GroupMember(group_id=g_quadrinhos.id, user_id=u2.id, role=GroupRole.OWNER),
            GroupMember(group_id=g_quadrinhos.id, user_id=u1.id, role=GroupRole.MEMBER),
        ])

        now = datetime.now(timezone.utc)
        db.add_all([
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
        ])

        db.commit()
        print("Seed OK. Usuários: demo@versos.com / demo1234, maria@versos.com / demo1234")
        print("Grupos criados:")
        print("  [DISCUSSÃO] Clássicos Literários Brasileiros")
        print("  [DISCUSSÃO] HP & Lovecraft — Mundos do Impossível")
        print("  [MARKETPLACE] Livros Técnicos de Exatas")
        print("  [MARKETPLACE] Quadrinhos & HQs")
    finally:
        db.close()


if __name__ == "__main__":
    main()
