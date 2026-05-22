import logging
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings
from app.db.base_class import Base
from app.models import *

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
target_metadata = Base.metadata


def get_url():
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            # Renderizar tipos específicos según motor
            render_item=lambda type_, obj, autogen_context: 
                _render_item(type_, obj, autogen_context)
        )

        with context.begin_transaction():
            context.run_migrations()


def _render_item(type_, obj, autogen_context):
    """Personalizar renderizado según motor"""
    if settings.IS_POSTGRESQL:
        # Usar tipos nativos de PostgreSQL
        if hasattr(obj, 'type') and hasattr(obj.type, 'as_uuid'):
            return "sa.dialects.postgresql.UUID(as_uuid=True)"
    return False


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()