(function(window, document) {

// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

// Config
angular.module('angular-cesiumjs.config', [])
    .value('angular-cesiumjs.config', {
        debug: true
    });

// Modules
angular.module('angular-cesiumjs.directives', []);
angular.module('angular-cesiumjs.services', []);
angular.module('angular-cesiumjs',
    [
        'angular-cesiumjs.config',
        'angular-cesiumjs.directives',
        'angular-cesiumjs.services',
        'ngResource'
    ]);
})(window, document);