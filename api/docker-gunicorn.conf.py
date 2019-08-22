import os
import gunicorn
gunicorn.SERVER_SOFTWARE = 'gunicorn'

bind = "0.0.0.0:8000"
workers=2
threads=4
worker_class='gthread'
worker_tmp_dir='/dev/shm'
accesslog='-'
errorlog='-'

for k,v in os.environ.items():
    if k.startswith("GUNICORN_"):
        key = k.split('_', 1)[1].lower()
        locals()[key] = v
