import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AIGameViewModel from '../../../viewModel/game/AIGameViewModel';

// --- Íconos SVG para la interfaz ---

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MaterialIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const TemplateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
);

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);


const CreateGameAIScreen = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isChatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '¡Hola! Soy tu asistente de IA. Pídeme que genere preguntas, cambie estilos o cree materiales para tu juego.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const chatEndRef = useRef(null);

  const sidebarItems = [
    { name: 'Materiales', icon: <MaterialIcon /> },
    { name: 'Subir', icon: <UploadIcon /> },
    { name: 'Plantillas', icon: <TemplateIcon /> },
    { name: 'Configuración', icon: <SettingsIcon /> },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAILoading]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || isAILoading) return;

    const newMessages = [...messages, { sender: 'user', text: inputText }];
    setMessages(newMessages);
    setInputText('');
    setIsAILoading(true);

    const result = await AIGameViewModel.getAIResponse(newMessages);
    
    if (result.success) {
      setMessages(prev => [...prev, { sender: 'ai', text: result.reply }]);
    } else {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${result.reply}` }]);
    }

    setIsAILoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* --- Panel Lateral --- */}
      <aside 
        className={`flex flex-col bg-white text-slate-700 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div>
            {/* Cabecera del Panel */}
            <div className="flex items-center justify-between h-16 border-b p-4">
            <span className={`font-bold text-lg text-sky-600 ${!isSidebarOpen && 'hidden'}`}>Canvas IA</span>
            <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)} 
                className="p-2 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Toggle sidebar"
            >
                {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            </div>

            {/* Navegación del Panel */}
            <nav className="mt-4">
            <ul>
                {sidebarItems.map((item) => (
                <li key={item.name} className="px-4 py-2">
                    <a href="#" className="flex items-center p-2 space-x-4 rounded-md hover:bg-sky-100 hover:text-sky-600">
                    {item.icon}
                    <span className={`font-medium ${!isSidebarOpen && 'hidden'}`}>{item.name}</span>
                    </a>
                </li>
                ))}
            </ul>
            </nav>
        </div>

        {/* --- Botón de Volver --- */}
        <div className="mt-auto p-4 border-t border-slate-200">
            <Link 
                to="/user-games" 
                className="flex items-center justify-center p-2 space-x-4 rounded-md bg-sky-500 text-white hover:bg-sky-600 transition-colors duration-150"
            >
                <BackIcon />
                <span className={`font-bold ${!isSidebarOpen && 'hidden'}`}>Volver</span>
            </Link>
        </div>
      </aside>

      {/* --- Contenido Principal (Canvas) --- */}
      <main className="flex-1 p-4 lg:p-6">
        <div className="w-full h-full bg-white rounded-xl shadow-md border border-slate-200 p-4">
          <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex justify-center items-center">
            <p className="text-slate-400">El contenido del juego aparecerá aquí.</p>
          </div>
        </div>
      </main>

      {/* --- Burbuja y Ventana de Chat IA --- */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end">
        {/* Ventana de Chat */}
        {isChatOpen && (
            <div className="w-96 h-[32rem] mb-4 bg-white rounded-xl shadow-2xl flex flex-col border border-slate-200 transition-all duration-300 ease-in-out">
                {/* Cabecera del Chat */}
                <div className="flex justify-between items-center p-3 bg-slate-100 rounded-t-xl border-b">
                    <h3 className="font-bold text-lg text-sky-600">Asistente IA</h3>
                    <button onClick={() => setChatOpen(false)} className="p-1 rounded-full hover:bg-slate-200">
                        <CloseIcon />
                    </button>
                </div>

                {/* Mensajes */}
                <div className="flex-1 p-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`py-2 px-4 rounded-2xl max-w-xs ${msg.sender === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isAILoading && (
                        <div className="flex justify-start">
                            <div className="py-2 px-4 rounded-2xl max-w-xs bg-slate-200 text-slate-800 rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input de Mensaje */}
                <div className="p-3 bg-slate-50 rounded-b-xl border-t">
                    <div className="flex items-center">
                        <input 
                            type="text" 
                            placeholder={isAILoading ? 'Esperando respuesta...' : 'Escribe tu petición...'}
                            className="flex-1 w-full px-4 py-2 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isAILoading}
                        />
                        <button onClick={handleSendMessage} className="ml-3 p-3 rounded-full bg-sky-500 text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300" disabled={isAILoading}>
                            <SendIcon />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Burbuja */}
        <button 
            onClick={() => setChatOpen(!isChatOpen)} 
            className="w-20 h-20 bg-sky-500 text-white rounded-full shadow-xl flex flex-col items-center justify-center hover:bg-sky-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            aria-label="Toggle chat"
        >
            {isChatOpen ? <CloseIcon /> : <><ChatIcon /><span className="font-bold text-sm">IA</span></>}
        </button>
      </div>
    </div>
  );
};

export default CreateGameAIScreen;