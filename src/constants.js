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
