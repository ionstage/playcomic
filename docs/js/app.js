(function(app) {
  'use strict';

  var content = app.content;

  var helper = (function() {
    var helper = {};

    helper.inherits = function(ctor, superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true,
        },
      });
      return ctor;
    };

    helper.toArray = function(value) {
      return Array.prototype.slice.call(value);
    };

    return helper;
  })();

  var dom = (function() {
    var dom = {};

    dom.body = function() {
      return document.body;
    };

    dom.find = function(el, selector) {
      return el.querySelector(selector);
    };

    dom.render = function(s) {
      var el = document.createRange().createContextualFragment(s).firstChild;
      el.parentNode.removeChild(el);
      return el;
    };

    dom.text = function(el, s) {
      el.textContent = s;
    };

    dom.html = function(el, s) {
      el.innerHTML = s;
    };

    dom.append = function(parent, el) {
      parent.appendChild(el);
    };

    dom.remove = function(el) {
      el.parentNode.removeChild(el);
    };

    dom.css = function(el, props) {
      var style = el.style;
      Object.keys(props).forEach(function(key) {
        style[key] = props[key];
      });
    };

    dom.toggleClass = function(el, className, force) {
      if (force) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    };

    dom.transform = function(el, value) {
      dom.css(el, {
        transform: value,
        webkitTransform: value,
      });
    };

    dom.translate = function(el, x, y) {
      dom.transform(el, 'translate(' + x + 'px, ' + y + 'px)');
    };

    dom.scrollTo = function(x, y) {
      window.scrollTo(x, y);
    };

    dom.ajax = function(opt) {
      var type = opt.type;
      var url = opt.url;
      return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        var onfailed = function() {
          reject(new Error('Failed to load resource: ' + type + ' ' + url));
        };
        req.onload = function() {
          if (req.status >= 200 && req.status < 400) {
            resolve(req.response);
          } else {
            onfailed();
          }
        };
        req.onerror = onfailed;
        req.onabort = onfailed;
        req.open(type, url, true);
        req.send();
      });
    };

    dom.loadScript = function(url) {
      return dom.ajax({ type: 'GET', url: url }).then(function(text) {
        var el = document.createElement('script');
        el.textContent = text;
        document.body.appendChild(el);
        document.body.removeChild(el);
      });
    };

    dom.supportsTouch = function() {
      return ('createTouch' in document);
    };

    dom.changedTouch = function(event) {
      return (dom.supportsTouch() ? event.changedTouches[0] : null);
    };

    dom.target = function(event) {
      var touch = dom.changedTouch(event);
      return (touch ? document.elementFromPoint(touch.clientX, touch.clientY) : event.target);
    };

    dom.removeFocus = function() {
      document.activeElement.blur();
    };

    dom.eventType = function(name) {
      var supportsTouch = dom.supportsTouch();
      switch (name) {
        case 'start':
          return (supportsTouch ? 'touchstart' : 'mousedown');
        case 'move':
          return (supportsTouch ? 'touchmove' : 'mousemove');
        case 'end':
          return (supportsTouch ? 'touchend' : 'mouseup');
        default:
          throw new Error('Invalid event type');
      }
    };

    dom.pageX = function(event) {
      return (dom.changedTouch(event) || event).pageX;
    };

    dom.pageY = function(event) {
      return (dom.changedTouch(event) || event).pageY;
    };

    dom.on = function(el, type, listener, useCapture) {
      el.addEventListener(type, listener, !!useCapture);
    };

    dom.off = function(el, type, listener, useCapture) {
      el.removeEventListener(type, listener, !!useCapture);
    };

    dom.beforeunload = function(listener) {
      window.addEventListener('beforeunload', listener);
    };

    dom.Draggable = (function() {
      var Draggable = function(props) {
        this.element = props.element;
        this.onstart = props.onstart;
        this.onmove = props.onmove;
        this.onend = props.onend;
        this.move = this.move.bind(this);
        this.end = this.end.bind(this);
        this.startPageX = 0;
        this.startPageY = 0;
        this.context = {};
        dom.on(this.element, dom.eventType('start'), this.start.bind(this));
      };

      Draggable.prototype.start = function(event) {
        dom.on(document, dom.eventType('move'), this.move);
        dom.on(document, dom.eventType('end'), this.end);
        this.startPageX = dom.pageX(event);
        this.startPageY = dom.pageY(event);
        if (typeof this.onstart === 'function') {
          this.onstart(event, this.context);
        }
      };

      Draggable.prototype.move = function(event) {
        if (typeof this.onmove === 'function') {
          var dx = dom.pageX(event) - this.startPageX;
          var dy = dom.pageY(event) - this.startPageY;
          this.onmove(event, this.context, dx, dy);
        }
      };

      Draggable.prototype.end = function(event) {
        dom.off(document, dom.eventType('move'), this.move);
        dom.off(document, dom.eventType('end'), this.end);
        if (typeof this.onend === 'function') {
          this.onend(event, this.context);
        }
      };

      return Draggable;
    })();

    return dom;
  })();

  var Component = (function() {
    var Component = function() {
      this.listeners = {};
    };

    Component.prototype.load = function() { return Promise.resolve(); };

    Component.prototype.redraw = function() {};

    Component.prototype.on = function(type, listener) {
      if (!this.listeners.hasOwnProperty(type)) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(listener);
    };

    Component.prototype.emit = function() {
      var args = helper.toArray(arguments);
      var type = args.shift();
      if (this.listeners.hasOwnProperty(type)) {
        this.listeners[type].forEach(function(listener) {
          listener.apply(this, args);
        }.bind(this));
      }
    };

    Component.prototype.removeAllListeners = function(type) {
      if (this.listeners.hasOwnProperty(type)) {
        delete this.listeners[type];
      } else {
        this.listeners = {};
      }
    };

    Component.prototype.oninit = function() {};

    Component.inherits = function(initializer) {
      var superCtor = this;
      return helper.inherits(function(props) {
        superCtor.call(this);
        initializer.call(this, props);
        this.oninit();
      }, superCtor);
    };

    return Component;
  })();

  var Panel = (function() {
    var Panel = Component.inherits(function(props) {
      this.element = dom.render(Panel.HTML_TEXT);
      this.height = props.height;
      this.hasBorder = (props.border !== false);
      this.image = props.image || '';
      this.captions = props.captions || [];
    });

    Panel.prototype.load = function() {
      if (this.image) {
        return dom.ajax({ type: 'GET', url: 'images/' + this.image + '.svg' }).then(function(text) {
          dom.html(dom.find(this.element, '.panel-image'), text);
        }.bind(this));
      } else {
        return Promise.resolve();
      }
    };

    Panel.prototype.redraw = function() {
      dom.css(this.element, { height: this.height + 'px' });
      dom.toggleClass(this.element, 'no-border', !this.hasBorder);
      this.captions.forEach(function(caption) {
        var el = dom.render('<div class="panel-caption"></div>');
        dom.translate(el, caption.x, caption.y);
        dom.html(el, caption.text.replace(/\n/g, '<br>'));
        dom.append(this.element, el);
      }.bind(this));
    };

    Panel.HTML_TEXT = [
      '<div class="panel content-item">',
        '<div class="panel-image"></div>',
      '</div>',
    ].join('');

    return Panel;
  })();

  var Choice = (function() {
    var Choice = Component.inherits(function(props) {
      this.element = dom.render(Choice.HTML_TEXT);
      this.title = props.title || '';
      this.options = props.options || [];
      this.optionComponents = [];
    });

    Choice.prototype.redraw = function() {
      dom.text(dom.find(this.element, '.choice-title'), this.title);
      var ontap = this.ontap.bind(this);
      this.optionComponents = this.options.map(function(option) {
        var component = new Choice.Option({ text: option });
        component.on('tap', ontap);
        dom.append(this.element, component.element);
        return component;
      }.bind(this));
    };

    Choice.prototype.ontap = function(component) {
      var selectedIndex = -1;
      this.optionComponents.forEach(function(optionComponent, index) {
        optionComponent.selected(optionComponent === component);
        if (optionComponent === component) {
          selectedIndex = index;
        }
      }.bind(this));
      this.emit('select', selectedIndex);
    };

    Choice.HTML_TEXT = [
      '<div class="choice content-item">',
        '<div class="choice-title"></div>',
      '</div>',
    ].join('');

    Choice.Option = (function() {
      var Option = Component.inherits(function(props) {
        this.element = dom.render(Choice.Option.HTML_TEXT);
        this.button = new Button({
          element: this.element,
          tapper: this.ontap.bind(this),
        });
        this.text = props.text;
      });

      Option.prototype.selected = function(value) {
        dom.toggleClass(this.element, 'selected', value);
      };

      Option.prototype.oninit = function() {
        dom.text(this.element, this.text);
        dom.toggleClass(this.element, 'hover', !dom.supportsTouch());
      };

      Option.prototype.ontap = function() {
        this.emit('tap', this);
      };

      Option.HTML_TEXT = '<div class="choice-option"></div>';

      return Option;
    })();

    return Choice;
  })();

  var Button = (function() {
    var Button = function(props) {
      this.element = props.element;
      this.tapper = props.tapper;
      new dom.Draggable({
        element: this.element,
        onstart: this.onstart.bind(this),
        onmove: this.onmove.bind(this),
        onend: this.onend.bind(this),
      });
      this.moved = false;
    };

    Button.prototype.isActive = function(value) {
      dom.toggleClass(this.element, 'active', value);
    };

    Button.prototype.disabled = function(value) {
      dom.toggleClass(this.element, 'disabled', value);
    };

    Button.prototype.onstart = function(event, context) {
      context.target = dom.target(event);
      dom.removeFocus();
      this.isActive(true);
      this.moved = false;
    };

    Button.prototype.onmove = function(event, context, dx, dy) {
      if (this.moved) {
        return;
      }
      this.moved = (Math.abs(dx) > 5 || Math.abs(dy) > 5);
      this.isActive(dom.target(event) === context.target && !this.moved);
    };

    Button.prototype.onend = function(event, context) {
      this.isActive(false);
      if (dom.target(event) === context.target && !this.moved) {
        this.tapper();
      }
    };

    return Button;
  })();

  var RestartButton = (function() {
    var RestartButton = Component.inherits(function(props) {
      this.element = dom.render(RestartButton.HTML_TEXT);
      this.button = new Button({
        element: dom.find(this.element, '.button'),
        tapper: this.ontap.bind(this),
      });
      this.disabled(!!props.disabled);
    });

    RestartButton.prototype.disabled = function(value) {
      this.button.disabled(value);
    };

    RestartButton.prototype.oninit = function() {
      dom.toggleClass(this.button.element, 'hover', !dom.supportsTouch());
    };

    RestartButton.prototype.ontap = function() {
      this.emit('tap');
    };

    RestartButton.HTML_TEXT = [
      '<div class="button-container content-item">',
        '<div class="button restart-button">Restart</div>',
      '</div>',
    ].join('');

    return RestartButton;
  })();

  var NextButton = (function() {
    var NextButton = Component.inherits(function(props) {
      this.element = dom.render(NextButton.HTML_TEXT);
      this.button = new Button({
        element: dom.find(this.element, '.button'),
        tapper: this.ontap.bind(this),
      });
      this.disabled(!!props.disabled);
    });

    NextButton.prototype.disabled = function(value) {
      this.button.disabled(value);
    };

    NextButton.prototype.oninit = function() {
      dom.toggleClass(this.button.element, 'hover', !dom.supportsTouch());
    };

    NextButton.prototype.ontap = function() {
      this.emit('tap');
    };

    NextButton.HTML_TEXT = [
      '<div class="button-container content-item">',
        '<div class="button next-button">Next</div>',
      '</div>',
    ].join('');

    return NextButton;
  })();

  var Scene = (function() {
    var Scene = function() {
      this.current = '';
      this.context = {};
    };

    Scene.prototype.ready = function(listener) {
      listener(this.context);
    };

    Scene.prototype.create = (function() {
      var map = {
        panel: Panel,
        choice: Choice,
        'restart-button': RestartButton,
        'next-button': NextButton,
      };
      return function(type, props) {
        return new map[type](props || {});
      };
    })();

    Scene.prototype.append = function(components) {
      var contentElement = dom.find(dom.body(), '.content');
      components.forEach(function(component) {
        dom.toggleClass(component.element, 'hide', true);
        component.redraw();
        dom.append(contentElement, component.element);
      });

      var showComponent = function(index) {
        var component = components[index];
        var now = Date.now();
        component.load().then(function() {
          var animationDelay = 100;
          var delay = Math.max(animationDelay - (Date.now() - now), 0);
          setTimeout(function() {
            dom.toggleClass(component.element, 'hide', false);
            if (index < components.length - 1) {
              showComponent(index + 1);
            }
          }, delay);
        });
      };

      showComponent(0);
    };

    Scene.prototype.load = function(name) {
      this.current = name;
      this.context = {};
      content.load(this.current, this.context);
      dom.append(dom.body(), dom.render('<div class="content"></div>'));
      dom.loadScript('scenes/' + name + '.js').then(function() {
        setTimeout(function() {
          dom.scrollTo(0, 0);
        }, dom.supportsTouch() ? 100 : 0);
        dom.remove(dom.find(dom.body(), '.content-hidden'));
      });
    };

    Scene.prototype.clear = function() {
      var el = dom.find(dom.body(), '.content');
      dom.toggleClass(el, 'content', false);
      dom.toggleClass(el, 'content-hidden', true);
    };

    Scene.prototype.next = function() {
      this.clear();
      setTimeout(function() {
        this.load(content.next(this.current, this.context));
      }.bind(this), 200);
    };

    Scene.prototype.restart = function() {
      this.clear();
      setTimeout(function() {
        content.restart(this.current, this.context);
        this.load('start');
      }.bind(this), 200);
    };

    return Scene;
  })();

  dom.beforeunload(function () {
    setTimeout(function() {
      dom.scrollTo(0, 0);
    }, 100);
  });

  app.scene = new Scene();
})(this.app || (this.app = {}));
