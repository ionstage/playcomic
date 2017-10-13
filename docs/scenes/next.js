(function(scene) {
  scene.ready(function(context) {
    var panel = scene.create('panel', {
      height: 360,
      border: false,
      image: 'image',
      captions: [
        { x: 24, y: 96, text: 'Selected: Option ' + (context.selectedIndex + 1) },
      ],
    });

    var restartButton = scene.create('restart-button');

    restartButton.on('tap', function() {
      scene.restart();
    });

    scene.append([panel, restartButton]);
  });
})(this.app.scene);
