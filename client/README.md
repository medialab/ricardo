##Installation
If you want to run your instance of RICardo locally on your machine, be sure you have the following requirements installed.

###Requirements

- [Git](http://git-scm.com/book/en/Getting-Started-Installing-Git)
- [Bower](http://bower.io/#installing-bower)


Clone RICardo from the command line:

``` sh
$ git clone https://github.com/medialab/ricardo.git
```

browse to RICardo root folder:

``` sh
$ cd ricardo
```

browse to RICardo client root folder:

``` sh
$ cd ricardo/client
```

install client-side dependencies:

``` sh
$ bower install
```

edit configuration file

```sh
$ cd js
$ cp config.sample.js config.js
$ vi config.js
# edit config.js and add the correct root to API
'use strict';

angular.module('ricardo')
  .constant('BASE_API_URL', 'http://localhost:5000')
```

You can now run RICardo from your local web server. For example, you can run Python's built-in server:

``` sh
$ python -m SimpleHTTPServer 4000
```

or for Python 3+

``` sh
$ python -m http.server 4000
```

Once this is running, go to [http://localhost:4000/](http://localhost:4000/)
