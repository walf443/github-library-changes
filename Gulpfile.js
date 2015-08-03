const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');

gulp.task('browserify', function() {
    browserify('src/main.es6.js', { debug: true, 'extensions': ['.es6.js'] })
        .transform(babelify)
        .bundle()
        .on('error', function(err) { console.log("Error: " + err.message); })
        .pipe(source('main.js'))
        .pipe(gulp.dest('./build/'));
    browserify('src/background.es6.js', { debug: true, 'extensions': ['.es6.js'] })
        .transform(babelify)
        .bundle()
        .on('error', function(err) { console.log("Error: " + err.message); })
        .pipe(source('background.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('manifest', function() {
    gulp.src('manifest.json').pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
    gulp.watch('src/*.es6.js', ['browserify']);
    gulp.watch('manifest.json', ['manifest']);
});

gulp.task('default', ['browserify', 'manifest', 'watch']);
