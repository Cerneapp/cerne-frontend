import React, { useState } from 'react';
import {
  Home, Compass, Plus, MessageCircle, User, Heart, Camera, X,
  ChevronLeft, Crown, Flame, Sparkles, Send, Search, Bell, Trash2, Check, Users
} from 'lucide-react';

const INTERESTS = ['fotografia', 'trilha', 'música', 'viagem', 'corrida', 'cinema', 'filosofia', 'cozinha'];

const INTENT_OPTIONS = [
  { key: 'amizade', label: 'Amizade', desc: 'Conectar por interesses em comum' },
  { key: 'namoro', label: 'Namoro', desc: 'Abrir espaço pra romance' },
  { key: 'ambos', label: 'Ambos', desc: 'Deixar a conexão te surpreender' },
];

const INTENT_STYLES = {
  amizade: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400', avatarBg: 'bg-emerald-100', avatarText: 'text-emerald-700' },
  namoro: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400', avatarBg: 'bg-blue-100', avatarText: 'text-blue-700' },
  ambos: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400', avatarBg: 'bg-amber-100', avatarText: 'text-amber-700' },
};

const INTENT_LABEL = { amizade: 'amizade', namoro: 'namoro', ambos: 'aberto a ambos' };

const SUGGESTED_TAGS = ['#trilha', '#natureza', '#pôrdosol'];

const COMMUNITIES = [
  { name: 'fotografia', count: '3.400 pulses essa semana', style: 'blue' },
  { name: 'trilha', count: '2.100 pulses essa semana', style: 'emerald' },
  { name: 'filosofia', count: '980 pulses essa semana', style: 'amber' },
  { name: 'música', count: '760 pulses essa semana', style: 'rose' },
];

const COMMUNITY_STYLES = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

const seedPulses = [
  { id: 1, author: 'Julia', intentKey: 'amizade', time: 'agora', text: 'Terminei 10km hoje, melhor tempo do ano. alguém treinando pra meia maratona também?', tags: ['corrida', 'saúde'], hasPhoto: false, reacted: false, mutual: false, matched: false },
  { id: 2, author: 'Marcos', intentKey: 'ambos', time: 'há 20 min', text: 'Pôr do sol no fim da trilha. valeu a subida.', tags: ['fotografia', 'trilha'], hasPhoto: true, reacted: false, mutual: false, matched: false },
  { id: 3, author: 'Bia', intentKey: 'namoro', time: 'há 1 hora', text: 'Descobri uma playlist nova que combina perfeito com viagem de carro. alguém quer trocar indicações?', tags: ['música', 'viagem'], hasPhoto: false, reacted: false, mutual: true, matched: false },
];

const seedConversations = [
  {
    id: 1, name: 'Carlos', intentKey: 'amizade', reasonTags: ['fotografia', 'trilha'], repliedOnce: false,
    messages: [
      { from: 'them', text: 'oi! vi que você também ama trilha, qual sua favorita?' },
      { from: 'me', text: 'tenho uma perto de casa que é linda no pôr do sol' },
      { from: 'them', text: 'boa, será que rola ir num fim de semana?' },
    ],
  },
];

function Avatar({ initials, intentKey, size = 'w-9 h-9 text-sm' }) {
  const s = INTENT_STYLES[intentKey] || INTENT_STYLES.ambos;
  return (
    <div className={`${size} ${s.avatarBg} ${s.avatarText} rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
      {initials}
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

export default function CerneApp() {
  const [screen, setScreen] = useState('onboarding');
  const [obStep, setObStep] = useState(0);

  const [profile, setProfile] = useState({
    name: 'Você',
    bio: 'Apaixonado por trilhas e fotos espontâneas.',
    interests: ['fotografia', 'viagem'],
    intent: 'ambos',
  });

  const [tab, setTab] = useState('feed');
  const [pulses, setPulses] = useState(seedPulses);
  const [conversations, setConversations] = useState(seedConversations);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatDraft, setChatDraft] = useState('');

  const [openReactId, setOpenReactId] = useState(null);
  const [reactDraft, setReactDraft] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createText, setCreateText] = useState('');
  const [createTags, setCreateTags] = useState(['#trilha']);

  const [matchOpen, setMatchOpen] = useState(false);
  const [matchWith, setMatchWith] = useState('');

  const [exploreMsg, setExploreMsg] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  function toggleInterest(tag) {
    setProfile((p) => ({
      ...p,
      interests: p.interests.includes(tag) ? p.interests.filter((i) => i !== tag) : [...p.interests, tag],
    }));
  }

  function finishOnboarding() {
    setScreen('app');
  }

  function submitReaction(pulse) {
    if (!reactDraft.trim()) return;
    setPulses((prev) => prev.map((p) => (p.id === pulse.id ? { ...p, reacted: true } : p)));
    setOpenReactId(null);
    setReactDraft('');
    if (pulse.mutual && !pulse.matched) {
      setPulses((prev) => prev.map((p) => (p.id === pulse.id ? { ...p, matched: true } : p)));
      setMatchWith(pulse.author);
      setMatchOpen(true);
      setConversations((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: pulse.author,
          intentKey: pulse.intentKey,
          reasonTags: pulse.tags,
          repliedOnce: false,
          messages: [{ from: 'them', text: `oi! que bom que reagiu de verdade ao meu pulse 🙂` }],
        },
      ]);
    }
  }

  function publishPulse() {
    if (!createText.trim()) return;
    setPulses((prev) => [
      {
        id: Date.now(),
        author: 'Você',
        intentKey: profile.intent,
        time: 'agora',
        text: createText,
        tags: createTags.map((t) => t.replace('#', '')),
        hasPhoto: false,
        reacted: false,
        mutual: false,
        matched: false,
        own: true,
      },
      ...prev,
    ]);
    setCreateText('');
    setCreateTags(['#trilha']);
    setCreateOpen(false);
  }

  function removeOwnPulse(id) {
    setPulses((prev) => prev.filter((p) => p.id !== id));
  }

  function sendChatMessage(convoId) {
    if (!chatDraft.trim()) return;
    const text = chatDraft.trim();
    setChatDraft('');
    setConversations((prev) => prev.map((c) => (c.id === convoId ? { ...c, messages: [...c.messages, { from: 'me', text }] } : c)));
    setConversations((prevOuter) => {
      const convo = prevOuter.find((c) => c.id === convoId);
      if (convo && !convo.repliedOnce) {
        setTimeout(() => {
          setConversations((prev2) =>
            prev2.map((c) =>
              c.id === convoId
                ? { ...c, repliedOnce: true, messages: [...c.messages, { from: 'them', text: 'haha bora combinar então!' }] }
                : c
            )
          );
        }, 1100);
      }
      return prevOuter;
    });
  }

  function saveProfile() {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1600);
  }

  // ---------- ONBOARDING ----------
  if (screen === 'onboarding') {
    return (
      <div className="max-w-sm mx-auto h-[700px] bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden relative flex flex-col font-sans p-6">
        <div className="flex justify-center gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === obStep ? 'w-5 bg-rose-500' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          {obStep === 0 && (
            <div>
              <p className="text-lg font-medium mb-1">Crie seu perfil vivo</p>
              <p className="text-sm text-gray-500 mb-6">Sem fotos editadas, sem pose. Só o real.</p>
              <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-6 h-6 text-gray-400" />
              </div>
              <input
                value={profile.name === 'Você' ? '' : profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Seu nome"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 bg-white"
              />
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="O que você está fazendo agora?"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white resize-none"
              />
            </div>
          )}

          {obStep === 1 && (
            <div>
              <p className="text-lg font-medium mb-1">Escolha seus interesses</p>
              <p className="text-sm text-gray-500 mb-6">Vamos te conectar por afinidade real.</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((tag) => (
                  <Chip key={tag} label={tag} selected={profile.interests.includes(tag)} onClick={() => toggleInterest(tag)} />
                ))}
              </div>
            </div>
          )}

          {obStep === 2 && (
            <div>
              <p className="text-lg font-medium mb-1">Qual sua intenção?</p>
              <p className="text-sm text-gray-500 mb-6">Você pode mudar isso quando quiser.</p>
              <div className="flex flex-col gap-2">
                {INTENT_OPTIONS.map((opt) => {
                  const s = INTENT_STYLES[opt.key];
                  const active = profile.intent === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setProfile((p) => ({ ...p, intent: opt.key }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left bg-white ${active ? `border-2 ${s.border}` : 'border-gray-200'}`}
                    >
                      <Sparkles className={`w-5 h-5 ${s.text}`} />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => (obStep < 2 ? setObStep(obStep + 1) : finishOnboarding())}
          className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium mt-4"
        >
          {obStep < 2 ? 'Continuar' : 'Começar a usar o Cerne'}
        </button>
      </div>
    );
  }

  // ---------- MAIN APP ----------
  const activeConvo = conversations.find((c) => c.id === activeChatId);

  return (
    <div className="max-w-sm mx-auto h-[700px] bg-white rounded-3xl border border-gray-200 overflow-hidden relative flex flex-col font-sans">
      {/* HEADER */}
      {!(tab === 'chat' && activeConvo) && (
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          {tab === 'feed' && (
            <>
              <span className="text-lg font-medium text-rose-600">Cerne</span>
              <div className="flex gap-3 text-gray-400">
                <Search className="w-[18px] h-[18px]" />
                <Bell className="w-[18px] h-[18px]" />
              </div>
            </>
          )}
          {tab === 'explore' && <span className="text-base font-medium">Explorar</span>}
          {tab === 'chat' && <span className="text-base font-medium">Conversas</span>}
          {tab === 'profile' && <span className="text-base font-medium">Perfil</span>}
        </div>
      )}

      {activeConvo && (
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setActiveChatId(null)} />
          <Avatar initials={activeConvo.name.slice(0, 2).toUpperCase()} intentKey={activeConvo.intentKey} size="w-8 h-8 text-xs" />
          <span className="text-sm font-medium">{activeConvo.name}</span>
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'feed' && !activeConvo && (
          <div className="flex flex-col gap-3">
            {pulses.map((pulse) => {
              const s = INTENT_STYLES[pulse.intentKey];
              return (
                <div key={pulse.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar initials={pulse.author.slice(0, 2).toUpperCase()} intentKey={pulse.intentKey} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pulse.author}</p>
                      <p className="text-xs text-gray-500">{pulse.time}</p>
                    </div>
                    {pulse.own ? (
                      <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => removeOwnPulse(pulse.id)} />
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-md ${s.bg} ${s.text}`}>{INTENT_LABEL[pulse.intentKey]}</span>
                    )}
                  </div>

                  {pulse.hasPhoto && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  <p className="text-sm mb-2">{pulse.text}</p>

                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {pulse.tags.map((t) => (
                      <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t}</span>
                    ))}
                  </div>

                  {!pulse.own && (
                    <div className="border-t border-gray-100 pt-2">
                      {pulse.reacted ? (
                        <p className="text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> você reagiu de verdade</p>
                      ) : openReactId === pulse.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={reactDraft}
                            onChange={(e) => setReactDraft(e.target.value)}
                            placeholder="escreva uma reação real..."
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                          />
                          <button onClick={() => submitReaction(pulse)} className="bg-blue-50 border border-blue-300 text-blue-700 rounded-lg px-3 text-xs font-medium">
                            enviar
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setOpenReactId(pulse.id); setReactDraft(''); }} className="text-xs text-gray-500 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> reagir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'explore' && (
          <div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Buscar interesses, pessoas...</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">em alta essa semana</p>
            <div className="flex flex-col gap-2">
              {COMMUNITIES.map((c) => {
                const s = COMMUNITY_STYLES[c.style];
                return (
                  <button
                    key={c.name}
                    onClick={() => setExploreMsg(`Em breve: feed dedicado a #${c.name}`)}
                    className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 text-left"
                  >
                    <div className={`w-9 h-9 rounded-full ${s.bg} ${s.text} flex items-center justify-center`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.count}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {exploreMsg && <p className="text-xs text-blue-600 mt-3">{exploreMsg}</p>}
          </div>
        )}

        {tab === 'chat' && !activeConvo && (
          <div className="flex flex-col gap-1">
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium mb-1">Ainda sem conversas</p>
                <p className="text-xs text-gray-500">Reaja de verdade aos pulses de alguém.</p>
              </div>
            )}
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setActiveChatId(c.id)} className="flex items-center gap-3 py-2.5 border-b border-gray-100 text-left">
                <Avatar initials={c.name.slice(0, 2).toUpperCase()} intentKey={c.intentKey} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.messages[c.messages.length - 1]?.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'chat' && activeConvo && (
          <div className="flex flex-col h-full">
            <div className="flex justify-center mb-3">
              <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                conectados por {activeConvo.reasonTags.join(' e ')}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {activeConvo.messages.map((m, i) => (
                <div key={i} className={`max-w-[75%] ${m.from === 'me' ? 'self-end' : 'self-start'}`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm ${m.from === 'me' ? 'bg-blue-50 text-blue-800' : 'border border-gray-200'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <div className="text-center mb-4">
              <Avatar initials="EU" intentKey={profile.intent} size="w-16 h-16 text-lg mx-auto mb-2" />
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="text-center text-base font-medium border-none focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mb-1">bio</p>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 resize-none"
            />
            <p className="text-xs text-gray-400 mb-2">interesses</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {INTERESTS.map((tag) => (
                <Chip key={tag} label={tag} selected={profile.interests.includes(tag)} onClick={() => toggleInterest(tag)} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-2">intenção atual</p>
            <div className="flex gap-2 mb-4">
              {INTENT_OPTIONS.map((opt) => {
                const s = INTENT_STYLES[opt.key];
                const active = profile.intent === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setProfile((p) => ({ ...p, intent: opt.key }))}
                    className={`flex-1 text-xs py-2 rounded-lg border ${active ? `${s.bg} ${s.text} ${s.border}` : 'border-gray-200 text-gray-500'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button onClick={saveProfile} className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium">
              {savedToast ? 'Salvo!' : 'Salvar alterações'}
            </button>
          </div>
        )}
      </div>

      {/* CHAT INPUT */}
      {tab === 'chat' && activeConvo && (
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage(activeConvo.id)}
            placeholder="Escreva uma mensagem..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={() => sendChatMessage(activeConvo.id)} className="text-blue-600">
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* BOTTOM NAV */}
      {!(tab === 'chat' && activeConvo) && (
        <div className="flex justify-around items-center py-3 border-t border-gray-100">
          <Home className={`w-5 h-5 cursor-pointer ${tab === 'feed' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('feed')} />
          <Compass className={`w-5 h-5 cursor-pointer ${tab === 'explore' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('explore')} />
          <Plus className="w-5 h-5 text-gray-400 cursor-pointer" onClick={() => setCreateOpen(true)} />
          <MessageCircle className={`w-5 h-5 cursor-pointer ${tab === 'chat' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('chat')} />
          <User className={`w-5 h-5 cursor-pointer ${tab === 'profile' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('profile')} />
        </div>
      )}

      {/* CREATE PULSE MODAL */}
      {createOpen && (
        <div className="absolute inset-0 bg-white p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <X className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setCreateOpen(false)} />
            <span className="text-sm font-medium">Novo pulse</span>
            <button onClick={publishPulse} className="bg-blue-50 border border-blue-300 text-blue-700 rounded-lg px-3 py-1 text-xs font-medium">
              Publicar
            </button>
          </div>
          <textarea
            autoFocus
            value={createText}
            onChange={(e) => setCreateText(e.target.value)}
            placeholder="O que você está fazendo agora?"
            rows={4}
            className="w-full border-none focus:outline-none text-sm mb-4 resize-none"
          />
          <div className="flex gap-2 flex-wrap">
            {SUGGESTED_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={createTags.includes(tag)}
                onClick={() => setCreateTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))}
              />
            ))}
          </div>
        </div>
      )}

      {/* MATCH MODAL */}
      {matchOpen && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium border-4 border-white -mr-4 z-10">EU</div>
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium border-4 border-white">
              {matchWith.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <p className="text-2xl font-medium mb-2">É um match!</p>
          <p className="text-sm text-gray-500 mb-8 max-w-[240px]">Você e {matchWith} reagiram de verdade um ao outro.</p>
          <button
            onClick={() => { setMatchOpen(false); setTab('chat'); setActiveChatId(conversations[conversations.length - 1]?.id); }}
            className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium mb-2"
          >
            Iniciar conversa
          </button>
          <button onClick={() => setMatchOpen(false)} className="w-full border border-gray-200 text-gray-500 rounded-lg py-3 text-sm font-medium">
            Continuar explorando
          </button>
        </div>
      )}
    </div>
  );
}
