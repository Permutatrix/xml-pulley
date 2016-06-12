var gulp = require('gulp');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
  return gulp.src('src/**/*.js')
  .pipe(babel({presets: ['es2015-loose']}))
  .pipe(gulp.dest('lib'));
});

gulp.task('with-sourcemap', function() {
  return gulp.src('src/**/*.js')
  .pipe(sourcemaps.init())
    .pipe(babel({presets: ['es2015-loose']}))
  .pipe(sourcemaps.write({ sourceRoot: '../src' }))
  .pipe(gulp.dest('lib'));
});
