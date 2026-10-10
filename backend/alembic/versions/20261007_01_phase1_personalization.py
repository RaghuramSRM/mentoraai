"""Phase 1 assessment and roadmap personalization fields."""
from alembic import op
import sqlalchemy as sa

revision = "20261007_01"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    if "users" not in sa.inspect(bind).get_table_names():
        from app.database import Base
        from app import models  # noqa: F401
        Base.metadata.create_all(bind)
        return
    with op.batch_alter_table("profiles") as batch:
        batch.add_column(sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.execute("UPDATE profiles SET onboarding_completed = 1")
    with op.batch_alter_table("roadmaps") as batch:
        batch.add_column(sa.Column("overall_progress", sa.Float(), nullable=False, server_default="0"))
    with op.batch_alter_table("assessments") as batch:
        batch.add_column(sa.Column("average_topics", sa.JSON(), nullable=False, server_default="[]"))
        batch.add_column(sa.Column("strong_topics", sa.JSON(), nullable=False, server_default="[]"))
        batch.add_column(sa.Column("topic_scores", sa.JSON(), nullable=False, server_default="{}"))
        batch.add_column(sa.Column("question_ids", sa.JSON(), nullable=False, server_default="[]"))

def downgrade():
    with op.batch_alter_table("assessments") as batch:
        batch.drop_column("question_ids"); batch.drop_column("topic_scores"); batch.drop_column("strong_topics"); batch.drop_column("average_topics")
    with op.batch_alter_table("roadmaps") as batch: batch.drop_column("overall_progress")
    with op.batch_alter_table("profiles") as batch: batch.drop_column("onboarding_completed")
