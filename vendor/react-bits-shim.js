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
      try{ ref.current && ref.current.setPointerCapture && ref.current.setPointerCapture(e.pointerId); }catch(_){ }
    }
    function onPointerMove(e){ if(e.pressure!==undefined){ const p = e.pressure; setScale(1 - Math.min(0.12, 0.07 * p * 2)); } }
    function onPointerUp(e){ setScale(1); try{ ref.current && ref.current.releasePointerCapture && ref.current.releasePointerCapture(e.pointerId);}catch(_){} }
    const combined = Object.assign({ display:'inline-block', transform: `scale(${scale})`, transition:'transform 120ms ease' }, mergeStyle(style));
    return ReactLocal.createElement('span', Object.assign({ ref, onPointerDown, onPointerMove, onPointerUp, style: combined, className }, rest), children);
  }

  // BlurText
  function BlurText(props){
    const { text = '', delay = 200, animateBy = 'words', className = '', direction = 'top' } = props || {};
    const ReactLocal = window.React;
    const elements = (animateBy === 'words') ? text.split(' ') : text.split('');
    const [inView, setInView] = ReactLocal.useState(false);
    const ref = ReactLocal.useRef(null);
    ReactLocal.useEffect(()=>{
      const el = ref.current; if(!el) return;
      const obs = new IntersectionObserver(([entry])=>{ if(entry.isIntersecting){ setInView(true); obs.unobserve(el); } }, { threshold: 0.1 });
      obs.observe(el); return ()=>obs.disconnect();
    },[]);
    const children = elements.map((segment, index)=>{
      const style = {};
      if(inView) style.animationDelay = `${(index * delay)/1000}s`;
      if(direction==='bottom') style.transform = 'translateY(50px)';
      return ReactLocal.createElement('span', { key:index, className: `blur-word${inView? ' animate' : ''}`, style }, (segment===' ' ? '\u00A0' : segment) + ((animateBy==='words' && index < elements.length-1) ? '\u00A0' : ''));
    });
    return ReactLocal.createElement('p', { ref, className }, children);
  }

  // ShinyText
  function ShinyText(props){
    const { text = '', pauseOnHover = false, className = '' } = props || {};
    const ReactLocal = window.React;
    const [paused, setPaused] = ReactLocal.useState(false);
    return ReactLocal.createElement('span', { className: `shiny-text ${className}${paused? ' paused' : ''}`, onMouseEnter: ()=> pauseOnHover && setPaused(true), onMouseLeave: ()=> pauseOnHover && setPaused(false) }, text);
  }

  // SpotlightCard
  function SpotlightCard(props){
    const { children, className = '', spotlightColor = 'rgba(255,255,255,0.25)' } = props || {};
    const ReactLocal = window.React;
    const ref = ReactLocal.useRef(null);
    function handleMouseMove(e){ if(!ref.current) return; const rect = ref.current.getBoundingClientRect(); ref.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`); ref.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`); ref.current.style.setProperty('--spotlight-color', spotlightColor); }
    return ReactLocal.createElement('div', { ref, onMouseMove: handleMouseMove, className: `card-spotlight ${className}` }, children);
  }

  // ClickSpark (canvas-based sparks)
  function ClickSpark(props){
    const { sparkColor = '#fff', sparkSize = 10, sparkRadius = 15, sparkCount = 8, duration = 400, easing = 'ease-out', extraScale = 1.0, children } = props || {};
    const ReactLocal = window.React;
    const canvasRef = ReactLocal.useRef(null);
    const sparksRef = ReactLocal.useRef([]);
    const easeFunc = ReactLocal.useCallback((t)=>{ switch(easing){ case 'linear': return t; case 'ease-in': return t*t; case 'ease-in-out': return t<0.5?2*t*t:-1+(4-2*t)*t; default: return t*(2-t); } }, [easing]);
    ReactLocal.useEffect(()=>{
      const canvas = canvasRef.current; if(!canvas) return; const parent = canvas.parentElement; if(!parent) return;
      const resizeCanvas = ()=>{ const { width, height } = parent.getBoundingClientRect(); canvas.width = width; canvas.height = height; };
      resizeCanvas(); const ro = new ResizeObserver(resizeCanvas); ro.observe(parent);
      const ctx = canvas.getContext('2d'); let animationId;
      const draw = (timestamp)=>{ ctx.clearRect(0,0,canvas.width,canvas.height); sparksRef.current = sparksRef.current.filter(spark=>{ const elapsed = timestamp - spark.startTime; if(elapsed >= duration) return false; const progress = elapsed / duration; const eased = easeFunc(progress); const distance = eased * sparkRadius * extraScale; const lineLength = sparkSize * (1 - eased); const x1 = spark.x + distance * Math.cos(spark.angle); const y1 = spark.y + distance * Math.sin(spark.angle); const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle); const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle); ctx.strokeStyle = sparkColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); return true; }); animationId = requestAnimationFrame(draw); };
      animationId = requestAnimationFrame(draw); return ()=>{ ro.disconnect(); cancelAnimationFrame(animationId); };
    }, [sparkColor, sparkSize, sparkRadius, duration, easeFunc, extraScale]);
    const handleClick = (e)=>{ const canvas = canvasRef.current; if(!canvas) return; const rect = canvas.getBoundingClientRect(); const now = performance.now(); sparksRef.current.push(...Array.from({ length: sparkCount }, (_, i)=>({ x: e.clientX - rect.left, y: e.clientY - rect.top, angle: (2 * Math.PI * i) / sparkCount, startTime: now }))); };
    return ReactLocal.createElement('div', { style: { position: 'relative', display: 'inline-block' }, onClick: handleClick }, ReactLocal.createElement('canvas', { ref: canvasRef, style: { position: 'absolute', width: '100%', height: '100%', top:0, left:0, pointerEvents:'none', zIndex:10 } }), children);
  }

  // StarBorder
  function StarBorder(props){
    const { className = '', color = 'white', speed = '6s', thickness = 1, children, ...rest } = props || {};
    const ReactLocal = window.React;
    return ReactLocal.createElement('button', Object.assign({ className: `star-border-container ${className}`, style: { padding: `${thickness}px 0` } }, rest), ReactLocal.createElement('div', { className: 'border-gradient-bottom', style: { background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed } }), ReactLocal.createElement('div', { className: 'border-gradient-top', style: { background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed } }), ReactLocal.createElement('div', { className: 'inner-content' }, children));
  }

  // TextPressure (adapted)
  function TextPressure(props){
    const { text = 'Compressa', fontFamily = 'System', fontUrl = '', width = true, weight = true, italic = true, alpha = false, flex = true, stroke = false, scale = false, textColor = '#FFFFFF', strokeColor = '#FF0000', className = '', minFontSize = 24 } = props || {};
    const ReactLocal = window.React;
    const containerRef = ReactLocal.useRef(null);
    const titleRef = ReactLocal.useRef(null);
    const spansRef = ReactLocal.useRef([]);
    const mouseRef = ReactLocal.useRef({ x:0, y:0 });
    const cursorRef = ReactLocal.useRef({ x:0, y:0 });
    const [fontSize, setFontSize] = ReactLocal.useState(minFontSize);
    const [scaleY, setScaleY] = ReactLocal.useState(1);
    const [lineHeight, setLineHeight] = ReactLocal.useState(1);
    const chars = text.split('');

    ReactLocal.useEffect(()=>{
      const handleMouseMove = e=>{ cursorRef.current.x = e.clientX; cursorRef.current.y = e.clientY; };
      const handleTouchMove = e=>{ const t = e.touches[0]; if(t){ cursorRef.current.x = t.clientX; cursorRef.current.y = t.clientY; } };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      if(containerRef.current){ const rect = containerRef.current.getBoundingClientRect(); mouseRef.current.x = rect.left + rect.width/2; mouseRef.current.y = rect.top + rect.height/2; cursorRef.current.x = mouseRef.current.x; cursorRef.current.y = mouseRef.current.y; }
      return ()=>{ window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('touchmove', handleTouchMove); };
    }, []);

    const setSize = ReactLocal.useCallback(()=>{
      if(!containerRef.current || !titleRef.current) return;
      const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
      let newFontSize = containerW / (chars.length / 2);
      newFontSize = Math.max(newFontSize, minFontSize);
      setFontSize(newFontSize);
      setScaleY(1); setLineHeight(1);
      requestAnimationFrame(()=>{ if(!titleRef.current) return; const textRect = titleRef.current.getBoundingClientRect(); if(scale && textRect.height>0){ const yRatio = containerH / textRect.height; setScaleY(yRatio); setLineHeight(yRatio); } });
    }, [chars.length, minFontSize, scale]);

    ReactLocal.useEffect(()=>{
      const deb = (fn, delay)=>{ let tid; return ()=>{ clearTimeout(tid); tid = setTimeout(fn, delay); }; };
      const debounced = deb(setSize, 100);
      debounced(); window.addEventListener('resize', debounced);
      return ()=> window.removeEventListener('resize', debounced);
    }, [setSize]);

    ReactLocal.useEffect(()=>{
      let rafId;
      const animate = ()=>{
        mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x)/15;
        mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y)/15;
        if(titleRef.current){ const titleRect = titleRef.current.getBoundingClientRect(); const maxDist = titleRect.width/2; spansRef.current.forEach(span=>{ if(!span) return; const rect = span.getBoundingClientRect(); const charCenter = { x: rect.x + rect.width/2, y: rect.y + rect.height/2 }; const dx = mouseRef.current.x - charCenter.x; const dy = mouseRef.current.y - charCenter.y; const d = Math.sqrt(dx*dx + dy*dy); const wdth = width ? Math.floor(Math.max(5, 200 - (200 * d)/maxDist)) : 100; const wght = weight ? Math.floor(Math.max(100, 900 - (800 * d)/maxDist)) : 400; const italVal = italic ? (Math.max(0, 1 - (d/maxDist))).toFixed(2) : 0; const alphaVal = alpha ? (Math.max(0, 1 - (d/maxDist))).toFixed(2) : 1; const newFontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`; if(span.style.fontVariationSettings !== newFontVariationSettings) span.style.fontVariationSettings = newFontVariationSettings; if(alpha && span.style.opacity !== alphaVal) span.style.opacity = alphaVal; }); }
        rafId = requestAnimationFrame(animate);
      };
      animate(); return ()=> cancelAnimationFrame(rafId);
    }, [width, weight, italic, alpha]);

    const styleEl = ReactLocal.createElement('style', null, `@font-face{ font-family: '${fontFamily}'; src: url('${fontUrl}'); font-style: normal; } .text-pressure-flex{display:flex;justify-content:space-between;} .text-pressure-stroke span{position:relative;color:${textColor};} .text-pressure-stroke span::after{ content: attr(data-char); position:absolute; left:0; top:0; color: transparent; z-index:-1; -webkit-text-stroke-width:3px; -webkit-text-stroke-color: ${strokeColor}; } .text-pressure-title{ color: ${textColor}; }`);

    const dynamicClassName = ['text-pressure-title', className, flex ? 'text-pressure-flex' : '', stroke ? 'text-pressure-stroke' : ''].filter(Boolean).join(' ');

    return ReactLocal.createElement('div', { ref: containerRef, style: { position: 'relative', width: '100%', height: '100%' } }, styleEl, ReactLocal.createElement('h1', { ref: titleRef, className: dynamicClassName, style: { fontFamily, fontSize, lineHeight, transform: `scale(1, ${scaleY})`, transformOrigin: 'center top', margin:0, fontWeight:100, fontStyle:'normal', width:'100%', ...(flex ? {} : { whiteSpace: 'nowrap' }) } }, chars.map((char, i)=> ReactLocal.createElement('span', { key: i, ref: el => { spansRef.current[i] = el; }, 'data-char': char, style: { display:'inline-block', color: stroke ? undefined : textColor } }, char)) );
  }

  const StyleSheet = {
    create(obj){ return obj; }
  };

  window.ReactBits = window.ReactBits || {};
  Object.assign(window.ReactBits, { View, Text, Image, Touchable, Animated, StyleSheet, PressureText, TextPressure: TextPressure, BlurText, ShinyText, SpotlightCard, ClickSpark, StarBorder });
})(this);