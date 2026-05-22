# Etapa 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Etapa 2: Runtime
FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY ./app ./app
COPY ./migrations ./migrations
COPY ./alembic.ini .

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]