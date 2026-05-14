import React, { useState, useEffect } from 'react';
import {
  Plus, Copy, Trash2, Edit2, ChevronLeft, ChevronRight,
  UploadCloud, Maximize, Minimize, Download, CheckCircle,
  Hexagon, Sparkles, Map, Users, Sun, Leaf, Share2, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DB_NAME = 'Elite24_B2B_Builder';
const STORE_NAME = 'projects';

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
  save: async (data) => {
    try {
      // 1. Try LocalStorage for instant access (handles most cases if compressed)
      localStorage.setItem('b2b-projects-v2', JSON.stringify(data));
      // 2. Fallback to IndexedDB for safety
      await saveToDB('b2b-projects-v2', data);
    } catch (e) {
      console.warn("LocalStorage full, relying on IndexedDB", e);
      await saveToDB('b2b-projects-v2', data);
    }
  },
  load: async () => {
    try {
      // Prefer LocalStorage if available and complete
      const local = localStorage.getItem('b2b-projects-v2');
      if (local) return JSON.parse(local);
      // Fallback to IndexedDB
      const dbData = await loadFromDB('b2b-projects-v2');
      return dbData;
    } catch (e) {
      console.error("Storage loading error:", e);
      return null;
    }
  }
};

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
      vision: { titleHtml: 'Una visión pensada <b>específicamente</b> para el potencial de su presencia en <b>Colombia</b>.', description: 'Hemos desarrollado un concepto estratégico que conecta la identidad digital de Nubank con un lenguaje físico capaz de generar memoria, comunidad y deseo de pertenencia.', cards: [{ id: 1, title: 'Biometría Espacial', text: 'El espacio reconoce al usuario al entrar. Adiós a las filas tradicionales, bienvenida la fricción cero.', imgUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' }, { id: 2, title: 'Luz como Marca', text: 'Bañamos los interiores con el espectro lumínico de Nubank, creando un aura inconfundible y magnética.', imgUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80' }, { id: 3, title: 'Paisajismo Digital', text: 'Integración de flora endémica colombiana con monolitos digitales y pantallas de datos en tiempo real.', imgUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' }, { id: 4, title: 'Materialidad Táctil', text: 'Superficies que invitan a tocar. Contraste entre metal pulido y tejidos cálidos artesanales colombianos.', imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' }, { id: 5, title: 'Community Hub', text: 'No es una sucursal, es un punto de encuentro, cafetería de autor y zona de networking para clientes.', imgUrl: 'https://images.unsplash.com/photo-1616803140344-6682afb13cda?auto=format&fit=crop&w=800&q=80' }] },
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
      // Compresión al vuelo respetando transparencias (PNG)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200; // Calidad FHD
        if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // SOLUCIÓN: Si es PNG, guardarlo como PNG para no perder la transparencia.
        // De lo contrario, usar WEBP/JPEG para máxima compresión.
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
        const quality = file.type === 'image/png' ? undefined : 0.8;

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
      onClick={() => document.getElementById(`file-upload-${className}`).click()}
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
      <input id={`file-upload-${className}`} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
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
        {/* Lado Izquierdo: Foto CEO con Borde Neón */}
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

        {/* Lado Derecho: Mensaje y Métricas */}
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

          {/* Métricas con Animación Escalonada */}
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

const RendersSlide = ({ data }) => {
  const { renders } = data;
  const [activeIndex, setActiveIndex] = useState(0);

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
          const isActive = idx === activeIndex;
          const isPrev = idx === (activeIndex - 1 + renders.length) % renders.length;
          const isNext = idx === (activeIndex + 1) % renders.length;

          let translateZ = -400; let translateX = 0; let rotateY = 0; let opacity = 0; let zIndex = 0;

          if (isActive) { translateZ = 0; translateX = 0; rotateY = 0; opacity = 1; zIndex = 30; }
          else if (isPrev) { translateZ = -200; translateX = -400; rotateY = 30; opacity = 0.6; zIndex = 20; }
          else if (isNext) { translateZ = -200; translateX = 400; rotateY = -30; opacity = 0.6; zIndex = 20; }
          else { opacity = 0; zIndex = 0; }

          return (
            <div
              key={render.id}
              onClick={() => { if (!isActive) setActiveIndex(idx); }}
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
          <motion.div key={activeIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
              <span className="text-[var(--brand-primary)] font-bold text-[10px] tracking-widest uppercase bg-[var(--brand-primary)]/10 px-2 py-1 rounded">0{activeIndex + 1}</span>
              <p className="text-white text-sm md:text-base font-light tracking-wide ceo-text render-subtitle" dangerouslySetInnerHTML={{ __html: renders[activeIndex].subtitle }} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-1/2 left-8 z-30"><button onClick={() => setActiveIndex((activeIndex - 1 + renders.length) % renders.length)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] transition-colors"><ChevronLeft /></button></div>
      <div className="absolute bottom-1/2 right-8 z-30"><button onClick={() => setActiveIndex((activeIndex + 1) % renders.length)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] transition-colors"><ChevronRight /></button></div>
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
        {/* Símbolo 3D Exclamación */}
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

const CtaSlide = ({ data }) => {
  const { ctaFinal, brand, studio } = data;
  const [step, setStep] = useState('initial');
  const processedHtml = ctaFinal.htmlText.replace(/{{brandName}}/g, brand.name);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('sending');
    setTimeout(() => { setStep('success'); }, 2500);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white px-20">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[100vw] h-[100vh] bg-[var(--brand-primary)] blur-[250px] mix-blend-screen opacity-10"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay animate-pulse-glow"></div>
      </div>

      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'initial' && (
            <motion.div key="initial" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="text-center">
              <div className="mb-10 text-[var(--brand-primary)] opacity-60">
                <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                  <Sparkles size={64} className="mx-auto drop-shadow-[0_0_25px_var(--brand-primary)]" />
                </motion.div>
              </div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-3xl md:text-5xl font-light tracking-tight text-white mb-8 ceo-text leading-tight">
                "{ctaFinal.quote}"
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-sm md:text-lg text-white/60 font-light max-w-2xl mx-auto leading-relaxed ceo-text mb-12" dangerouslySetInnerHTML={{ __html: processedHtml }} />
              <motion.button onClick={() => setStep('form')} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.6 }} className="px-12 py-5 rounded-full text-white text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 border border-[var(--brand-primary)] shadow-[0_0_30px_var(--brand-primary)] bg-[var(--brand-primary)]/20 backdrop-blur-md flex items-center gap-3 mx-auto group">
                QUIERO AGENDAR REUNIÓN <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.form key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }} onSubmit={handleSubmit} className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Construyamos el futuro de {brand.name}</h3>
                <p className="text-xs text-[var(--brand-primary)] uppercase tracking-widest font-bold">Respuesta en menos de 48 horas</p>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Nombre completo</label><input type="text" name="nombre" required className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] focus:bg-white/5 outline-none transition-colors" placeholder="Tu nombre" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Cargo</label><input type="text" name="cargo" required className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] focus:bg-white/5 outline-none transition-colors" placeholder="Ej: Director de Expansión" /></div>
              </div>
              <div className="mb-6"><label className="block text-[10px] uppercase tracking-widest text-[var(--brand-primary)] mb-2 font-bold flex items-center gap-1">Correo corporativo (*)</label><input type="email" name="email" required className="w-full bg-black/40 border border-[var(--brand-primary)]/50 rounded-lg px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] focus:bg-white/5 outline-none transition-colors shadow-[0_0_10px_var(--brand-primary)]/20" placeholder={`ejemplo@${brand.name.toLowerCase().replace(/\s/g, '')}.com`} /></div>
              <div className="mb-8"><label className="block text-[10px] uppercase tracking-widest text-[var(--brand-primary)] mb-2 font-bold flex items-center gap-1">Celular / WhatsApp (*)</label><input type="tel" name="whatsapp" required className="w-full bg-black/40 border border-[var(--brand-primary)]/50 rounded-lg px-4 py-3 text-sm text-white focus:border-[var(--brand-primary)] focus:bg-white/5 outline-none transition-colors shadow-[0_0_10px_var(--brand-primary)]/20" placeholder="+57 300 000 0000" /></div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setStep('initial')} className="px-6 py-4 rounded-xl border border-white/20 text-white/60 text-xs font-bold tracking-[0.1em] uppercase hover:bg-white/5 transition-colors">Volver</button>
                <button type="submit" className="flex-1 py-4 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-[1.02] shadow-[0_0_20px_var(--brand-primary)]">Enviar Solicitud</button>
              </div>
            </motion.form>
          )}

          {step === 'sending' && (
            <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-16 h-16 border-4 border-white/10 border-t-[var(--brand-primary)] rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_var(--brand-primary)]"></div>
              <p className="text-sm tracking-[0.2em] uppercase text-[var(--brand-primary)] font-bold animate-pulse">Conectando con {studio.ceo}...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white/5 backdrop-blur-xl border border-[var(--brand-primary)]/50 rounded-3xl p-12 shadow-[0_0_50px_rgba(138,5,190,0.3)] max-w-xl">
              <CheckCircle size={64} className="mx-auto text-[var(--brand-primary)] mb-6 drop-shadow-[0_0_15px_var(--brand-primary)]" />
              <h3 className="text-3xl font-bold text-white mb-4">¡GRACIAS!</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-8">
                Nuestro CEO en las proximas 48 horas te contactara para presentarte nuestro estudio mas a fondo, nos alegra que hayas dado el primer paso...
              </p>
              <a href={studio.web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-white text-xs font-bold tracking-[0.1em] uppercase hover:bg-[var(--brand-primary)] transition-all">
                Conoce nuestro portafolio acá <ChevronRight size={16} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="absolute bottom-8 w-full flex justify-center text-[9px] tracking-[0.4em] uppercase text-white/40 font-bold z-10 pointer-events-none">CAPÍTULO &nbsp;&nbsp; 08 / 08</footer>
    </div>
  );
};

export default function App() {
  const [projects, setProjects] = useState(defaultProjects);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState('hero');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  useEffect(() => {
    loadFromDB('b2b-projects-v2').then((saved) => {
      if (saved && saved.length > 0) {
        setProjects(saved);
        setActiveProjectId(saved[0].id);
      } else {
        setActiveProjectId(defaultProjects[0].id);
      }
      setIsAppLoaded(true);
    }).catch(err => {
      console.error(err);
      setActiveProjectId(defaultProjects[0].id);
      setIsAppLoaded(true);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    StorageManager.load().then((saved) => {
      if (saved && saved.length > 0) {
        setProjects(saved);
        setActiveProjectId(saved[0].id);
      } else {
        setActiveProjectId(defaultProjects[0].id);
      }
      setIsAppLoaded(true);
    }).catch(err => {
      console.error(err);
      setActiveProjectId(defaultProjects[0].id);
      setIsAppLoaded(true);
    });
  }, []);

  const handleSaveChanges = async () => {
    setSaveStatus('saving');
    try {
      await StorageManager.save(projects);
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

  const handleDeleteProject = (id) => {
    if (projects.length === 1) return;
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (activeProjectId === id) setActiveProjectId(newProjects[0].id);
  };

  const handleRenameProject = (id, newName) => {
    setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleShareLink = () => {
    const url = `https://elite24studio.com.co/propuesta/${activeProjectId}`;
    const fallbackCopy = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try { document.execCommand('copy'); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch (err) { }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  };

  if (!isAppLoaded) {
    return (
      <div className="w-screen h-screen bg-[#0A0514] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-white/10 border-t-[#8A05BE] rounded-full animate-spin mb-6"></div>
        <p className="text-xs uppercase tracking-widest font-bold text-white/50 animate-pulse">Cargando Bóveda Segura...</p>
      </div>
    );
  }

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const projectData = activeProject.data;

  return (
    <div className="w-full h-screen bg-[#0A0514] font-sans overflow-hidden flex" style={{ '--brand-primary': projectData.brand.primaryColor, '--brand-accent': projectData.brand.accentColor }}>

      {/* SIDEBAR IZQUIERDO */}
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

          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-3 px-1">PROYECTOS GUARdados</div>
          <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {projects.map(proj => (
              <ProjectListItem key={proj.id} proj={proj} isActive={activeProjectId === proj.id} onClick={() => { setActiveProjectId(proj.id); setActiveAccordion('hero'); setCurrentSlide(0); }} onRename={handleRenameProject} onDuplicate={handleDuplicateProject} onDelete={handleDeleteProject} />
            ))}
          </div>
        </div>
      </aside>

      {/* PANEL CENTRAL (EDITOR VISUAL) */}
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

          <Accordion title="Portada (Hero)" badge="1" isOpen={activeAccordion === 'hero'} onClick={() => { setActiveAccordion('hero'); setCurrentSlide(0); }}>
            <div className="space-y-4">
              <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Badge superior</label><input type="text" value={projectData.hero.badge} onChange={e => handleUpdateData('hero', 'badge', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-xs text-white" /></div>
              <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Pregunta principal (HTML)</label><textarea value={projectData.hero.titleHtml} onChange={e => handleUpdateData('hero', 'titleHtml', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-24 resize-none custom-scrollbar" /></div>
            </div>
          </Accordion>

          <Accordion title="Invitación CEO" badge="2" isOpen={activeAccordion === 'ceo'} onClick={() => { setActiveAccordion('ceo'); setCurrentSlide(2); }}>
            <div className="space-y-6">
              <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Cuerpo del saludo (HTML)</label><textarea value={projectData.ceoInvitation.htmlMessage} onChange={e => handleUpdateData('ceoInvitation', 'htmlMessage', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-32 custom-scrollbar focus:border-[var(--brand-primary)] outline-none" /></div>
              <div className="grid grid-cols-3 gap-2"><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Métrica 1</label><input type="text" value={projectData.ceoInvitation.metric1.value} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric1', 'value', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-2 text-center text-sm text-white mb-2" /><input type="text" value={projectData.ceoInvitation.metric1.label} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric1', 'label', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-1 text-center text-[9px] text-white uppercase" /></div><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Métrica 2</label><input type="text" value={projectData.ceoInvitation.metric2.value} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric2', 'value', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-2 text-center text-sm text-white mb-2" /><input type="text" value={projectData.ceoInvitation.metric2.label} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric2', 'label', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-1 text-center text-[9px] text-white uppercase" /></div><div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Métrica 3</label><input type="text" value={projectData.ceoInvitation.metric3.value} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric3', 'value', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-2 text-center text-sm text-white mb-2" /><input type="text" value={projectData.ceoInvitation.metric3.label} onChange={e => handleUpdateNestedData('ceoInvitation', 'metric3', 'label', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-2 py-1 text-center text-[9px] text-white uppercase" /></div></div>
              <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Foto CEO (Retrato)</label><ImageUploader value={projectData.ceoInvitation.photoUrl} onChange={val => handleUpdateData('ceoInvitation', 'photoUrl', val)} className="h-40" /></div>
            </div>
          </Accordion>

          <Accordion title="Visión conceptual" badge="3" isOpen={activeAccordion === 'vision'} onClick={() => { setActiveAccordion('vision'); setCurrentSlide(3); }}>
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

          <Accordion title={`Renders del proyecto (${projectData.renders.length})`} badge="4" isOpen={activeAccordion === 'renders'} onClick={() => { setActiveAccordion('renders'); setCurrentSlide(4); }}>
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

          <Accordion title="Recordatorio" badge="5" isOpen={activeAccordion === 'reminder'} onClick={() => { setActiveAccordion('reminder'); setCurrentSlide(5); }}>
            <div className="space-y-4">
              <div><label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2 font-bold">Párrafo (HTML)</label><textarea value={projectData.reminder.htmlText} onChange={e => handleUpdateData('reminder', 'htmlText', e.target.value)} className="w-full bg-[#0A0514] border border-[#2D1B4E] rounded-md px-3 py-2 text-sm text-white h-32 custom-scrollbar focus:border-[var(--brand-primary)] outline-none" /></div>
            </div>
          </Accordion>

          <Accordion title={`Pilares (${projectData.pillars.length} cards)`} badge="6" isOpen={activeAccordion === 'pillars'} onClick={() => { setActiveAccordion('pillars'); setCurrentSlide(6); }}>
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

          <Accordion title="CTA Final" badge="7" isOpen={activeAccordion === 'cta'} onClick={() => { setActiveAccordion('cta'); setCurrentSlide(7); }}>
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

      {/* PREVIEW DERECHA (LIENZO CINEMÁTICO) */}
      <main className={`relative bg-black overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'flex-1'}`}>
        <header className="absolute top-0 w-full p-4 flex justify-end gap-3 z-50 pointer-events-none">
          <div className="pointer-events-auto flex gap-3">
            <button onClick={handleShareLink} className={`bg-white/10 hover:bg-[var(--brand-primary)] text-white backdrop-blur-md rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg ${isCopied ? 'bg-green-500 hover:bg-green-600' : ''}`}>
              {isCopied ? <CheckCircle size={14} /> : <Share2 size={14} />} {isCopied ? '¡Link copiado!' : 'Compartir'}
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors shadow-lg">
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} {isFullscreen ? 'Salir (ESC)' : 'Pantalla completa'}
            </button>
            <button className="bg-[#E7B865] hover:bg-[#D4A352] text-black rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-colors shadow-lg shadow-[#E7B865]/20">
              <Download size={14} /> Exportar HTML
            </button>
          </div>
        </header>

        <div className="w-full h-full relative">
          {currentSlide === 0 && <HeroSlide data={projectData} onNext={() => { setCurrentSlide(1); setActiveAccordion(null); }} />}
          {currentSlide === 1 && <ManifestoSlide data={projectData} />}
          {currentSlide === 2 && <CeoSlide data={projectData} />}
          {currentSlide === 3 && <VisionSlide data={projectData} />}
          {currentSlide === 4 && <RendersSlide data={projectData} />}
          {currentSlide === 5 && <ReminderSlide data={projectData} />}
          {currentSlide === 6 && <PillarsSlide data={projectData} />}
          {currentSlide === 7 && <CtaSlide data={projectData} />}

          <div className="absolute inset-y-0 left-0 w-32 flex items-center justify-start opacity-0 hover:opacity-100 transition-opacity z-40">
            <button onClick={() => { const n = (currentSlide - 1 + MAX_SLIDES) % MAX_SLIDES; setCurrentSlide(n); }} className="ml-8 w-12 h-12 rounded-full border border-white/20 bg-black/20 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all backdrop-blur-md shadow-lg"><ChevronLeft /></button>
          </div>
          <div className="absolute inset-y-0 right-0 w-32 flex items-center justify-end opacity-0 hover:opacity-100 transition-opacity z-40">
            <button onClick={() => { const n = (currentSlide + 1) % MAX_SLIDES; setCurrentSlide(n); }} className="mr-8 w-12 h-12 rounded-full border border-white/20 bg-black/20 flex items-center justify-center text-white hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all backdrop-blur-md shadow-lg"><ChevronRight /></button>
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
} 2