//----------------------------------------------------
// gulp: Setting
//----------------------------------------------------

const gulp = require("gulp")
const fs = require("fs")
const notify = require("gulp-notify")
const plumber = require("gulp-plumber")
const rename = require("gulp-rename")
const header = require("gulp-header")
const gulpif = require("gulp-if")
const sass = require("gulp-sass")
const sassGlob = require("gulp-sass-glob")
const postcss = require("gulp-postcss")
const autoprefixer = require("autoprefixer")
const flexBugsFixes = require("postcss-flexbugs-fixes")
const gcmq = require("gulp-group-css-media-queries")
const cleanCSS = require("gulp-clean-css")
const packageImporter = require("node-sass-package-importer")
const babel = require("gulp-babel")
const uglify = require("gulp-uglify")

// Read File
const files = {
  pkg: "./package.json",
  pjt: "./project.json"
}
const pkg = JSON.parse(fs.readFileSync(files.pkg))
const pjt = JSON.parse(fs.readFileSync(files.pjt))

// Banner
const banner = {
  basic: [
    "/*! <%= pjt.setting.name %> v<%= pkg.version %> <%= pkg.license %> by <%= pkg.author.name %> */",
    "",
    ""
  ].join("\n"),
  visible: pjt.setting.banner
}

// Paths
const paths = {
  src: {
    dir: pjt.setting.src + "/",
    scss: pjt.setting.src + "/scss/",
    js: pjt.setting.src + "/js/"
  },
  dist: {
    dir: pjt.setting.dist + "/",
    css: pjt.setting.dist + "/",
    js: pjt.setting.dist + "/"
  }
}

// Sass Options
const sassOptions = {
  outputStyle: "expanded",
  importer: packageImporter({
    extensions: [".scss", ".css"]
  })
}

// Autoprefixer Options
const autoprefixerOptions = {
  grid: true
}

// PostCSS Options
const postcssOptions = [flexBugsFixes, autoprefixer(autoprefixerOptions)]

// Uglify Options
const uglifyOptions = {
  output: { comments: /^!/ }
}

//----------------------------------------------------
// gulp: Task
//----------------------------------------------------

// SCSS > CSS
gulp.task("scss", () => {
  return gulp
    .src(paths.src.scss + "**/*.scss")
    .pipe(sassGlob())
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(sass(sassOptions))
    .pipe(postcss(postcssOptions))
    .pipe(gcmq())
    .pipe(gulpif(banner.visible, header(banner.basic, { pkg, pjt })))
    .pipe(gulp.dest(paths.dist.css))
})

// CSS Minify
gulp.task("cssmin", () => {
  return gulp
    .src([paths.dist.css + "**/*.css", "!" + paths.dist.css + "**/*.min.css"])
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(cleanCSS())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest(paths.dist.css))
})

// Babel
gulp.task("babel", () => {
  return gulp
    .src(paths.src.js + "**/*.js")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      babel({
        presets: ["@babel/env"]
      })
    )
    .pipe(gulpif(banner.visible, header(banner.basic, { pkg, pjt })))
    .pipe(gulp.dest(paths.dist.js))
})

// Uglify
gulp.task("uglify", () => {
  return gulp
    .src([paths.dist.js + "**/*.js", "!" + paths.dist.js + "**/*.min.js"])
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(uglify(uglifyOptions))
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest(paths.dist.js))
})

// Watch
gulp.task("watch", () => {
  gulp.watch(
    paths.src.scss + "**/*.scss",
    gulp.series("scss", "cssmin", "reload")
  )
  gulp.watch(paths.src.js + "**/*.js", gulp.series("babel", "uglify", "reload"))
})

gulp.task("default", gulp.parallel("watch"))

//----------------------------------------------------
// gulp: Build
//----------------------------------------------------

gulp.task(
  "build",
  gulp.parallel(gulp.series("scss", "cssmin"), gulp.series("babel", "uglify"))
)
