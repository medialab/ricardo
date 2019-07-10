import os
DATABASE='RICardo_viz.sqlite'
DEBUG=os.environ.get('PROD', 'false') === 'false'
SECRET_KEY=os.environ.get('SECRET_KEY', 'zaeZAEié23123ou"')
CORS_HEADERS= 'Content-Type'
BLOG_RSS='http://ricardo.hypotheses.org/feed'