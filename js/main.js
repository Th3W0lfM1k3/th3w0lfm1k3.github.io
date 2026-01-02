let dbProyectos = [];
let vistaActual = 'main';
let filtroActual = 'ALL';
let carruselTimeout;

async function cargar() {
    try {
        const [resP, resC, resE] = await Promise.all([
            fetch('data.json'), 
            fetch('comments.json'), 
            fetch('experience.json')
        ]);
        
        dbProyectos = (await resP.json()).proyectos.reverse();
        const dbComments = (await resC.json()).comments;
        const dbJobs = (await resE.json()).jobs;
        
        renderProyectos(dbProyectos);
        renderComments(dbComments);
        renderExperience(dbJobs);
        
        generarFiltrosAutomaticos();
        
        setTimeout(() => actualizarPildora(document.getElementById('view-default')), 150);
    } catch (e) { 
        console.error(e); 
    }
}

function generarFiltrosAutomaticos() {
    const container = document.getElementById('filter-container');
    if (!container) return;

    const todosLosTags = dbProyectos.flatMap(p => p.tags || []);
    const tagsUnicos = ['ALL', ...new Set(todosLosTags.map(t => t.toUpperCase()))];

    container.innerHTML = tagsUnicos.map(tag => `
        <button onclick="aplicarFiltro('${tag}')" class="filter-pill ${filtroActual === tag ? 'active' : ''}">
            ${tag}
        </button>
    `).join('');
}

function aplicarFiltro(tag) {
    filtroActual = tag;
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === tag);
    });
    renderProyectos(dbProyectos);
}

function renderProyectos(lista) {
    const feed = document.getElementById('feed');
    const isMedia = vistaActual === 'media';
    const listaFiltrada = filtroActual === 'ALL' ? lista : lista.filter(p => p.tags?.some(t => t.toUpperCase() === filtroActual));

    feed.className = isMedia ? 'twitch-grid' : 'flex flex-col';
    feed.innerHTML = listaFiltrada.map((p, i) => `
        <article class="slide-in group ${isMedia ? '' : 'p-6 border-b border-[#2f3336]'}" style="animation-delay: ${i * 0.05}s">
            <div class="flex ${isMedia ? 'flex-col' : 'gap-4'}">
                <a href="media.html?v=${p.id}" class="relative w-full rounded-xl overflow-hidden bg-black border border-[#2f3336] mb-3 aspect-video flex-shrink-0 ${!isMedia ? 'max-w-[320px]' : ''}">
                    <img src="${p.imagen}" class="absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-500 group-hover:opacity-0 pointer-events-none">
                    <video muted loop playsinline preload="auto" class="absolute inset-0 w-full h-full object-cover z-10" onmouseenter="startVideoPreview(this)" onmouseleave="stopVideoPreview(this)">
                        <source src="${p.video}" type="video/mp4">
                    </video>
                </a>
                <div class="flex-grow min-w-0">
                    <span class="font-bold text-white text-[15px] truncate block mb-1 uppercase">${p.titulo}</span>
                    <div class="flex flex-wrap gap-2 mb-2">
                        ${p.tags ? p.tags.map(t => `<span class="text-blue-500 text-[10px] font-bold">#${t.toUpperCase()}</span>`).join('') : ''}
                    </div>
                    <p class="text-slate-400 text-[12px] leading-relaxed line-clamp-2">${p.descripcion}</p>
                </div>
            </div>
        </article>`).join('');
}

function cambiarVista(btn, vista) {
    if (vista === vistaActual) return;
    
    const colL = document.getElementById('col-left');
    const colR = document.getElementById('col-right');
    const colC = document.getElementById('col-center');
    const feed = document.getElementById('feed');
    const filters = document.getElementById('filter-container');
    
    feed.classList.add('fade-out');
    vistaActual = vista;
    actualizarPildora(btn);

    if (vista === 'media') {
        filters?.classList.remove('hidden-filters');
    } else {
        filters?.classList.add('hidden-filters');
        filtroActual = 'ALL';
    }

    document.querySelectorAll('.view-btn').forEach(b => b.classList.replace('text-white', 'text-slate-500'));
    btn.classList.replace('text-slate-500', 'text-white');

    setTimeout(() => {
        [colL, colR, colC].forEach(el => {
            el.className = el.className.replace(/md:col-span-\d+|hidden|block/g, '').trim();
            el.classList.remove('-translate-x-full', 'translate-x-full', 'opacity-0', 'closed');
        });

        if (vista === 'media') {
            colL.classList.add('-translate-x-full', 'opacity-0', 'hidden', 'closed');
            colR.classList.add('translate-x-full', 'opacity-0', 'hidden', 'closed');
            colC.classList.add('md:col-span-12', 'block');
        } else if (vista === 'comunidad') {
            colC.classList.add('hidden', 'closed'); 
            colL.classList.add('md:col-span-6', 'block');
            colR.classList.add('md:col-span-6', 'block');
        } else {
            colL.classList.add('md:col-span-3', 'block');
            colC.classList.add('md:col-span-6', 'block');
            colR.classList.add('md:col-span-3', 'block');
        }
        
        renderProyectos(dbProyectos);
        feed.classList.remove('fade-out');
    }, 300);
}

function startVideoPreview(video) {
    if (!video) return;
    video.muted = true;
    video.playbackRate = 5.0;
    video.style.transform = "scale(1.05)";
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            clearTimeout(carruselTimeout);
            carruselTimeout = setTimeout(() => stopVideoPreview(video), 5000);
        }).catch(() => {});
    }
}

function stopVideoPreview(video) {
    if (!video) return;
    clearTimeout(carruselTimeout);
    video.pause();
    video.currentTime = 0;
    video.style.transform = "scale(1)";
}

function renderComments(lista) {
    const container = document.getElementById('col-comments');
    if(!container) return;

    container.innerHTML = lista.map(c => `
        <div class="p-3 bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] mb-3 group hover:border-[#2f3336] transition-colors">
            <div class="flex justify-between items-start mb-1">
                <h3 class="text-blue-500 font-black text-[15px] uppercase">${c.asunto}</h3>
                <span class="text-[9px] text-slate-600 font-bold whitespace-nowrap ml-2">${c.fecha || ''}</span>
            </div>
            ${c.puesto ? `<p class="text-slate-500 text-[10px] font-bold mb-2 uppercase tracking-tighter">${c.puesto}</p>` : ''}
            <p class="text-slate-300 text-[12px] leading-snug">${c.texto}</p>
        </div>
    `).join('');
}

function renderExperience(lista) {
    const container = document.getElementById('col-experience');
    if(!container) return;

    container.innerHTML = lista.map((j, i) => `
        <div class="relative pl-5 border-l border-[#1a1a1a] py-1 mb-6 group">
            <div class="absolute -left-[3.5px] top-2 w-[6.5px] h-[6.5px] bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] ${i === 0 ? 'animate-pulse' : ''}"></div>
            <div class="flex justify-between items-start">
                <h4 class="text-white font-black text-[12px] uppercase leading-none">${j.empresa}</h4>
                <span class="text-[9px] text-slate-600 font-bold uppercase">${j.periodo || ''}</span>
            </div>
            <p class="text-emerald-500/80 text-[10px] font-bold uppercase mt-1 mb-2 tracking-tight">${j.puesto || ''}</p>
            <p class="text-slate-500 text-[11px] leading-relaxed">${j.descripcion}</p>
        </div>
    `).join('');
}

function actualizarPildora(btn) {
    const p = document.getElementById('pildora-view');
    if(btn && p) {
        p.style.width = `${btn.offsetWidth}px`;
        p.style.left = `${btn.offsetLeft}px`;
    }
}

window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.view-btn.text-white');
    if (activeBtn) actualizarPildora(activeBtn);
});

document.addEventListener('DOMContentLoaded', cargar);