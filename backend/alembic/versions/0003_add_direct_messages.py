"""add direct_messages

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-30
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "direct_messages",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("purchase_id", sa.Integer, sa.ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("sender_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_direct_messages_purchase_created", "direct_messages", ["purchase_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_direct_messages_purchase_created", table_name="direct_messages")
    op.drop_table("direct_messages")
