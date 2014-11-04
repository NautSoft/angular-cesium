describe('viewer', function () {
  var $scope;

  beforeEach(module('cesiumjs.viewer'));
  beforeEach(module('template/viewer/viewer.html'));

  beforeEach(inject(function ($rootScope) {
    $scope = $rootScope;
  }));

  describe('controller', function () {

    var ctrl, $element, $attrs;
    beforeEach(inject(function($controller) {
      $attrs = {}; $element = {};
      ctrl = $controller('ViewerController', { $scope: $scope, $element: $element, $attrs: $attrs });
    }));

//    describe('addGroup', function() {
//      it('adds a the specified panel to the collection', function() {
//        var group1, group2;
//        ctrl.addGroup(group1 = $scope.$new());
//        ctrl.addGroup(group2 = $scope.$new());
//        expect(ctrl.groups.length).toBe(2);
//        expect(ctrl.groups[0]).toBe(group1);
//        expect(ctrl.groups[1]).toBe(group2);
//      });
//    });

  });

});
