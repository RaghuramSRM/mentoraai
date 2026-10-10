"""Add activities, projects, user projects and stored research."""
from alembic import op
import sqlalchemy as sa

revision = "20261007_03"
down_revision = "20261007_02"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("activities", sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id"),nullable=False),sa.Column("kind",sa.String(50),nullable=False),sa.Column("detail",sa.String(255),nullable=False),sa.Column("created_at",sa.DateTime(),nullable=False))
    op.create_index("ix_activities_user_id","activities",["user_id"]); op.create_index("ix_activities_created_at","activities",["created_at"])
    op.create_table("projects",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("title",sa.String(180),nullable=False,unique=True),sa.Column("description",sa.Text(),nullable=False),sa.Column("difficulty",sa.String(30),nullable=False),sa.Column("skills",sa.JSON(),nullable=False),sa.Column("technologies",sa.JSON(),nullable=False),sa.Column("career_goals",sa.JSON(),nullable=False))
    op.create_table("user_projects",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.Integer(),sa.ForeignKey("users.id"),nullable=False),sa.Column("project_id",sa.Integer(),sa.ForeignKey("projects.id"),nullable=False),sa.Column("status",sa.String(30),nullable=False),sa.Column("progress",sa.Float(),nullable=False))
    op.create_index("ix_user_projects_user_id","user_projects",["user_id"]); op.create_index("ix_user_projects_project_id","user_projects",["project_id"])
    op.create_table("research_updates",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("title",sa.String(220),nullable=False),sa.Column("topic",sa.String(120),nullable=False),sa.Column("summary",sa.Text(),nullable=False),sa.Column("source",sa.String(255),nullable=False),sa.Column("source_url",sa.String(500),nullable=False),sa.Column("published_at",sa.DateTime(),nullable=False))

def downgrade():
    op.drop_table("research_updates"); op.drop_index("ix_user_projects_project_id",table_name="user_projects"); op.drop_index("ix_user_projects_user_id",table_name="user_projects"); op.drop_table("user_projects"); op.drop_table("projects"); op.drop_index("ix_activities_created_at",table_name="activities"); op.drop_index("ix_activities_user_id",table_name="activities"); op.drop_table("activities")
