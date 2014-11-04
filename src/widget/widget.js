/**
 * Created by michael
 * Copyright: 10/31/14
 * Portland Webworks, Inc.
 */
angular.module('cesiumjs.widget', ['angular-md5'])

    .controller('WidgetController', ['$scope', '$attrs', '$log',
        function($scope, $attrs, $log) {
        var _self = this,
            _scope = $scope.$new();
        var _service = $scope[$attrs.service];

        /**
         *
         * @param element
         */
        this.init = function(element) {
            $log.info('WidgetController: init');
            try {
                _self.$element = element;

                var mapId = _self.$element[0].id;

                _service.initViewer(mapId);
                _scope.cesiumService = _service;
            } catch(exception) {
                $log.error('WidgetController: failed to initialize');
                $log.info(_service);
                _scope.cesiumService = angular.noop;
            }
        };
    }])

    .service('CesiumjsWidgetService', [
        '$q', '$log', 'md5', 'IMAGERY_PROVIDER', 'PIN_COLLECTION_MAKI',
        function ($q, $log, md5, IMAGERY_PROVIDER, PIN_COLLECTION_MAKI) {
        $log.info('CesiumjsWidgetService: Init');

        var _imageryProviders    = {},
            _activeProvider      = null,
            _viewer              = null,
            _scene               = null,
            _primitives          = null,
            _camera              = null,
            _pinBuilder          = null,
            _billboardCollection = null,
            _markerCanvas        = {},
            _billboardPins       = {};


        this.addMarker = function(label, type, cssColorString, size, latitude, longitude) {
            $log.info('CesiumjsWidgetService: addMarker ' + type + ' ['+latitude+','+longitude+']');

            if( !angular.isDefined(PIN_COLLECTION_MAKI[type]) ) {
                $log.error('CesiumjsWidgetService: addMarker - invalid marker type = ' + type);
            }

            size = angular.isNumber(size) && size > 5 ? size : 48;
            var color         = Cesium.Color.fromCssColorString(cssColorString),
                canvasHash    = md5.createHash(type + color + size),
                billboardHash = md5.createHash(label);

            if( angular.isDefined(_markerCanvas[ canvasHash ]) ) {
                if( angular.isDefined(_billboardPins[ billboardHash ]) ) {
                    $log.info('CesiumjsWidgetService: addMarker already exists');

                } else {
                    $log.info('CesiumjsWidgetService: canvas exists, but not billboard');
                    _billboardPins[ billboardHash ] = _billboardCollection.add({
                        image : _markerCanvas[ canvasHash ],
                        verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                        position : Cesium.Cartesian3.fromDegrees(longitude, latitude, 0)
                    });
                }

            } else {
                Cesium.when(_pinBuilder.fromMakiIconId(type, color, size),
                    function(canvas) {
                        $log.info('CesiumjsWidgetService: addMarker canvas created');
                        _markerCanvas[  canvasHash    ] = canvas;
                        _billboardPins[ billboardHash ] = _billboardCollection.add({
                            image : canvas,
                            verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                            position : Cesium.Cartesian3.fromDegrees(longitude, latitude, 0)
                        });
                    }
                );
            }
        };

        this.removeMarker = function(label) {
            $log.info('CesiumjsWidgetService: removeMarker');

            var billboardHash = md5.createHash(label);
            _billboardCollection.remove( _billboardPins[billboardHash] );

            delete _billboardPins[billboardHash];
        };

        this.removeAllMarkers = function() {
            _billboardCollection.removeAll();
            _billboardPins = {};
        };

        /**
         *
         * @param enable {boolean}
         */
        this.enableMoon = function(enable) {
            _viewer.scene.moon.show  = !!enable;
        };

        /**
         *
         * @param enable {boolean}
         */
        this.enableSkyBox = function(enable) {
            _viewer.scene.skyAtmosphere.show  = !!enable;
        };

        /**
         *
         * @param enable {boolean}
         */
        this.enableSun = function(enable) {
            _viewer.scene.sun.show  = !!enable;
        };

        /**
         *
         * @param enable
         */
        this.enableDebug = function(enable) {
            _scene.debugShowFramesPerSecond = !!enable;
        };

        /**
         *
         * @param enable
         */
        this.enableDefaultHandlers = function(enable) {
            enable = !!enable;
            _scene.screenSpaceCameraController.enableLook      = enable;
            _scene.screenSpaceCameraController.enableTilt      = enable;
            _scene.screenSpaceCameraController.enableZoom      = enable;
            _scene.screenSpaceCameraController.enableRotate    = enable;
            _scene.screenSpaceCameraController.enableTranslate = enable;
        };

        /**
         *
         * @param provider {{label: string, url:string}}
         */
        this.generateImageryProvider = function(provider) {

            switch(provider.label) {
                case IMAGERY_PROVIDER.BING.label: {
                    var key = provider.apiKey || Cesium.BingMapsApi.defaultKey;
                    Cesium.BingMapsApi.defaultKey = key;

                    _imageryProviders[provider.customLabel] = new Cesium.BingMapsImageryProvider({
                        url : provider.url,
                        key : key,
                        mapStyle : Cesium.BingMapsStyle.AERIAL
                    });

                    break;
                }

                case IMAGERY_PROVIDER.BLACK_MARBLE.label: {
                    _imageryProviders[provider.customLabel] = new Cesium.TileMapServiceImageryProvider({
                        url:          provider.url,
                        maximumLevel: provider.maximumLevel
                    });

                    break;
                }

                case IMAGERY_PROVIDER.NATURAL_EARTH_II.label: {
                    _imageryProviders[provider.customLabel] = new Cesium.TileMapServiceImageryProvider({
                        url: provider.url
                    });

                    break;
                }

                case IMAGERY_PROVIDER.WORLDSAT_EARTH.label: {
                    $log.warn('WORLDSAT not yet implemented');
//					var provider = new Cesium.WebMapServiceImageryProvider({
//						url: '//sampleserver1.arcgisonline.com/ArcGIS/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/WMSServer',
//						layers : '0',
//						proxy: new Cesium.DefaultProxy('/proxy/')
//					});
//
//					viewer.scene.imageryLayers.addImageryProvider(provider);
//
//// This line is not required to use a WMS imagery layer, but adding it will enable automatic
//// display of WMS feature information (if available) on click.
//					viewer.extend(Cesium.viewerEntityMixin);
                    break;
                }

                default:
                    $log.error('no supported image provider:' + provider.label);
            }

            if(!_activeProvider) {
                this.setActiveProvider(provider.customLabel);
            }
        };

        /**
         * DO NOT USE right now
         * @returns {Cesium.SkyBox}
         * //TODO: figure out why this interferes with sun rendering
         */
        this.generateSkyBox = function() {
            var skyBoxBaseUrl = 'bower_components/cesiumjs/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80';
            return new Cesium.SkyBox({
                positiveX : skyBoxBaseUrl + '_px.jpg',
                negativeX : skyBoxBaseUrl + '_mx.jpg',
                positiveY : skyBoxBaseUrl + '_py.jpg',
                negativeY : skyBoxBaseUrl + '_my.jpg',
                positiveZ : skyBoxBaseUrl + '_pz.jpg',
                negativeZ : skyBoxBaseUrl + '_mz.jpg'
            });
        };

        /**
         *
         * @param div {string}
         */
        this.initViewer = function(div) {
            $log.info('CesiumjsWidgetService: init Viewer');
            _viewer              = new Cesium.CesiumWidget(div);
            _scene               = _viewer.scene;
            _camera              = _scene.camera;
            _primitives          = _scene.primitives;
            _billboardCollection = _primitives.add(new Cesium.BillboardCollection());
            _pinBuilder          = new Cesium.PinBuilder();

            _scene.sun           = new Cesium.Sun();
            _scene.moon          = new Cesium.Moon();
            _scene.skyAtmosphere = new Cesium.SkyAtmosphere();
//			_scene.skyBox        = this.generateSkyBox();

            //select image tile for cesium to use
            var provider = _imageryProviders[_activeProvider];
            var ellipsoid = provider.ellipsoid || Cesium.Ellipsoid.WGS84;

            var globe = new Cesium.Globe( ellipsoid );
            globe.imageryLayers.addImageryProvider( provider );
            globe.enableLighting  = true;
            globe.showWaterEffect = false;
            _primitives.globe = globe;

        };

        /**
         *
         * @returns {boolean}
         */
        this.isReady = function() {
            return _viewer !== null;
        };

        /**
         *
         * @param customLabel {string}
         */
        this.setActiveProvider = function(customLabel) {
            if(angular.isDefined(_imageryProviders[customLabel])) {
                _activeProvider = customLabel;
            }
        };

        /**
         *
         */
        this.set3DOnly = function() {
            _scene.scene3DOnly = true;
        };

        /**
         *
         * @param mode
         * @param animate {boolean}
         */
        this.setSceneMode = function(mode, animate) {
            animate = animate===null ? true : !!animate;

            switch(mode) {
                case Cesium.SceneMode.SCENE3D: {
                    _scene.morphTo3D();
                    break;
                }

                case Cesium.SceneMode.SCENE2D: {
                    if(!_scene.scene3DOnly) {
                        _scene.morphTo2D();

                    } else {
                        $log.error('CesiumjsWidgetService: "3D mode only" was set. Cannot change to a 2D mode');
                        return;
                    }
                    break;
                }

                case Cesium.SceneMode.COLUMBUS_VIEW: {
                    if(!_scene.scene3DOnly) {
                        _scene.morphToColumbusView();
                    } else {
                        $log.error('CesiumjsWidgetService: "3D mode only" was set. Cannot change to a 2D mode');
                        return;
                    }
                    break;
                }

                default: {
                    $log.error('CesiumjsWidgetService: invalid Screen mode set');
                    return;
                }
            }

            if(!animate) {
                _scene.completeMorph();
            }
        };

        /**
         *
         * @param latitude {number} decimal -90 to +90
         * @param longitude {number} decimal -179.9999 to 180.0
         * @param altitude {number} meters
         */
        this.setCameraPosition = function(latitude, longitude, altitude) {
            _camera.setPositionCartographic( Cesium.Cartographic.fromDegrees(longitude, latitude, altitude) );
        };
    }])

    .directive('cesiumWidget', [
        '$log',
        function ($log) {
        return {
            restrict: 'EA',
            controller: 'WidgetController',
            replace: false,
            link: function (scope, element, attrs, ctrl) {
                if(!angular.isDefined(element[0]) || element[0].id === '') {
                    $log.error('cesiumWidget: An ID must exist for Cesium to initialize');
                    return;
                }

                if( !angular.isDefined(attrs.service) ) {
                    $log.warn('cesiumWidget: no service to control cesium was provided');
                }

                ctrl.init( element );
            }
        };
    }])
;
