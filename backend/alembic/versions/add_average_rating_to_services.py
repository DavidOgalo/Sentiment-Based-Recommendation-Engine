"""add average rating to services

Revision ID: add_average_rating_to_services
Revises: 
Create Date: 2024-04-11 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_average_rating_to_services'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('services', sa.Column('average_rating', sa.Float(), nullable=True, server_default='0.0'))


def downgrade():
    op.drop_column('services', 'average_rating') 