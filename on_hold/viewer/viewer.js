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

    .controller('ViewerController', function($scope, $attrs, $log) {
        $log.info('viewerController init');
        var self = this,
            scope = $scope.$new();

        function init(element, config) {
            self.$element = element;

            var mapId = self.$element[0].id || 'cesiumViewer';

            //noinspection JSPotentiallyInvalidConstructorUsage
            scope.cesiumViewer = new Cesium.viewer(mapId, config);
        }

        this.init = init;

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
            replace: false,
            templateUrl: 'template/viewer/viewer.html',
            link: function (scope, element, attrs, viewerCtrl) {

                if(!angular.isDefined(element[0]) || element[0].id === '') {
                    $log.error('cesiumViewer: An ID must exist for Cesium to initialize');
                    return;
                }
                var combinedConfig = angular.copy(viewerConfig);
                angular.extend(combinedConfig, scope[attrs.config]);


                viewerCtrl.init(element, combinedConfig);
            }
        };
    })
;
