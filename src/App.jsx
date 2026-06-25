import React, { useState, useEffect } from 'react';
import {
  Home, Compass, Plus, MessageCircle, User, Heart, Camera, X,
  ChevronLeft, Sparkles, Send, Search, Bell, Trash2, Check, Users, LogOut, Eye, Video
} from 'lucide-react';

const API_URL = 'https://cerne-backend.onrender.com';

const INTERESTS = ['fotografia', 'trilha', 'música', 'viagem', 'corrida', 'cinema', 'filosofia', 'cozinha'];

const INTENT_OPTIONS = [
  { key: 'amizade', label: 'Amizade', desc: 'Conectar por interesses em comum' },
  { key: 'namoro', label: 'Namoro', desc: 'Abrir espaço pra romance' },
  { key: 'ambos', label: 'Ambos', desc: 'Deixar a conexão te surpreender' },
];

const INTENT_STYLES = {
  amizade: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400' },
  namoro: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  ambos: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' },
};

const INTENT_LABEL = { amizade: 'amizade', namoro: 'namoro', ambos: 'aberto a ambos' };

const SUGGESTED_TAGS = ['trilha', 'natureza', 'pôrdosol'];

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

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} dia(s)`;
}

async function apiFetch(path, options = {}, token) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Algo deu errado, tente novamente.');
  return data;
}

function CerneMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 280 280" width={size} height={size} aria-hidden="true">
      <circle cx="140" cy="140" r="92" fill="none" stroke="#fda4af" strokeWidth="10" />
      <circle cx="140" cy="140" r="70" fill="none" stroke="#fb7185" strokeWidth="10" />
      <circle cx="140" cy="140" r="48" fill="none" stroke="#e11d48" strokeWidth="10" />
      <circle cx="140" cy="140" r="20" fill="#9f1239" />
    </svg>
  );
}

function Avatar({ initials, intentKey, size = 'w-9 h-9 text-sm' }) {
  const s = INTENT_STYLES[intentKey] || INTENT_STYLES.ambos;
  return (
    <div className={`${size} ${s.bg} ${s.text} rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
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
  const [screen, setScreen] = useState('auth'); // auth | onboarding | app
  const [booting, setBooting] = useState(true);

  const [authMode, setAuthMode] = useState('login'); // login | signup | forgot | reset
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const [obStep, setObStep] = useState(0);
  const [profile, setProfile] = useState({ name: '', bio: '', interests: ['fotografia'], intent: 'ambos' });

  const [tab, setTab] = useState('feed');
  const [pulses, setPulses] = useState([]);
  const [feedError, setFeedError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [chatDraft, setChatDraft] = useState('');

  const [openReactId, setOpenReactId] = useState(null);
  const [reactDraft, setReactDraft] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createText, setCreateText] = useState('');
  const [createTags, setCreateTags] = useState(['trilha']);
  const [createImageUrl, setCreateImageUrl] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState(null);
  const [createMediaType, setCreateMediaType] = useState('image');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [matchOpen, setMatchOpen] = useState(false);
  const [matchWith, setMatchWith] = useState('');

  const [exploreMsg, setExploreMsg] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const [stories, setStories] = useState([]);
  const [viewingStory, setViewingStory] = useState(null);
  const [storyViewers, setStoryViewers] = useState(null);
  const [creatingStory, setCreatingStory] = useState(false);
  const [profileGridTab, setProfileGridTab] = useState('pulses');
  const [interests, setInterests] = useState([]);

  // Tenta recuperar sessão salva ao abrir o app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromLink = params.get('resetToken');
    if (tokenFromLink) {
      setResetToken(tokenFromLink);
      setAuthMode('reset');
      setBooting(false);
      return;
    }

    const savedToken = localStorage.getItem('cerne_token');
    const savedUserId = localStorage.getItem('cerne_userId');
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      bootstrapApp(savedUserId, savedToken).finally(() => setBooting(false));
    } else {
      setBooting(false);
    }
  }, []);

  async function bootstrapApp(uid, tok) {
    try {
      const user = await apiFetch(`/users/${uid}`, {}, tok);
      setProfile({
        name: user.name,
        bio: user.bio || '',
        interests: user.interests.map((i) => i.interest.name),
        intent: user.intent,
      });
      setScreen('app');
      await Promise.all([loadFeed(uid, tok), loadConversations(uid, tok), loadStories(uid, tok), loadInterests()]);
    } catch (err) {
      localStorage.removeItem('cerne_token');
      localStorage.removeItem('cerne_userId');
      setScreen('auth');
    }
  }

  async function loadFeed(uid = userId, tok = token) {
    try {
      setFeedError('');
      const raw = await apiFetch('/pulses', {}, tok);
      setPulses(
        raw.map((p) => ({
          id: p.id,
          author: p.author.name,
          authorId: p.authorId,
          intentKey: p.author.intent,
          time: timeAgo(p.createdAt),
          text: p.text,
          tags: p.tags.map((t) => t.interest.name),
          hasPhoto: !!p.mediaUrl,
          mediaUrl: p.mediaUrl,
          mediaType: p.mediaType || 'image',
          reacted: p.reactions.some((r) => r.userId === uid),
          own: p.authorId === uid,
        }))
      );
    } catch (err) {
      setFeedError('Não foi possível carregar o feed. O servidor pode estar acordando, tente de novo em um minuto.');
    }
  }

  async function loadStories(uid = userId, tok = token) {
    try {
      const raw = await apiFetch(`/stories?viewerId=${uid}`, {}, tok);
      setStories(raw);
    } catch (err) {
      // sem momentos não quebra o app
    }
  }

  async function loadInterests() {
    try {
      const raw = await apiFetch('/interests', {});
      setInterests(raw);
    } catch (err) {
      // explorar fica vazio se falhar, sem quebrar o app
    }
  }

  async function loadConversations(uid = userId, tok = token) {
    try {
      const raw = await apiFetch(`/matches/user/${uid}`, {}, tok);
      setConversations(
        raw.map((m) => {
          const other = m.userAId === uid ? m.userB : m.userA;
          return {
            id: m.id,
            name: other.name,
            intentKey: other.intent || 'ambos',
            lastMessage: m.messages[0]?.text || 'vocês deram match. diga olá!',
          };
        })
      );
    } catch (err) {
      // silencioso — a lista de conversas pode ficar vazia sem quebrar o app
    }
  }

  async function openChat(matchId) {
    setActiveChatId(matchId);
    setTab('chat');
    try {
      const msgs = await apiFetch(`/matches/${matchId}/messages`, {}, token);
      setMessagesByChat((prev) => ({
        ...prev,
        [matchId]: msgs.map((m) => ({ from: m.senderId === userId ? 'me' : 'them', text: m.text })),
      }));
    } catch (err) {
      setMessagesByChat((prev) => ({ ...prev, [matchId]: [] }));
    }
  }

  // Atualiza as mensagens automaticamente enquanto uma conversa está aberta
  useEffect(() => {
    if (!activeChatId || !token) return;
    const interval = setInterval(() => {
      apiFetch(`/matches/${activeChatId}/messages`, {}, token)
        .then((msgs) => {
          setMessagesByChat((prev) => ({
            ...prev,
            [activeChatId]: msgs.map((m) => ({ from: m.senderId === userId ? 'me' : 'them', text: m.text })),
          }));
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChatId, token, userId]);

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: authForm.email }) });
      setForgotSent(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setAuthError('');
    if (newPassword.length < 6) {
      setAuthError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setAuthLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, newPassword }) });
      setResetDone(true);
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const path = authMode === 'signup' ? '/auth/signup' : '/auth/login';
      const body =
        authMode === 'signup'
          ? { name: authForm.name, email: authForm.email, password: authForm.password }
          : { email: authForm.email, password: authForm.password };

      const data = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      localStorage.setItem('cerne_token', data.token);
      localStorage.setItem('cerne_userId', data.user.id);
      setToken(data.token);
      setUserId(data.user.id);

      if (authMode === 'signup') {
        setProfile((p) => ({ ...p, name: data.user.name }));
        setScreen('onboarding');
      } else {
        await bootstrapApp(data.user.id, data.token);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function toggleInterest(tag) {
    setProfile((p) => ({
      ...p,
      interests: p.interests.includes(tag) ? p.interests.filter((i) => i !== tag) : [...p.interests, tag],
    }));
  }

  async function finishOnboarding() {
    try {
      await apiFetch(
        `/users/${userId}`,
        { method: 'PATCH', body: JSON.stringify({ bio: profile.bio, intent: profile.intent, interestNames: profile.interests }) },
        token
      );
      setScreen('app');
      await Promise.all([loadFeed(), loadConversations()]);
    } catch (err) {
      setAuthError('Não foi possível salvar seu perfil. Tente novamente.');
    }
  }

  async function submitReaction(pulse) {
    if (!reactDraft.trim()) return;
    try {
      const result = await apiFetch(
        `/pulses/${pulse.id}/react`,
        { method: 'POST', body: JSON.stringify({ userId, comment: reactDraft }) },
        token
      );
      setPulses((prev) => prev.map((p) => (p.id === pulse.id ? { ...p, reacted: true } : p)));
      setOpenReactId(null);
      setReactDraft('');
      if (result.match) {
        setMatchWith(pulse.author);
        setMatchOpen(true);
        await loadConversations();
      }
    } catch (err) {
      setFeedError(err.message);
    }
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video');
    setCreateMediaType(isVideo ? 'video' : 'image');
    setCreateImagePreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'erro ao enviar arquivo');
      setCreateImageUrl(data.url);
    } catch (err) {
      setFeedError('Não foi possível enviar o arquivo: ' + err.message);
      setCreateImagePreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleStoryFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCreatingStory(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'erro ao enviar momento');
      await apiFetch('/stories', { method: 'POST', body: JSON.stringify({ authorId: userId, mediaUrl: data.url }) }, token);
      await loadStories();
    } catch (err) {
      setFeedError('Não foi possível publicar o momento: ' + err.message);
    } finally {
      setCreatingStory(false);
    }
  }

  async function openStory(story) {
    setViewingStory(story);
    setStoryViewers(null);
    if (story.authorId === userId) {
      try {
        const data = await apiFetch(`/stories/${story.id}/viewers?authorId=${userId}`, {}, token);
        setStoryViewers(data);
      } catch (err) {
        setStoryViewers({ count: 0, viewers: [] });
      }
    } else {
      try {
        await apiFetch(`/stories/${story.id}/view`, { method: 'POST', body: JSON.stringify({ viewerId: userId }) }, token);
        setStories((prev) => prev.map((s) => (s.id === story.id ? { ...s, viewedByMe: true } : s)));
      } catch (err) {
        // não bloqueia a visualização se a marcação falhar
      }
    }
  }

  async function publishPulse() {
    if (!createText.trim()) return;
    try {
      await apiFetch(
        '/pulses',
        { method: 'POST', body: JSON.stringify({ authorId: userId, text: createText, tagNames: createTags, mediaUrl: createImageUrl, mediaType: createMediaType }) },
        token
      );
      setCreateText('');
      setCreateTags(['trilha']);
      setCreateImageUrl(null);
      setCreateImagePreview(null);
      setCreateMediaType('image');
      setCreateOpen(false);
      await loadFeed();
    } catch (err) {
      setFeedError(err.message);
    }
  }

  async function removeOwnPulse(id) {
    try {
      await apiFetch(`/pulses/${id}?userId=${userId}`, { method: 'DELETE' }, token);
      setPulses((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setFeedError(`Não foi possível apagar o pulse: ${err.message}`);
    }
  }

  async function sendChatMessage(matchId) {
    if (!chatDraft.trim()) return;
    const text = chatDraft.trim();
    setChatDraft('');
    setMessagesByChat((prev) => ({ ...prev, [matchId]: [...(prev[matchId] || []), { from: 'me', text }] }));
    try {
      await apiFetch(`/matches/${matchId}/messages`, { method: 'POST', body: JSON.stringify({ senderId: userId, text }) }, token);
    } catch (err) {
      // mensagem já apareceu na tela; se falhar, ela só não persiste no servidor
    }
  }

  async function saveProfile() {
    try {
      await apiFetch(
        `/users/${userId}`,
        { method: 'PATCH', body: JSON.stringify({ name: profile.name, bio: profile.bio, intent: profile.intent, interestNames: profile.interests }) },
        token
      );
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1600);
    } catch (err) {
      setFeedError('Não foi possível salvar.');
    }
  }

  function logout() {
    localStorage.removeItem('cerne_token');
    localStorage.removeItem('cerne_userId');
    setToken(null);
    setUserId(null);
    setScreen('auth');
    setPulses([]);
    setConversations([]);
  }

  if (booting) {
    return (
      <div className="max-w-sm mx-auto h-[700px] bg-gray-50 rounded-3xl border border-gray-200 flex items-center justify-center font-sans">
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    );
  }

  // ---------- AUTH (login / cadastro / esqueci a senha / redefinir) ----------
  if (screen === 'auth') {
    return (
      <div className="max-w-sm mx-auto h-[700px] bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden relative flex flex-col font-sans p-6 justify-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CerneMark size={32} />
          <span className="text-2xl font-medium text-rose-600">Cerne</span>
        </div>
        <p className="text-xs text-gray-500 text-center italic mb-6">conecte-se pelo que é real</p>

        {authMode === 'reset' ? (
          resetDone ? (
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Senha redefinida!</p>
              <p className="text-xs text-gray-500 mb-5">Já pode entrar com a senha nova.</p>
              <button
                onClick={() => { setAuthMode('login'); setResetDone(false); setResetToken(null); }}
                className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium"
              >
                Ir pro login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit}>
              <p className="text-sm text-gray-600 mb-3">Crie uma senha nova pra sua conta.</p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Senha nova"
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 bg-white"
              />
              {authError && <p className="text-xs text-rose-600 mb-3">{authError}</p>}
              <button type="submit" disabled={authLoading} className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium disabled:opacity-60">
                {authLoading ? 'Salvando...' : 'Salvar senha nova'}
              </button>
            </form>
          )
        ) : authMode === 'forgot' ? (
          forgotSent ? (
            <div className="text-center">
              <p className="text-sm font-medium mb-2">E-mail enviado!</p>
              <p className="text-xs text-gray-500 mb-5">Se esse e-mail existir, um link de recuperação foi enviado. Verifique sua caixa de entrada.</p>
              <button onClick={() => { setAuthMode('login'); setForgotSent(false); }} className="w-full border border-gray-200 text-gray-500 rounded-lg py-3 text-sm font-medium">
                Voltar pro login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit}>
              <p className="text-sm text-gray-600 mb-3">Digite o e-mail da sua conta.</p>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="E-mail"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 bg-white"
              />
              {authError && <p className="text-xs text-rose-600 mb-3">{authError}</p>}
              <button type="submit" disabled={authLoading} className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium disabled:opacity-60 mb-2">
                {authLoading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-gray-500 text-xs py-2">
                Voltar pro login
              </button>
            </form>
          )
        ) : (
          <>
            <div className="flex bg-gray-200 rounded-full p-1 mb-5">
              <button onClick={() => setAuthMode('login')} className={`flex-1 text-sm py-2 rounded-full ${authMode === 'login' ? 'bg-white font-medium' : 'text-gray-500'}`}>
                Entrar
              </button>
              <button onClick={() => setAuthMode('signup')} className={`flex-1 text-sm py-2 rounded-full ${authMode === 'signup' ? 'bg-white font-medium' : 'text-gray-500'}`}>
                Criar conta
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <input
                  value={authForm.name}
                  onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 bg-white"
                />
              )}
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="E-mail"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 bg-white"
              />
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Senha"
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 bg-white"
              />

              {authMode === 'login' && (
                <p onClick={() => setAuthMode('forgot')} className="text-xs text-blue-600 text-right mb-4 cursor-pointer">
                  Esqueceu a senha?
                </p>
              )}
              {authMode === 'signup' && <div className="mb-4" />}

              {authError && <p className="text-xs text-rose-600 mb-3">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium disabled:opacity-60"
              >
                {authLoading ? 'Conectando ao servidor...' : authMode === 'signup' ? 'Criar conta' : 'Entrar'}
              </button>
              {authLoading && (
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Pode levar até 1 minuto na primeira vez (o servidor grátis "acorda" sob demanda).
                </p>
              )}
            </form>
          </>
        )}
      </div>
    );
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
              <p className="text-lg font-medium mb-1">Oi, {profile.name}!</p>
              <p className="text-sm text-gray-500 mb-6">Conte um pouco sobre você.</p>
              <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-6 h-6 text-gray-400" />
              </div>
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

        {authError && <p className="text-xs text-rose-600 mb-2">{authError}</p>}

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
  const activeMessages = messagesByChat[activeChatId] || [];

  return (
    <div className="max-w-sm mx-auto h-[700px] bg-white rounded-3xl border border-gray-200 overflow-hidden relative flex flex-col font-sans">
      {!(tab === 'chat' && activeConvo) && (
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          {tab === 'feed' && (
            <>
              <div className="flex items-center gap-2">
                <CerneMark size={22} />
                <span className="text-lg font-medium text-rose-600">Cerne</span>
              </div>
              <div className="flex gap-3 text-gray-400">
                <Search className="w-[18px] h-[18px]" />
                <Bell className="w-[18px] h-[18px]" />
              </div>
            </>
          )}
          {tab === 'explore' && <span className="text-base font-medium">Explorar</span>}
          {tab === 'chat' && <span className="text-base font-medium">Conversas</span>}
          {tab === 'profile' && (
            <>
              <span className="text-base font-medium">Perfil</span>
              <LogOut className="w-[18px] h-[18px] text-gray-400 cursor-pointer" onClick={logout} />
            </>
          )}
        </div>
      )}

      {activeConvo && (
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setActiveChatId(null)} />
          <Avatar initials={activeConvo.name.slice(0, 2).toUpperCase()} intentKey={activeConvo.intentKey} size="w-8 h-8 text-xs" />
          <span className="text-sm font-medium">{activeConvo.name}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'feed' && !activeConvo && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 overflow-x-auto pb-1 -mt-1">
              {stories.find((s) => s.authorId === userId) ? (
                <button onClick={() => openStory(stories.find((s) => s.authorId === userId))} className="text-center flex-shrink-0">
                  <div className="w-14 h-14 rounded-full border-2 border-rose-400 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-medium">EU</div>
                  </div>
                  <p className="text-[11px] mt-1">seu</p>
                </button>
              ) : (
                <label className="text-center flex-shrink-0 cursor-pointer">
                  <div className="w-14 h-14 rounded-full border-[1.5px] border-dashed border-gray-300 flex items-center justify-center">
                    {creatingStory ? <span className="text-[10px] text-gray-400">...</span> : <Plus className="w-5 h-5 text-gray-400" />}
                  </div>
                  <p className="text-[11px] mt-1">seu</p>
                  <input type="file" accept="image/*,video/*" onChange={handleStoryFileSelect} className="hidden" />
                </label>
              )}
              {stories
                .filter((s) => s.authorId !== userId)
                .map((s) => (
                  <button key={s.id} onClick={() => openStory(s)} className="text-center flex-shrink-0">
                    <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${s.viewedByMe ? 'border-gray-200' : 'border-rose-400'}`}>
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                        {s.authorName.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <p className="text-[11px] mt-1">{s.authorName}</p>
                  </button>
                ))}
            </div>

            {feedError && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                <span>{feedError}</span>
                <button onClick={() => loadFeed()} className="font-medium underline ml-2 flex-shrink-0">tentar de novo</button>
              </div>
            )}
            {pulses.length === 0 && !feedError && <p className="text-xs text-gray-400 text-center py-10">Nenhum pulse ainda. Seja o primeiro a postar!</p>}
            {pulses.map((pulse) => {
              const s = INTENT_STYLES[pulse.intentKey] || INTENT_STYLES.ambos;
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
                      <span className={`text-xs px-2 py-0.5 rounded-md ${s.bg} ${s.text}`}>{INTENT_LABEL[pulse.intentKey] || 'aberto a ambos'}</span>
                    )}
                  </div>

                  {pulse.hasPhoto && (
                    <div className="w-full h-44 bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {pulse.mediaType === 'video' ? (
                        <video src={pulse.mediaUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={pulse.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
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
            <p className="text-xs text-gray-400 mb-2">comunidades com mais pulses</p>
            {interests.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">Ainda não tem pulses com tags suficientes pra formar uma comunidade.</p>
            )}
            <div className="flex flex-col gap-2">
              {interests.map((c, i) => {
                const styleKeys = ['blue', 'emerald', 'amber', 'rose'];
                const s = COMMUNITY_STYLES[styleKeys[i % styleKeys.length]];
                return (
                  <button key={c.name} onClick={() => setExploreMsg(`Em breve: feed dedicado a #${c.name}`)} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 text-left">
                    <div className={`w-9 h-9 rounded-full ${s.bg} ${s.text} flex items-center justify-center`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.pulseCount} {c.pulseCount === 1 ? 'pulse' : 'pulses'}</p>
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
              <button key={c.id} onClick={() => openChat(c.id)} className="flex items-center gap-3 py-2.5 border-b border-gray-100 text-left">
                <Avatar initials={c.name.slice(0, 2).toUpperCase()} intentKey={c.intentKey} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'chat' && activeConvo && (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col gap-2">
              {activeMessages.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Diga olá pra começar a conversa.</p>}
              {activeMessages.map((m, i) => (
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
              <Avatar initials={profile.name.slice(0, 2).toUpperCase() || 'EU'} intentKey={profile.intent} size="w-16 h-16 text-lg mx-auto mb-2" />
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="text-center text-base font-medium border-none focus:outline-none"
              />
            </div>

            <div className="flex justify-around bg-gray-50 rounded-xl py-3 mb-4">
              <div className="text-center">
                <p className="text-base font-medium">{conversations.length}</p>
                <p className="text-[11px] text-gray-400">matches</p>
              </div>
              <div className="text-center">
                <p className="text-base font-medium">{profile.interests.length}</p>
                <p className="text-[11px] text-gray-400">comunidades</p>
              </div>
              <div className="text-center">
                <p className="text-base font-medium">{pulses.filter((p) => p.own).length}</p>
                <p className="text-[11px] text-gray-400">pulses</p>
              </div>
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
                  <button key={opt.key} onClick={() => setProfile((p) => ({ ...p, intent: opt.key }))} className={`flex-1 text-xs py-2 rounded-lg border ${active ? `${s.bg} ${s.text} ${s.border}` : 'border-gray-200 text-gray-500'}`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button onClick={saveProfile} className="w-full bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-3 text-sm font-medium mb-5">
              {savedToast ? 'Salvo!' : 'Salvar alterações'}
            </button>

            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setProfileGridTab('pulses')}
                className={`flex-1 text-center py-2.5 ${profileGridTab === 'pulses' ? 'border-b-2 border-rose-500 text-rose-600' : 'border-b-2 border-transparent text-gray-400'}`}
              >
                <Camera className="w-4 h-4 inline" />
              </button>
              <button
                onClick={() => setProfileGridTab('reels')}
                className={`flex-1 text-center py-2.5 ${profileGridTab === 'reels' ? 'border-b-2 border-rose-500 text-rose-600' : 'border-b-2 border-transparent text-gray-400'}`}
              >
                <Video className="w-4 h-4 inline" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pulses
                .filter((p) => p.own && (profileGridTab === 'reels' ? p.mediaType === 'video' : true))
                .map((p) => (
                  <div key={p.id} className="h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {p.mediaUrl ? (
                      p.mediaType === 'video' ? (
                        <video src={p.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <p className="text-[11px] text-gray-400 p-2 line-clamp-3">{p.text}</p>
                    )}
                  </div>
                ))}
              {pulses.filter((p) => p.own && (profileGridTab === 'reels' ? p.mediaType === 'video' : true)).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6 col-span-2">
                  {profileGridTab === 'reels' ? 'Ainda sem reels.' : 'Ainda sem pulses.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

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

      {!(tab === 'chat' && activeConvo) && (
        <div className="flex justify-around items-center py-3 border-t border-gray-100">
          <Home className={`w-5 h-5 cursor-pointer ${tab === 'feed' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('feed')} />
          <Compass className={`w-5 h-5 cursor-pointer ${tab === 'explore' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('explore')} />
          <Plus className="w-5 h-5 text-gray-400 cursor-pointer" onClick={() => setCreateOpen(true)} />
          <MessageCircle className={`w-5 h-5 cursor-pointer ${tab === 'chat' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('chat')} />
          <User className={`w-5 h-5 cursor-pointer ${tab === 'profile' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('profile')} />
        </div>
      )}

      {createOpen && (
        <div className="absolute inset-0 bg-white p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <X
              className="w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => { setCreateOpen(false); setCreateImageUrl(null); setCreateImagePreview(null); setCreateMediaType('image'); }}
            />
            <span className="text-sm font-medium">Novo pulse</span>
            <button
              onClick={publishPulse}
              disabled={uploadingPhoto}
              className="bg-blue-50 border border-blue-300 text-blue-700 rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
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

          {createImagePreview && (
            <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-4">
              {createMediaType === 'video' ? (
                <video src={createImagePreview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={createImagePreview} alt="" className="w-full h-full object-cover" />
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs text-gray-600">Enviando...</div>
              )}
              <X
                className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full p-1 text-gray-600 cursor-pointer"
                onClick={() => { setCreateImageUrl(null); setCreateImagePreview(null); setCreateMediaType('image'); }}
              />
            </div>
          )}

          <div className="flex gap-2 flex-wrap mb-4">
            {SUGGESTED_TAGS.map((tag) => (
              <Chip key={tag} label={`#${tag}`} selected={createTags.includes(tag)} onClick={() => setCreateTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))} />
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer border-t border-gray-100 pt-3">
            <Camera className="w-5 h-5" />
            {createImagePreview ? 'Trocar mídia' : 'Adicionar foto ou vídeo (reel)'}
            <input type="file" accept="image/*,video/*" onChange={handlePhotoSelect} className="hidden" />
          </label>
        </div>
      )}

      {viewingStory && (
        <div className="absolute inset-0 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-medium">
                {viewingStory.authorId === userId ? 'EU' : viewingStory.authorName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-white font-medium">{viewingStory.authorId === userId ? 'seu momento' : viewingStory.authorName}</span>
            </div>
            <X className="w-5 h-5 text-white cursor-pointer" onClick={() => setViewingStory(null)} />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <img src={viewingStory.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
          </div>

          {viewingStory.authorId === userId && (
            <div className="bg-gray-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-gray-300" />
                <span className="text-sm text-white font-medium">{storyViewers ? storyViewers.count : '...'} visualizações</span>
                <span className="text-xs text-gray-500">· só você vê isso</span>
              </div>
              {storyViewers?.viewers.slice(0, 5).map((v) => (
                <p key={v.id} className="text-sm text-gray-300 py-1">{v.name}</p>
              ))}
            </div>
          )}
        </div>
      )}

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
            onClick={() => {
              setMatchOpen(false);
              const convo = conversations.find((c) => c.name === matchWith);
              if (convo) openChat(convo.id);
            }}
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
