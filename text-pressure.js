(function(window){
  // Vanilla JS port of TextPressure component (mountTextPressure)
  function dist(a, b){ const dx = b.x - a.x; const dy = b.y - a.y; return Math.sqrt(dx*dx + dy*dy); }
  function getAttr(distance, maxDist, minVal, maxVal){ const val = maxVal - Math.abs((maxVal * distance) / maxDist); return Math.max(minVal, val + minVal); }
  function debounce(func, delay){ let timeoutId; return function(){ const args = arguments; clearTimeout(timeoutId); timeoutId = setTimeout(function(){ func.apply(null, args); }, delay); }; }

  function createTextPressure(root, opts){
    const options = Object.assign({
      text: 'Compressa',
      fontFamily: 'Compressa VF',
      fontUrl: 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
      width: true, weight: true, italic: true, alpha: false,
      flex: true, stroke: false, scale: false,
      textColor: '#FFFFFF', strokeColor: '#FF0000', minFontSize: 24
    }, opts || {});

    const { text, fontFamily, fontUrl, width, weight, italic, alpha, flex, stroke, scale, textColor, strokeColor, minFontSize } = options;

    // inject CSS font-face if not present
    if(fontUrl){
      const id = 'tp-font-' + btoa(fontUrl).slice(0,8);
      if(!document.getElementById(id)){
        const style = document.createElement('style');
        style.id = id;
        style.textContent = "@font-face{ font-family: '"+fontFamily+"'; src: url('"+fontUrl+"') format('woff2'); font-style: normal; font-weight: 100 900; font-display: swap; }";
        document.head.appendChild(style);
      }
    }

    const container = document.createElement('div');
    container.className = 'text-pressure-container';
    container.style.width = '100%'; container.style.maxWidth = '1000px'; container.style.height = '280px'; container.style.padding = '20px'; container.style.boxSizing = 'border-box';

    const h1 = document.createElement('h1');
    h1.className = 'text-pressure-title' + (flex? ' flex':'');
    h1.style.margin = '0'; h1.style.whiteSpace = 'nowrap'; h1.style.lineHeight = '1'; h1.style.fontWeight = '100'; h1.style.textTransform = 'uppercase'; h1.style.textAlign = 'center'; h1.style.userSelect = 'none';
    container.appendChild(h1);

    const chars = String(text).split('');
    const spans = [];
    chars.forEach((ch,i)=>{
      const sp = document.createElement('span');
      sp.textContent = ch;
      sp.setAttribute('data-char', ch);
      sp.style.display = 'inline-block';
      sp.style.color = stroke ? '' : textColor;
      sp.style.marginRight = '0.05em';
      h1.appendChild(sp);
      spans.push(sp);
    });

    function setSize(){
      const rect = container.getBoundingClientRect();
      const containerW = rect.width; const containerH = rect.height;
      let newFontSize = containerW / (chars.length / 2);
      newFontSize = Math.max(newFontSize, minFontSize);
      h1.style.fontSize = Math.round(newFontSize) + 'px';
      if(scale){
        requestAnimationFrame(()=>{
          const textRect = h1.getBoundingClientRect();
          if(textRect.height>0){ const yRatio = containerH / textRect.height; h1.style.transform = 'scale(1,'+yRatio+')'; h1.style.transformOrigin = 'center top'; }
        });
      }
    }

    const debouncedSetSize = debounce(setSize, 100);
    setSize();
    window.addEventListener('resize', debouncedSetSize);

    const cursor = { x: window.innerWidth/2, y: window.innerHeight/2 };
    const mouse = { x: cursor.x, y: cursor.y };
    function onMove(e){ const t = e.touches ? e.touches[0] : e; cursor.x = t.clientX; cursor.y = t.clientY; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });

    let rafId = null;
    function animate(){
      mouse.x += (cursor.x - mouse.x)/15; mouse.y += (cursor.y - mouse.y)/15;
      const titleRect = h1.getBoundingClientRect();
      const maxDist = Math.max(80, titleRect.width/2);
      spans.forEach(sp=>{
        const rect = sp.getBoundingClientRect();
        const charCenter = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
        const d = dist(mouse, charCenter);
        const wdth = width ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
        const wght = weight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
        const italVal = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0;
        const alphaVal = alpha ? getAttr(d, maxDist, 0, 1).toFixed(2) : 1;
        const fv = "'wght' " + wght + ", 'wdth' " + wdth + ", 'ital' " + italVal;
        sp.style.fontVariationSettings = fv;
        if(alpha) sp.style.opacity = alphaVal;
      });
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    // attach cleanup function
    container._tpCleanup = function(){ window.removeEventListener('resize', debouncedSetSize); window.removeEventListener('mousemove', onMove); window.removeEventListener('touchmove', onMove); cancelAnimationFrame(rafId); };

    return container;
  }

  window.mountTextPressure = function(root, opts){
    if(!root) throw new Error('root element required');
    // clear root
    root.innerHTML = '';
    const node = createTextPressure(root, opts);
    root.appendChild(node);
    return node;
  };

})(this);
