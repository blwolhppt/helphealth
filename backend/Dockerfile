FROM python:3.10

RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

RUN pip install --no-cache-dir gunicorn

COPY . .

RUN python manage.py collectstatic --noinput || true

COPY docker-cmd.sh /docker-cmd.sh
RUN chmod +x /docker-cmd.sh

EXPOSE 8000

ENTRYPOINT ["/docker-cmd.sh"]