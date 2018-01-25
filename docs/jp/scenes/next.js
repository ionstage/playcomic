(function(scene) {
  scene.ready(function(context) {
    var panel = scene.create('panel', {
      height: 360,
      border: false,
      image: 'image',
      captions: [
        { x: 24, y: 96, text: '<div><ruby>選択<rt>せんたく</rt>： オプション' + ['１', '２', '３'][context.selectedIndex] + '</div>' },
      ],
    });

    var restartButton = scene.create('restart-button', {
      label: 'もういちど',
    });

    restartButton.on('tap', function() {
      scene.restart();
    });

    scene.append([panel, restartButton]);
  });
})(this.app.scene);
