/*global require:true */
(function () {
  'use strict';
  var gulp = require('gulp');
  var rename = require('gulp-rename');
  var uglify = require('gulp-uglify');
  var jshint = require('gulp-jshint');
  var concat = require('gulp-concat');
  var shell = require('gulp-shell');

  var build = 'build/';

  gulp.task('docs', function () {
    return gulp.src('js/core.js', {read: false})
      .pipe(shell('node_modules/docco/bin/docco -o docs js/*.js'));
  });

  gulp.task('js', function () {
    return gulp.src(['js/core.js', 'js/**.js'])
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .pipe(concat('arenite.js'))
      .pipe(gulp.dest(build))
      .pipe(uglify({preserveComments: 'some'}))
      .pipe(rename({extname: '.min.js'}))
      .pipe(gulp.dest(build));
  });

  gulp.task('default', ['js', 'docs']);

  gulp.task('watch', function () {
    gulp.watch('js/**/*.js', ['js', 'docs']);
  });
}());
