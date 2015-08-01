const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');

gulp.task('browserify', function() {
    browserify('src/main.es6.js', { debug: true })
        .transform(babelify)
        .bundle()
        .on('error', function(err) { console.log("Error: " + err.message); })
        .pipe(source('main.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('watch', function() {
    gulp.watch('src/*.es6.js', ['browserify']);
});

gulp.task('default', ['browserify', 'watch']);
