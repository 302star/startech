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
      constructor(v){ this._val = v; this._listeners = new Map(); this._id = 1; }
      setValue(v){ this._val = v; this._listeners.forEach((fn)=>fn.callback(v)); }
      addListener(fn){ const id = String(this._id++); this._listeners.set(id, { callback: fn }); return { remove: ()=>this._listeners.delete(id) }; }
      removeAllListeners(){ this._listeners.clear(); }
      getValue(){ return this._val; }
      // simple interpolation helper
      interpolate(){ return this._val; }
    }
    function timing(value, opts){
      return {
        start(cb){
          const start = Date.now();
          const from = Number(value.getValue()) || 0;
          const to = ('toValue' in opts) ? Number(opts.toValue) : from;
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

  // PressureText component: small component that responds to pointer pressure
  function PressureText(props){
    const { children, style, className, ...rest } = props || {};
    const ReactLocal = window.React;
    const [scale, setScale] = ReactLocal.useState(1);
    const ref = ReactLocal.useRef(null);
    function onPointerDown(e){
      const p = (typeof e.pressure === 'number') ? e.pressure : 0.5;
      setScale(1 - Math.min(0.12, 0.07 * p * 2));
      try{ ref.current && ref.current.setPointerCapture && ref.current.setPointerCapture(e.pointerId); }catch(_){}
    }
    function onPointerMove(e){ if(e.pressure!==undefined){ const p = e.pressure; setScale(1 - Math.min(0.12, 0.07 * p * 2)); } }
    function onPointerUp(e){ setScale(1); try{ ref.current && ref.current.releasePointerCapture && ref.current.releasePointerCapture(e.pointerId);}catch(_){} }
    const combined = Object.assign({ display:'inline-block', transform: `scale(${scale})`, transition:'transform 120ms ease' }, mergeStyle(style));
    return ReactLocal.createElement('span', Object.assign({ ref, onPointerDown, onPointerMove, onPointerUp, style: combined, className }, rest), children);
  }

  const StyleSheet = {
    create(obj){ return obj; }
  };

  window.ReactBits = window.ReactBits || {};
  Object.assign(window.ReactBits, { View, Text, Image, Touchable, Animated, StyleSheet, PressureText });
})(this);