/*
 * angular-cesiumjs
 * 

 * Version: 0.0.1-SNAPSHOT - 2014-09-29
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
    targetFrameRate: 24,
    showRenderLoopErrors: true,
    automaticallyTrackDataSourceClocks: true
  }).

  controller('ViewerController', function ($scope, $attrs, viewerConfig) {
    $scope.cesiumViewer = null;

  }).

  directive('cesiumvViewer', function () {
    return {
      restrict: 'EA',
      controller: 'ViewerController',
      transclude: true,
      replace: false,
      templateUrl: 'template/accordion/viewer.html'
    };
  });



angular.module("template/viewer/viewer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/viewer/viewer.html",
    "<div class=\"cesium-viewer\" ng-transclude></div>");
}]);
