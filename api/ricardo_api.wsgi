activate_this = '/home/pom/.virtualenvs/RICARDOAPI/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))

import sys
sys.path.insert(0, '/home/pom/ricardo/api')
from api import app as application

import sys
sys.stdout = sys.stderr
