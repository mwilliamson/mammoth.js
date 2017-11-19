'use strict'

const browserify = require('browserify')
const uglifyES = require('uglify-es')
const gulp = require('gulp')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const composer = require('gulp-uglify/composer')
const sourcemaps = require('gulp-sourcemaps')
const minify = composer(uglifyES, console)
const jetpack = require('fs-jetpack')
const rename = require('gulp-rename')
const prependLicense = require('browserify-prepend-licenses')
const babelify = require('babelify')
const babel = require('gulp-babel')
const nodeResolve = require('rollup-plugin-node-resolve')

const srcDir = jetpack.cwd('./src')

const libDir = srcDir.cwd('./lib')
const testDir = srcDir.cwd('./test')
const binDir = srcDir.cwd('./bin')

const buildDir = jetpack.cwd('./build')

const libBuildDir = buildDir.cwd('./lib')
const testBuildDir = buildDir.cwd('./test')
const binBuildDir = buildDir.cwd('./bin')

const distDir = jetpack.cwd('./dist')

const bundleName = 'mammoth.browser.js'
const minifiedBundleName = 'mammoth.browser.min.js'

gulp.task('clean-dist', () => {
  distDir.dir('.', {empty: true})
})

gulp.task('clean-build', () => {
  buildDir.dir('.', {empty: true})
  libBuildDir.dir('.', {empty: true})
  testBuildDir.dir('.', {empty: true})
  binBuildDir.dir('.', {empty: true})
})

gulp.task('build-dist', ['clean-dist'], () => {
  // set up the browserify instance on a task basis
  const b = browserify({
    entries: libDir.path('index.js'),
    debug: true,
    standalone: 'mammoth'
  })

  b.plugin(prependLicense)

  b.transform('rollupify', {
    config: {
      external: ['jszip', 'lop', 'path-is-absolute', 'sax', 'xmlbuilder'],
      plugins: [
        nodeResolve({
          browser: true,
          jsnext: true
        })
      ]
    }
  })

  b.transform(babelify.configure({
    presets: [
      ['env', {
        targets: {
          browsers: ['> 1%']
        }
      }]
    ]
  }))

  return b.bundle()
    .pipe(source(bundleName, buildDir.path()))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(distDir.path()))
})

gulp.task('minify', ['build-dist'], () => {
  return gulp.src(distDir.path(bundleName))
    .pipe(rename(minifiedBundleName))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(minify({
      compress: {
        passes: 2,
        toplevel: true,
        typeofs: false
      },
      ie8: true,
      toplevel: true
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(distDir.path()))
})

gulp.task('pretest', ['build-lib', 'copy-test-assets', 'build-bin'], () => {
  return gulp.src(testDir.path('**/*.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
      sourceMaps: true,
      presets: [
        ['env', {
          targets: {
            node: true
          }
        }]
      ]
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(testBuildDir.path()))
})

gulp.task('copy-test-assets', ['clean-build'], () => {
  return gulp.src(testDir.path('test-data/**'))
    .pipe(gulp.dest(testBuildDir.path('test-data')))
})

gulp.task('build-lib', ['clean-build'], () => {
  return gulp.src(libDir.path('**/*.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
      sourceMaps: true,
      presets: [
        ['env', {
          targets: {
            node: true
          }
        }]
      ]
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(libBuildDir.path('.')))
})

gulp.task('build-bin', ['clean-build'], () => {
  return gulp.src(binDir.path('**/*'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({
      sourceMaps: true,
      presets: [
        ['env', {
          targets: {
            node: true
          }
        }]
      ]
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(binBuildDir.path('.')))
})
