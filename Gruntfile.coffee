module.exports = (grunt) ->
  grunt.initConfig
    babel:
      compile:
        expand: true
        options:
          sourceMap: true
          presets: ['babel-preset-es2015']
        cwd: "#{__dirname}/src/"
        src: ['**/*.js', '!*.test.js']
        dest: 'lib/'
        ext: '.js'
      tests:
        expand: true
        options:
          sourceMap: true
          presets: ['babel-preset-es2015']
        flatten: false
        cwd: "#{__dirname}/tests/"
        src: ['*.js']
        dest: 'test/'
        ext: '.js'
    ts:
      dev:
        src: ['src/**/*.ts', '!src/**/*.test.ts']
        outDir: 'lib',
      options:
        noImplicitAny: true
        moduleResolution: 'node'
        target: 'es5'
        module: 'commonjs'
        noLib: false
        removeComments: true
        preserveConstEnums: true
        allowSyntheticDefaultImports: true
        allowJs: true
        declaration: false
        sourceMap: true

  grunt.loadNpmTasks 'grunt-ts'
  grunt.loadNpmTasks 'grunt-babel'

  grunt.registerTask 'build', ['ts', 'babel']
  grunt.registerTask 'default', ['build']
