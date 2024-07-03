FROM python:3-slim AS builder
ADD . /app
WORKDIR /app

RUN apt-get update
RUN apt-get install -y git curl

# We are installing a dependency here directly into our app source dir
RUN pip install --target=/app -r requirements.txt

FROM gcr.io/distroless/python3-debian10
COPY --from=builder /app /app
WORKDIR /app
ENV PYTHONPATH /app
CMD ["/app/main.py"]
