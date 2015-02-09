/*global require:true */
(function () {
  'use strict';

  var gulp = require('gulp');
  var rename = require('gulp-rename');
  var uglify = require('gulp-uglify');
  var jshint = require('gulp-jshint');
  var concat = require('gulp-concat');
  var shell = require('gulp-shell');

  var DEST = 'build/';

  gulp.task('docs', function(){
    return gulp.src('di.iml', {read:false})
      .pipe(shell('node_modules/docco/bin/docco -o website/docs js/*.js js/extensions/*.js js/extensions/**/*.js'));
  });

  gulp.task('default', function () {
    return gulp.src(['js/ioc.core.js', 'js/**.js'])
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .pipe(concat('ioc.js'))
      .pipe(gulp.dest(DEST))
      .pipe(uglify())
      .pipe(rename({extname: '.min.js'}))
      .pipe(gulp.dest(DEST));
  });

  gulp.task('watch', function () {
    gulp.watch('js/**/*.js', ['default']);
  });
}());