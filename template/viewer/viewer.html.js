angular.module("template/viewer/viewer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/viewer/viewer.html",
    "<div class=\"cesium-viewer\" ng-transclude></div>");
}]);
