(function(app) {
  var content = {};

  var data = { selectedIndex: -1 };

  content.load = function(name, context) {
    if (name === 'next') {
      context.selectedIndex = data.selectedIndex;
    }
  };

  content.next = function(current, context) {
    if (current === 'start') {
      data.selectedIndex = context.selectedIndex;
    }
    return 'next';
  };

  content.restart = function(current, context) {
    data.selectedIndex = -1;
  };

  app.content = content;
})(this.app || (this.app = {}));
