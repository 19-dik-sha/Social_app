FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["gunicorn", "My_app.wsgi:application", "--bind", "0.0.0.0:8001"]