import React, { useState, useEffect } from 'react';
import { 
  Plus, Copy, Trash2, Edit2, ChevronLeft, ChevronRight, 
  UploadCloud, Maximize, Minimize, Download, CheckCircle,
  Hexagon, Sparkles, Map, Users, Sun, Leaf, Share2, Save,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DB_NAME = 'Elite24_B2B_Builder';
const STORE_NAME = 'projects';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToDB = async (key, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const loadFromDB = async (key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const StorageManager = {
  save: async (projects, activeId) => {
    try {
      // Prioritize active project if provided
      const sortedProjects = [...projects].sort((a, b) => {
        if (a.id === activeId) return -1;
        if (b.id === activeId) return 1;
        return 0;
      });

      // Save each project individually to Notion in parallel
      const savePromises = sortedProjects.map(async (proj) => {
        try {
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: proj.id,
              name: proj.name,
              date: proj.date,
              data: proj.data
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error ${res.status}`);
          }
          return true;
        } catch (e) {
          console.warn(`Error saving project ${proj.id} to Notion:`, e);
          return false;
        }
      });
      
      await Promise.all(savePromises);
      
      try { localStorage.setItem('b2b-projects-v2', JSON.stringify(projects)); } catch(e) {}
    } catch (e) {
      console.error("Error saving projects:", e);
      try { localStorage.setItem('b2b-projects-v2', JSON.stringify(projects)); } catch(err) {}
      throw e;
    }
  },
  load: async () => {
    try {
      // Use cache: 'no-store' to avoid stale results from Notion
      const res = await fetch('/api/projects', { cache: 'no-store' });
      if (res.ok) {
        const notionData = await res.json();
        if (notionData && notionData.length > 0) {
          let local = null;
          try { local = localStorage.getItem('b2b-projects-v2'); } catch(e) {}
          const localProjects = local ? JSON.parse(local) : [];

          const merged = notionData.map(np => {
            const localMatch = localProjects.find(lp => 
              String(lp.id) === String(np.id) || (lp.name && np.name && slugify(lp.name) === slugify(np.name))
            );
            
            if (localMatch && np.data) {
              return {
                id: np.id,
                name: np.name || localMatch.name,
                date: np.date || localMatch.date,
                data: mergeProjectData(np.data, localMatch.data)
              };
            }
            
            return {
              id: np.id,
              name: np.name,
              date: np.date,
              data: np.data || {}
            };
          });
          
          return merged;
        }
        return []; // Return empty array if Notion is empty but response was OK
      }
      throw new Error(`Load failed with status ${res.status}`);
    } catch (e) {
      console.error("Error loading from Notion:", e);
      let local = null;
      try { local = localStorage.getItem('b2b-projects-v2'); } catch(err) {}
      return local ? JSON.parse(local) : null;
    }
  },
  delete: async (id) => {
    try {
      await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      console.error("Error deleting from Notion:", e);
    }
  }
};

// Recursively merge Notion data (no images) with local data (has images)
function mergeProjectData(notionData, localData) {
  if (!localData) return notionData;
  if (!notionData) return localData;
  
  const result = { ...notionData };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string' && result[key] === '' && localData[key] && typeof localData[key] === 'string' && localData[key].startsWith('data:image/')) {
      // Recover base64 image from local
      result[key] = localData[key];
    } else if (Array.isArray(result[key]) && Array.isArray(localData[key])) {
      result[key] = result[key].map((item, idx) => {
        if (localData[key][idx] && typeof item === 'object') {
          return mergeProjectData(item, localData[key][idx]);
        }
        return item;
      });
    } else if (typeof result[key] === 'object' && result[key] !== null && typeof localData[key] === 'object' && localData[key] !== null) {
      result[key] = mergeProjectData(result[key], localData[key]);
    }
  }
  return result;
}

const MAX_SLIDES = 8;

const defaultProjects = [
  {
    id: '1',
    name: 'Propuesta · Nubank Colombia',
    date: '13 de may · 11:34 a. m.',
    data: {
      brand: { name: 'Nubank', primaryColor: '#8A05BE', accentColor: '#FCFCFC', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/2560px-Nubank_logo_2021.svg.png' },
      studio: { name: 'Elite 24 Studio S.A.S.', nit: '901.789.989-3', ceo: 'Santiago Folleco', iniciales: 'SF', web: 'https://elite24studio.com.co/', email: 'gerencia@elite24studio.com.co', asunto: 'NUEVA SOLICITUD B2B', logoUrl: '' },
      hero: { badge: 'PROPUESTA COMERCIAL B2B · COLOMBIA 2026', titleHtml: '¿Cómo podría <b>Nubank</b> transformar la experiencia <b>física</b> de atención financiera en Colombia?' },
      ceoInvitation: { photoUrl: '', htmlMessage: 'Soy <b>Santiago Folleco</b>, CEO de <b>Elite 24 Studio S.A.S.</b> Durante las últimas semanas estuvimos analizando la <b>evolución espacial y experiencial</b> de marcas contemporáneas en Latinoamérica, y encontramos <b>oportunidades estratégicas</b> muy interesantes alrededor de la <b>experiencia física y emocional</b> que ustedes están construyendo como marca.', metric1: { value: '5+', label: 'SEMANAS DE<br/>ANÁLISIS' }, metric2: { value: '04', label: 'CONCEPTOS<br/>ESPACIALES' }, metric3: { value: '∞', label: 'POTENCIAL<br/>EN COLOMBIA' } },
      vision: { titleHtml: 'Una visión pensada <b>específicamente</b> para el potencial de su presencia en <b>Colombia</b>.', description: 'Hemos desarrollado un concepto estratégico que conecta la identity digital de Nubank con un lenguaje físico capaz de generar memoria, comunidad y deseo de pertenencia.', cards: [{ id: 1, title: 'Biometría Espacial', text: 'El espacio reconoce al usuario al entrar. Adiós a las filas tradicionales, bienvenida la fricción cero.', imgUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' }, { id: 2, title: 'Luz como Marca', text: 'Bañamos los interiores con el espectro lumínico de Nubank, creando un aura inconfundible y magnética.', imgUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80' }, { id: 3, title: 'Paisajismo Digital', text: 'Integración de flora endémica colombiana con monolitos digitales y pantallas de datos en tiempo real.', imgUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' }, { id: 4, title: 'Materialidad Táctil', text: 'Superficies que invitan a tocar. Contraste entre metal pulido y tejidos cálidos artesanales colombianos.', imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' }, { id: 5, title: 'Community Hub', text: 'No es una sucursal, es un punto de encuentro, cafetería de autor y zona de networking para clientes.', imgUrl: 'https://images.unsplash.com/photo-1616803140344-6682afb13cda?auto=format&fit=crop&w=800&q=80' }] },
      renders: [{ id: 1, imgUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', subtitle: 'Lobby principal · <b>Hito de marca</b>' }, { id: 2, imgUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80', subtitle: 'Zona de bienvenida · <b>Lounge experiencial</b>' }, { id: 3, imgUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', subtitle: 'Sala de educación financiera' }, { id: 4, imgUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80', subtitle: 'Fachada nocturna · <b>Hito urbano</b>' }],
      reminder: { htmlText: 'Lo que ves aquí es el <b>inicio de una conversación creativa entre ELITE 24 STUDIO</b>, dando un punto de partida para imaginar juntos lo que <b>{{brandName}}</b> puede llegar a ser en el espacio físico colombiano.' },
      pillars: [{ id: 1, title: 'Arquitectura de marca', text: 'Espacios que traducen la identidad digital al mundo físico con precisión emocional. Cada elemento funciona como una extensión del logo.' }, { id: 2, title: 'Experiencia emocional', text: 'Recorridos sensoriales donde la luz, el sonido y la textura se orquestan para generar respuesta emocional auténtica.' }, { id: 3, title: 'Diseño territorial', text: 'Cada ciudad tiene una memoria, un clima. Adaptamos el lenguaje arquitectónico al contexto local sin diluir la identidad global de la marca.' }, { id: 4, title: 'Comunidad y pertenencia', text: 'No diseñamos sucursales: diseñamos plazas. Espacios pensados para que la comunidad ocurra — talleres, charlas, encuentros.' }, { id: 5, title: 'Materialidad y luz', text: 'Materiales cálidos, superficies táctiles, iluminación curada que abraza. Paleta de marca traducida en materiales físicos.' }, { id: 6, title: 'Innovación + sostenibilidad', text: 'Tecnología integrada de forma invisible, sistemas pasivos, materiales responsables y diseño modular escalable a 20 años.' }],
      ctaFinal: { quote: 'Donde los sueños se convierten en espacio, y el espacio en legado.', htmlText: 'Sé parte de nuestro camino, <b>construyendo sueños y futuro</b> en el país. Si lo consideran interesante, déjenos sus datos en el formulario y nuestro CEO, <b>Santiago Folleco</b>, les contactará personalmente.' }
    }
  },
  {
    id: '2',
    name: 'Propuesta · adidas',
    date: '13 de may · 11:35 a. m.',
    data: {
      brand: { name: 'adidas', primaryColor: '#0051BA', accentColor: '#FFFFFF', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png' },
      studio: { name: 'Elite 24 Studio S.A.S.', nit: '901.789.989-3', ceo: 'Santiago Folleco', iniciales: 'SF', web: 'https://elite24studio.com.co/', email: 'gerencia@elite24studio.com.co', asunto: 'NUEVA SOLICITUD B2B', logoUrl: '' },
      hero: { badge: 'PROPUESTA COMERCIAL B2B · COLOMBIA 2026', titleHtml: '¿Cómo podría <b>adidas</b> transformar la experiencia <b>física</b> de retail deportivo en Colombia?' },
      ceoInvitation: { photoUrl: '', htmlMessage: 'Soy <b>Santiago Folleco</b>, CEO de <b>Elite 24 Studio S.A.S.</b> Durante las últimas semanas estuvimos analizando la <b>evolución espacial y experiencial</b> de marcas contemporáneas en Latinoamérica, y encontramos <b>oportunidades estratégicas</b> muy interesantes alrededor de la <b>experiencia física y emocional</b> que ustedes están construyendo como marca.', metric1: { value: '5+', label: 'SEMANAS DE<br/>ANÁLISIS' }, metric2: { value: '04', label: 'CONCEPTOS<br/>ESPACIALES' }, metric3: { value: '∞', label: 'POTENCIAL<br/>EN COLOMBIA' } },
      vision: { titleHtml: 'Una visión pensada <b>específicamente</b> para el potencial de su presencia en <b>Colombia</b>.', description: 'Desarrollamos una estrategia espacial que transforma la tienda tradicional en una arena de rendimiento y cultura urbana.', cards: [{ id: 1, title: 'Retail Sensorial', text: 'Zonas de prueba con simulación climática y pavimentos deportivos reactivos.', imgUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80' }, { id: 2, title: 'Museografía Urbana', text: 'Exhibición de sneakers como obras de arte, con halos de luz individuales.', imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' }, { id: 3, title: 'Comunidad Creators', text: 'Gradas para eventos, charlas y lanzamientos con la comunidad creativa local.', imgUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' }, { id: 4, title: 'Materialidad Sostenible', text: 'Uso de plásticos reciclados locales y hormigón arquitectónico expuesto.', imgUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' }, { id: 5, title: 'Fachada Dinámica', text: 'Estructuras exteriores que reaccionan al paso de los peatones, generando tráfico.', imgUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80' }] },
      renders: [{ id: 1, imgUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80', subtitle: 'Store Experience · <b>Hito de marca</b>' }, { id: 2, imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', subtitle: 'Zona de bienvenida · <b>Creators Lounge</b>' }, { id: 3, imgUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', subtitle: 'Sala de educación deportiva' }, { id: 4, imgUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', subtitle: 'Fachada nocturna · <b>Hito urbano</b>' }],
      reminder: { htmlText: 'Lo que ves aquí es el <b>inicio de una conversación creativa entre ELITE 24 STUDIO</b>, dando un punto de partida para imaginar juntos lo que <b>{{brandName}}</b> puede llegar a ser en el espacio físico colombiano.' },
      pillars: [{ id: 1, title: 'Arquitectura de marca', text: 'Espacios que traducen la identidad digital al mundo físico con precisión emocional. Cada elemento funciona como una extensión del logo.' }, { id: 2, title: 'Experiencia emocional', text: 'Recorridos sensoriales donde la luz, el sonido y la textura se orquestan para generar respuesta emocional auténtica.' }, { id: 3, title: 'Diseño territorial', text: 'Cada ciudad tiene una memoria, un clima. Adaptamos el lenguaje arquitectónico al contexto local sin diluir la identidad global de la marca.' }, { id: 4, title: 'Comunidad y pertenencia', text: 'No diseñamos sucursales: diseñamos plazas. Espacios pensados para que la comunidad ocurra — talleres, charlas, encuentros.' }, { id: 5, title: 'Materialidad y luz', text: 'Materiales cálidos, superficies táctiles, iluminación curada que abraza. Paleta de marca traducida en materiales físicos.' }, { id: 6, title: 'Innovación + sostenibilidad', text: 'Tecnología integrada de forma invisible, sistemas pasivos, materiales responsables y diseño modular escalable a 20 años.' }],
      ctaFinal: { quote: 'Donde los sueños se convierten en espacio, y el espacio en legado.', htmlText: 'Sé parte de nuestro camino, <b>construyendo sueños y futuro</b> en el país. Si lo consideran interesante, déjenos sus datos en el formulario y nuestro CEO, <b>Santiago Folleco</b>, les contactará personalmente.' }
    }
  }
];

const ImageUploader = ({ value, onChange, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = React.useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = (file) => {
    if (!file.type.match('image.*')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800; // Optimizado para no exceder límites de Notion (200KB total)
        if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // WebP 0.5 es el punto óptimo entre legibilidad y tamaño para Notion
        const outputType = 'image/webp';
        const quality = 0.5;
        onChange(canvas.toDataURL(outputType, quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${isDragging ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 scale-[1.02]' : 'border-[#2D1B4E] bg-[#0A0514] hover:border-white/20'} ${className}`}
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {value ? (
        <>
          <img src={value} alt="Preview" className="w-full h-full object-contain p-2 opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2"><UploadCloud size={16} /> Cambiar</span>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
          <UploadCloud className={`mx-auto mb-2 transition-colors ${isDragging ? 'text-[var(--brand-primary)]' : 'text-white/30'}`} size={24} />
          <p className="text-white/70 text-xs font-bold">Subir imagen</p>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">PNG · JPG · WEBP</p>
        </div>
      )}
      <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
};

const Accordion = ({ title, badge, isOpen, onClick, children }) => (
  <div className="border-b border-[#2D1B4E] bg-[#110822]">
    <button onClick={onClick} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        {badge && <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--brand-primary)] to-[#3B0059] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_var(--brand-primary)]/50">{badge}</span>}
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      <ChevronLeft size={16} className={`text-white/40 transition-transform duration-300 ${isOpen ? '-rotate-90' : 'rotate-180'}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-5 pt-0">{children}</div>
    </div>
  </div>
);

const ProjectListItem = ({ proj, isActive, onClick, onRename, onDuplicate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(proj.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const brandColor = proj.data?.brand?.primaryColor || '#8A05BE';
  const logoUrl = proj.data?.brand?.logoUrl;

  const handleRename = () => { if (editName.trim()) { onRename(proj.id, editName); setIsEditing(false); } };

  return (
    <div className={`group relative flex flex-col p-3 rounded-lg border transition-all duration-300 cursor-pointer mb-2 ${isActive ? 'bg-[#1A0B2E]' : 'bg-[#150C22] border-[#2D1B4E] hover:bg-white/5'}`} style={isActive ? { borderColor: brandColor } : {}} onClick={() => !isEditing && onClick()}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded text-white flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors overflow-hidden ${isActive ? '' : 'bg-[#2D1B4E]'}`} style={isActive ? { backgroundColor: brandColor, boxShadow: `0 0 10px ${brandColor}40` } : {}}>
          {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" /> : proj.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleRename} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="w-full bg-[#0A0514] border border-[#8A05BE] rounded px-2 py-1 text-xs text-white outline-none" onClick={(e) => e.stopPropagation()} />
          ) : (
            <h3 className="text-white text-xs font-bold truncate">{proj.name}</h3>
          )}
          <p className="text-white/40 text-[9px] truncate">{proj.date}</p>
        </div>
      </div>
      <div className={`flex items-center justify-end gap-1 mt-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {!isEditing && <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"><Edit2 size={12} /></button>}
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(proj.id); }} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"><Copy size={12} /></button>
        {confirmDelete ? (
          <button onClick={(e) => { e.stopPropagation(); onDelete(proj.id); setConfirmDelete(false); }} className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-[10px] font-bold px-2">¿Seguro?</button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }} className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
        )}
      </div>
    </div>
  );
};

const AiWizardModal = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', color: '#8A05BE' });

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setStep(2);
    setTimeout(() => { onComplete(formData); }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#020105]/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#110822] border border-[#2D1B4E] rounded-2xl p-8 shadow-[0_0_50px_rgba(138,5,190,0.2)] relative overflow-hidden">
        {step === 1 ? (
          <form onSubmit={handleGenerate} className="relative z-10">
            <button type="button" onClick={onClose} className="absolute -top-2 -right-2 text-white/40 hover:text-white"><ChevronLeft size={20} className="rotate-180" /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-[#8A05BE] flex items-center justify-center"><Sparkles className="text-white" size={20} /></div>
              <div><h3 className="text-lg font-bold text-white">IA Fast Builder</h3><p className="text-xs text-white/50">Genera la propuesta base en 3 segundos</p></div>
            </div>
            <div className="space-y-4 mb-8">
              <div><label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-bold">Nombre de la marca</label><input autoFocus type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Tesla, Spotify, Netflix..." className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#8A05BE] outline-none transition-colors" required /></div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-bold">Color principal</label>
                <div className="flex items-center gap-3"><input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" /><input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#8A05BE] outline-none font-mono" /></div>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-[#8A05BE] hover:from-blue-500 hover:to-[#9B06D6] text-white rounded-lg py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-lg flex items-center justify-center gap-2"><Sparkles size={16} /> Construir Experiencia</button>
          </form>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center relative z-10">
            <div className="w-16 h-16 border-4 border-white/10 border-t-[#8A05BE] rounded-full animate-spin mb-6 shadow-[0_0_30px_#8A05BE]"></div>
            <h3 className="text-xl font-bold text-white mb-2">Diseñando estrategia...</h3><p className="text-xs text-white/50 uppercase tracking-widest animate-pulse">Adaptando arquitectura de marca</p>
          </div>
        )}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0%,rgba(138,5,190,0.1)_50%,transparent_100%)] animate-spin-slow pointer-events-none z-0"></div>
      </motion.div>
    </div>
  );
};

const HeroSlide = ({ data, onNext, onPrev }) => {
  const { brand, studio, hero } = data;
  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#020105] z-0"></div>
        <div className="w-[150vw] h-[150vw] absolute bg-[var(--brand-primary)] mix-blend-screen opacity-40 blur-[80px] animate-rotate-wave origin-center z-10"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay z-20"></div>
        {brand.logoUrl && (
          <img src={brand.logoUrl} alt="Watermark" className="absolute object-contain w-full max-w-[600px] opacity-30 animate-float-watermark mix-blend-screen z-30" />
        )}
      </div>

      <header className="absolute top-0 w-full p-10 flex justify-between items-center z-40">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 font-bold">{studio.name}</div>
        <div className="flex items-center gap-6">
          {studio.logoUrl && <img src={studio.logoUrl} alt="Studio" className="h-10 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />}
          {studio.logoUrl && brand.logoUrl && <span className="text-white/20 text-xs font-light">×</span>}
          {brand.logoUrl && <img src={brand.logoUrl} alt="Brand" className="h-10 object-contain drop-shadow-[0_0_15px_var(--brand-primary)]" />}
        </div>
      </header>

      <main className="relative z-40 w-full max-w-4xl text-center px-8">
        <span className="inline-block px-6 py-2 border border-white/20 rounded-full text-[10px] font-bold tracking-[0.3em] uppercase mb-10 text-white/90 backdrop-blur-md bg-black/40 shadow-[0_0_20px_var(--brand-primary)] border-[var(--brand-primary)]">
          {hero.badge}
        </span>
        <h1
          className="text-5xl md:text-7xl font-light tracking-tight leading-tight mb-12 ceo-text"
          dangerouslySetInnerHTML={{ __html: hero.titleHtml }}
        />
        <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--brand-primary)] font-bold mb-16 drop-shadow-[0_0_8px_var(--brand-primary)]">
          {studio.name} — VISIÓN ARQUITECTÓNICA
        </div>
        <button onClick={onNext} className="px-10 py-4 rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-105 hover:shadow-[0_0_40px_var(--brand-primary)] flex items-center gap-3 mx-auto border border-white/10 shadow-[0_0_20px_var(--brand-primary)]">
          ENTRAR A LA EXPERIENCIA <ChevronRight size={16} />
        </button>
      </main>

      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-40 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 01 / 08</footer>
    </div>
  );
};

const ManifestoSlide = ({ data }) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white px-20">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="w-[100vw] h-[100vh] bg-[var(--brand-primary)] blur-[200px] mix-blend-screen opacity-10 animate-pulse-glow"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
              Esto no es una propuesta <span className="font-serif italic font-light text-white/30">comercial.</span>
            </h2>
            <div className="h-[2px] w-24 bg-[var(--brand-primary)] shadow-[0_0_15px_var(--brand-primary)] my-8"></div>
            <p className="text-2xl md:text-3xl font-light text-white/80 leading-relaxed max-w-2xl">
              Es el inicio de una <span className="text-white font-medium drop-shadow-[0_0_15px_var(--brand-primary)] ceo-text"><b>conversación estratégica.</b></span>
            </p>
          </motion.div>
        </div>

        <div className="md:col-span-5 relative mt-12 md:mt-0">
          <div className="absolute -top-32 -left-10 text-[250px] font-bold text-white/[0.02] leading-none pointer-events-none font-serif italic select-none">01</div>

          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="relative">
              <div className="absolute -left-6 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[var(--brand-primary)] to-transparent"></div>
              <p className="text-base md:text-xl text-white/70 font-light leading-relaxed">
                Co-creamos espacios que conectan <span className="text-white font-medium drop-shadow-[0_0_10px_var(--brand-primary)]">emocionalmente</span> marcas y comunidades.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="relative">
              <div className="absolute -left-6 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[var(--brand-primary)] to-transparent"></div>
              <p className="text-base md:text-xl text-white/70 font-light leading-relaxed">
                Construimos experiencias físicas para marcas que quieren <span className="text-white font-medium ceo-text"><b>trascender.</b></span>
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 02 / 08</footer>
    </div>
  );
};

const CeoSlide = ({ data }) => {
  const { ceoInvitation, studio } = data;
  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white px-20">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[80vw] h-[80vh] bg-[var(--brand-primary)] blur-[180px] mix-blend-screen opacity-15"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
        <div className="md:col-span-5 flex justify-center relative">
          <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-2xl p-1 overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0%,var(--brand-primary)_50%,transparent_100%)] animate-spin-slow opacity-100"></div>
            <div className="absolute inset-[2px] bg-[#05010A] rounded-xl z-0"></div>

            <div className="relative z-10 w-full h-full rounded-xl overflow-hidden bg-[#110822] border border-white/5">
              {ceoInvitation.photoUrl ? (
                <img src={ceoInvitation.photoUrl} alt="CEO" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 text-9xl font-bold font-serif">{studio.iniciales}</div>
              )}
              <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-sm">
                <h3 className="text-white font-bold text-xl tracking-wide">{studio.ceo}</h3>
                <p className="text-[var(--brand-primary)] text-[10px] tracking-[0.3em] uppercase font-bold mt-1 drop-shadow-[0_0_5px_var(--brand-primary)]">CEO & Founder</p>
                <p className="text-white/40 text-[9px] tracking-widest uppercase mt-1">{studio.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 relative">
          <div className="absolute -top-20 -left-10 text-[180px] text-[var(--brand-primary)]/5 font-serif font-bold pointer-events-none leading-none">"</div>

          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 rounded text-[9px] text-[var(--brand-primary)] font-bold tracking-[0.2em] uppercase mb-6 shadow-[0_0_15px_var(--brand-primary)]/20">
              Liderazgo Estratégico
            </span>
          </div>

          <div
            className="text-lg md:text-xl font-light text-white/70 leading-relaxed mb-12 ceo-text"
            dangerouslySetInnerHTML={{ __html: ceoInvitation.htmlMessage }}
          />

          <div className="h-[1px] w-full bg-gradient-to-r from-[var(--brand-primary)] to-transparent opacity-30 mb-10"></div>

          <div className="grid grid-cols-3 gap-6">
            {[ceoInvitation.metric1, ceoInvitation.metric2, ceoInvitation.metric3].map((metric, index) => (
              <motion.div key={index} className="relative group cursor-default">
                <motion.div
                  className="text-4xl md:text-5xl font-bold mb-2 text-white/80 transition-all duration-300 drop-shadow-md"
                  animate={{ scale: [1, 1.05, 1], textShadow: ["0px 0px 0px transparent", "0px 0px 20px var(--brand-primary)", "0px 0px 0px transparent"], color: ["#ccc", "var(--brand-primary)", "#ccc"] }}
                  transition={{ duration: 4, repeat: Infinity, delay: index * 1.2, ease: "easeInOut" }}
                >
                  {metric.value}
                </motion.div>
                <p
                  className="text-[9px] text-white/50 tracking-[0.2em] uppercase font-bold leading-tight group-hover:text-white/80 transition-colors"
                  dangerouslySetInnerHTML={{ __html: metric.label }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 03 / 08</footer>
    </div>
  );
};

const VisionSlide = ({ data }) => {
  const [activeCard, setActiveCard] = useState(0);
  const { vision } = data;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#05010A] text-white px-20">
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="w-[80vw] h-[80vh] bg-[var(--brand-primary)] blur-[150px] rounded-full mix-blend-screen opacity-20"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1300px] flex flex-col items-center">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--brand-primary)] font-bold mb-4 drop-shadow-[0_0_8px_var(--brand-primary)]">
            04 // Visión Conceptual
          </p>
          <h2
            className="text-3xl md:text-5xl font-light mb-6 text-white ceo-text max-w-4xl mx-auto leading-tight"
            dangerouslySetInnerHTML={{ __html: vision.titleHtml }}
          />
          <p className="text-white/50 max-w-2xl mx-auto text-[11px] tracking-widest leading-relaxed uppercase">
            {vision.description}
          </p>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: [0.4, 0.8, 0.4] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mt-6 text-[9px] text-[var(--brand-primary)] tracking-[0.3em] font-bold uppercase"
          >
            Haz clic en cada pilar para expandir la visión
          </motion.p>
        </div>

        <div className="flex h-[45vh] min-h-[350px] w-full gap-3 overflow-hidden p-2">
          {vision.cards.map((card, idx) => {
            const isActive = activeCard === idx;
            return (
              <motion.div
                key={card.id}
                layout
                onClick={() => setActiveCard(idx)}
                className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isActive ? 'flex-[5] shadow-[0_0_40px_var(--brand-primary)] border border-[var(--brand-primary)]/50' : 'flex-[1] opacity-50 hover:opacity-100 hover:flex-[1.2] border border-white/10 grayscale hover:grayscale-0'
                  }`}
              >
                {card.imgUrl ? (
                  <img src={card.imgUrl} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-[#110822] flex items-center justify-center text-white/20"><Map size={32} /></div>
                )}
                <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'bg-gradient-to-t from-[#05010A] via-[#05010A]/80 to-transparent' : 'bg-black/60'}`} />

                <div className="absolute bottom-0 left-0 w-full h-full p-6 md:p-8 flex flex-col justify-end">
                  {!isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="origin-center -rotate-90 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-white whitespace-nowrap">
                        0{idx + 1} · {card.title}
                      </span>
                    </div>
                  )}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative z-10">
                        <span className="inline-block px-3 py-1 bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/50 rounded-full text-[9px] text-[var(--brand-primary)] font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_var(--brand-primary)]">Pilar 0{idx + 1}</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">{card.title}</h3>
                        <p className="text-white/70 text-xs md:text-sm leading-relaxed max-w-lg font-medium">{card.text}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 04 / 08</footer>
    </div>
  );
};

const RendersSlide = ({ data, activeIndex, onIndexChange }) => {
  const { renders } = data;

  // Guard: If there are no renders, show a placeholder or empty state
  if (!renders || renders.length === 0) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#020105]">
        <div className="text-white/20 flex flex-col items-center">
          <UploadCloud size={64} className="mb-4 opacity-50" />
          <p className="text-xs uppercase tracking-widest font-bold">No hay renders disponibles</p>
          <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">Añade renders desde el panel lateral</p>
        </div>
        <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 05 / 08</footer>
      </div>
    );
  }

  // Ensure activeIndex is within bounds (safety reset)
  const safeIndex = activeIndex >= renders.length ? 0 : activeIndex;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#020105]">
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#020105] via-transparent to-[#020105]"></div>

      <div className="absolute top-12 w-full text-center z-20">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--brand-primary)] font-bold drop-shadow-[0_0_8px_var(--brand-primary)]">
          05 // Visualización Espacial
        </p>
      </div>

      <div className="relative z-10 w-full h-[60vh] flex items-center justify-center perspective-[1200px]">
        {renders.map((render, idx) => {
          const isActive = idx === safeIndex;
          const isPrev = idx === (safeIndex - 1 + renders.length) % renders.length;
          const isNext = idx === (safeIndex + 1) % renders.length;

          let translateZ = -400; let translateX = 0; let rotateY = 0; let opacity = 0; let zIndex = 0;

          if (isActive) { translateZ = 0; translateX = 0; rotateY = 0; opacity = 1; zIndex = 30; }
          else if (isPrev) { translateZ = -200; translateX = -400; rotateY = 30; opacity = 0.6; zIndex = 20; }
          else if (isNext) { translateZ = -200; translateX = 400; rotateY = -30; opacity = 0.6; zIndex = 20; }
          else { opacity = 0; zIndex = 0; }

          return (
            <div
              key={render.id}
              onClick={() => { if (!isActive) onIndexChange(idx); }}
              className={`absolute transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer ${isActive ? 'shadow-[0_0_50px_var(--brand-primary)]' : ''}`}
              style={{ transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`, opacity, zIndex, width: '65vw', maxWidth: '900px', aspectRatio: '16/9' }}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative bg-[#110822] flex items-center justify-center">
                {render.imgUrl ? (
                  <img src={render.imgUrl} alt="Render" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white/20 flex flex-col items-center"><UploadCloud size={48} className="mb-4" /> <span>Esperando Render 0{idx + 1}</span></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020105] via-[#020105]/40 to-transparent"></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-24 w-full text-center z-20 px-8">
        <AnimatePresence mode="wait">
          {renders[safeIndex] && (
            <motion.div key={safeIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                <span className="text-[var(--brand-primary)] font-bold text-[10px] tracking-widest uppercase bg-[var(--brand-primary)]/10 px-2 py-1 rounded">0{safeIndex + 1}</span>
                <p className="text-white text-sm md:text-base font-light tracking-wide ceo-text render-subtitle" dangerouslySetInnerHTML={{ __html: renders[safeIndex].subtitle || 'Sin descripción' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {renders.length > 1 && (
        <>
          <div className="absolute bottom-1/2 left-8 z-30"><button onClick={() => onIndexChange((safeIndex - 1 + renders.length) % renders.length)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] transition-colors"><ChevronLeft /></button></div>
          <div className="absolute bottom-1/2 right-8 z-30"><button onClick={() => onIndexChange((safeIndex + 1) % renders.length)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] transition-colors"><ChevronRight /></button></div>
        </>
      )}
      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 05 / 08</footer>
    </div>
  );
};

const ReminderSlide = ({ data }) => {
  const { reminder, brand } = data;
  const processedHtml = reminder.htmlText.replace(/{{brandName}}/g, brand.name);

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white px-20">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
        <div className="w-[80vw] h-[80vh] bg-[var(--brand-primary)] blur-[250px] mix-blend-screen opacity-15"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-4xl text-center">
        <motion.div animate={{ y: [0, -15, 0], rotateY: [0, 10, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="mb-12 relative">
          <div className="absolute inset-0 bg-[var(--brand-primary)] blur-[40px] opacity-60 rounded-full scale-150"></div>
          <div className="relative w-24 h-32 flex flex-col items-center justify-between z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            <div className="w-4 h-20 bg-gradient-to-b from-white to-white/40 rounded-full backdrop-blur-md border border-white/40 shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]"></div>
            <div className="w-5 h-5 bg-white rounded-full backdrop-blur-md border border-white/40 shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] shadow-[0_0_30px_var(--brand-primary)]"></div>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="text-2xl md:text-4xl font-light tracking-wide leading-relaxed text-white/80 ceo-text" dangerouslySetInnerHTML={{ __html: processedHtml }} />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-16 w-16 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent"></motion.div>
      </div>
      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 06 / 08</footer>
    </div>
  );
};

const PillarsSlide = ({ data }) => {
  const { pillars } = data;
  const icons = [<Hexagon />, <Sparkles />, <Map />, <Users />, <Sun />, <Leaf />];

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white px-20">
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>

      <div className="text-center mb-16 relative z-10">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--brand-primary)] font-bold mb-4 drop-shadow-[0_0_8px_var(--brand-primary)]">07 // Pilares Estratégicos</p>
        <h2 className="text-4xl font-light text-white ceo-text">Arquitectura de Experiencia</h2>
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((pillar, idx) => (
          <div key={pillar.id} className="group relative bg-[#0A0514] border border-[#2D1B4E] rounded-2xl p-8 hover:border-[var(--brand-primary)] transition-all duration-500 overflow-hidden cursor-default">
            <div className="absolute inset-0 bg-[var(--brand-primary)] opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--brand-primary)] blur-[50px] opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/30 group-hover:text-[var(--brand-primary)] transition-colors">0{idx + 1}</span>
                <div className="text-white/30 group-hover:text-[var(--brand-primary)] transition-colors drop-shadow-[0_0_10px_transparent] group-hover:drop-shadow-[0_0_10px_var(--brand-primary)]">
                  {icons[idx]}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transition-all">{pillar.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">{pillar.text}</p>
            </div>
          </div>
        ))}
      </div>
      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 07 / 08</footer>
    </div>
  );
};

const CtaSlide = ({ data, onRestart }) => {
  const [step, setStep] = useState('initial');
  const [formData, setFormData] = useState({ name: '', role: '', email: '', whatsapp: '' });
  
  // Extraemos datos con seguridad absoluta
  const brandName = data?.brand?.name || 'la marca';
  const ctaQuote = data?.ctaFinal?.quote || 'El futuro comienza hoy.';
  const ctaHtml = data?.ctaFinal?.htmlText || 'Agenda tu sesión ahora.';
  const ceoName = data?.studio?.ceo || 'nuestro equipo';
  const studioName = data?.studio?.name || 'Elite 24 Studio';
  const studioWeb = data?.studio?.web || '#';
  const primaryColor = data?.brand?.primaryColor || '#8A05BE';

  const processedHtml = (ctaHtml || '').replace(/{{brandName}}/g, brandName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('sending');
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          brandName,
          studioName
        })
      });

      if (response.ok) {
        setStep('success');
      } else {
        const err = await response.json();
        alert('Error: ' + (err.error || 'No se pudo enviar el correo'));
        setStep('form');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al enviar el formulario');
      setStep('form');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white px-20">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[100vw] h-[100vh] bg-[var(--brand-primary)] blur-[250px] mix-blend-screen opacity-10"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
      </div>

      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'initial' && (
            <motion.div key="initial" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="mb-10 text-[var(--brand-primary)] opacity-60">
                <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                  <Sparkles size={60} className="mx-auto" />
                </motion.div>
              </div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl md:text-5xl font-light text-white mb-8 ceo-text leading-tight italic">
                "{ctaQuote}"
              </motion.h2>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-sm md:text-lg text-white/60 font-light max-w-2xl mx-auto leading-relaxed mb-12" dangerouslySetInnerHTML={{ __html: processedHtml }} />
              
              <div className="flex flex-col gap-5 items-center">
                <button 
                  onClick={() => setStep('form')} 
                  className="px-12 py-5 rounded-full text-white text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 border border-[var(--brand-primary)] bg-[var(--brand-primary)]/20 backdrop-blur-md flex items-center gap-3 shadow-[0_0_30px_rgba(138,5,190,0.2)]"
                >
                  QUIERO AGENDAR REUNIÓN <ChevronRight size={16} />
                </button>
                
                <button 
                  onClick={onRestart}
                  className="px-10 py-4 rounded-full border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <RefreshCcw size={14} /> Volver a vivir la experiencia
                </button>
              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.form key="form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Construyamos el futuro</h3>
                <p className="text-[10px] text-[var(--brand-primary)] uppercase tracking-widest font-bold">Respuesta en menos de 48 horas</p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nombre" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] outline-none transition-all" />
                  <input type="text" placeholder="Cargo" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] outline-none transition-all" />
                </div>
                <input type="email" placeholder="Email corporativo" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] outline-none transition-all" />
                <input type="tel" placeholder="WhatsApp" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] outline-none transition-all" />
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep('initial')} className="px-6 py-4 rounded-xl border border-white/10 text-white/40 text-xs font-bold uppercase">Volver</button>
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(138,5,190,0.4)]">Enviar Solicitud</button>
                </div>
              </div>
            </motion.form>
          )}

          {step === 'sending' && (
            <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-16 h-16 border-4 border-white/10 border-t-[var(--brand-primary)] rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--brand-primary)] font-bold animate-pulse">Conectando con {ceoName}...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white/5 backdrop-blur-2xl border border-[var(--brand-primary)]/40 rounded-3xl p-12 max-w-xl">
              <CheckCircle size={60} className="mx-auto text-[var(--brand-primary)] mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4 uppercase tracking-tighter">¡GRACIAS!</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-10">
                Nos alegra que hayas dado el primer paso. Nos pondremos en contacto contigo muy pronto.
              </p>
              <div className="flex flex-col gap-4">
                <a href={studioWeb} target="_blank" rel="noopener noreferrer" className="w-full py-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold tracking-widest uppercase text-center shadow-[0_0_30px_rgba(138,5,190,0.3)]">
                  Conoce nuestro portafolio acá
                </a>
                <button onClick={onRestart} className="w-full py-4 rounded-full border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                  <RefreshCcw size={14} /> Volver al inicio
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10">CAPÍTULO &nbsp;&nbsp; 08 / 08</footer>
    </div>
  );
};

export default function App() {
  const [projects, setProjects] = useState(defaultProjects);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState('hero');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [renderIndex, setRenderIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isPublicView, setIsPublicView] = useState(() => {
    const path = window.location.pathname;
    return path.startsWith('/c/') || new URLSearchParams(window.location.search).has('p');
  });

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || defaultProjects[0];
  const projectData = activeProject.data;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = decodeURIComponent(window.location.pathname);
    const rawPathSegment = path.startsWith('/c/') ? path.split('/c/')[1].replace(/\/$/, '') : null;
    const sharedParam = rawPathSegment || params.get('p');
    if (sharedParam) setIsPublicView(true);

    // Parse the share URL format: /c/nombre-del-proyecto--ID
    // The ID is the reliable part (after --), the slug is for readability
    let sharedId = null;
    let sharedSlug = null;
    if (sharedParam) {
      if (sharedParam.includes('--')) {
        const parts = sharedParam.split('--');
        sharedSlug = parts[0];
        sharedId = parts[1];
      } else {
        // Fallback: could be just an ID or just a slug (backwards compat)
        sharedId = sharedParam;
        sharedSlug = sharedParam;
      }
    }

    StorageManager.load().then((saved) => {
      console.log("Loading projects context:", { 
        count: saved?.length || 0, 
        sharedParam, 
        isPublic: isPublicView 
      });

      if (saved && saved.length > 0) {
        setProjects(saved);
        if (sharedId || sharedSlug) {
          // 1. Exact ID match (Preferred)
          let shared = sharedId ? saved.find(p => String(p.id) === String(sharedId)) : null;
          
          // 2. Exact Slug match
          if (!shared && sharedSlug) {
            shared = saved.find(p => p.name && slugify(p.name) === sharedSlug);
          }
          
          // 3. Fallback: Search the whole sharedParam as an ID or Slug
          if (!shared && sharedParam) {
            shared = saved.find(p => String(p.id) === String(sharedParam) || (p.name && slugify(p.name) === sharedParam));
          }

          if (shared) {
            console.log("Matched project found:", shared.name);
            setActiveProjectId(shared.id);
            setIsFullscreen(true);
          } else if (isPublicView) {
            console.error("Project match failed:", { sharedId, sharedSlug, sharedParam });
            setIsNotFound(true);
          } else {
            setActiveProjectId(saved[0].id);
          }
        } else {
          setActiveProjectId(saved[0].id);
        }
      } else {
        // If it's a public view and we found NO projects, it's definitely an error
        if (isPublicView) {
          console.error("No projects returned from Notion during public view");
          setIsNotFound(true);
        } else if (saved !== null) {
          // If saved is [], we just show the default
          setActiveProjectId(defaultProjects[0].id);
        }
        // If saved is null, it means the fetch failed completely
      }
      setIsAppLoaded(true);
    }).catch(err => {
      console.error("Critical loading error:", err);
      if (isPublicView) setIsNotFound(true);
      setIsAppLoaded(true);
    });
  }, []);

  const scrollTimeout = React.useRef(null);
  const lastScrollTime = React.useRef(0);

  const handleNext = () => {
    if (currentSlide === 4 && renderIndex < (projectData.renders?.length || 0) - 1) {
      setRenderIndex(prev => prev + 1);
    } else if (currentSlide < MAX_SLIDES - 1) {
      setCurrentSlide(prev => prev + 1);
      setRenderIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentSlide === 4 && renderIndex > 0) {
      setRenderIndex(prev => prev - 1);
    } else if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setRenderIndex(0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
    };

    const handleWheel = (e) => {
      if (e.target.closest('aside') || e.target.closest('section')) return;
      
      const now = Date.now();
      if (now - lastScrollTime.current < 900) return; // Debounce 0.9s

      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) handleNext();
        else handlePrev();
        lastScrollTime.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isFullscreen, currentSlide, renderIndex, projectData]);

  const handleSaveChanges = async () => {
    setSaveStatus('saving');
    try {
      await StorageManager.save(projects, activeProjectId);
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleUpdateData = (section, field, value) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, data: { ...p.data, [section]: { ...p.data[section], [field]: value } } } : p));
  };

  const handleUpdateNestedData = (section, nestedField, field, value) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        if (nestedField) return { ...p, data: { ...p.data, [section]: { ...p.data[section], [nestedField]: { ...p.data[section][nestedField], [field]: value } } } };
        else return { ...p, data: { ...p.data, [section]: { ...p.data[section], [field]: value } } };
      }
      return p;
    }));
  };

  const handleUpdateVisionCard = (cardIdx, field, value) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const newCards = [...p.data.vision.cards];
        newCards[cardIdx] = { ...newCards[cardIdx], [field]: value };
        return { ...p, data: { ...p.data, vision: { ...p.data.vision, cards: newCards } } };
      }
      return p;
    }));
  };

  const handleUpdateRender = (renderIdx, field, value) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const newRenders = [...p.data.renders];
        newRenders[renderIdx] = { ...newRenders[renderIdx], [field]: value };
        return { ...p, data: { ...p.data, renders: newRenders } };
      }
      return p;
    }));
  };

  const handleExportHtml = () => {
    const brandName = projectData.brand.name || 'Proyecto';
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandName} · Propuesta B2B</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        :root { --brand-primary: ${projectData.brand.primaryColor}; }
        body { background: #0A0514; color: white; font-family: 'Outfit', sans-serif; }
        .ceo-text b { color: var(--brand-primary); font-weight: 700; }
        .bg-glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); }
    </style>
</head>
<body class="min-h-screen overflow-x-hidden">
    <div id="viewer" class="max-w-4xl mx-auto p-8 space-y-20 py-20">
        <section class="text-center space-y-8">
            <div class="inline-block px-4 py-1 rounded-full border border-[var(--brand-primary)] text-[var(--brand-primary)] text-[10px] tracking-widest font-bold uppercase">
                ${projectData.hero.badge}
            </div>
            <h1 class="text-4xl md:text-6xl font-bold leading-tight ceo-text">
                ${projectData.hero.titleHtml}
            </h1>
        </section>
        <section class="grid md:grid-cols-2 gap-12 items-center bg-glass p-8 rounded-3xl border border-white/10">
            <div class="space-y-6">
                <h2 class="text-xs tracking-[0.3em] uppercase text-white/40 font-bold">Invitación del CEO</h2>
                <div class="text-lg leading-relaxed ceo-text">
                    ${projectData.ceoInvitation.htmlMessage}
                </div>
            </div>
            ${projectData.ceoInvitation.photoUrl ? `<img src="${projectData.ceoInvitation.photoUrl}" class="rounded-2xl w-full aspect-[3/4] object-cover shadow-2xl border border-white/10" />` : ''}
        </section>
        <section class="space-y-8">
            <h2 class="text-center text-xs tracking-[0.3em] uppercase text-white/40 font-bold">Visualización Espacial</h2>
            <div class="grid gap-8">
                ${projectData.renders.map(r => `
                    <div class="space-y-4">
                        <img src="${r.imgUrl}" class="w-full rounded-2xl border border-white/10 shadow-xl" />
                        <p class="text-center text-sm text-white/60 ceo-text">${r.subtitle}</p>
                    </div>
                `).join('')}
            </div>
        </section>
        <footer class="text-center py-20 border-t border-white/10">
            <p class="text-white/40 text-xs tracking-widest uppercase mb-4">Generado por B2B CEO Builder</p>
            <div class="font-bold text-[var(--brand-primary)]">${projectData.studio.name}</div>
        </footer>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Propuesta_${brandName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddRender = () => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId && p.data.renders.length < 7) {
        const newRenders = [...p.data.renders, { id: Date.now(), imgUrl: '', subtitle: 'Nuevo espacio estratégico' }];
        return { ...p, data: { ...p.data, renders: newRenders } };
      }
      return p;
    }));
  };

  const handleRemoveRender = (renderIdx) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId && p.data.renders.length > 1) {
        const newRenders = p.data.renders.filter((_, i) => i !== renderIdx);
        return { ...p, data: { ...p.data, renders: newRenders } };
      }
      return p;
    }));
  };

  const handleUpdatePillar = (idx, field, value) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const newPillars = [...p.data.pillars];
        newPillars[idx] = { ...newPillars[idx], [field]: value };
        return { ...p, data: { ...p.data, pillars: newPillars } };
      }
      return p;
    }));
  };

  const handleCreateProject = () => {
    const newProj = {
      id: Date.now().toString(),
      name: 'Nueva Propuesta',
      date: new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }).format(new Date()),
      data: JSON.parse(JSON.stringify(defaultProjects[0].data))
    };
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
  };

  const handleAiCreate = (data) => {
    const newProj = {
      id: Date.now().toString(),
      name: `Propuesta · ${data.name}`,
      date: new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }).format(new Date()),
      data: {
        ...JSON.parse(JSON.stringify(defaultProjects[0].data)),
        brand: { ...defaultProjects[0].data.brand, name: data.name, primaryColor: data.color, logoUrl: '' },
        hero: { ...defaultProjects[0].data.hero, titleHtml: `¿Cómo podría <b>${data.name}</b> transformar la experiencia <b>física</b> corporativa en Colombia?` }
      }
    };
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
    setShowAiModal(false);
    setActiveAccordion('hero');
    setCurrentSlide(0);
  };

  const handleDuplicateProject = (id) => {
    const projToCopy = projects.find(p => p.id === id);
    if (projToCopy) {
      const newProj = { ...projToCopy, id: Date.now().toString(), name: `${projToCopy.name} (Copia)`, date: new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }).format(new Date()), data: JSON.parse(JSON.stringify(projToCopy.data)) };
      setProjects([newProj, ...projects]);
    }
  };

  const handleDeleteProject = async (id) => {
    if (projects.length === 1) return;
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (activeProjectId === id) setActiveProjectId(newProjects[0].id);
    await StorageManager.delete(id);
  };

  const handleRenameProject = (id, newName) => {
    setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
  };
  const handleShareLink = async () => {
    // Auto-guardar antes de compartir para asegurar que los datos estén en la nube
    if (!isPublicView) {
      await handleSaveChanges();
    }
    
    // Format: /c/nombre-del-proyecto--ID
    // Slug gives readability & trust, ID ensures reliable matching
    const slug = slugify(activeProject.name);
    const url = `${window.location.origin}/c/${slug}--${activeProject.id}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url.toString()).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement("textarea");
      textArea.value = url.toString();
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  if (isNotFound) {
    return (
      <div className="w-screen h-screen bg-[#0A0514] flex flex-col items-center justify-center text-white px-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
          <Trash2 className="text-red-500" size={32} />
        </div>
        <h2 className="text-3xl font-bold mb-4 uppercase tracking-tighter">Propuesta no encontrada</h2>
        <p className="text-white/50 max-w-md text-sm leading-relaxed mb-8">
          Lo sentimos, el enlace al que intentas acceder no existe o ha sido movido. 
          Por favor, contacta a tu asesor de ELITE 24 STUDIO.
        </p>
        <a href="https://elite24studio.com.co/" className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
          Ir a la web principal
        </a>
      </div>
    );
  }

  if (!isAppLoaded) {
    return (
      <div className="w-screen h-screen bg-[#0A0514] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-white/10 border-t-[#8A05BE] rounded-full animate-spin mb-6 shadow-[0_0_20px_#8A05BE]/20"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 animate-pulse">
          {isPublicView ? 'Iniciando Experiencia Digital...' : 'Cargando Bóveda Segura...'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#0A0514] font-sans overflow-hidden flex" style={{ '--brand-primary': projectData.brand.primaryColor, '--brand-accent': projectData.brand.accentColor }}>
      {!isPublicView && (
        <aside className={`w-[280px] h-full bg-[#05020A] border-r border-[#2D1B4E] flex flex-col z-40 ${isFullscreen ? 'hidden' : 'flex'}`}>
          <div className="p-4 border-b border-[#2D1B4E] flex items-center gap-3 bg-[#110822]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8A05BE] to-[#3B0059] flex items-center justify-center font-bold text-white shadow-[0_0_15px_#8A05BE]">E24</div>
            <div><h1 className="text-white text-sm font-bold tracking-wider">ELITE 24 STUDIO</h1><p className="text-white/40 text-[10px] tracking-widest uppercase">B2B Builder</p></div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <button onClick={handleCreateProject} className="w-full bg-[#8A05BE] hover:bg-[#9B06D6] text-white rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-[0_0_20px_#8A05BE]/30 mb-3">
              <Plus size={16} /> Nuevo proyecto
            </button>
            <button onClick={() => setShowAiModal(true)} className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-[#8A05BE] text-white rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 shadow-[0_0_20px_rgba(138,5,190,0.3)] mb-6 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(138,5,190,0.6)]">
              <Sparkles size={16} className="animate-pulse" /> IA FAST BUILDER
            </button>

            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-3 px-1">PROYECTOS GUARDADOS</div>
            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-2">
              {projects.map(proj => (
                <ProjectListItem key={proj.id} proj={proj} isActive={activeProjectId === proj.id} onClick={() => { setActiveProjectId(proj.id); setActiveAccordion('hero'); setCurrentSlide(0); }} onRename={handleRenameProject} onDuplicate={handleDuplicateProject} onDelete={handleDeleteProject} />
              ))}
            </div>
          </div>
        </aside>
      )}

      {!isPublicView && (
        <section className={`w-[400px] h-full bg-[#0A0514] border-r border-[#2D1B4E] flex flex-col z-30 ${isFullscreen ? 'hidden' : 'flex'}`}>
          <div className="p-4 border-b border-[#2D1B4E] bg-[#110822]">
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">PROYECTO ACTIVO</div>
            <h2 className="text-white text-lg font-bold truncate">{projectData.brand.name}</h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
            <Accordion title="Identidad de la marca" isOpen={activeAccordion === 'brand'} onClick={() => setActiveAccordion(activeAccordion === 'brand' ? null : 'brand')}>
              <div className="space-y-4">
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Nombre de la marca</label><input type="text" value={projectData.brand.name} onChange={e => handleUpdateData('brand', 'name', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white focus:border-[#8A05BE] outline-none transition-colors" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Color primario</label><div className="flex items-center gap-2"><input type="color" value={projectData.brand.primaryColor} onChange={e => handleUpdateData('brand', 'primaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" /><input type="text" value={projectData.brand.primaryColor} onChange={e => handleUpdateData('brand', 'primaryColor', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-1.5 text-xs text-white uppercase font-mono" /></div></div>
                </div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Logo de la marca (opcional)</label><ImageUploader value={projectData.brand.logoUrl} onChange={val => handleUpdateData('brand', 'logoUrl', val)} /></div>
              </div>
            </Accordion>

            <Accordion title="Tu estudio" isOpen={activeAccordion === 'studio'} onClick={() => setActiveAccordion(activeAccordion === 'studio' ? null : 'studio')}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Nombre estudio</label><input type="text" value={projectData.studio.name} onChange={e => handleUpdateData('studio', 'name', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white" /></div><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">NIT</label><input type="text" value={projectData.studio.nit} onChange={e => handleUpdateData('studio', 'nit', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">CEO</label><input type="text" value={projectData.studio.ceo} onChange={e => handleUpdateData('studio', 'ceo', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white" /></div><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Iniciales</label><input type="text" value={projectData.studio.iniciales} onChange={e => handleUpdateData('studio', 'iniciales', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white" /></div></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Email gerencia</label><input type="email" value={projectData.studio.email} onChange={e => handleUpdateData('studio', 'email', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Logo Estudio</label><ImageUploader value={projectData.studio.logoUrl} onChange={val => handleUpdateData('studio', 'logoUrl', val)} className="h-24" /></div>
              </div>
            </Accordion>

            <Accordion title="Portada (Hero)" badge="1" isOpen={activeAccordion === 'hero'} onClick={() => { 
              const next = activeAccordion === 'hero' ? null : 'hero';
              setActiveAccordion(next); 
              if (next) setCurrentSlide(0); 
            }}>
              <div className="space-y-4">
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Badge superior</label><input type="text" value={projectData.hero.badge} onChange={e => handleUpdateData('hero', 'badge', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Pregunta principal (HTML)</label><textarea value={projectData.hero.titleHtml} onChange={e => handleUpdateData('hero', 'titleHtml', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-24 resize-none custom-scrollbar" /></div>
              </div>
            </Accordion>

            <Accordion title="Invitación CEO" badge="2" isOpen={activeAccordion === 'ceo'} onClick={() => { 
              const next = activeAccordion === 'ceo' ? null : 'ceo';
              setActiveAccordion(next); 
              if (next) setCurrentSlide(2); 
            }}>
              <div className="space-y-6">
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Cuerpo del saludo (HTML)</label><textarea value={projectData.ceoInvitation.htmlMessage} onChange={e => handleUpdateData('ceoInvitation', 'htmlMessage', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-32 custom-scrollbar focus:border-[var(--brand-primary)] outline-none" /></div>
                <div className="grid grid-cols-3 gap-2"><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Métrica 1</label><input type="text" value={projectData.ceoInvitation.metric1.value} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric1', 'value', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-2 text-center text-sm text-white mb-2" /><input type="text" value={projectData.ceoInvitation.metric1.label} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric1', 'label', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-1 text-center text-[9px] text-white uppercase" /></div><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Métrica 2</label><input type="text" value={projectData.ceoInvitation.metric2.value} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric2', 'value', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-2 text-center text-sm text-white mb-2" /><input type="text" value={projectData.ceoInvitation.metric2.label} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric2', 'label', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-1 text-center text-[9px] text-white uppercase" /></div><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Métrica 3</label><input type="text" value={projectData.ceoInvitation.metric3.value} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric3', 'value', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-2 text-center text-sm text-white mb-2" /><input type="text" value={projectData.ceoInvitation.metric3.label} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric3', 'label', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-1 text-center text-[9px] text-white uppercase" /></div></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Foto CEO (Retrato)</label><ImageUploader value={projectData.ceoInvitation.photoUrl} onChange={val => handleUpdateData('ceoInvitation', 'photoUrl', val)} className="h-40" /></div>
              </div>
            </Accordion>

            <Accordion title="Visión conceptual" badge="3" isOpen={activeAccordion === 'vision'} onClick={() => { 
              const next = activeAccordion === 'vision' ? null : 'vision';
              setActiveAccordion(next); 
              if (next) setCurrentSlide(3); 
            }}>
              <div className="space-y-6">
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Título (HTML)</label><textarea value={projectData.vision.titleHtml} onChange={e => handleUpdateNestedData('vision', null, 'titleHtml', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white focus:border-[#8A05BE] outline-none min-h-[80px] custom-scrollbar" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Párrafo descriptivo</label><textarea value={projectData.vision.description} onChange={e => handleUpdateNestedData('vision', null, 'description', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white focus:border-[#8A05BE] outline-none min-h-[80px] custom-scrollbar" /></div>
                <div className="border-t border-[#2D1B4E] pt-4 space-y-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">Tarjetas de Estrategia (5)</p>
                  {projectData.vision.cards.map((card, index) => (
                    <div key={card.id} className="bg-[#150C22] p-4 rounded-lg border border-[#2D1B4E] space-y-3 relative group">
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg">0{index + 1}</div>
                      <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Título Tarjeta</label><input type="text" value={card.title} onChange={e => handleUpdateVisionCard(index, 'title', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white" /></div>
                      <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Descripción breve</label><textarea value={card.text} onChange={e => handleUpdateVisionCard(index, 'text', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white h-16 resize-none custom-scrollbar" /></div>
                      <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Imagen Conceptual</label><ImageUploader value={card.imgUrl} onChange={val => handleUpdateVisionCard(index, 'imgUrl', val)} className="mt-0" /></div>
                    </div>
                  ))}
                </div>
              </div>
            </Accordion>

            <Accordion title={`Renders del proyecto (${projectData.renders?.length || 0})`} badge="4" isOpen={activeAccordion === 'renders'} onClick={() => { 
              const next = activeAccordion === 'renders' ? null : 'renders';
              setActiveAccordion(next); 
              if (next) { setCurrentSlide(4); setRenderIndex(0); }
            }}>
              <div className="space-y-4">
                {projectData.renders.map((render, index) => (
                  <div key={render.id} className="bg-[#150C22] p-4 rounded-lg border border-[#2D1B4E] border-dashed space-y-4 relative group">
                    <div className="absolute top-2 left-2 w-6 h-6 bg-[var(--brand-primary)] text-white rounded flex items-center justify-center text-[10px] font-bold shadow-lg">0{index + 1}</div>
                    {projectData.renders.length > 1 && (<button onClick={() => handleRemoveRender(index)} className="absolute top-2 right-2 text-white/20 hover:text-red-400 p-1 transition-colors"><Trash2 size={14} /></button>)}
                    <div className="pt-6">
                      <ImageUploader value={render.imgUrl} onChange={val => handleUpdateRender(index, 'imgUrl', val)} className="h-24 mb-3" />
                      <input type="text" value={render.subtitle} onChange={e => handleUpdateRender(index, 'subtitle', e.target.value)} placeholder="Ej: Lobby principal · <b>Hito de marca</b>" className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white text-center focus:border-[var(--brand-primary)] outline-none" />
                    </div>
                  </div>
                ))}
                {projectData.renders.length < 7 && (
                  <button onClick={handleAddRender} className="w-full py-3 border border-dashed border-[#2D1B4E] rounded-lg text-white/40 hover:text-white hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-4">
                    <Plus size={14} /> Añadir Render ({projectData.renders.length}/7)
                  </button>
                )}
              </div>
            </Accordion>

            <Accordion title="Recordatorio" badge="5" isOpen={activeAccordion === 'reminder'} onClick={() => { 
              const next = activeAccordion === 'reminder' ? null : 'reminder';
              setActiveAccordion(next); 
              if (next) setCurrentSlide(5); 
            }}>
              <div className="space-y-4">
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Párrafo (HTML)</label><textarea value={projectData.reminder.htmlText} onChange={e => handleUpdateData('reminder', 'htmlText', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-32 custom-scrollbar focus:border-[var(--brand-primary)] outline-none" /></div>
              </div>
            </Accordion>

            <Accordion title={`Pilares (${projectData.pillars?.length || 0} cards)`} badge="6" isOpen={activeAccordion === 'pillars'} onClick={() => { 
              const next = activeAccordion === 'pillars' ? null : 'pillars';
              setActiveAccordion(next); 
              if (next) setCurrentSlide(6); 
            }}>
              <div className="space-y-4">
                {projectData.pillars.map((pillar, idx) => (
                  <div key={pillar.id} className="bg-[#150C22] p-4 rounded-lg border border-[#2D1B4E] space-y-3 relative group">
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg">0{idx + 1}</div>
                    <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Título</label><input type="text" value={pillar.title} onChange={e => handleUpdatePillar(idx, 'title', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white focus:border-[var(--brand-primary)] outline-none" /></div>
                    <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Texto</label><textarea value={pillar.text} onChange={e => handleUpdatePillar(idx, 'text', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-24 custom-scrollbar focus:border-[var(--brand-primary)] outline-none" /></div>
                  </div>
                ))}
              </div>
            </Accordion>

            <Accordion title="CTA Final" badge="7" isOpen={activeAccordion === 'cta'} onClick={() => { 
              const next = activeAccordion === 'cta' ? null : 'cta';
              setActiveAccordion(next); 
              if (next) setCurrentSlide(7); 
            }}>
              <div className="space-y-6">
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Cita destacada</label><input type="text" value={projectData.ctaFinal.quote} onChange={e => handleUpdateData('ctaFinal', 'quote', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white focus:border-[var(--brand-primary)] outline-none" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Párrafo CTA (HTML)</label><textarea value={projectData.ctaFinal.htmlText} onChange={e => handleUpdateData('ctaFinal', 'htmlText', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-32 custom-scrollbar focus:border-[var(--brand-primary)] outline-none" /></div>
              </div>
            </Accordion>

            <div className="p-6 mt-4 mb-10 border-t border-[#2D1B4E]">
              <button
                onClick={handleSaveChanges}
                className={`w-full py-4 rounded-xl text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500 shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group
                  ${saveStatus === 'saved' ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
                    saveStatus === 'error' ? 'bg-red-500 text-white' :
                      'bg-[var(--brand-primary)] text-white shadow-[0_0_20px_var(--brand-primary)] hover:scale-[1.02]'}`}
              >
                {saveStatus === 'saved' ? <CheckCircle size={18} /> : saveStatus === 'error' ? 'Error de Bóveda' : <Save size={18} className="group-hover:-translate-y-1 transition-transform" />}
                {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? '¡Cambios Guardados!' : saveStatus === 'error' ? 'Vuelve a intentar' : 'Guardar Proyecto'}
                {saveStatus === 'saving' && <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>}
              </button>
              <p className="text-center text-[9px] text-white/30 tracking-widest uppercase mt-4">Almacenamiento Ilimitado (IndexedDB)</p>
            </div>
          </div>
        </section>
      )}

      <main className={`relative bg-black overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${isFullscreen || isPublicView ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'flex-1'}`}>
        <header className="absolute top-0 w-full p-4 flex justify-end gap-3 z-50 pointer-events-none">
          <div className="pointer-events-auto flex gap-3">
            {isPublicView ? (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10 shadow-2xl mr-4 mt-2"
              >
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#8A05BE] to-[#3B0059] flex items-center justify-center text-[8px] font-bold text-white shadow-[0_0_10px_#8A05BE]">E24</div>
                <div className="w-px h-3 bg-white/20"></div>
                <div className="text-[9px] tracking-[0.3em] uppercase text-white/60 font-bold">{projectData.studio.name}</div>
              </motion.div>
            ) : (
              <>
                <button onClick={handleShareLink} className={`bg-white/10 hover:bg-[var(--brand-primary)] text-white backdrop-blur-md rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg ${isCopied ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                  {isCopied ? <CheckCircle size={14} /> : <Share2 size={14} />} {isCopied ? '¡Link copiado!' : 'Compartir'}
                </button>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors shadow-lg">
                  {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} {isFullscreen ? 'Salir (ESC)' : 'Pantalla completa'}
                </button>
                <button onClick={handleExportHtml} className="bg-[#E7B865] hover:bg-[#D4A352] text-black rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors shadow-lg shadow-[#E7B865]/20">
                  <Download size={14} /> Exportar HTML
                </button>
              </>
            )}
          </div>
        </header>

        <div className="w-full h-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {currentSlide === 0 && <HeroSlide data={projectData} onNext={handleNext} />}
              {currentSlide === 1 && <ManifestoSlide data={projectData} />}
              {currentSlide === 2 && <CeoSlide data={projectData} />}
              {currentSlide === 3 && <VisionSlide data={projectData} />}
              {currentSlide === 4 && <RendersSlide data={projectData} activeIndex={renderIndex} onIndexChange={setRenderIndex} />}
              {currentSlide === 5 && <ReminderSlide data={projectData} />}
              {currentSlide === 6 && <PillarsSlide data={projectData} />}
              {currentSlide === 7 && <CtaSlide data={projectData} onRestart={() => { setCurrentSlide(0); setRenderIndex(0); }} />}
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-y-0 left-0 w-32 flex items-center justify-start opacity-0 hover:opacity-100 transition-opacity z-40">
            <button onClick={handlePrev} className="ml-8 w-12 h-12 rounded-full border border-white/20 bg-black/20 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all backdrop-blur-md shadow-lg"><ChevronLeft /></button>
          </div>
          <div className="absolute inset-y-0 right-0 w-32 flex items-center justify-end opacity-0 hover:opacity-100 transition-opacity z-40">
            <button onClick={handleNext} className="mr-8 w-12 h-12 rounded-full border border-white/20 bg-black/20 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all backdrop-blur-md shadow-lg"><ChevronRight /></button>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        :root { --brand-primary: #8A05BE; --brand-accent: #FCFCFC; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2D1B4E; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--brand-primary); }
        .ceo-text b { color: var(--brand-primary); font-weight: 700; text-shadow: 0 0 20px var(--brand-primary); }
        .render-subtitle b { color: var(--brand-primary); font-weight: 700; text-shadow: 0 0 10px var(--brand-primary); animation: breatheText 3s infinite; }
        @keyframes float-watermark { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.25; } 50% { transform: translateY(-20px) scale(1.05); opacity: 0.35; filter: blur(3px); } }
        .animate-float-watermark { animation: float-watermark 15s ease-in-out infinite; }
        @keyframes rotate-wave { 0% { transform: rotate(0deg) scale(1); opacity: 0.3; } 50% { transform: rotate(180deg) scale(1.2); opacity: 0.5; } 100% { transform: rotate(360deg) scale(1); opacity: 0.3; } }
        .animate-rotate-wave { animation: rotate-wave 25s linear infinite; border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.25; transform: scale(1.2); } }
        .animate-pulse-glow { animation: pulse-glow 8s ease-in-out infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes breatheText { 0%, 100% { text-shadow: 0 0 10px var(--brand-primary); } 50% { text-shadow: 0 0 20px var(--brand-primary), 0 0 30px var(--brand-primary); } }
      `}} />

      {showAiModal && <AiWizardModal onClose={() => setShowAiModal(false)} onComplete={handleAiCreate} />}
    </div>
  );
}
