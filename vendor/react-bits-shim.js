(function(window){
  // Minimal react-bits shim for offline demo. Exposes View, Text, Image, Touchable, Animated, StyleSheet.
  const React = window.React;
  if(!React) { console.error('React not found for react-bits-shim'); return; }

  function mergeStyle(s){ return s || {}; }

  function View(props){
    const { children, style, ...rest } = props || {};
    return React.createElement('div', Object.assign({}, rest, { style: mergeStyle(style) }), children);
  }
  function Text(props){
    const { children, style, ...rest } = props || {};
    return React.createElement('span', Object.assign({}, rest, { style: mergeStyle(style) }), children);
  }
  function Image(props){
    const { source, style, ...rest } = props || {};
    let src = '';
    if(source){ src = source.uri || source; }
    return React.createElement('img', Object.assign({}, rest, { src: src, style: Object.assign({display:'block'}, mergeStyle(style)) }));
  }
  function Touchable(props){
    const { children, onPress, style, ...rest } = props || {};
    const handle = function(e){ if(onPress) onPress(e); };
    return React.createElement('div', Object.assign({ onClick: handle, role: 'button', tabIndex: 0 }, rest, { style: Object.assign({cursor:'pointer'}, mergeStyle(style)) }), children);
  }

  // Minimal Animated API
  const Animated = (function(){
    class Value{
      constructor(v){ this._val = v; this._listeners = new Set(); }
      setValue(v){ this._val = v; this._listeners.forEach(fn=>fn(v)); }
      addListener(fn){ this._listeners.add(fn); return { remove: ()=>this._listeners.delete(fn) }; }
      removeAllListeners(){ this._listeners.clear(); }
      getValue(){ return this._val; }
    }
    function timing(value, opts){
      return {
        start(cb){
          const start = Date.now();
          const from = value.getValue();
          const to = ('toValue' in opts) ? opts.toValue : from;
          const duration = opts.duration || 300;
          let rafId = null;
          function step(){
            const t = Date.now() - start;
            const p = Math.min(1, t / duration);
            const cur = from + (to - from) * p;
            value.setValue(cur);
            if(p < 1) rafId = requestAnimationFrame(step);
            else { if(cb) cb(); }
          }
          rafId = requestAnimationFrame(step);
          return { stop: ()=>{ if(rafId) cancelAnimationFrame(rafId); } };
        }
      };
    }
    return { Value, timing };
  })();

  const StyleSheet = {
    create(obj){ return obj; }
  };

  window.ReactBits = window.ReactBits || {};
  Object.assign(window.ReactBits, { View, Text, Image, Touchable, Animated, StyleSheet });
})(this);