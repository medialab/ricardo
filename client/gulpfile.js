var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	ngAnnotate = require('gulp-ng-annotate'),
	gitshasuffix = require("gulp-gitshasuffix"),
	revReplace = require('gulp-rev-replace'),
	useref = require('gulp-useref'),
	csso = require('gulp-csso'),
	gulpif = require('gulp-if'),
	del = require('del');

gulp.task("index", function() {
  return gulp.src("index.html")
  	.pipe(useref())
    .pipe(gulpif('**/app.js', ngAnnotate()))
    .pipe(gulpif('**/app.js', uglify()))
	.pipe(gulpif('**/style.css', csso()))
    .pipe(gulpif('**/app.js',gitshasuffix()))                // Rename the concatenated files 
    .pipe(gulpif('**/lib.js',gitshasuffix()))
    .pipe(gulpif('**/style.css',gitshasuffix()))
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

gulp.task('locales', function() {
  return gulp.src('js/locale*.json')
  .pipe(gulp.dest('build/js/'))
})

gulp.task('templates', function() {
  return gulp.src('partials/**/*.html')
  .pipe(gulp.dest('build/partials/'))
})

gulp.task('clean:build', function() {
  return del.sync('build');
})


/*
 * Run tasks build
 */

gulp.task('default', ['clean:build','index','fonts','locales','img','templates'], function() {
});
