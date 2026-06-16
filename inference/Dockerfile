FROM python:3.11-slim

WORKDIR /app

# HF Spaces runs containers as uid 1000
RUN adduser --disabled-password --gecos "" --uid 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user:user . .

EXPOSE 7860
ENV PORT=7860

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
