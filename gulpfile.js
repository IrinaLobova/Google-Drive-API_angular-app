var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var Server = require('karma').Server;
var jshint = require('gulp-jshint');
var connect = require('gulp-connect');

// *******************************************

gulp.task('buildApp', function(){
  return gulp.src(['src/js/config.js', 'src/js/**/*.js'])
    .pipe(concat('app.js'))
    .pipe(uglify({mangle: false}))
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());
});

gulp.task('buildVendor', function(){
  return gulp.src([
    'bower_components/jquery/dist/jquery.min.js',
    'bower_components/bootstrap/dist/js/bootstrap.min.js',
    'bower_components/angular/angular.min.js',
    'bower_components/angular-route/angular-route.min.js',
    'bower_components/angular-sanitize/angular-sanitize.min.js'])
    .pipe(concat('vendors.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildCSS', function(){
  return gulp.src([
    'bower_components/bootstrap/dist/css/bootstrap.css',
    'src/css/**/*.css'])
  .pipe(concat('styles.css'))
  .pipe(minifycss())
  .pipe(gulp.dest('dist'))
  .pipe(connect.reload());
});

gulp.task('moveHTML', function(){
  return gulp.src('src/**/*.html')
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());
});

gulp.task('build', ['buildVendor', 'buildApp', 'buildCSS', 'moveHTML']);

// **********************************

gulp.task('karma', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('jshint', function(){
  return gulp.src(['src/js/**/*.js', 'src/tests/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('test', ['karma', 'jshint']);

// ***************************************

gulp.task('connect', function(){
  connect.server({
    root: 'dist',
    livereload: true
  });
});

gulp.task('watch', function(){
  gulp.watch('src/js/**/*.js', ['buildApp', 'test']);
  gulp.watch('src/css/**/*.css', ['buildCSS']);
  gulp.watch('src/**/*.html', ['moveHTML']);
});

// *******************************************

gulp.task('default', ['build', 'test', 'watch', 'connect']);
