var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	ngAnnotate = require('gulp-ng-annotate'),
	gitshasuffix = require("gulp-gitshasuffix"),
	revReplace = require('gulp-rev-replace'),
	useref = require('gulp-useref'),
	csso = require('gulp-csso'),
	gulpif = require('gulp-if'),
	del = require('del'),
    replace = require('gulp-replace');

gulp.task('env', function() {
  return gulp.src('js/config.js')
    .pipe(replace('http://localhost:5000', process.env.API_URL || 'http://localhost:5000'))
    .pipe(gulp.dest(function(file) {
      return file.base;
     }))
})

gulp.task("index", function() {
  return gulp.src("index.html")
  	.pipe(useref())
    .pipe(gulpif('**/app.js', ngAnnotate()))
    .pipe(gulpif('**/app.js', uglify()))
	.pipe(gulpif('./css/style.css', csso()))
    .pipe(gulpif('**/app.js',gitshasuffix()))                // Rename the concatenated files
    .pipe(gulpif('**/lib.js',gitshasuffix()))
    .pipe(gulpif('./css/style.css',gitshasuffix()))
    .pipe(revReplace())         // Substitute in new filenames
    .pipe(gulp.dest('build'));
});

gulp.task('fonts', function() {
  return gulp.src('css/fonts/**/*')
  .pipe(gulp.dest('build/css/fonts'))
})

gulp.task('img', function() {
  return gulp.src('img/*')
  .pipe(gulp.dest('build/img'))
})

gulp.task('svg', function() {
  return gulp.src('svg/*')
  .pipe(gulp.dest('build/svg'))
})
gulp.task('data', function() {
  return gulp.src('data/*.csv')
  .pipe(gulp.dest('build/data'))
})

gulp.task('locales', function() {
  return gulp.src('js/locale*.json')
  .pipe(gulp.dest('build/js/'))
})

gulp.task('templates', function() {
  return gulp.src('partials/**/*.html')
  .pipe(gulp.dest('build/partials/'))
})

gulp.task('papers', function() {
  return gulp.src('papers/*.pdf')
  .pipe(gulp.dest('build/'))
})

gulp.task('clean:build', function() {
  return del.sync('build');
})


/*
 * Run tasks build
 */

gulp.task('default', ['clean:build', 'env', 'index','fonts','locales','img','svg','data','templates', 'papers'], function() {
});
