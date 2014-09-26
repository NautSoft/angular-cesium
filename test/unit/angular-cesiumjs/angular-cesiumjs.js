'use strict';

// Set the jasmine fixture path
// jasmine.getFixtures().fixturesPath = 'base/';

describe('angular-cesiumjs', function() {

    var module;
    var dependencies;
    dependencies = [];

    var hasModule = function(module) {
        return dependencies.indexOf(module) >= 0;
    };

    beforeEach(function() {

        // Get module
        module = angular.module('angular-cesiumjs');
        dependencies = module.requires;
    });

    it('should load config module', function() {
        expect(hasModule('angular-cesiumjs.config')).toBeTruthy();
    });

    

    
    it('should load directives module', function() {
        expect(hasModule('angular-cesiumjs.directives')).toBeTruthy();
    });
    

    
    it('should load services module', function() {
        expect(hasModule('angular-cesiumjs.services')).toBeTruthy();
    });
    

});
