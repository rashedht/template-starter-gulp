"use strict";

var autoPrefixer = require("gulp-autoprefixer"),
    browserSync = require("browser-sync"),
    csscomb = require("gulp-csscomb"),
    gulp = require("gulp"),
    sass = require("gulp-sass"),
    wait = require('gulp-wait'),
    gutil = require("gutil"),
    ftp = require("vinyl-ftp"),
    fileinclude = require('gulp-file-include'),
    changed = require('gulp-changed'),
    del = require('del'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    prettyHtml = require('gulp-pretty-html'),
    imagemin = require('gulp-imagemin'),
    imageminJpegRecompress = require('imagemin-jpeg-recompress'),
    mmq = require('gulp-merge-media-queries');

    /**
     * Browser selection for Autoprefixer
     * @type {Array}
     */

    var AUTOPREFIXER_BROWSERS = [
        "last 2 version",
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

     /* file locations */

     var styleSass = "./src/assets/scss/style.scss",
     sassPartialFiles = "src/assets/scss/**/*.scss",
     vendorJs = "./src/assets/js/vendors.js",
     activeJs = "./src/assets/js/active.js";


    /* browser sync */

    function browser_sync() {
        browserSync.init({
            server: {
                baseDir: "./tmp",
                index: "index.html",
            },
            port: 5566,
            notify: false
        });
    };

    /* SCSS compile */
    
    function css(done){
        
        gulp.src(styleSass)
        .pipe(customPlumber('Error Running Sass'))
        .pipe(wait(500))
        .pipe(sass())
        .pipe(autoPrefixer(AUTOPREFIXER_BROWSERS))
        .pipe(csscomb())
        .pipe(mmq())
        .pipe(gulp.dest("./src/assets/css"))
        .pipe(browserSync.stream());

        done();
    };

     /* JS tasks */
    
     function js(done) {
        gulp.src(activeJs)
        .pipe(customPlumber('Error Running JS'))
        .pipe(gulp.dest('./src/assets/js/'));
        done();
    };

    /* Include Html Pertials */

    function compile_html(done) {
        gulp.src( 'src/*.html' )
            .pipe(customPlumber('Error Running html-include'))
            .pipe(fileinclude({ basepath: "src/_partials/" }))
            .pipe(prettyHtml())
            .pipe(gulp.dest('./tmp'))
            .pipe(browserSync.reload({
                stream: true
            })
            );
        done();
    };

    /* clean tmp folder */

    function clean_tmp(done) {
        del(['tmp/**/*']);
        done();
    };

    /* clean build folder */

    function clean_build(done) {
        del(['build/**/*']);
        done();
    };

    /* copy all folder to specific location */

    function copy_assets(done) {
        gulp.src('./src/assets/**/*')
        .pipe(changed('./tmp/assets'))
        .pipe(customPlumber('Error Copying file'))
        .pipe(gulp.dest('./tmp/assets'));
        done();
    };

    /* watch files */
    
    function watch_files(){
        gulp.watch(sassPartialFiles, css);
        gulp.watch([vendorJs, activeJs]).on("change", browserSync.reload);
        gulp.watch('src/**/*', copy_assets);
        gulp.watch(["src/*.html" , "src/_partials/**/*.htm"], compile_html);
        gulp.watch(["src/*.html" , "src/_partials/**/*.htm"]).on("change", browserSync.reload);
    }

    /* Gulp Ftp Server Upload */

    var d = new Date(),
    month = d.getMonth(),
    todayDate = d.getFullYear()+'.'+(month + 1)+'.'+d.getDate();
 
    var localFiles = ['tmp/**/*'];

    function getFtpConnection() {
         return ftp.create({
             host: 'ftp.whizthemes.com',
             port: 21,
             user: 'rashed@whizthemes.com',
             password: 'agP8[;4dT.Ax',
             parallel: 5,
             log: gutil.log
         });
    }
 
    var remoteLogLocation = 'log/' + todayDate;
    var remoteProjectLocation = 'project-name';
 
     
     /* upload log */
     
    function upload_log(done) {
         var conn = getFtpConnection();
         gulp.src(localFiles, {
             base: './tmp/',
             buffer: false
         }).pipe(conn.dest(remoteLogLocation));
         done();
    };  
 
     /* upload project */
     
    function upload_project(done) {
         var conn = getFtpConnection();
         gulp.src(localFiles, {
             base: './tmp/',
             buffer: false
         }).pipe(conn.dest(remoteProjectLocation));
         done();
    };  

    /*  custom plumber */

    function customPlumber(errTitle) {
        return plumber({
            errorHandler: notify.onError({
            title: errTitle || "Error running Gulp",
            message: "Error: <%= error.message %>",
            sound: "Glass"
            })
        });
    }


    /* Minify images */
    
    function minify_image(done) {
        gulp.src('./tmp/assets/img/**/*')
          .pipe(imagemin([
            imagemin.gifsicle(),
            imageminJpegRecompress({
              loops:4,
              min: 50,
              max: 95,
              quality:'high' 
            }),
            imagemin.optipng({optimizationLevel: 7}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
          ],

          {
            verbose: true
          }))
          .pipe(gulp.dest('./build/assets/img'));

          done();
    };

    
    /* copy to production */
    
    function copy_to_production(done){
        gulp.src(['tmp/**/*'])
        .pipe(gulp.dest('build/'));
        done();
    }
    

    /* Minify image */
    // function minify_image(done){
    //     gulp.src('tmp/assets/img/products/**/*')
    //     .pipe(kraken({
    //         key: '91c9952e286576fe3379e7f4312d7580',
    //         secret: '13c5855fe484ea269d635b9eff5b13eeb397da28',
    //         lossy: true,
    //         concurrency: 6
    //     }));
    //     done();
    // }
    


    gulp.task('browser_sync', browser_sync);
    gulp.task('css', css);
    gulp.task('js', js);
    gulp.task('compile_html', compile_html);
    gulp.task('copy_assets', copy_assets);
    gulp.task('clean_tmp', clean_tmp);
    gulp.task('clean_build', clean_build);
    gulp.task('upload_log', upload_log);
    gulp.task('upload_project', upload_project);
    gulp.task('minify_image', minify_image);
    gulp.task('copy_to_production', copy_to_production);

    const build = gulp.series(copy_assets, compile_html, css, js);
    const buildWatch = gulp.series(build, gulp.parallel(browser_sync, watch_files));

    /* make production ready */
    const production_ready = gulp.series(copy_to_production, minify_image);
    gulp.task('production_ready', production_ready);

    gulp.task('default', buildWatch);