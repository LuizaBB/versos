"""add group_type and group_messages

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "7969c3de0add"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Novo enum group_type
    op.execute("CREATE TYPE grouptype AS ENUM ('DISCUSSION', 'MARKETPLACE')")

    # 2. Coluna group_type na tabela groups (default DISCUSSION para não quebrar dados existentes)
    op.add_column(
        "groups",
        sa.Column(
            "group_type",
            sa.Enum("DISCUSSION", "MARKETPLACE", name="grouptype"),
            nullable=False,
            server_default="DISCUSSION",
        ),
    )

    # 3. Tabela group_messages
    op.create_table(
        "group_messages",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("group_id", sa.Integer, sa.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("sender_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column(
            "kind",
            sa.Enum("TEXT", "LISTING_REF", name="messagekind"),
            nullable=False,
            server_default="TEXT",
        ),
        sa.Column("body", sa.Text, nullable=True),          # texto livre
        sa.Column("listing_id", sa.Integer, sa.ForeignKey("listings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reply_to_id", sa.Integer, sa.ForeignKey("group_messages.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_group_messages_group_created", "group_messages", ["group_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_group_messages_group_created", table_name="group_messages")
    op.drop_table("group_messages")
    op.drop_column("groups", "group_type")
    op.execute("DROP TYPE IF EXISTS grouptype")
    op.execute("DROP TYPE IF EXISTS messagekind")
