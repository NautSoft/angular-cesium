/*
 * angular-cesiumjs
 * http://maikuru.github.io/angular-cesiumjs

 * Version: 0.2.1 - 2014-12-08
 * License: Apache-2.0
 */
angular.module('cesiumjs', ['cesiumjs.widget'])
    .constant('IMAGERY_PROVIDER', {
    BING: {
        label:       'bing',
        customLabel: 'bing',
        url:         'http://dev.virtualearth.net',
        ellipsoid:   Cesium.Ellipsoid.WGS84,
        apiKey:      null,
        active:      true,
        online:      true
    },

    BLACK_MARBLE: {
        label:         'blackMarble',
        url:           'http://dev.virtualearth.net',
        ellipsoid:     Cesium.Ellipsoid.WGS84,
        maximumLevel:  8
    },

    NATURAL_EARTH_II: {
        label:       'naturalEarthII',
        url:         'bower_components/cesiumjs/Build/Cesium/Assets/Textures/NaturalEarthII',
        ellipsoid:   Cesium.Ellipsoid.WGS84
    },

    WEB_MAP_SERVICE: {
        label:       'WebMapService',
        url:         'http://localhost:8080/geoserver/example/wms',
        layers:      '',
        ellipsoid:   Cesium.Ellipsoid.WGS84
    },

    SINGLE_TILE: {
        label:       'SingleTile',
        url:         '/path/to/file',
        credit:      ''
    },

    TILE_MAP_SERVICE: {
        label:          'TileMapService',
        url:            '/path/to/files/onServer',
        credit:         '',
        fileExtension:  'png',
        minimumLevel:   0,
        maximumLevel:   13,
        // rectangle:      Cesium.Rectangle.MAX_VALUE,
        ellipsoid:      Cesium.Ellipsoid.WGS84,
        tilingScheme:   Cesium.GeographicTilingScheme,
        tileWidth:      256,
        tileHeight:     256
    }
})
    .constant('SCENE_MODE', {
        'scene2d':       Cesium.SceneMode.SCENE2D,
        'scene3d':       Cesium.SceneMode.SCENE3D,
        'sceneColumbus': Cesium.SceneMode.COLUMBUS_VIEW
    })
    .constant('PIN_COLLECTION_MAKI', {
        camera: 'camera'
    })
;

angular.module('cesiumjs.widget', ['angular-md5'])

    .controller('WidgetController', [
        '$scope', '$attrs', '$parse', '$log', 'CesiumjsWidgetService',
        function($scope, $attrs, $parse, $log, CesiumjsWidgetService) {
            /**
             *
             * @param element
             */
            this.init = function(element) {
                $log.debug('WidgetController: init');
                this.$element = element;

                var mapId = this.$element[0].id,
                    options = {
                        scene3DOnly: $attrs.scene3dOnly.toLowerCase() === 'true' || $attrs.scene3dOnly === '1'
                    };

                if ($attrs.noDefaultImagery.toLowerCase() === 'true' || $attrs.noDefaultImagery === '1') {
                    options.imageryProvider = false;
                }

                CesiumjsWidgetService.initViewer(mapId, options);
            };
        }
    ])

    .service('CesiumjsWidgetService', [
        '$q', '$log', 'md5', 'IMAGERY_PROVIDER', 'PIN_COLLECTION_MAKI',

        function ($q, $log, md5, IMAGERY_PROVIDER, PIN_COLLECTION_MAKI) {
            var _viewer,
                _scene,
                _clock,
                _primitives,
                _camera,
                _pinBuilder,
                _billboardCollection,
                _billboardPins,
                _customMarkers,
                _polyLineCollection,
                _labeledImageryLayers,
                _polyLines,
                _readyDeferred = $q.defer(),
                _promises = [_readyDeferred.promise],
                _self = this,
                _math = Cesium.Math;

            this.animationMethod = null;

            /**
             *
             * @param div {string}
             * @param options {{showRenderLoopErrors:boolean}}
             */
            this.initViewer = function(div, options) {
                $log.debug('CesiumjsWidgetService: initViewer started');
                if (!angular.isDefined(_viewer) || _viewer.isDestroyed()) {
                    $log.debug('CesiumjsWidgetService: initViewer creating widget');

                    options.showRenderLoopErrors = true;
                    options.targetFrameRate = 60;

                    _viewer                 = new Cesium.CesiumWidget(div, options);
                    _viewer.resolutionScale = 2.0;

                    _scene                  = _viewer.scene;
                    _clock                  = _viewer.clock;

                    _camera                 = _scene.camera;
                    _primitives             = _scene.primitives;
                    _primitives.globe       = new Cesium.Globe( Cesium.Ellipsoid.WGS84 );

                    _labeledImageryLayers   = _labeledImageryLayers || {};
                    _polyLineCollection     = _primitives.add(new Cesium.PolylineCollection());
                    _billboardCollection    = _primitives.add(new Cesium.BillboardCollection());
                    _pinBuilder             = new Cesium.PinBuilder();

                    _primitives.globe    = new Cesium.Globe( Cesium.Ellipsoid.WGS84 );
                    _scene.sun           = new Cesium.Sun();
                    _scene.moon          = new Cesium.Moon();
                    _scene.skyAtmosphere = new Cesium.SkyAtmosphere();
                    _scene.skyBox        = this.generateSkyBox();

                } else if ( angular.isDefined(_viewer) ) {
                    $log.warn('CesiumjsWidgetService: initViewer already exists');
                }

                _readyDeferred.resolve(function() {
                    $log.debug('CesiumjsWidgetService: init Viewer success');
                });
            };

            /**
             *
             * @param label {string} unique identifier for this marker
             * @param imagePath {string} path to the image
             * @param size {number} size of image
             * @param latitude {number} -90 - 90
             * @param longitude {number} -180 through 180
             * @param altitude {number} meters
             * @param shown {boolean}
             */
            this.addCustomMarker = function(label, imagePath, size, latitude, longitude, altitude, shown) {
                this.whenReady(function() {
                    $log.debug('CesiumjsWidgetService: addCustomMarker ' + imagePath + ' [' + latitude + ',' + longitude + ']');
                    var hash = md5.createHash(label);

                    _customMarkers = _customMarkers || {};

                    size = angular.isNumber(size) && size > 5 ? size : 128;

                    _customMarkers[hash] = _billboardCollection.add( {
                        image: imagePath,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
                        show: !!shown
                    });
                });
            };

            this.addImageryLayer = function(label, provider) {
                this.whenReady(function() {
                    _labeledImageryLayers[label] = _scene.imageryLayers.addImageryProvider(provider);
                });
            };

            /**
             *
             * @param label
             * @param type
             * @param cssColorString
             * @param size
             * @param latitude
             * @param longitude
             * @param shown
             *
             */
            this.addMarker = function(label, type, cssColorString, size, latitude, longitude, shown) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: addMarker ' + type + ' [' + latitude + ',' + longitude + ']');

                    _billboardPins = _billboardPins || {};

                    if (!angular.isDefined(PIN_COLLECTION_MAKI[type])) {
                        $log.error('CesiumjsWidgetService: addMarker - invalid marker type = ' + type);
                    }

                    size = angular.isNumber(size) && size > 5 ? size : 48;
                    var color = Cesium.Color.fromCssColorString(cssColorString),
                        billboardHash = md5.createHash(label);

                    Cesium.when(_pinBuilder.fromMakiIconId(type, color, size),
                        function (canvas) {
                            $log.debug('CesiumjsWidgetService: addMarker canvas created');
                            _billboardPins[billboardHash] = _billboardCollection.add({
                                image: canvas,
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 0),
                                show: !!shown
                            });
                        }
                    );
                });
            };

            /**
             *
             * @param label
             * @param points
             * @param color
             * @param clearPrevious
             */
            this.addPolyLine = function(label, points, color, clearPrevious) {
                $q.all(_promises).then( function() {

                    $log.debug('CesiumjsWidgetService: addPolyLine');
                    _polyLines = _polyLines || {};

                    if (clearPrevious) {
                        _polyLineCollection.removeAll();
                    }

                    _polyLines[label] = _polyLineCollection.add( {
                        positions: Cesium.Cartesian3.fromDegreesArrayHeights(points),
                        width: 2.0,
                        material : Cesium.Material.fromType('Color', {
                            color : Cesium.Color.fromCssColorString(color)
                        })
                    });
                });
            };

            /**
             *
             * @param action {string}
             * @param valueInDegrees {number}
             */
            this.adjustCamera = function(action, valueInDegrees) {
                $q.all(_promises).then( function() {
                    var value = _math.toRadians(valueInDegrees);
                    switch (action) {
                        case 'roll':
                        case 'twistRight': {
                            _camera.twistRight(value);
                            break;
                        }

                        case 'lookUp':
                        case 'tilt': {
                            _camera.lookUp(value);
                            break;
                        }

                        default: {
                            if (angular.isFunction(_camera[action])) {
                                _camera[action](value);
                            }
                        }
                    }
                });
            };

            /**
             * for raw camera animations.  use only when you're sure that cesium is ready
             * @param action {string}
             * @param valueInDegrees {number}
             */
            this._adjustCamera = function(action, valueInDegrees) {
                if (!angular.isDefined(_camera)) {
                    return;
                }

                var value = _math.toRadians(valueInDegrees);
                switch (action) {
                    case 'roll':
                    case 'twistRight': {
                        _camera.twistRight(value);
                        break;
                    }

                    case 'lookUp':
                    case 'tilt': {
                        _camera.lookUp(value);
                        break;
                    }

                    default: {
                        if (angular.isFunction(_camera[action])) {
                            _camera[action](value);
                        }
                    }
                }
            };

            /**
             *
             * @param options {{}}
             */
            this.adjustClock = function(options) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: adjusting Clock');
                    $log.debug(options);

                    options = angular.isObject(options) ? options : {};

                    if (angular.isDate(options.startTime)) {
                        _clock.startTime = Cesium.JulianDate.fromDate(options.startTime);
                    }
                    if (angular.isDate(options.currentTime)) {
                        _clock.currentTime = Cesium.JulianDate.fromDate(options.currentTime);
                    }

                    if (angular.isDate(options.stopTime)) {
                        _clock.stopTime = Cesium.JulianDate.fromDate(options.stopTime);
                    }

                    if (angular.isNumber(options.multiplier)) {
                        _clock.multiplier = options.multiplier;
                    }

                    if (angular.isDefined(Cesium.ClockStep[options.clockStep])) {
                        _clock.clockStep = options.clockStep;
                    }

                    if (angular.isDefined(Cesium.ClockRange[options.clockRange])) {
                        _clock.clockRange = clockRange;
                    }
                });
            };

            /**
             *
             * @param enable
             */
            this.enableDebug = function(enable) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: enableDebug ' + enable);
                    _scene.debugShowFramesPerSecond = !!enable;
                });
            };

            /**
             *
             * @param enable
             */
            this.enableDefaultHandlers = function(enable) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: enableDefaultHandlers ' + enable);
                    enable = !!enable;
                    _scene.screenSpaceCameraController.enableLook = enable;
                    _scene.screenSpaceCameraController.enableTilt = enable;
                    _scene.screenSpaceCameraController.enableZoom = enable;
                    _scene.screenSpaceCameraController.enableRotate = enable;
                    _scene.screenSpaceCameraController.enableTranslate = enable;
                });
            };

            /**
             *
             * @param enable {boolean}
             */
            this.enableMoon = function(enable) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: enableMoon ' + enable);
                    _viewer.scene.moon.show = !!enable;
                });
            };

            /**
             *
             * @param enable
             */
            this.enableSkyAtmosphere = function(enable) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: enableAtmosphere ' + enable);
                    _scene.skyAtmosphere.show = !!enable;
                });

            };

            /**
             *
             * @param enable {boolean}
             */
            this.enableSkyBox = function(enable) {
                this.whenReady(function(){
                    $log.debug('CesiumjsWidgetService: enableSkyBox ' + enable);
                    _scene.skyAtmosphere.show = !!enable;
                });
            };

            /**
             *
             * @param enable {boolean}
             */
            this.enableSun = function(enable) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: enableSun ' + enable);
                    _scene.sun.show = !!enable;
                });
            };

            /**
             *
             * @param provider {{label: string, url:string}}
             * @return ImageryLayer|null
             */
            this.generateImageryProvider = function(provider) {
                $log.debug('CesiumjsWidgetService: generateImageryProvider ' + provider.label);
                $log.debug(provider);
                var layer;

                switch(provider.label) {
                    case IMAGERY_PROVIDER.BING.label: {
                        var key = provider.apiKey || Cesium.BingMapsApi.defaultKey;
                        Cesium.BingMapsApi.defaultKey = key;
                        layer = new Cesium.BingMapsImageryProvider({
                            url : provider.url,
                            key : key,
                            mapStyle : Cesium.BingMapsStyle.AERIAL
                        });
                        break;
                    }

                    case IMAGERY_PROVIDER.BLACK_MARBLE.label: {
                        layer = new Cesium.TileMapServiceImageryProvider({
                            url:          provider.url,
                            maximumLevel: provider.maximumLevel
                        });
                        break;
                    }

                    case IMAGERY_PROVIDER.NATURAL_EARTH_II.label: {
                        layer = new Cesium.TileMapServiceImageryProvider({
                            url: provider.url
                        });
                        break;
                    }

                    case IMAGERY_PROVIDER.WEB_MAP_SERVICE.label: {
                        layer = new Cesium.WebMapServiceImageryProvider( {
                            url:          provider.url,
                            layers:       provider.layers,
                            maximumLevel: provider.maximumLevel,
                            minimumLevel: provider.minimumLevel,
                            parameters:   provider.parameters
                        });
                        break;
                    }

                    case IMAGERY_PROVIDER.SINGLE_TILE.label: {
                        layer = new Cesium.SingleTileImageryProvider({
                            url: provider.url
                        });
                        break;
                    }

                    case IMAGERY_PROVIDER.TILE_MAP_SERVICE.label: {
                        layer = new Cesium.TileMapServiceImageryProvider( provider );
                        break;
                    }

                    default: {
                        $log.error('no supported image provider:' + provider.label);
                        return null;
                    }
                }

                return layer;
            };

            /**
             * @returns {Cesium.SkyBox}
             * //TODO: figure out why this interferes with sun rendering
             */
            this.generateSkyBox = function() {

                //$log.debug('CesiumjsWidgetService: generateSkyBox');
                //$log.error('CesiumjsWidgetService: generateSkyBox Error: Should not use this.' +
                //'  Custom SkyBox is not refreshing so sun smears');

                var skyBoxBaseUrl = 'bower_components/cesiumjs/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80';
                return Cesium.SkyBox({
                    show: false,
                    sources : {
                        positiveX: skyBoxBaseUrl + '_px.jpg',
                        negativeX: skyBoxBaseUrl + '_mx.jpg',
                        positiveY: skyBoxBaseUrl + '_py.jpg',
                        negativeY: skyBoxBaseUrl + '_my.jpg',
                        positiveZ: skyBoxBaseUrl + '_pz.jpg',
                        negativeZ: skyBoxBaseUrl + '_mz.jpg'
                    }
                });
            };

            /**
             *
             * @returns {Date}
             */
            this.getCurrentTime = function() {
                var deferred = $q.defer();
                $q.all(_promises).then(
                    function() {
                        deferred.resolve( Cesium.JulianDate.toDate(_clock.currentTime) );
                    },
                    function(errors) {
                        deferred.reject(errors);
                    },
                    function(updates) {
                        deferred.update(updates);
                    });
                return deferred.promise;
            };

            /**
             *
             */
            this.hideAllCustomMarkers = function() {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: hideAllMarkers ');
                    _customMarkers = _customMarkers || {};

                    angular.forEach(_customMarkers, function(marker) {
                        marker.show = false;
                    });
                });
            };

            /**
             *
             */
            this.hideAllMarkers = function() {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: hideAllMarkers ');
                    _billboardPins = _billboardPins || {};

                    angular.forEach(_billboardPins, function(pin) {
                        pin.show = false;
                    });
                });
            };

            /**
             *
             * @param label
             */
            this.hideCustomMarker = function(label) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: hideCustomMarker ' + label);

                    _customMarkers = _customMarkers || {};

                    var hash = md5.createHash(label);
                    if (angular.isDefined( _customMarkers[ hash ] )) {
                        _customMarkers[hash].show = false;
                    }
                });
            };

            /**
             *
             * @param label
             */
            this.hideMarker = function(label) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: hideMarker ' + label);

                    _billboardPins = _billboardPins || {};

                    var billboardHash = md5.createHash(label);
                    if (angular.isDefined(_billboardPins[billboardHash])) {
                        _billboardPins[billboardHash].show = false;
                    }
                });
            };

            /**
             *
             * @param label {string}
             * @param latitude {number}
             * @param longitude {number}
             * @param altitude {number}
             */
            this.moveCustomMarker = function(label, latitude, longitude, altitude) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: moveCustomMarker ' + label);

                    _customMarkers = _customMarkers || {};

                    var hash = md5.createHash(label);
                    if (angular.isDefined( _customMarkers[ hash ] )) {
                        _customMarkers[hash].position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
                    }
                });
            };

            /**
             *
             */
            this.removeAllMarkers = function() {
                $q.all(_promises).then(function() {
                    $log.debug('CesiumjsWidgetService: removeAllMarkers ' + _billboardCollection.length);
                    if (_billboardCollection.length > 0) {
                        _billboardCollection.removeAll();
                    }
                    _billboardPins = {};
                });
            };

            /**
             *
             */
            this.removeAllPolyLines = function() {
                $q.all(_promises).then(function() {
                    $log.debug('CesiumjsWidgetService: removeAllPolyLines ' + _polyLineCollection.length);
                    if (_polyLineCollection.length > 0) {
                        _polyLineCollection.removeAll();
                    }
                    _polyLines = {};
                });
            };

            /**
             *
             * @param label
             */
            this.removeMarker = function(label) {
                $log.debug('CesiumjsWidgetService: removeMarker deferring ' + label);
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: removeMarker ' + label);

                    _billboardPins = _billboardPins || {};

                    var hash = md5.createHash(label);
                    if (angular.isDefined(_billboardPins[hash])) {
                        _billboardCollection.remove(_billboardPins[hash]);
                        delete _billboardPins[hash];
                    }
                });
            };

            /**
             *
             * @param label
             */
            this.removePolyLine = function(label) {
                $q.all(_promises).then( function() {
                    _polyLineCollection.remove(_polyLines[label]);
                    delete _polyLines[label];
                });
            };

            /**
             *
             * @param label {string}
             */
            this.setActiveLayer = function(label) {
                this.whenReady(function() {
                    if (angular.isDefined(_labeledImageryLayers[label])) {
                        _labeledImageryLayers[label].alpha = 1.0;
                        _scene.imageryLayers.raiseToTop(_labeledImageryLayers[label]);
                        for (var i = 1; i < _scene.imageryLayers; i++) {
                            _scene.imageryLayers.get(i).alpha = 0.0;
                        }

                    } else {
                        $log.error('CesiumjsWidgetService: setActiveProvider failed ' + label + ' does not exist');
                    }
                });
            };

            /**
             *
             * @param latitude {number} decimal -90 to +90
             * @param longitude {number} decimal -179.9999 to 180.0
             * @param altitude {number} meters
             * @param animate {boolean}
             */
            this.setCameraPosition = function(latitude, longitude, altitude, animate) {
                $q.all(_promises).then( function() {
                    //$log.debug('CesiumjsWidgetService: setCameraPosition: [' + latitude+','+longitude+']');
                    if (!!animate) {
                        _camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude)
                        });
                    } else {
                        _camera.setPositionCartographic(Cesium.Cartographic.fromDegrees(longitude, latitude, altitude));
                    }
                }, function(reason) {
                    $log.error('CesiumjsWidgetService: setCameraPosition Failed:');
                    (reason || angular.noop)();
                }, function(update) {
                    $log.warn('CesiumjsWidgetService: setCameraPosition update: ' + update);
                });
            };

            /**
             * for raw camera animations.  use only when you're sure that cesium is ready
             * @param latitude
             * @param longitude
             * @param altitude
             * @param animate
             * @private
             */
            this._setCameraPosition = function(latitude, longitude, altitude, animate) {
                if (!angular.isDefined(_camera)) {
                    return;
                }

                if (!!animate) {
                    _camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude)
                    });
                } else {
                    _camera.setPositionCartographic(Cesium.Cartographic.fromDegrees(longitude, latitude, altitude));
                }			};

            /**
             *
             * @param goFullScreen {boolean}
             */
            this.setFullScreen = function(goFullScreen) {
                $q.all(_promises).then( function() {
                    if (!!goFullScreen) {
                        $log.debug('CesiumjsWidgetService: setFullScreen mode: ' + !!goFullScreen);
                        Cesium.Fullscreen.requestFullscreen(_scene.canvas);

                    } else {
                        Cesium.Fullscreen.exitFullscreen();
                    }
                });
            };

            /**
             *
             * @param mode
             * @param animate {boolean}
             */
            this.setSceneMode = function(mode, animate) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: Screen mode setting to: ' + mode);

                    animate = animate === null ? true : !!animate;

                    switch (mode) {
                        case Cesium.SceneMode.SCENE3D:
                        {
                            _scene.morphTo3D();
                            break;
                        }

                        case Cesium.SceneMode.SCENE2D:
                        {
                            if (!_scene.scene3DOnly) {
                                _scene.morphTo2D();

                            } else {
                                $log.error('CesiumjsWidgetService: "3D mode only" was set. Cannot change to a 2D mode');
                                return;
                            }
                            break;
                        }

                        case Cesium.SceneMode.COLUMBUS_VIEW:
                        {
                            if (!_scene.scene3DOnly) {
                                _scene.morphToColumbusView();
                            } else {
                                $log.error('CesiumjsWidgetService: "3D mode only" was set. Cannot change to a 2D mode');
                                return;
                            }
                            break;
                        }

                        default:
                        {
                            $log.error('CesiumjsWidgetService: invalid Screen mode set');
                            return;
                        }
                    }

                    if (!animate) {
                        _scene.completeMorph();
                    }
                });
            };

            /**
             *
             */
            this.showAllMarkers = function() {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: shpowAllMarkers ');
                    _billboardPins = _billboardPins || {};

                    angular.forEach(_billboardPins, function(pin) {
                        pin.show = true;
                    });
                });
            };

            /**
             *
             * @param label
             */
            this.showCustomMarker = function(label) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: hideMarker ' + label);

                    _customMarkers = _customMarkers || {};

                    var hash = md5.createHash(label);
                    if (angular.isDefined(_customMarkers[hash])) {
                        _customMarkers[hash].show = true;
                    }
                });
            };

            /**
             *
             * @param label
             */
            this.showMarker = function(label) {
                $q.all(_promises).then( function() {
                    $log.debug('CesiumjsWidgetService: hideMarker ' + label);

                    _billboardPins = _billboardPins || {};

                    var billboardHash = md5.createHash(label);
                    if (angular.isDefined(_billboardPins[billboardHash])) {
                        _billboardPins[billboardHash].show = true;
                    }
                });
            };

            /**
             * for raw camera animations.  use only when you're sure that cesium is ready pair with whenReady()
             */
            this.tick = function() {
                //$q.all(_promises).then( function() {
                _scene.initializeFrame();
                if (angular.isFunction(_self.animationMethod)) {
                    _self.animationMethod(Cesium.JulianDate.toDate(_clock.currentTime));
                }
                _scene.render();

                Cesium.requestAnimationFrame(_self.tick);
                //});
            };

            /**
             *
             * @param callback
             * @returns {promise}
             */
            this.whenReady = function(callback) {
                $log.debug('CesiumjsWidgetService: whenReady');
                if (angular.isFunction(callback)) {
                    $q.all(_promises).then(callback);
                }

                return $q.all(_promises).promise;
            };
        }
    ])

    .directive('cesiumWidget', [
        '$log',
        function ($log) {
            return {
                restrict: 'EA',
                controller: 'WidgetController',
                scope: {},
                replace: false,
                link: function (scope, element, attrs, ctrl) {
                    if (!angular.isDefined(element[0]) || element[0].id === '') {
                        $log.error('cesiumWidget: An ID must exist for Cesium to initialize');
                        return;
                    }

                    ctrl.init( element );
                }
            };
        }
    ])
;

