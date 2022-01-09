/* package */
const { src, dest, watch, series, parallel } = require("gulp");
// const gulp = require("gulp");
const sass = require('gulp-sass')(require('sass'));
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sassGlob = require("gulp-sass-glob-use-forward");
const mmq = require("gulp-merge-media-queries");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssdeclsort = require("css-declaration-sorter");
const cleanCSS = require("gulp-clean-css");
const cssnext = require("postcss-cssnext");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");

const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const imageminSvgo = require("imagemin-svgo");
const browserSync = require("browser-sync");
const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");


// 読み込み先
const srcPath = {
	css: './sass/**/*.scss',
	js: './js/**/*',
	img: './images/**/*',
	ejs: './ejs/**/*.ejs'
}

// html反映用
const destPath = {
	all: '../dist/**/*',
	css: '../dist/css/',
	js: '../dist/js/',
	img: '../dist/images/',
	html: '../dist/',
}


// 不要ファイルを削除
// const del = require('del');
// const delPath = {
// 	dist: '../dist/'
// }
// const clean = (done) => {
// 	del(delPath.dist, { force: true, });
// 	done();
// };
const browsers = [
	'last 2 versions',
	'> 5%',
	'ie = 11',
	'not ie <= 10',
	'ios >= 8',
	'and_chr >= 5',
	'Android >= 5',
]
const cssSass = () => {
	return src(srcPath.css)
		.pipe(sourcemaps.init())
		.pipe(
			plumber({
				errorHandler: notify.onError('Error:<%= error.message %>')
			}))
		.pipe(sassGlob())
		.pipe(sass.sync({
			includePaths: ['src/sass'],
			outputStyle: 'expanded'
		})) //指定できるキー expanded compressed
		.pipe(postcss([autoprefixer({ // autoprefixer
			grid: true
		})]))
		.pipe(postcss([
			cssdeclsort({ order: "alphabetical" }),
			cssnext(browsers)
		]))
		.pipe(mmq()) // media query mapper
		.pipe(sourcemaps.write('./'))
		.pipe(dest(destPath.css))
		.pipe(notify({
			message: 'Sassをコンパイルしました！',
			onLast: true
		}))
}


//  EJS
const ejs = require("gulp-ejs");
const replace = require("gulp-replace");
const htmlbeautify = require("gulp-html-beautify");

const srcEjsDir = "./ejs";

const ejsCompile = (done) => {
	src([srcEjsDir + "/**/*.ejs", "!" + srcEjsDir + "/**/_*.ejs"])
		.pipe(
			plumber({
				errorHandler: notify.onError(function (error) {
					return {
						message: "Error: <%= error.message %>",
						sound: false,
					};
				}),
			})
		)
		.pipe(ejs({}))
		.pipe(rename({ extname: ".html" }))
		.pipe(replace(/^[ \t]*\n/gim, ""))
		.pipe(
			htmlbeautify({
				indent_size: 2,
				indent_char: " ",
				max_preserve_newlines: 0,
				preserve_newlines: false,
				extra_liners: [],
			})
		)
		.pipe(dest(destPath.html));
	done();
};

// 画像圧縮

const imgImagemin = () => {
	return src(srcPath.img)

		.pipe(
			imagemin(
				[
					imageminMozjpeg({
						quality: 80
					}),
					imageminPngquant(),
					imageminSvgo({
						plugins: [
							{
								removeViewbox: false
							}
						]
					})
				],
				{
					verbose: true
				}
			)
		)
		.pipe(dest(destPath.img))
}

// js圧縮
const jsBabel = () => {
	return src(srcPath.js)
		.pipe(
			plumber(
				{
					errorHandler: notify.onError('Error: <%= error.message %>')
				}
			)
		)
		.pipe(babel({
			presets: ['@babel/preset-env']
		}))
		.pipe(dest(destPath.js))
		.pipe(uglify())
		.pipe(
			rename(
				{ extname: '.min.js' }
			)
		)
		.pipe(dest(destPath.js))
}

// ブラウザーシンク
const browserSyncOption = {
	notify: false,
	server: "../dist/"
}
const browserSyncFunc = () => {
	browserSync.init(browserSyncOption);
}
const browserSyncReload = (done) => {
	browserSync.reload();
	done();
}


const watchFiles = () => {
	watch(srcPath.css, series(cssSass, browserSyncReload))
	watch(srcPath.js, series(jsBabel, browserSyncReload))
	watch(srcPath.img, series(imgImagemin, browserSyncReload))
	watch(srcPath.ejs, series(ejsCompile, browserSyncReload))

}
exports.default = series(series(cssSass, jsBabel, imgImagemin, ejsCompile), parallel(watchFiles, browserSyncFunc));
