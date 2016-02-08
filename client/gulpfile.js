var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	ngAnnotate = require('gulp-ng-annotate'),
	watch = require('gulp-watch'),
	webserver = require('gulp-webserver'),
	http = require('http'),
	livereload = require('gulp-livereload');

/*
 * Minify angular app
 */

gulp.task('min_js', function () {
  gulp.src(['controllers/*.js', 
  			'directives/*.js', 
  			'js/app.js', 
  			'js/filters.js', 
  			'js/services.js',
  			'js/country.services.js', 
  			'js/config.js'
  	])
    .pipe(concat('build/app.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('.'))
})

/*
 * Concat all libs
 */

gulp.task('concat_lib', function () {
  gulp.src(['lib/bower_components/jquery/dist/jquery.min.js',
			'lib/bower_components/jquery-ui/ui/minified/jquery-ui.min.js',
			'lib/bower_components/bootstrap/dist/js/bootstrap.min.js',
			'lib/bower_components/d3/d3.min.js',
			'lib/bower_components/crossfilter/crossfilter.min.js',
			'lib/angular/angular.min.js',
			'lib/angular/angular-route.js',
			'lib/angular/angular-animate.js',
			'lib/angular/angular-sanitize.js',
			'lib/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
			'lib/bower_components/angular-ui-select/dist/select.js',
			'lib/bower_components/ng-grid/build/ng-grid.js',
			'lib/bower_components/ng-grid/plugins/ng-grid-csv-export.js',
			'lib/bower_components/angular-loading-bar/build/loading-bar.js',
			'lib/bower_components/angular-translate/angular-translate.min.js',
			'lib/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
			'lib/bower_components/oclazyload/dist/ocLazyLoad.min.js',
			'lib/bower_components/angulartics/dist/angulartics.min.js',
			'lib/bower_components/angulartics-google-analytics/dist/angulartics-google-analytics.min.js'		
  	])
    .pipe(concat('build/lib.js'))
    .pipe(gulp.dest('.'))
})

/*
 * Run tasks build
 */

gulp.task('default', ['min_js', 'concat_lib'], function() {
});

/*
 *	DEV - Watch if files change and reload browser
 */

// gulp.task('webserver_dev', function() {
//   gulp.src('app')
//     .pipe(webserver({
//     	port: 4000,
//     	path: '/',
// 		livereload: true,
// 		open: true,
// 		fallback: 'index_prod.html'
//     }));
// });







