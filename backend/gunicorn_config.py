"""
Gunicorn configuration for AcuRate production deployment.

Usage:
    gunicorn backend.wsgi:application --config gunicorn_config.py
"""

import multiprocessing
import os

# Server socket
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:8000')
backlog = 2048

# Worker processes
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'sync')
worker_connections = 1000
timeout = int(os.environ.get('GUNICORN_TIMEOUT', 30))
keepalive = 5

# Restart workers after this many requests (prevent memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Preload app for better performance
preload_app = True

# Logging
accesslog = os.environ.get('GUNICORN_ACCESS_LOG', '-')  # '-' means stdout
errorlog = os.environ.get('GUNICORN_ERROR_LOG', '-')  # '-' means stderr
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'acurate'

# Server mechanics
daemon = False
pidfile = os.environ.get('GUNICORN_PIDFILE', None)
umask = 0
user = os.environ.get('GUNICORN_USER', None)
group = os.environ.get('GUNICORN_GROUP', None)
tmp_upload_dir = None

# SSL (if using SSL directly, otherwise use reverse proxy)
keyfile = os.environ.get('GUNICORN_KEYFILE', None)
certfile = os.environ.get('GUNICORN_CERTFILE', None)

def when_ready(server):
    """Called just after the server is started."""
    server.log.info("AcuRate server is ready. Spawning workers")

def worker_int(worker):
    """Called when a worker receives INT or QUIT signal."""
    worker.log.info("worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    pass

def worker_abort(worker):
    """Called when a worker times out."""
    worker.log.info("worker aborted")
