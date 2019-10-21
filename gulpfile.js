var gulp            = require('gulp'),
    clean           = require('gulp-clean'),
    browserSync     = require('browser-sync').create(),
    changed         = require('gulp-changed'),
    concat          = require('gulp-concat'),
    sass            = require('gulp-sass'),
    autoprefixer    = require('gulp-autoprefixer'),
    uglifycss       = require('gulp-uglifycss'),
    uglify          = require('gulp-uglify'),
    notify          = require('gulp-notify'),
    plumber         = require('gulp-plumber'),
    sourcemaps      = require('gulp-sourcemaps'),
    fileInclude     = require('gulp-file-include'),
    beautifyCode    = require('gulp-beautify-code'),
    removeEmptyLines = require('gulp-remove-empty-lines'),
    imagemin        = require('gulp-imagemin'),
    imageminUPNG    = require("imagemin-upng"),
    mozjpeg         = require('imagemin-mozjpeg'),
    jpegRecompress  = require('imagemin-jpeg-recompress'),
    svgo            = require('imagemin-svgo'),
    mmq             = require('gulp-merge-media-queries');
    
    // Source Folder Locations
    src = {
        'root': './src/',
        
        'rootHtml': './src/*.html',
        'rootPartials': './src/partials/',
        
        'rootFonts': './src/assets/fonts/*',
        'fontsAll': './src/assets/fonts/**/*',
        
        'rootVendorCss': './src/assets/css/*.css',
        'rootPluginsCss': './src/assets/css/plugins/*.css',
        
        
        'rootScss': './src/assets/scss/*',
        'scssAll': './src/assets/scss/**/*',
        
        'rootVendorJs': './src/assets/js/*.js',
        'rootPluginsJs': './src/assets/js/plugins/*.js',
        
        'pluginsJsRelFolder': './src/assets/js/plugins/plugins-related/**/*',
        'pluginsJsRelFolderRoot': './src/assets/js/root-plugins-related/**/*',
        
        'mainJs': './src/assets/js/main.js',
        
        'images': './src/assets/img/**/*',

        'php_copy': './src/assets/php/**/*'
    },
    
    // Destination Folder Locations
    dest = {
        'root': './dest/',
        'fonts': './dest/assets/fonts/',
        'assets': './dest/assets/',
        'scss': './dest/assets/scss/',
        
        'rootCss': './dest/assets/css',
        'rootVendorCss': './dest/assets/css/',
        'rootPluginsCss': './dest/assets/css/plugins/',
        
        'rootJs': './dest/assets/js',
        'rootVendorJs': './dest/assets/js/',
        'rootPluginsJs': './dest/assets/js/plugins/',
        
        'images': './dest/assets/img/',
        'php_copy': './dest/assets/php/'
    },
    
    // Separator For Vendor CSS & JS
    separator = '\n\n/*====================================*/\n\n',
    
    // Autoprefixer Options
    autoPreFixerOptions = [
        "last 4 version",
        "> 1%",
        "ie >= 9",
        "ie_mob >= 10",
        "ff >= 30",
        "chrome >= 34",
        "safari >= 7",
        "opera >= 23",
        "ios >= 7",
        "android >= 4",
        "bb >= 10"
    ];



/*-- 
    Live Synchronise & Reload
--------------------------------------------------------------------*/

// Browser Synchronise
function liveBrowserSync(done) {
    browserSync.init({
        server: {
            baseDir: dest.root,
            index: "index.html"
        },
        port: 5566,
        notify: false
    });
    done();
}
// Reload
function reload(done) {
    browserSync.reload();
    done();
}


/*-- 
    Gulp Custom Notifier
--------------------------------------------------------------------*/
function customPlumber(errTitle) {
    return plumber({
        errorHandler: notify.onError({
            title: errTitle || "Error running Gulp",
            message: "Error: <%= error.message %>",
            sound: "Glass"
        })
    });
}

/*-- 
    Gulp Other Tasks
--------------------------------------------------------------------*/

/*-- Remove Destination Folder Before Starting Gulp --*/
function cleanProject(done) {
    gulp.src(dest.root)
        .pipe(customPlumber('Error On Clean App'))
        .pipe(clean());
    done();
}

/*-- Copy Font Form Source to Destination Folder --*/
function fonts(done) {
    gulp.src(src.rootFonts)
        .pipe(customPlumber('Error On Copy Fonts'))
        .pipe(gulp.dest(dest.fonts));
    done();
}

/*-- 
    All HTMl Files Compile With Partial & Copy Paste To Destination Folder
--------------------------------------------------------------------*/
function html(done) {
    gulp.src(src.rootHtml)
        .pipe(customPlumber('Error On Compile HTML'))
        .pipe(fileInclude({ basepath: src.rootPartials }))
        .pipe(beautifyCode())
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(dest.root));
    done();
}

/*-- 
    CSS & SCSS Task
--------------------------------------------------------------------*/

/*-- Vendor CSS --*/
function vendorCss(done) {
    gulp.src(src.rootVendorCss)
        .pipe(customPlumber('Error On Copying Vendor CSS'))
        .pipe(gulp.dest(dest.rootVendorCss))
        .pipe(customPlumber('Error On Combining Vendor CSS'))
        .pipe(concat('vendor.css', {newLine: separator}))
        .pipe(autoprefixer(autoPreFixerOptions))
        .pipe(gulp.dest(dest.rootVendorCss))
        .pipe(customPlumber('Error On Combine & Minifying Vendor CSS'))
        .pipe(concat('vendor.min.css', {newLine: separator}))
        .pipe(uglifycss())
        .pipe(autoprefixer(autoPreFixerOptions))
        .pipe(gulp.dest(dest.rootVendorCss));
    done();
}

/*-- All CSS Plugins --*/
function pluginsCss(done) {
    gulp.src(src.rootPluginsCss)
        .pipe(customPlumber('Error On Copying Plugins CSS'))
        .pipe(gulp.dest(dest.rootPluginsCss))
        .pipe(customPlumber('Error On Combining Plugins CSS'))
        .pipe(concat('plugins.css', {newLine: separator}))
        .pipe(autoprefixer(autoPreFixerOptions))
        .pipe(gulp.dest(dest.rootPluginsCss))
        .pipe(customPlumber('Error On Combine & Minifying Plugins CSS'))
        .pipe(concat('plugins.min.css', {newLine: separator}))
        .pipe(uglifycss())
        .pipe(autoprefixer(autoPreFixerOptions))
        .pipe(gulp.dest(dest.rootPluginsCss));
    done();
}

/*-- Gulp Compile Scss to Css Task & Minify --*/
function styleCss(done) {
    var styleScss = [
        './src/assets/scss/style.scss'
    ];
    gulp.src(styleScss)
        .pipe(sourcemaps.init())
        .pipe(customPlumber('Error On Compiling Style Scss'))
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(autoprefixer(autoPreFixerOptions))
        .pipe(mmq())
        .pipe(gulp.dest(dest.rootCss))
        .pipe(browserSync.stream())
    done();
}

/*-- Gulp copy Scss --*/
function scss(done) {
    gulp.src(src.scssAll)
        .pipe(changed(dest.scss))
        .pipe(customPlumber('Error On Copying Scss'))
        .pipe(gulp.dest(dest.scss));
    done();
}

/*-- Copy image Form Source to Destination Folder --*/
function images(done) {
    gulp.src(src.images)
        .pipe(customPlumber('Error On Copy Image'))
        .pipe(gulp.dest(dest.images));
    done();
}

/*-- Copy php Form Source to Destination Folder --*/
function php_copy(done) {
    gulp.src(src.php_copy)
        .pipe(customPlumber('Error On Copy Image'))
        .pipe(gulp.dest(dest.php_copy));
    done();
}


/*-- 
    JS Task
--------------------------------------------------------------------*/

/*-- Vendor JS --*/
function vendorJs(done) {
    gulp.src(src.rootVendorJs)
        .pipe(customPlumber('Error On Copying Vendor JS'))
        .pipe(gulp.dest(dest.rootVendorJs))
        
    done();
}

/*-- All JS Plugins --*/
function pluginsJs(done) {
    gulp.src(src.rootPluginsJs)
        .pipe(customPlumber('Error On Copying Plugin JS'))
        .pipe(gulp.dest(dest.rootPluginsJs))
        .pipe(customPlumber('Error On Combining Plugin JS'))
        .pipe(concat('plugins.js', {newLine: separator}))
        .pipe(gulp.dest(dest.rootPluginsJs))
        .pipe(customPlumber('Error On Combining & Minifying Plugin JS'))
        .pipe(concat('plugins.min.js', {newLine: separator}))
        .pipe(uglify())
        .pipe(gulp.dest(dest.rootPluginsJs));
    done();
}

/*-- Gulp Main Js Task --*/

function mainJs(done) {
    gulp.src(src.mainJs)
        .pipe(customPlumber('Error On Copying Main Js File'))
        .pipe(gulp.dest(dest.rootJs));
    done();
}


/*-- 
    All, Watch & Default Task
--------------------------------------------------------------------*/

/*-- All --*/
gulp.task('clean', cleanProject);
gulp.task('allTask', gulp.series(images, php_copy, fonts, html, vendorCss, pluginsCss, styleCss, scss, vendorJs, pluginsJs, mainJs));

/*-- Watch --*/
function watchFiles() {
    gulp.watch(src.fontsAll, gulp.series(fonts, reload));
    gulp.watch(src.images, gulp.series(images, reload));
    gulp.watch(src.php_copy, gulp.series(php_copy, reload));
    
    gulp.watch(src.rootHtml, gulp.series(html, reload));
    gulp.watch(src.rootPartials, gulp.series(html, reload));
    
    gulp.watch(src.rootVendorCss, gulp.series(vendorCss, reload));
    gulp.watch(src.rootPluginsCss, gulp.series(pluginsCss, reload));
    gulp.watch(src.scssAll, gulp.series(styleCss));
    gulp.watch(src.scssAll, gulp.series(scss));
    
    gulp.watch(src.rootVendorJs, gulp.series(vendorJs, reload));
    gulp.watch(src.rootPluginsJs, gulp.series(pluginsJs, reload));
    gulp.watch(src.mainJs, gulp.series(mainJs, reload));
}

/*-- Default --*/
gulp.task('default', gulp.series('allTask', gulp.parallel(liveBrowserSync, watchFiles)));


/*-- 
    Image Optimization
--------------------------------------------------------------------*/
function minify_image(done) {
    gulp.src(src.images)
        .pipe(imagemin(
            [imageminUPNG(), mozjpeg(), jpegRecompress(), svgo()],
            {verbose: true}
        ))
        .pipe(gulp.dest(dest.images));
    done();
}

/* other tasks */

gulp.task('minify_image', minify_image);