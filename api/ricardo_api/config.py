import os
import ast
DATABASE='RICardo_viz.sqlite'
DEBUG=ast.literal_eval(os.environ.get('DEBUG', 'False'))
SECRET_KEY=os.environ.get('SECRET_KEY', 'zaeZAEi23123ou')
CORS_HEADERS='Content-Type'
BLOG_RSS='http://ricardo.hypotheses.org/feed'
