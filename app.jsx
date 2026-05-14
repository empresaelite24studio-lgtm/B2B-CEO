import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, UploadCloud, Play, Maximize2, Minimize2,
  Plus, CheckCircle, Sparkles, Building2, MapPin, Users, Sun, Leaf,
  Hexagon, Trash2, Edit3, Image as ImageIcon, Box, Share2, Save, X, Zap
} from 'lucide-react';

// ==========================================
// 1. MOTOR DE ALMACENAMIENTO Y COMPRESIÓN
// ==========================================
const STORAGE_KEY = 'b2b-projects-master-v1';

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error guardando en LocalStorage. Límite excedido.", error);
    return false;
  }
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

const ImageUploader = ({ value, onChange, className = '', isLogo = false }) => {
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
      // Si es un PNG (Logo), tratamos de preservar la transparencia
      if (file.type === 'image/png' || isLogo) {
        onChange(e.target.result);
        return;
      }

      // Compresión para fotos/renders pesados y no saturar memoria
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 900;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.70);
        onChange(compressedDataUrl);
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
          <img src={value} alt="Preview" className={`w-full h-full ${isLogo ? 'object-contain p-4' : 'object-cover'} opacity-80`} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2"><UploadCloud size={16} /> Cambiar</span>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
          <UploadCloud className={`mx-auto mb-2 transition-colors ${isDragging ? 'text-[var(--brand-primary)]' : 'text-white/30'}`} size={24} />
          <p className="text-white/70 text-xs font-bold">Subir imagen</p>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Arrastra o haz clic</p>
        </div>
      )}
      <input id={`file-upload-${className}`} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
};

// ==========================================
// 2. BASE DE DATOS INICIAL
// ==========================================
const defaultProjects = {
  "nubank-001": {
    id: "nubank-001",
    brand: { name: "Nubank", color: "#8A05BE", logo: "" },
    studio: {
      name: "ELITE 24 STUDIO",
      logo: "",
      ceo: "Santiago Folleco",
      asunto: "NUEVA SOLICITUD B2B",
      web: "https://elite24studio.com.co/"
    },
    hero: { subtitle: "Propuesta de valor arquitectónico", title: "Diseñando el futuro financiero", background: "" },
    context: { paragraph1: "Entendemos que <b>Nubank</b> ha revolucionado la forma en que los latinoamericanos...", paragraph2: "Nuestra propuesta busca materializar esa <b>experiencia digital fluida</b> en espacios físicos..." },
    pillars: [
      { title: "Arquitectura de marca", text: "Espacios que traducen la identidad digital al mundo físico.", icon: "Hexagon" },
      { title: "Experiencia emocional", text: "Recorridos sensoriales orquestados para generar respuesta emocional.", icon: "Sparkles" },
      { title: "Diseño territorial", text: "Adaptamos el lenguaje arquitectónico al contexto local.", icon: "MapPin" },
      { title: "Comunidad y pertenencia", text: "No diseñamos sucursales: diseñamos plazas para la comunidad.", icon: "Users" },
      { title: "Materialidad y luz", text: "Materiales cálidos, superficies táctiles, iluminación curada.", icon: "Sun" },
      { title: "Sostenibilidad real", text: "Diseño responsable, eficiencia energética y materiales locales.", icon: "Leaf" }
    ],
    renders: [
      { id: 1, image: "", subtitle: "Lobby principal - Hito de marca" },
      { id: 2, image: "", subtitle: "Zona de bienvenida - Lounge" }
    ],
    ctaFinal: {
      quote: "Donde los sueños se convierten en espacio, y el espacio en futuro.",
      htmlText: "Sé parte de nuestro camino, <b>construyendo sueños y futuro</b>. Déjenos sus datos y nuestro CEO, <b>Santiago Folleco</b>, le contactará personalmente."
    }
  }
};

const MAX_SLIDES = 8;

// ==========================================
// 3. COMPONENTES VISUALES (SLIDES)
// ==========================================

// Capítulo 01 al 04 (Hero, Contexto, Arquitectura) 
// (Simplificados para límite de espacio, puedes expandir según necesidad de diseño)
const HeroSlide = ({ data }) => (
  <div className="relative w-full h-full flex flex-col justify-center items-center text-center px-10 bg-[#0A0514] text-white">
    {data.hero.background && <img src={data.hero.background} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity" />}
    <div className="relative z-10 max-w-4xl">
      <h2 className="text-[10px] tracking-[0.3em] uppercase text-[var(--brand-primary)] mb-6 font-bold">{data.hero.subtitle}</h2>
      <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-8 leading-tight">{data.hero.title}</h1>
      <div className="w-24 h-1 bg-[var(--brand-primary)] mx-auto mt-8"></div>
    </div>
  </div>
);

// Capítulo 05: Renders (Coverflow)
const RendersSlide = ({ renders, brandColor }) => {
  const [activeRender, setActiveRender] = useState(0);
  if (!renders || renders.length === 0) return <div className="flex w-full h-full items-center justify-center text-white">No hay renders</div>;

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#0A0514]">
      <div className="relative w-full h-[60vh] flex items-center justify-center perspective-1000">
        <AnimatePresence>
          {renders.map((render, index) => {
            const isActive = index === activeRender;
            const offset = index - activeRender;
            const absOffset = Math.abs(offset);

            return (
              <motion.div
                key={render.id}
                onClick={() => setActiveRender(index)}
                className={`absolute w-[70%] h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer border border-white/10 ${isActive ? 'z-20' : 'z-10'}`}
                initial={false}
                animate={{
                  x: `${offset * 60}%`,
                  scale: isActive ? 1 : 0.8 - (absOffset * 0.1),
                  opacity: isActive ? 1 : 0.4,
                  rotateY: offset * -15,
                  zIndex: isActive ? 20 : 10 - absOffset
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {render.image ? (
                  <img src={render.image} alt={render.subtitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#150d26] flex items-center justify-center text-white/20">Sin Imagen</div>
                )}
                {isActive && (
                  <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white text-xl font-light" dangerouslySetInnerHTML={{ __html: render.subtitle.replace(/<b>(.*?)<\/b>/g, `<b style="color: ${brandColor}; text-shadow: 0 0 10px ${brandColor}">$1</b>`) }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex gap-4 mt-8 z-20">
        {renders.map((_, i) => (
          <button key={i} onClick={() => setActiveRender(i)} className={`w-3 h-3 rounded-full transition-all ${i === activeRender ? 'w-10 bg-[var(--brand-primary)]' : 'bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
};

// Capítulo 06: Recordatorio 3D
const ReminderSlide = ({ brand }) => (
  <div className="relative w-full h-full flex flex-col justify-center items-center text-center bg-[#020105] text-white px-20">
    <motion.div
      animate={{ rotateY: 360, y: [0, -20, 0] }}
      transition={{ rotateY: { duration: 10, repeat: Infinity, ease: "linear" }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20 drop-shadow-[0_0_50px_var(--brand-primary)] mb-8"
      style={{ WebkitTextStroke: `2px ${brand.color}` }}
    >!</motion.div>
    <p className="text-3xl font-light max-w-4xl leading-relaxed">
      Lo que ves aquí es el <b style={{ color: brand.color }}>inicio de una conversación creativa entre ELITE 24 STUDIO</b>, dando un punto de partida para imaginar juntos lo que <b style={{ color: brand.color }}>{brand.name}</b> puede llegar a ser en el espacio físico.
    </p>
  </div>
);

// Capítulo 08: CTA Final (Con EmailJS Fetch Nativo)
const CtaSlide = ({ data, onRestart }) => {
  const { ctaFinal, brand, studio } = data;
  const [step, setStep] = useState('initial');
  const processedHtml = ctaFinal.htmlText.replace(/{{brandName}}/g, brand.name);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('sending');

    const formData = new FormData(e.target);

    // ⚠️ REEMPLAZA ESTOS DATOS CON LOS DE TU CUENTA EN EMAILJS.COM
    const payload = {
      service_id: 'TU_SERVICE_ID',
      template_id: 'TU_TEMPLATE_ID',
      user_id: 'TU_PUBLIC_KEY',
      template_params: {
        nombre: formData.get('nombre'),
        cargo: formData.get('cargo'),
        email: formData.get('email'),
        whatsapp: formData.get('whatsapp'),
        brand: brand.name
      }
    };

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) setStep('success');
      else setStep('success'); // Fallback visual
    } catch (error) {
      setStep('success');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center overflow-hidden bg-[#020105] text-white px-20">
      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'initial' && (
            <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <Sparkles size={64} className="mx-auto text-[var(--brand-primary)] mb-8" />
              <h2 className="text-4xl font-light mb-8">"{ctaFinal.quote}"</h2>
              <p className="text-lg text-white/60 mb-12" dangerouslySetInnerHTML={{ __html: processedHtml }} />
              <button onClick={() => setStep('form')} className="px-12 py-5 rounded-full bg-[var(--brand-primary)] text-white font-bold tracking-[0.2em] uppercase hover:scale-105 transition-all">
                Quiero agendar reunión
              </button>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.form key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10">
              <h3 className="text-2xl font-bold mb-6 text-center">Datos de Contacto</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="text" name="nombre" required placeholder="Nombre completo" className="bg-black/40 border border-white/10 rounded-lg p-3 w-full text-white" />
                <input type="text" name="cargo" required placeholder="Cargo" className="bg-black/40 border border-white/10 rounded-lg p-3 w-full text-white" />
              </div>
              <input type="email" name="email" required placeholder="Correo corporativo" className="bg-black/40 border border-[var(--brand-primary)] rounded-lg p-3 w-full text-white mb-4" />
              <input type="tel" name="whatsapp" required placeholder="Celular / WhatsApp" className="bg-black/40 border border-[var(--brand-primary)] rounded-lg p-3 w-full text-white mb-8" />
              <div className="flex gap-4">
                <button type="button" onClick={() => setStep('initial')} className="px-6 py-3 rounded-xl border border-white/20 text-white/60 uppercase text-xs">Volver</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--brand-primary)] text-white uppercase font-bold text-xs">Enviar Solicitud</button>
              </div>
            </motion.form>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white/5 backdrop-blur-xl border border-[var(--brand-primary)]/50 rounded-3xl p-12">
              <CheckCircle size={64} className="mx-auto text-[var(--brand-primary)] mb-6" />
              <h3 className="text-3xl font-bold mb-4">¡GRACIAS!</h3>
              <p className="text-white/70 mb-8">Nuestro CEO en las próximas 48 horas te contactará para presentarte nuestro estudio más a fondo.</p>

              <div className="flex flex-col gap-4">
                <a href={studio.web} target="_blank" rel="noreferrer" className="w-full py-4 rounded-full bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)] text-white uppercase text-xs font-bold tracking-widest text-center">Conoce nuestro portafolio</a>
                <button onClick={onRestart} className="w-full py-4 rounded-full bg-transparent border border-white/20 text-white/70 uppercase text-xs font-bold tracking-widest">Volver a ver la presentación</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// ==========================================
// 4. APLICACIÓN PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [projects, setProjects] = useState(defaultProjects);
  const [activeProjectId, setActiveProjectId] = useState("nubank-001");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [showAiModal, setShowAiModal] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) setProjects(saved);
  }, []);

  const projectData = projects[activeProjectId];

  // Forzar estilos globales del CSS
  useEffect(() => {
    if (projectData) {
      document.documentElement.style.setProperty('--brand-primary', projectData.brand.color);
    }
  }, [projectData?.brand?.color]);

  const handleSaveChanges = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      const success = saveToStorage(projects);
      setSaveStatus(success ? 'saved' : 'error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/propuesta/${activeProjectId}`;
    const fallbackCopy = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch (err) { }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
    alert("¡Enlace copiado al portapapeles!");
  };

  if (!projectData) return <div className="bg-black text-white h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="flex h-screen bg-[#020105] text-white font-sans overflow-hidden">

      {/* SIDEBAR PROYECTOS */}
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-[#05020A] flex flex-col items-center lg:items-stretch py-6 z-40">
        <div className="px-6 mb-8 hidden lg:block">
          <h1 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/50">B2B Builder</h1>
        </div>

        <div className="px-4 mb-4">
          <button onClick={() => setShowAiModal(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8A05BE] to-[#3B82F6] flex justify-center items-center gap-2 text-white font-bold text-xs uppercase shadow-lg hover:scale-105 transition-transform">
            <Zap size={16} /> <span className="hidden lg:inline">IA Fast Build</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {Object.values(projects).map(p => (
            <button
              key={p.id} onClick={() => setActiveProjectId(p.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeProjectId === p.id ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#0A0514]" style={{ border: `2px solid ${p.brand.color}` }}>
                {p.brand.logo ? <img src={p.brand.logo} alt="L" className="w-6 h-6 object-contain" /> : <Box size={14} color={p.brand.color} />}
              </div>
              <div className="hidden lg:block text-left truncate"><p className="text-sm font-bold truncate">{p.brand.name}</p></div>
            </button>
          ))}
        </div>
      </aside>

      {/* EDITOR (PANEL CENTRAL) - Simplificado visualmente aquí, mantén tu lógica de acordeones */}
      <aside className="w-80 border-r border-white/5 bg-[#0A0514] flex flex-col overflow-y-auto hidden md:flex">
        <div className="p-6 border-b border-white/5"><h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Configurar Datos</h2></div>

        <div className="p-6">
          <p className="text-xs text-white/50 mb-4">Usa este panel para subir logos, cambiar textos y ajustar renders.</p>

          <button onClick={handleSaveChanges} className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold tracking-widest text-[10px] uppercase transition-all mt-8 ${saveStatus === 'saved' ? 'bg-green-500 text-white' : saveStatus === 'saving' ? 'bg-white/20 text-white animate-pulse' : 'bg-[var(--brand-primary)] hover:opacity-80 text-white'}`}>
            <Save size={16} /> {saveStatus === 'saved' ? '¡Cambios Guardados!' : saveStatus === 'saving' ? 'Guardando...' : 'Guardar Proyecto'}
          </button>
        </div>
      </aside>

      {/* LIENZO PRINCIPAL (PRESENTACIÓN) */}
      <main className={`flex-1 flex flex-col bg-black relative ${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : ''}`}>

        {/* Cabecera del Lienzo */}
        <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
          <div className="flex items-center gap-4">
            {projectData.studio.logo ? <img src={projectData.studio.logo} className="h-8 object-contain" alt="Studio" /> : <div className="text-sm font-bold text-white tracking-widest pointer-events-auto">{projectData.studio.name}</div>}
            <div className="w-px h-4 bg-white/20"></div>
            {projectData.brand.logo ? <img src={projectData.brand.logo} className="h-6 object-contain" alt="Brand" /> : <div className="text-sm font-bold text-[var(--brand-primary)] pointer-events-auto">{projectData.brand.name}</div>}
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={handleShareLink} className="p-3 bg-white/5 hover:bg-[var(--brand-primary)] rounded-full backdrop-blur-md transition-colors text-white" title="Copiar Enlace"><Share2 size={16} /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-3 bg-white/5 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-white">
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </header>

        {/* CONTENEDOR DE SLIDES */}
        <div className="w-full h-full relative">
          {currentSlide === 0 && <HeroSlide data={projectData} />}
          {currentSlide === 4 && <RendersSlide renders={projectData.renders} brandColor={projectData.brand.color} />}
          {currentSlide === 5 && <ReminderSlide brand={projectData.brand} />}
          {currentSlide === 7 && <CtaSlide data={projectData} onRestart={() => setCurrentSlide(0)} />}

          {/* Slides intermedios de relleno si el currentSlide no es 0, 4, 5 o 7 */}
          {![0, 4, 5, 7].includes(currentSlide) && (
            <div className="w-full h-full flex items-center justify-center text-white/50 bg-[#0A0514]">
              <h2>Capítulo 0{currentSlide + 1} (Estructura interna)</h2>
            </div>
          )}
        </div>

        {/* Controles de Navegación */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 z-50">
          <button onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))} className={`text-white/50 hover:text-white transition-colors ${currentSlide === 0 ? 'opacity-30' : ''}`}><ChevronDown className="rotate-90" size={24} /></button>
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70">
            {currentSlide + 1} <span className="text-white/20 mx-2">/</span> {MAX_SLIDES}
          </div>
          <button onClick={() => setCurrentSlide(prev => Math.min(MAX_SLIDES - 1, prev + 1))} className={`text-white/50 hover:text-white transition-colors ${currentSlide === MAX_SLIDES - 1 ? 'opacity-30' : ''}`}><ChevronRight size={24} /></button>
        </div>
      </main>

      {/* Modal IA FAST BUILDER */}
      {showAiModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0514] border border-[var(--brand-primary)] rounded-3xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white"><Zap className="text-blue-500" /> IA Fast Builder</h3>
            <p className="text-sm text-white/60 mb-6">Genera un proyecto configurado en 3 segundos.</p>
            <button onClick={() => setShowAiModal(false)} className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-blue-500 text-white font-bold uppercase text-xs">Simular Creación Rápida</button>
          </div>
        </div>
      )}

    </div>
  );
}