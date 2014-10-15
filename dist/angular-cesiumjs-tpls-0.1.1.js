/*
 * angular-cesiumjs
 * 

 * Version: 0.1.1 - 2014-10-14
 * License: Apache v2
 */
angular.module("cesiumjs", ["cesiumjs.tpls", "cesiumjs.viewer"]);
angular.module("cesiumjs.tpls", ["template/viewer/viewer.html"]);
/**
 * Created by michael
 * Copyright: 9/29/14
 * Portland Webworks, Inc.
 */
angular.module('cesiumjs.viewer', [])

    .constant('viewerConfig', {
        animation: true,
        baseLayerPicker: true,
        fullscreenButton: true,
        geocoder:	true,
        homeButton: true,
        infoBox: true,
        sceneModePicker: true,
        selectionIndicator: true,
        timeline: true,
        navigationHelpButton: true,
        navigationInstructionsInitiallyVisible: true,
        scene3DOnly: false,
        useDefaultRenderLoop: true,
        targetFrameRate: 48,
        showRenderLoopErrors: true,
        automaticallyTrackDataSourceClocks: true
    })

    .controller('ViewerController', function($scope, $log, CesiumjsViewerService, viewerConfig) {
        var service = CesiumjsViewerService;
        $log.info('viewer controller init');
        $log.info(viewerConfig);
        $log.info(service);
    })

    .service('CesiumjsViewerService', function ($log) {
        $log.info('Service Init');
        this.viewer = null;
    })

    .directive('cesiumViewer', function ($log, viewerConfig) {
        $log.info('cesiumViewer called' );
        return {
            restrict: 'EA',
            controller: 'ViewerController',
            transclude: true,
            replace: false,
            templateUrl: 'template/viewer/viewer.html',
            link: function ($scope, element, attrs) {
                $log.info('cesiumViewer');
                $scope.cesiumViewer = new Cesium.Viewer(attrs.id, viewerConfig);
            }
        };
    });



angular.module("template/viewer/viewer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/viewer/viewer.html",
    "<div class=\"cesium-viewer\" ng-transclude></div>");
}]);