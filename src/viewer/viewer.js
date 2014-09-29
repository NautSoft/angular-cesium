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


