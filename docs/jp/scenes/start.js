(function(scene) {
  scene.ready(function(context) {
    var panels = [
      scene.create('panel', {
        height: 360,
        image: 'image',
        captions: [
          { x : 48, y: 72, text: '<div><ruby>見出<rt>みだ</rt></ruby>し１</div>' },
          { x : 360, y: 240, text: '<div><ruby>見出<rt>みだ</rt></ruby>し２</div>' },
        ],
      }),
      scene.create('panel', {
        height: 360,
        border: false,
        captions: [
          { x : 168, y: 96, text: '<div><ruby>見出<rt>みだ</rt></ruby>し３</div>' },
        ],
      }),
    ];

    var choice = scene.create('choice', {
      title: '<ruby>選択<rt>せんたく</rt></ruby>してください',
      options: [
        '１．オプション１',
        '２．オプション２',
        '３．オプション３',
      ],
    });

    var nextButton = scene.create('next-button', {
      disabled: true,
      label: '<ruby>次<rt>つぎ</rt>へ</ruby>',
    });

    choice.on('select', function(index) {
      nextButton.disabled(false);
      context.selectedIndex = index;
    });

    nextButton.on('tap', function() {
      scene.next();
    });

    scene.append(panels.concat([choice, nextButton]));
  });
})(this.app.scene);
