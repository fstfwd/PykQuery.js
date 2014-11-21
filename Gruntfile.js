module.exports = function(grunt) {

    'use strict';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        js_src_path: 'src',
        js_distro_path: 'dist',

        concat: {
            'js': {
                'src': [
                      '<%= js_src_path %>/PykUtil.js'
                    , '<%= js_src_path %>/PykQuery.js'
                    , '<%= js_src_path %>/PykQuery.adapter.rumi.js'
                    , '<%= js_src_path %>/PykQuery.adapter.inbrowser.js'
                    , '<%= js_src_path %>/filter.js'
                ],
                'dest': '<%= js_distro_path %>/pykquery.<%= pkg.version %>.js'
            }
        },

        uglify: {
            'my_target': {
                'files': {
                '<%= js_distro_path %>/pykquery.<%= pkg.version %>.min.js': // destination
                ['<%= js_distro_path %>/pykquery.<%= pkg.version %>.js'] // source
                }
            }
        },

        watch: {
            src: {
                files: ['<%= js_src_path %>/*.js'],
                tasks: ['build'],
            },
        },

        jshint: {
            all: ['Gruntfile.js', '<%= js_src_path %>/*.js']
        },

        clean: {
            // Clean any pre-commit hooks in .git/hooks directory
            hooks: ['.git/hooks/pre-commit']
        },

        // Run shell commands
        shell: {
            hooks: {
                // Copy the project's pre-commit hook into .git/hooks
                command: 'cp git-hooks/pre-commit .git/hooks/pre-commit'
            },
            rmclogs: {
                // Run the script
                command: 'bash pre-build/script.bash'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Clean the .git/hooks/pre-commit file then copy in the latest version
    grunt.registerTask('hookmeup', ['clean:hooks', 'shell:hooks']);

    //build task
    grunt.registerTask('build', ['concat', 'uglify', 'hookmeup']);

    grunt.event.on('watch', function(action, filepath) {
        grunt.log.writeln(filepath + ' has ' + action);
    });
};
