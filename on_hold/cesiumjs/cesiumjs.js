angular.module('cesiumjs', [])
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
            customLabel:   'blackMarble',
            url:           'http://dev.virtualearth.net',
            ellipsoid:     Cesium.Ellipsoid.WGS84,
            maximumLevel:  8,
            active:        true,
            online:        true
        },

        NATURAL_EARTH_II: {
            label:       'naturalEarthII',
            customLabel: 'naturalEarthII',
            url:         'bower_components/cesiumjs/Build/Cesium/Assets/Textures/NaturalEarthII',
            ellipsoid:   Cesium.Ellipsoid.WGS84,
            active:      true,
            online:      false
        },

        WORLDSAT_EARTH: {
            label:       'SeattleMoF',
            customLabel: 'SeattleMoF',
            url:         'http://localhost:8080/geoserver/Seattle.MoF/wms',
            ellipsoid:   Cesium.Ellipsoid.WGS84,
            active:      true,
            online:      false
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
