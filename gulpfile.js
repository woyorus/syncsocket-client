const gulp = require('gulp');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const webpack = require('webpack-stream');
const help = require('gulp-task-listing');
const eslint = require('gulp-eslint');

gulp.task('help', help);
gulp.task('default', ['build']);

// Building //

const BUILD_TARGET_DIR = './';

gulp.task('build', function () {
    return gulp.src('src/*.js')
        .pipe(webpack(require('./support/webpack.config.js')))
        .pipe(gulp.dest(BUILD_TARGET_DIR));
});

// Testing //

const REPORTER = 'dot';
const TEST_FILE = './test/index.js';
const TEST_SUPPORT_SERVER_FILE = './test/support/server.js';

gulp.task('lint', function () {
    return gulp.src([
        '**/*.js',
        '!node_modules/**',
        '!coverage/**',
        '!syncsocket-client.js'
    ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', ['lint'], function () {
    const MOCHA_OPTS = {
        reporter: REPORTER,
        require: [TEST_SUPPORT_SERVER_FILE],
        bail: true
    };
    return gulp.src(TEST_FILE, { read: false })
        .pipe(mocha(MOCHA_OPTS))
        .once('error', function (err) {
            console.error(err.stack);
            process.exit(1);
        })
        .once('end', function () {
            process.exit();
        });
});

gulp.task('istanbul-pre-test', function () {
    return gulp.src(['src/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

gulp.task('test-cov', ['istanbul-pre-test'], function () {
    gulp.src(['test/*.js', 'test/support/*.js'])
        .pipe(mocha({
            reporter: REPORTER
        }))
        .pipe(istanbul.writeReports())
        .once('error', function (err) {
            console.error(err);
            process.exit(1);
        })
        .once('end', function () {
            process.exit();
        });
});
