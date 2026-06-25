import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Compass, Plus, MessageCircle, User, Heart, Camera, X,
  ChevronLeft, Sparkles, Send, Search, Bell, Trash2, Check, Users, LogOut, Eye, Video, MoreVertical, RefreshCw, Image as ImageIcon, Share2, Link as LinkIcon, Download
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

function formatSeconds(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
  const [openCommentId, setOpenCommentId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorMode, setCreatorMode] = useState('pulse'); // pulse | momento | reel
  const [createText, setCreateText] = useState('');
  const [createTags, setCreateTags] = useState(['trilha']);
  const [createImageUrl, setCreateImageUrl] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState(null);
  const [createMediaType, setCreateMediaType] = useState('image');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [matchOpen, setMatchOpen] = useState(false);
  const [matchWith, setMatchWith] = useState('');

  const [exploreMsg, setExploreMsg] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const [stories, setStories] = useState([]);
  const [viewingStory, setViewingStory] = useState(null);
  const [storyViewers, setStoryViewers] = useState(null);
  const [storyMenuOpen, setStoryMenuOpen] = useState(false);
  const [hideListOpen, setHideListOpen] = useState(false);
  const [hiddenUserIds, setHiddenUserIds] = useState([]);
  const [profileGridTab, setProfileGridTab] = useState('pulses');
  const [viewingOwnPulse, setViewingOwnPulse] = useState(null);
  const [pulseViewers, setPulseViewers] = useState(null);
  const [sharingPulse, setSharingPulse] = useState(null);
  const [shareSubview, setShareSubview] = useState('main');
  const [shareCopied, setShareCopied] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingProfileLoading, setViewingProfileLoading] = useState(false);
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
          comments: [
            ...p.reactions.map((r) => ({ key: `r-${r.userId}`, commentId: null, userId: r.userId, name: r.user.name, intentKey: r.user.intent, text: r.comment, createdAt: r.createdAt, likedByMe: false })),
            ...p.comments.map((c) => ({ key: `c-${c.id}`, commentId: c.id, userId: c.userId, name: c.user.name, intentKey: c.user.intent, text: c.text, createdAt: c.createdAt, likedByMe: c.likes.some((l) => l.userId === uid), likeCount: c.likes.length })),
          ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
          likedByMe: p.likes.some((l) => l.userId === uid),
          likeCount: p.likes.length,
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
            otherId: other.id,
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

  function mapMessages(msgs) {
    return msgs.map((m) => ({
      from: m.senderId === userId ? 'me' : 'them',
      text: m.text,
      sharedPulse: m.sharedPulse
        ? { id: m.sharedPulse.id, text: m.sharedPulse.text, mediaUrl: m.sharedPulse.mediaUrl, mediaType: m.sharedPulse.mediaType, authorName: m.sharedPulse.author.name }
        : null,
    }));
  }

  async function openChat(matchId) {
    setActiveChatId(matchId);
    setTab('chat');
    try {
      const msgs = await apiFetch(`/matches/${matchId}/messages`, {}, token);
      setMessagesByChat((prev) => ({ ...prev, [matchId]: mapMessages(msgs) }));
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
          setMessagesByChat((prev) => ({ ...prev, [activeChatId]: mapMessages(msgs) }));
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

  async function openProfile(targetId) {
    if (targetId === userId) {
      setTab('profile');
      return;
    }
    setViewingProfileLoading(true);
    setViewingProfile({ id: targetId, loading: true });
    try {
      const data = await apiFetch(`/users/${targetId}`, {}, token);
      setViewingProfile({
        ...data,
        mappedPulses: data.pulses.map((p) => ({
          id: p.id,
          author: data.name,
          authorId: data.id,
          intentKey: data.intent,
          time: timeAgo(p.createdAt),
          text: p.text,
          tags: [],
          comments: [],
          hasPhoto: !!p.mediaUrl,
          mediaUrl: p.mediaUrl,
          mediaType: p.mediaType || 'image',
        })),
      });
    } catch (err) {
      setFeedError('Não foi possível carregar esse perfil.');
      setViewingProfile(null);
    } finally {
      setViewingProfileLoading(false);
    }
  }

  async function submitComment(pulse) {
    if (!commentDraft.trim()) return;
    const text = commentDraft;
    setCommentDraft('');
    setOpenCommentId(null);
    try {
      await apiFetch(`/pulses/${pulse.id}/comments`, { method: 'POST', body: JSON.stringify({ userId, text }) }, token);
      setPulses((prev) =>
        prev.map((p) =>
          p.id === pulse.id
            ? { ...p, comments: [...p.comments, { key: `c-${Date.now()}`, commentId: null, userId, name: profile.name, intentKey: profile.intent, text, createdAt: new Date().toISOString(), likedByMe: false, likeCount: 0 }] }
            : p
        )
      );
    } catch (err) {
      setFeedError('Não foi possível comentar: ' + err.message);
    }
  }

  async function togglePulseLike(pulse) {
    try {
      const res = await apiFetch(`/pulses/${pulse.id}/like`, { method: 'POST', body: JSON.stringify({ userId }) }, token);
      setPulses((prev) =>
        prev.map((p) => (p.id === pulse.id ? { ...p, likedByMe: res.liked, likeCount: p.likeCount + (res.liked ? 1 : -1) } : p))
      );
    } catch (err) {
      setFeedError('Não foi possível curtir: ' + err.message);
    }
  }

  async function toggleCommentLike(pulseId, commentKey, commentId) {
    if (!commentId) return;
    try {
      const res = await apiFetch(`/pulses/comments/${commentId}/like`, { method: 'POST', body: JSON.stringify({ userId }) }, token);
      setPulses((prev) =>
        prev.map((p) =>
          p.id === pulseId ? { ...p, comments: p.comments.map((c) => (c.key === commentKey ? { ...c, likedByMe: res.liked } : c)) } : p
        )
      );
    } catch (err) {
      setFeedError('Não foi possível curtir o comentário: ' + err.message);
    }
  }

  function markPulseViewed(pulseId, authorId) {
    if (authorId === userId) return;
    apiFetch(`/pulses/${pulseId}/view`, { method: 'POST', body: JSON.stringify({ viewerId: userId }) }, token).catch(() => {});
  }

  async function openPulseDetail(pulse) {
    setViewingOwnPulse(pulse);
    setPulseViewers(null);
    if (pulse.authorId === userId && pulse.mediaType === 'video') {
      try {
        const data = await apiFetch(`/pulses/${pulse.id}/viewers?authorId=${userId}`, {}, token);
        setPulseViewers(data);
      } catch (err) {
        setPulseViewers({ count: 0, viewers: [] });
      }
    }
  }

  async function shareToMatch(pulse, matchId) {
    try {
      await apiFetch(`/matches/${matchId}/messages`, { method: 'POST', body: JSON.stringify({ senderId: userId, text: '', sharedPulseId: pulse.id }) }, token);
      setSharingPulse(null);
    } catch (err) {
      setFeedError('Não foi possível compartilhar: ' + err.message);
    }
  }

  async function nativeShare(pulse) {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cerne', text: pulse.text || 'Veja esse pulse no Cerne', url: window.location.origin });
        setSharingPulse(null);
      } catch (err) {
        // usuário cancelou o compartilhamento, sem problema
      }
    } else {
      setFeedError('Compartilhamento direto não é suportado nesse navegador. Use "Copiar link".');
    }
  }

  async function copyPulseLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setShareCopied(true);
      setTimeout(() => {
        setShareCopied(false);
        setSharingPulse(null);
      }, 1200);
    } catch (err) {
      setFeedError('Não foi possível copiar o link.');
    }
  }

  function downloadPulseMedia(pulse) {
    if (!pulse.mediaUrl) return;
    window.open(pulse.mediaUrl, '_blank');
    setSharingPulse(null);
  }

  async function repostAsMomento(pulse) {
    if (!pulse.mediaUrl) return;
    try {
      await apiFetch('/stories', { method: 'POST', body: JSON.stringify({ authorId: userId, mediaUrl: pulse.mediaUrl, mediaType: pulse.mediaType }) }, token);
      await loadStories();
      setSharingPulse(null);
    } catch (err) {
      setFeedError('Não foi possível adicionar ao momento: ' + err.message);
    }
  }

  async function submitReaction(pulse) {
    if (!reactDraft.trim()) return;
    const commentText = reactDraft;
    try {
      const result = await apiFetch(
        `/pulses/${pulse.id}/react`,
        { method: 'POST', body: JSON.stringify({ userId, comment: commentText }) },
        token
      );
      setPulses((prev) =>
        prev.map((p) =>
          p.id === pulse.id
            ? { ...p, reacted: true, comments: [...p.comments, { key: `r-${userId}`, userId, name: profile.name, intentKey: profile.intent, text: commentText, createdAt: new Date().toISOString() }] }
            : p
        )
      );
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

  function stopCameraTracksOnly() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera(mode, wantsAudio) {
    stopCameraTracksOnly();
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: !!wantsAudio });
      streamRef.current = stream;
      setCameraStream(stream);
      setCameraOn(true);
    } catch (err) {
      if (wantsAudio) {
        try {
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
          streamRef.current = videoOnlyStream;
          setCameraStream(videoOnlyStream);
          setCameraOn(true);
          setCameraError('Gravando sem áudio — permissão de microfone não foi concedida.');
          return;
        } catch (err2) {
          // segue pro erro genérico abaixo
        }
      }
      setCameraError('Não conseguimos acessar sua câmera. Escolha um arquivo da galeria abaixo.');
      setCameraOn(false);
      setCameraStream(null);
    }
  }

  // Conecta a câmera ao elemento de vídeo toda vez que um stream novo chega —
  // depender só de "câmera ligada" (true/false) não bastava, porque trocar de
  // aba (Pulse/Momento/Reel) pede um stream novo sem mudar esse booleano,
  // e o vídeo ficava preto mostrando o stream antigo (já parado).
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  function flipCamera() {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next, creatorMode === 'reel');
  }

  function openCreator(mode) {
    setCreatorMode(mode);
    setCreateImageUrl(null);
    setCreateImagePreview(null);
    setCreateMediaType(mode === 'reel' ? 'video' : 'image');
    setCreateText('');
    setCreateTags(['trilha']);
    setCreatorOpen(true);
    startCamera(facingMode, mode === 'reel');
  }

  function switchCreatorMode(mode) {
    setCreatorMode(mode);
    setCreateMediaType(mode === 'reel' ? 'video' : 'image');
    if (!createImagePreview) startCamera(facingMode, mode === 'reel');
  }

  function closeCreator() {
    stopCameraTracksOnly();
    setCameraOn(false);
    setCameraStream(null);
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
    setRecordingSeconds(0);
    setCreatorOpen(false);
    setCreateImageUrl(null);
    setCreateImagePreview(null);
    setCreateText('');
    setCreateTags(['trilha']);
    setCreateMediaType('image');
  }

  function retake() {
    setCreateImageUrl(null);
    setCreateImagePreview(null);
    startCamera(facingMode, creatorMode === 'reel');
  }

  async function uploadCapturedBlob(blob, filename) {
    if (!blob || !(blob instanceof Blob) || blob.size === 0) {
      setFeedError('A captura ficou vazia, tenta gravar de novo.');
      return;
    }
    let previewUrl;
    try {
      previewUrl = URL.createObjectURL(blob);
    } catch (err) {
      setFeedError('Não foi possível processar o arquivo capturado, tenta de novo.');
      return;
    }
    setCreateImagePreview(previewUrl);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, filename);
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

  function takePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setFeedError('Não foi possível tirar a foto, tenta de novo.');
        return;
      }
      stopCameraTracksOnly();
      setCameraOn(false);
      setCameraStream(null);
      setCreateMediaType('image');
      uploadCapturedBlob(blob, 'photo.jpg');
    }, 'image/jpeg', 0.9);
  }

  function startRecording() {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    const supportedType = ['video/mp4', 'video/webm'].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(streamRef.current, supportedType ? { mimeType: supportedType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stopCameraTracksOnly();
      setCameraOn(false);
      setCameraStream(null);
      if (recordedChunksRef.current.length === 0) {
        setFeedError('A gravação ficou muito curta, tenta de novo segurando um pouco mais.');
        startCamera(facingMode, true);
        return;
      }
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/mp4' });
      setCreateMediaType('video');
      uploadCapturedBlob(blob, 'video.mp4');
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingIntervalRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  }


  function handleGallerySelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video');
    setCreateMediaType(isVideo ? 'video' : 'image');
    stopCameraTracksOnly();
    setCameraOn(false);
    setCameraStream(null);
    uploadCapturedBlob(file, file.name);
  }

  async function publishFromCreator() {
    if (!createImageUrl || publishing) return;
    if (creatorMode !== 'momento' && !createText.trim()) return;
    setPublishing(true);
    try {
      if (creatorMode === 'momento') {
        await apiFetch('/stories', { method: 'POST', body: JSON.stringify({ authorId: userId, mediaUrl: createImageUrl, mediaType: createMediaType }) }, token);
        await loadStories();
      } else {
        await apiFetch(
          '/pulses',
          { method: 'POST', body: JSON.stringify({ authorId: userId, text: createText, tagNames: createTags, mediaUrl: createImageUrl, mediaType: createMediaType }) },
          token
        );
        await loadFeed();
      }
      closeCreator();
    } catch (err) {
      setFeedError(err.message);
    } finally {
      setPublishing(false);
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

  async function deleteStory(storyId) {
    try {
      await apiFetch(`/stories/${storyId}?authorId=${userId}`, { method: 'DELETE' }, token);
      setViewingStory(null);
      setStoryMenuOpen(false);
      await loadStories();
    } catch (err) {
      setFeedError('Não foi possível apagar o momento: ' + err.message);
    }
  }

  async function openHideList() {
    setStoryMenuOpen(false);
    setHideListOpen(true);
    try {
      const list = await apiFetch(`/stories/hide-list?hiderId=${userId}`, {}, token);
      setHiddenUserIds(list);
    } catch (err) {
      setHiddenUserIds([]);
    }
  }

  async function toggleHidePerson(personId) {
    const isHidden = hiddenUserIds.includes(personId);
    try {
      await apiFetch(
        isHidden ? '/stories/unhide' : '/stories/hide',
        { method: 'POST', body: JSON.stringify({ hiderId: userId, hiddenUserId: personId }) },
        token
      );
      setHiddenUserIds((prev) => (isHidden ? prev.filter((id) => id !== personId) : [...prev, personId]));
    } catch (err) {
      setFeedError('Não foi possível atualizar: ' + err.message);
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
                <button onClick={() => openCreator('momento')} className="text-center flex-shrink-0">
                  <div className="w-14 h-14 rounded-full border-[1.5px] border-dashed border-gray-300 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-[11px] mt-1">seu</p>
                </button>
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
                    <button onClick={() => openProfile(pulse.authorId)}>
                      <Avatar initials={pulse.author.slice(0, 2).toUpperCase()} intentKey={pulse.intentKey} />
                    </button>
                    <button className="flex-1 text-left" onClick={() => openProfile(pulse.authorId)}>
                      <p className="text-sm font-medium">{pulse.author}</p>
                      <p className="text-xs text-gray-500">{pulse.time}</p>
                    </button>
                    {pulse.own ? (
                      <Trash2 className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => removeOwnPulse(pulse.id)} />
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-md ${s.bg} ${s.text}`}>{INTENT_LABEL[pulse.intentKey] || 'aberto a ambos'}</span>
                    )}
                  </div>

                  {pulse.hasPhoto && (
                    <div className="relative w-full h-44 bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {pulse.mediaType === 'video' ? (
                        <video
                          src={pulse.mediaUrl}
                          controls
                          className="w-full h-full object-cover"
                          onPlay={() => markPulseViewed(pulse.id, pulse.authorId)}
                        />
                      ) : (
                        <img src={pulse.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      {pulse.mediaType === 'video' && !pulse.own && (
                        <button onClick={() => togglePulseLike(pulse)} className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5">
                          <Heart className={`w-4 h-4 ${pulse.likedByMe ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-sm mb-2">{pulse.text}</p>

                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {pulse.tags.map((t) => (
                      <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t}</span>
                    ))}
                  </div>

                  {pulse.comments.length > 0 && (
                    <div className="flex flex-col gap-1.5 mb-2 border-t border-gray-100 pt-2">
                      {pulse.comments.map((c) => (
                        <div key={c.key} className="flex items-start justify-between gap-2">
                          <p className="text-xs">
                            <button onClick={() => openProfile(c.userId)} className="font-medium">{c.name}</button>{' '}
                            <span className="text-gray-600">{c.text}</span>
                            {c.likeCount > 0 && (
                              <span className="text-[10px] text-gray-400 ml-1">· {c.likeCount} {c.likeCount === 1 ? 'curtida' : 'curtidas'}</span>
                            )}
                          </p>
                          {c.commentId && (
                            <button onClick={() => toggleCommentLike(pulse.id, c.key, c.commentId)} className="flex-shrink-0 mt-0.5">
                              <Heart className={`w-3 h-3 ${c.likedByMe ? 'text-rose-500 fill-rose-500' : 'text-gray-300'}`} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!pulse.own && !pulse.reacted && (
                    <div className={pulse.comments.length === 0 ? 'border-t border-gray-100 pt-2 mb-1.5' : 'mb-1.5'}>
                      {openReactId === pulse.id ? (
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

                  <div className={pulse.own && pulse.comments.length === 0 ? 'border-t border-gray-100 pt-2 flex items-center justify-between' : 'flex items-center justify-between'}>
                    {openCommentId === pulse.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          autoFocus
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="escreva um comentário..."
                          onKeyDown={(e) => e.key === 'Enter' && submitComment(pulse)}
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                        />
                        <button onClick={() => submitComment(pulse)} className="bg-blue-50 border border-blue-300 text-blue-700 rounded-lg px-3 text-xs font-medium">
                          enviar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setOpenCommentId(pulse.id); setCommentDraft(''); }} className="text-xs text-gray-400">
                        comentar
                      </button>
                    )}
                    <button onClick={() => setSharingPulse(pulse)} className="text-gray-400 flex-shrink-0 ml-2">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
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
                  {m.sharedPulse ? (
                    <button onClick={() => openPulseDetail({ ...m.sharedPulse, hasPhoto: !!m.sharedPulse.mediaUrl, author: m.sharedPulse.authorName, intentKey: 'ambos', authorId: '', time: '', tags: [], comments: [] })} className="border border-gray-200 rounded-2xl p-2 text-left">
                      {m.sharedPulse.mediaUrl && (
                        <div className="w-40 h-32 bg-gray-100 rounded-lg overflow-hidden mb-1">
                          {m.sharedPulse.mediaType === 'video' ? (
                            <video src={m.sharedPulse.mediaUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={m.sharedPulse.mediaUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 line-clamp-2 max-w-[150px]">{m.sharedPulse.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">pulse de {m.sharedPulse.authorName}</p>
                    </button>
                  ) : (
                    <div className={`rounded-2xl px-3 py-2 text-sm ${m.from === 'me' ? 'bg-blue-50 text-blue-800' : 'border border-gray-200'}`}>
                      {m.text}
                    </div>
                  )}
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

            <div className="flex justify-around py-3 mb-4 border-t border-b border-gray-100">
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
                  <button key={p.id} onClick={() => openPulseDetail(p)} className="relative h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {p.mediaUrl ? (
                      p.mediaType === 'video' ? (
                        <video src={p.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <p className="text-[11px] text-gray-400 p-2 line-clamp-3 text-left">{p.text}</p>
                    )}
                    {p.mediaType === 'video' && (
                      <div className="absolute bottom-1 right-1 bg-black/50 rounded-full p-1">
                        <Video className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
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
          <Plus className="w-5 h-5 text-gray-400 cursor-pointer" onClick={() => openCreator('pulse')} />
          <MessageCircle className={`w-5 h-5 cursor-pointer ${tab === 'chat' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('chat')} />
          <User className={`w-5 h-5 cursor-pointer ${tab === 'profile' ? 'text-rose-600' : 'text-gray-400'}`} onClick={() => setTab('profile')} />
        </div>
      )}

      {creatorOpen && (
        <div className="absolute inset-0 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <X className="w-5 h-5 text-white cursor-pointer" onClick={closeCreator} />
            <div className="flex gap-1 bg-white/15 rounded-full p-1">
              {['pulse', 'momento', 'reel'].map((m) => (
                <button
                  key={m}
                  onClick={() => switchCreatorMode(m)}
                  className={`px-3 py-1 rounded-full text-xs ${creatorMode === m ? 'bg-white text-gray-900 font-medium' : 'text-white'}`}
                >
                  {m === 'pulse' ? 'Pulse' : m === 'momento' ? 'Momento' : 'Reel'}
                </button>
              ))}
            </div>
            <span className="w-5" />
          </div>

          <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
            {createImagePreview ? (
              createMediaType === 'video' ? (
                <video src={createImagePreview} className="w-full h-full object-contain" controls autoPlay loop muted playsInline />
              ) : (
                <img src={createImagePreview} alt="" className="w-full h-full object-contain" />
              )
            ) : cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
            ) : (
              <p className="text-sm text-gray-300 px-8 text-center">{cameraError || 'Carregando câmera...'}</p>
            )}

            {cameraOn && !createImagePreview && (
              <button onClick={flipCamera} className="absolute top-3 right-3 bg-black/40 rounded-full p-2">
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            )}

            {isRecording && (
              <div className="absolute top-3 left-3 bg-rose-600 rounded-full px-3 py-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full" />
                <span className="text-xs text-white font-medium">{formatSeconds(recordingSeconds)}</span>
              </div>
            )}

            {cameraOn && cameraError && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 rounded-lg px-3 py-2">
                <p className="text-xs text-white text-center">{cameraError}</p>
              </div>
            )}
          </div>

          {!createImagePreview ? (
            <div className="p-5 flex items-center justify-between">
              <label className="cursor-pointer">
                <ImageIcon className="w-6 h-6 text-white" />
                <input type="file" accept={creatorMode === 'reel' ? 'video/*' : 'image/*,video/*'} onChange={handleGallerySelect} className="hidden" />
              </label>

              {creatorMode === 'reel' ? (
                <button
                  onClick={() => (isRecording ? stopRecording() : startRecording())}
                  className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center ${isRecording ? 'bg-rose-600' : 'bg-transparent'}`}
                  aria-label={isRecording ? 'Parar gravação' : 'Gravar vídeo'}
                >
                  {isRecording && <div className="w-5 h-5 bg-white rounded" />}
                </button>
              ) : (
                <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white" aria-label="Tirar foto" />
              )}

              <span className="w-6" />
            </div>
          ) : (
            <div className="bg-white p-4">
              {creatorMode !== 'momento' && (
                <>
                  <textarea
                    autoFocus
                    value={createText}
                    onChange={(e) => setCreateText(e.target.value)}
                    placeholder="Escreva uma legenda..."
                    rows={2}
                    className="w-full border-none focus:outline-none text-sm mb-3 resize-none"
                  />
                  <div className="flex gap-2 flex-wrap mb-3">
                    {SUGGESTED_TAGS.map((tag) => (
                      <Chip key={tag} label={`#${tag}`} selected={createTags.includes(tag)} onClick={() => setCreateTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))} />
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button onClick={retake} className="flex-1 border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-medium">
                  Refazer
                </button>
                <button
                  onClick={publishFromCreator}
                  disabled={uploadingPhoto || publishing || (creatorMode !== 'momento' && !createText.trim())}
                  className="flex-1 bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {uploadingPhoto ? 'Enviando...' : publishing ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          )}
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
            <div className="flex items-center gap-3">
              {viewingStory.authorId === userId && (
                <MoreVertical className="w-5 h-5 text-white cursor-pointer" onClick={() => setStoryMenuOpen((v) => !v)} />
              )}
              <X className="w-5 h-5 text-white cursor-pointer" onClick={() => { setViewingStory(null); setStoryMenuOpen(false); }} />
            </div>
          </div>

          {storyMenuOpen && (
            <div className="absolute inset-0 flex items-end justify-center" onClick={() => setStoryMenuOpen(false)}>
              <div className="bg-white rounded-t-2xl p-5 w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <button onClick={() => deleteStory(viewingStory.id)} className="flex items-center gap-3 py-3 text-sm text-rose-600 w-full text-left border-b border-gray-100">
                  <Trash2 className="w-[18px] h-[18px]" /> Apagar momento
                </button>
                <button onClick={openHideList} className="flex items-center gap-3 py-3 text-sm w-full text-left">
                  <Eye className="w-[18px] h-[18px] text-gray-600" /> Ocultar de alguém
                </button>
                <button onClick={() => setStoryMenuOpen(false)} className="w-full border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-medium mt-3">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            {viewingStory.mediaType === 'video' ? (
              <video src={viewingStory.mediaUrl} className="max-h-full max-w-full object-contain" controls autoPlay />
            ) : (
              <img src={viewingStory.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
            )}
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

      {hideListOpen && (
        <div className="absolute inset-0 bg-white flex flex-col p-5">
          <div className="flex items-center justify-between mb-4">
            <ChevronLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setHideListOpen(false)} />
            <span className="text-sm font-medium">Ocultar momentos de</span>
            <span className="w-5" />
          </div>
          <p className="text-xs text-gray-400 mb-4">Quem você marcar aqui não vê mais nenhum dos seus momentos futuros, até você desmarcar.</p>
          {conversations.length === 0 && <p className="text-xs text-gray-400 text-center py-8">Você ainda não tem matches pra ocultar.</p>}
          <div className="flex flex-col gap-1">
            {conversations.map((c) => {
              const isHidden = hiddenUserIds.includes(c.otherId || c.id);
              return (
                <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100">
                  <Avatar initials={c.name.slice(0, 2).toUpperCase()} intentKey={c.intentKey} />
                  <span className="flex-1 text-sm">{c.name}</span>
                  <button
                    onClick={() => toggleHidePerson(c.otherId || c.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${isHidden ? 'bg-rose-50 border-rose-300 text-rose-600' : 'border-gray-200 text-gray-500'}`}
                  >
                    {isHidden ? 'Ocultando' : 'Ocultar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sharingPulse && (
        <div className="absolute inset-0 flex items-end justify-center" onClick={() => { setSharingPulse(null); setShareSubview('main'); }}>
          <div className="bg-white rounded-t-2xl p-5 w-full max-h-[80%] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            {shareSubview === 'main' ? (
              <>
                <p className="text-sm font-medium mb-3">Compartilhar</p>
                <div className="flex flex-col gap-1 mb-3">
                  <button onClick={() => setShareSubview('matches')} className="flex items-center gap-3 py-2.5 border-b border-gray-100 text-left w-full">
                    <Send className="w-[18px] h-[18px] text-gray-600" />
                    <span className="text-sm">Enviar pra um match</span>
                  </button>
                  <button onClick={() => nativeShare(sharingPulse)} className="flex items-center gap-3 py-2.5 border-b border-gray-100 text-left w-full">
                    <Share2 className="w-[18px] h-[18px] text-gray-600" />
                    <span className="text-sm">Compartilhar (WhatsApp e outros)</span>
                  </button>
                  {sharingPulse.mediaUrl && (
                    <button onClick={() => repostAsMomento(sharingPulse)} className="flex items-center gap-3 py-2.5 border-b border-gray-100 text-left w-full">
                      <Plus className="w-[18px] h-[18px] text-gray-600" />
                      <span className="text-sm">Adicionar ao seu momento</span>
                    </button>
                  )}
                  <button onClick={copyPulseLink} className="flex items-center gap-3 py-2.5 border-b border-gray-100 text-left w-full">
                    <LinkIcon className="w-[18px] h-[18px] text-gray-600" />
                    <span className="text-sm">{shareCopied ? 'Copiado!' : 'Copiar link'}</span>
                  </button>
                  {sharingPulse.mediaUrl && (
                    <button onClick={() => downloadPulseMedia(sharingPulse)} className="flex items-center gap-3 py-2.5 text-left w-full">
                      <Download className="w-[18px] h-[18px] text-gray-600" />
                      <span className="text-sm">Baixar</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <ChevronLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setShareSubview('main')} />
                  <p className="text-sm font-medium">Enviar pra</p>
                </div>
                {conversations.length === 0 && <p className="text-xs text-gray-400 text-center py-8">Você ainda não tem matches pra enviar.</p>}
                <div className="flex flex-col gap-1 mb-3">
                  {conversations.map((c) => (
                    <button key={c.id} onClick={() => { shareToMatch(sharingPulse, c.id); setShareSubview('main'); }} className="flex items-center gap-3 py-2.5 border-b border-gray-100 text-left w-full">
                      <Avatar initials={c.name.slice(0, 2).toUpperCase()} intentKey={c.intentKey} />
                      <span className="flex-1 text-sm">{c.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <button onClick={() => { setSharingPulse(null); setShareSubview('main'); }} className="w-full border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {viewingOwnPulse && (
        <div className="absolute inset-0 bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => { setViewingOwnPulse(null); setPulseViewers(null); }} />
            <span className="text-sm font-medium">Pulse</span>
            {viewingOwnPulse.authorId === userId ? (
              <Trash2
                className="w-5 h-5 text-gray-400 cursor-pointer"
                onClick={() => { removeOwnPulse(viewingOwnPulse.id); setViewingOwnPulse(null); }}
              />
            ) : (
              <span className="w-5" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <Avatar initials={viewingOwnPulse.author.slice(0, 2).toUpperCase()} intentKey={viewingOwnPulse.intentKey} />
              <div>
                <p className="text-sm font-medium">{viewingOwnPulse.author}</p>
                <p className="text-xs text-gray-500">{viewingOwnPulse.time}</p>
              </div>
            </div>
            {viewingOwnPulse.hasPhoto && (
              <div className="w-full bg-gray-100 rounded-lg overflow-hidden mb-3" style={{ maxHeight: 400 }}>
                {viewingOwnPulse.mediaType === 'video' ? (
                  <video src={viewingOwnPulse.mediaUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={viewingOwnPulse.mediaUrl} alt="" className="w-full h-full object-contain" />
                )}
              </div>
            )}
            <p className="text-sm mb-3">{viewingOwnPulse.text}</p>
            <div className="flex gap-1.5 flex-wrap">
              {(viewingOwnPulse.tags || []).map((t) => (
                <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t}</span>
              ))}
            </div>

            {viewingOwnPulse.authorId === userId && viewingOwnPulse.mediaType === 'video' && (
              <div className="mt-4 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-medium">{viewingOwnPulse.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{pulseViewers ? pulseViewers.count : '...'}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">só você vê isso</span>
                </div>
                {pulseViewers?.viewers.slice(0, 5).map((v) => (
                  <p key={v.id} className="text-xs text-gray-600 py-0.5">{v.name}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewingProfile && (
        <div className="absolute inset-0 bg-white flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setViewingProfile(null)} />
            <span className="text-sm font-medium">{viewingProfile.loading ? '...' : viewingProfile.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {viewingProfileLoading ? (
              <p className="text-xs text-gray-400 text-center py-10">Carregando perfil...</p>
            ) : (
              <>
                <div className="text-center mb-4">
                  <Avatar initials={viewingProfile.name.slice(0, 2).toUpperCase()} intentKey={viewingProfile.intent} size="w-16 h-16 text-lg mx-auto mb-2" />
                  <p className="text-base font-medium">{viewingProfile.name}</p>
                  {viewingProfile.bio && <p className="text-xs text-gray-500 mt-1 max-w-[260px] mx-auto">{viewingProfile.bio}</p>}
                </div>

                <div className="flex justify-around py-3 mb-4 border-t border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-base font-medium">{viewingProfile.matchCount}</p>
                    <p className="text-[11px] text-gray-400">matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium">{viewingProfile.interests.length}</p>
                    <p className="text-[11px] text-gray-400">comunidades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium">{viewingProfile.mappedPulses.length}</p>
                    <p className="text-[11px] text-gray-400">pulses</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {viewingProfile.interests.map((i) => (
                    <span key={i.interest.name} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{i.interest.name}</span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {viewingProfile.mappedPulses.map((p) => (
                    <button key={p.id} onClick={() => openPulseDetail(p)} className="h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {p.mediaUrl ? (
                        p.mediaType === 'video' ? (
                          <video src={p.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <p className="text-[11px] text-gray-400 p-2 line-clamp-3 text-left">{p.text}</p>
                      )}
                    </button>
                  ))}
                  {viewingProfile.mappedPulses.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6 col-span-2">Ainda sem pulses.</p>
                  )}
                </div>
              </>
            )}
          </div>
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
