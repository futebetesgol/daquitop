'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const MENU = [
  ['⌂','Início'],['🏆','Ranking da Cidade'],['▰','Estabelecimentos'],['⌖','Explorar Cidade'],['🔎','Buscar Pessoas'],['🏪','Buscar Estabelecimentos'],['📣','Feed CIDARANK'],['✈','Mensagens'],['●','Perfil'],['⚙','Configurações'],['?','Suporte']
];

const OWNER_EMAIL = 'cidarankk@gmail.com';
const INSTAGRAM_HANDLE = '@cidarank';
const QUICK_EMOJIS = ['😀','❤️','🔥','👏','😂','😍'];

function isOwnerEmail(email=''){
  return String(email || '').trim().toLowerCase() === OWNER_EMAIL;
}

function isInstitutionalOwner(p){
  const role=String(p?.role||'').toLowerCase();
  const username=String(p?.username||'').trim().toLowerCase();
  return role==='owner' || username==='cidarank';
}
function sealTypeFor(p){
  const role=String(p?.role||'').toLowerCase();
  if(isInstitutionalOwner(p)) return 'owner';
  if(role==='admin'||role==='moderator') return 'admin';
  if(p?.account_type==='business') return 'business';
  if(p?.verified) return 'verified';
  return 'user';
}

const SEAL_COLORS={blue:['#8bc7ff','rgba(41,139,255,.16)','rgba(60,158,255,.42)'],green:['#8fffd4','rgba(22,208,142,.16)','rgba(73,236,181,.38)'],gold:['#ffd978','rgba(255,192,50,.16)','rgba(255,197,55,.42)'],purple:['#dcb2ff','rgba(181,82,255,.16)','rgba(193,104,255,.4)'],pink:['#ff9ce8','rgba(236,71,196,.16)','rgba(244,102,214,.4)'],red:['#ffaaaa','rgba(239,68,68,.16)','rgba(248,113,113,.42)'],cyan:['#82f3ff','rgba(34,211,238,.15)','rgba(103,232,249,.4)']};
function sealColorStyle(color='blue'){const c=SEAL_COLORS[color]||SEAL_COLORS.blue;return {color:c[0],background:c[1],borderColor:c[2]};}

const CATEGORIES = ['Restaurante','Pizzaria','Lanchonete','Hamburgueria','Padaria','Confeitaria','Açaiteria','Sorveteria','Bar','Cafeteria','Delivery','Mercado','Supermercado','Hortifruti','Farmácia','Academia','Salão de Beleza','Barbearia','Manicure / Estética','Loja de Roupas','Calçados','Eletrônicos','Informática','Celulares / Assistência','Móveis','Material de Construção','Autopeças','Oficina Mecânica','Lava-jato','Posto de Combustível','Pet Shop','Clínica','Dentista','Ótica','Papelaria','Hotel / Pousada','Turismo','Fotografia','Eventos','Educação','Serviços','Tecnologia','Construção','Automotivo','Lazer','Outros'];

function initials(name='U'){
  return String(name || 'U').trim().slice(0,1).toUpperCase();
}
function fmtDate(value){
  if(!value) return '';
  return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
}
function cleanUsername(value=''){
  return value.trim().replace(/^@/,'').toLowerCase().replace(/\s+/g,'');
}
function safeName(name='arquivo'){
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');
}
function locationKey(value=''){
  return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
function cityKey(value=''){
  return locationKey(value);
}
function stateKey(value=''){
  return locationKey(value);
}
function sameCity(a,b){
  return String(a?.city||'').toLowerCase()===String(b?.city||'').toLowerCase() && String(a?.state||'').toLowerCase()===String(b?.state||'').toLowerCase();
}

function Avatar({profile,name,size='md'}){
  const label=name || profile?.full_name || profile?.username || 'Usuário';
  const src=profile?.avatar_url;
  return <div className={`avatar ${size}`} title={label}>{src?<img src={src} alt={label}/>:initials(label)}</div>;
}

function Empty({title,children}){
  return <div className="emptyCard"><b>{title}</b>{children&&<span>{children}</span>}</div>;
}

export default function Home(){
  const [active,setActive]=useState('Início');
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [clockNow,setClockNow]=useState(Date.now());

  const [authMode,setAuthMode]=useState('login');
  const [authMessage,setAuthMessage]=useState('');
  const [authBusy,setAuthBusy]=useState(false);
  const [form,setForm]=useState({email:'',password:'',full_name:'',username:'',state:'',state_id:'',city:'',gender:''});
  const [states,setStates]=useState([]);
  const [cities,setCities]=useState([]);
  const [locationsBusy,setLocationsBusy]=useState(false);
  const [locationsError,setLocationsError]=useState('');

  const [posts,setPosts]=useState([]);
  const [postAuthors,setPostAuthors]=useState({});
  const [postBusinesses,setPostBusinesses]=useState({});
  const [likedPosts,setLikedPosts]=useState(new Set());
  const [daquitop_comments,setComments]=useState({});
  const [commentAuthors,setCommentAuthors]=useState({});
  const [commentDraft,setCommentDraft]=useState({});
  const [commentLikes,setCommentLikes]=useState(new Set());
  const [commentLikeCounts,setCommentLikeCounts]=useState({});
  const [replyingTo,setReplyingTo]=useState({});
  const [commentReplyDraft,setCommentReplyDraft]=useState({});
  const [postText,setPostText]=useState('');
  const [postFile,setPostFile]=useState(null);
  const [postPreview,setPostPreview]=useState('');
  const postFileRef=useRef(null);

  const [people,setPeople]=useState([]);
  const [following,setFollowing]=useState(new Set());
  const [selectedProfile,setSelectedProfile]=useState(null);
  const [profilePosts,setProfilePosts]=useState([]);
  const [profilePostAuthors,setProfilePostAuthors]=useState({});
  const [followModal,setFollowModal]=useState(null);
  const [followList,setFollowList]=useState([]);
  const [followSearch,setFollowSearch]=useState('');
  const [directorySearch,setDirectorySearch]=useState('');
  const [lastSeenCityFeed,setLastSeenCityFeed]=useState('');

  const [businesses,setBusinesses]=useState([]);
  const [selectedBusiness,setSelectedBusiness]=useState(null);
  const [businessReviews,setBusinessReviews]=useState([]);
  const [businessPosts,setBusinessPosts]=useState([]);
  const [businessPostAuthors,setBusinessPostAuthors]=useState({});
  const [reviewAuthors,setReviewAuthors]=useState({});
  const [businessForm,setBusinessForm]=useState({name:'',username:'',category:'',description:'',address:'',whatsapp:'',website:''});
  const [businessEdit,setBusinessEdit]=useState(null);
  const [reviewForm,setReviewForm]=useState({rating:5,comment:''});
  const [businessPostText,setBusinessPostText]=useState('');
  const [businessPostFile,setBusinessPostFile]=useState(null);
  const [businessPostPreview,setBusinessPostPreview]=useState('');
  const businessPostFileRef=useRef(null);
  const [profileAwards,setProfileAwards]=useState([]);
  const [profileRankPositions,setProfileRankPositions]=useState({popular:null,week:null,month:null,year:null});

  const [settings,setSettings]=useState({full_name:'',username:'',bio:'',activity:'',public_phone:'',website:'',gender:'',avatar_url:'',cover_url:''});
  const [avatarUploading,setAvatarUploading]=useState(false);
  const [coverUploading,setCoverUploading]=useState(false);

  const [exploreStateId,setExploreStateId]=useState('');
  const [exploreState,setExploreState]=useState('');
  const [exploreCities,setExploreCities]=useState([]);
  const [exploreCity,setExploreCity]=useState('');
  const [exploreData,setExploreData]=useState({posts:[],authors:{},postBusinesses:{},businesses:[],people:[],votes:[]});
  const [exploreBusy,setExploreBusy]=useState(false);
  const [explorePostText,setExplorePostText]=useState('');
  const [exploreRankView,setExploreRankView]=useState('week');

  const [daquitop_messages,setMessages]=useState([]);
  const [messagePeople,setMessagePeople]=useState({});
  const [selectedChat,setSelectedChat]=useState(null);
  const [messageText,setMessageText]=useState('');
  const [personalNotifications,setPersonalNotifications]=useState([]);
  const [notificationActors,setNotificationActors]=useState({});
  const [mentionSearch,setMentionSearch]=useState('');
  const [mentionResults,setMentionResults]=useState([]);
  const [mentionBusy,setMentionBusy]=useState(false);
  const [mentionPickerOpen,setMentionPickerOpen]=useState(false);

  const [tickets,setTickets]=useState([]);
  const [supportForm,setSupportForm]=useState({category:'duvida',subject:'',message:'',image:null});

  const [siteBanner,setSiteBanner]=useState('/cidarank-national-banner.png');
  const DEFAULT_PODIUM_BANNER='/cidarank-podium-bg.webp';
  const [sitePodiumBanner,setSitePodiumBanner]=useState(DEFAULT_PODIUM_BANNER);
  const [rankPodiumBanners,setRankPodiumBanners]=useState({city:DEFAULT_PODIUM_BANNER,week:DEFAULT_PODIUM_BANNER,month:DEFAULT_PODIUM_BANNER,year:DEFAULT_PODIUM_BANNER,state:DEFAULT_PODIUM_BANNER,brazil:DEFAULT_PODIUM_BANNER});
  const [ownerTab,setOwnerTab]=useState('dashboard');
  const [ownerUsers,setOwnerUsers]=useState([]);
  const [ownerTickets,setOwnerTickets]=useState([]);
  const [ownerBusinesses,setOwnerBusinesses]=useState([]);
  const [ownerBusy,setOwnerBusy]=useState(false);
  const [ownerReply,setOwnerReply]=useState({});
  const [ownerPresence,setOwnerPresence]=useState([]);
  const [ownerLogs,setOwnerLogs]=useState([]);
  const [ownerReports,setOwnerReports]=useState([]);
  const [ownerVotes,setOwnerVotes]=useState([]);
  const [ownerSearch,setOwnerSearch]=useState('');
  const [ownerCityFilter,setOwnerCityFilter]=useState('');
  const [ownerStateFilter,setOwnerStateFilter]=useState('');
  const [ownerStateId,setOwnerStateId]=useState('');
  const [ownerCities,setOwnerCities]=useState([]);
  const [ownerLocationBusy,setOwnerLocationBusy]=useState(false);
  const [ownerRankingPeriod,setOwnerRankingPeriod]=useState('city');
  const [ownerInviteEmail,setOwnerInviteEmail]=useState('');
  const [ownerSupportStatus,setOwnerSupportStatus]=useState('all');
  const [ownerReportStatus,setOwnerReportStatus]=useState('all');
  const [ownerGlobalSearch,setOwnerGlobalSearch]=useState('');
  const [popularView,setPopularView]=useState('city');
  const [rankMenuOpen,setRankMenuOpen]=useState(false);
  const [homeRankView,setHomeRankView]=useState('week');
  const [ownerLiveEvents,setOwnerLiveEvents]=useState([]);
  const [ownerRealtimeConnected,setOwnerRealtimeConnected]=useState(false);
  const [ownerHealth,setOwnerHealth]=useState({database:'checking',auth:'ok',realtime:'checking',lastCheck:null});
  const [supportMessages,setSupportMessages]=useState([]);
  const [ownerSupportMessages,setOwnerSupportMessages]=useState([]);
  const [announcements,setAnnouncements]=useState([]);
  const [ownerAnnouncement,setOwnerAnnouncement]=useState({title:'',message:'',kind:'novidade',scope:'brasil',state:'',city:'',show_popup:true,active:true});
  const [auditOpen,setAuditOpen]=useState(null);
  const [ownerPublicProfile,setOwnerPublicProfile]=useState(null);
  const [ownerPublicPosts,setOwnerPublicPosts]=useState([]);
  const [ownerPublicAuthors,setOwnerPublicAuthors]=useState({});
  const [expansionRows,setExpansionRows]=useState([]);
  const [expansionStateId,setExpansionStateId]=useState('');
  const [expansionState,setExpansionState]=useState('');
  const [expansionCities,setExpansionCities]=useState([]);
  const [expansionBusy,setExpansionBusy]=useState(false);
  const [postingPaused,setPostingPaused]=useState(false);
  const [waitlistCount,setWaitlistCount]=useState(0);

  const [competitionType,setCompetitionType]=useState('week');
  const [competitionVotes,setCompetitionVotes]=useState([]);
  const [scopeRanking,setScopeRanking]=useState([]);
  const [scopeRankingBusy,setScopeRankingBusy]=useState(false);

  const [search,setSearch]=useState('');

  useEffect(()=>{
    if(!profile || !['state','brazil'].includes(popularView)) return;
    loadScopePopular(popularView);
  },[popularView,profile?.state]);

  const displayName=profile?.full_name || session?.user?.email?.split('@')[0] || 'Usuário';
  const cityLabel=profile?.city && profile?.state ? `${profile.city} - ${profile.state}` : 'Sua cidade';
  const heroTitle=cityLabel.toUpperCase();
  const isOwner=isOwnerEmail(session?.user?.email);
  const isAdmin=isOwner || ['owner','admin','moderator'].includes(String(profile?.role||'').toLowerCase());
  const menuItems=isAdmin?[...MENU,[isOwner?'♛':'🛡️',isOwner?'Painel do Dono':'Administração']]:MENU;

  useEffect(()=>{
    let alive=true;
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(r=>{if(!r.ok) throw new Error();return r.json()})
      .then(data=>{if(alive)setStates(data||[])})
      .catch(()=>{if(alive)setLocationsError('Não foi possível carregar estados e cidades do IBGE.')});
    return()=>{alive=false};
  },[]);

  useEffect(()=>{
    let mounted=true;
    supabase.auth.getSession().then(({data})=>{
      if(!mounted)return;
      setSession(data.session||null);
      if(!data.session)setLoading(false);
    });
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{
      setSession(next||null);
      if(!next){
        setProfile(null); setLoading(false); setActive('Início');
      }
    });
    return()=>{mounted=false;listener.subscription.unsubscribe()};
  },[]);

  useEffect(()=>{
    if(session?.user?.id) bootstrap(session.user.id);
  },[session?.user?.id]);


  useEffect(()=>{
    if(!session?.user?.id)return;
    let stopped=false;
    async function heartbeat(){
      if(stopped)return;
      try{
        await supabase.from('cidarank_user_presence').upsert({
          user_id:session.user.id,
          last_seen:new Date().toISOString(),
          page:active,
          city:profile?.city||null,
          state:profile?.state||null
        },{onConflict:'user_id'});
      }catch{}
    }
    heartbeat();
    const timer=setInterval(heartbeat,45000);
    return()=>{stopped=true;clearInterval(timer)};
  },[session?.user?.id,active,profile?.city,profile?.state]);

  useEffect(()=>{
    if(!isAdmin)return;
    const channel=supabase.channel('cidarank-owner-live')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'businesses'},payload=>pushOwnerLive('Novo estabelecimento',payload.new))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'daquitop_support_tickets'},payload=>pushOwnerLive('Novo chamado',payload.new))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'profiles'},payload=>pushOwnerLive('Novo usuário',payload.new))
      .subscribe(status=>setOwnerRealtimeConnected(status==='SUBSCRIBED'));
    return()=>{supabase.removeChannel(channel);setOwnerRealtimeConnected(false)};
  },[isAdmin]);

  function pushOwnerLive(type,row){
    setOwnerLiveEvents(v=>[{id:`${Date.now()}-${Math.random()}`,type,row,at:new Date().toISOString()},...v].slice(0,60));
  }

  useEffect(()=>{
    if(!session?.user?.id)return;
    const channel=supabase.channel(`cidarank-personal-notifications-${session.user.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'cidarank_notifications',filter:`recipient_id=eq.${session.user.id}`},()=>loadPersonalNotifications(session.user.id))
      .subscribe();
    return()=>{supabase.removeChannel(channel)};
  },[session?.user?.id]);

  async function handleStateChange(e){
    const id=e.target.value;
    const item=states.find(x=>String(x.id)===String(id));
    setForm(v=>({...v,state_id:id,state:item?.sigla||'',city:''}));
    setCities([]); setLocationsError('');
    if(!id)return;
    setLocationsBusy(true);
    try{
      const r=await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${id}/municipios?orderBy=nome`);
      if(!r.ok)throw new Error();
      setCities(await r.json());
    }catch{setLocationsError('Não foi possível carregar as cidades desse estado.');}
    setLocationsBusy(false);
  }

  async function handleExploreState(e){
    const id=e.target.value;
    const item=states.find(x=>String(x.id)===String(id));
    setExploreStateId(id); setExploreState(item?.sigla||''); setExploreCity(''); setExploreCities([]);
    if(!id)return;
    setExploreBusy(true);
    try{
      const r=await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${id}/municipios?orderBy=nome`);
      setExploreCities(r.ok?await r.json():[]);
    }finally{setExploreBusy(false)}
  }

  async function handleOwnerStateChange(e){
    const id=e.target.value;
    const item=states.find(x=>String(x.id)===String(id));
    setOwnerStateId(id);
    setOwnerStateFilter(item?.sigla||'');
    setOwnerCityFilter('');
    setOwnerCities([]);
    if(!id)return;
    setOwnerLocationBusy(true);
    try{
      const r=await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${id}/municipios?orderBy=nome`);
      if(!r.ok)throw new Error('IBGE indisponível');
      setOwnerCities(await r.json());
    }catch{
      setOwnerCities([]);
      setNotice('Não foi possível carregar as cidades do IBGE agora. Tente novamente.');
    }finally{setOwnerLocationBusy(false)}
  }


  async function ownerSearchNationalUsers(){
    if(!isAdmin)return;
    setOwnerBusy(true);
    try{
      const {data,error}=await supabase.rpc('cidarank_owner_search_users',{
        p_state:ownerStateFilter||null,
        p_city:ownerCityFilter||null,
        p_query:ownerSearch.trim()||null
      });
      if(error)throw error;
      setOwnerUsers(Array.isArray(data)?data:[]);
      const where=ownerStateFilter?(ownerCityFilter?`${ownerCityFilter} - ${ownerStateFilter}`:`Estado ${ownerStateFilter}`):'Brasil inteiro';
      setNotice(`Pesquisa nacional concluída: ${Array.isArray(data)?data.length:0} usuário(s) em ${where}.`);
    }catch(e){
      console.error('Busca nacional de usuários:',e);
      setNotice(`Não foi possível pesquisar os usuários: ${e.message}. Execute o SQL da V6.14.5 no Supabase.`);
    }finally{setOwnerBusy(false)}
  }

  function ownerSaveNationalScope(){
    try{
      localStorage.setItem('cidarank_owner_user_scope',JSON.stringify({stateId:ownerStateId,state:ownerStateFilter,city:ownerCityFilter}));
      setNotice(`Filtro salvo: ${ownerStateFilter?(ownerCityFilter?`${ownerCityFilter} - ${ownerStateFilter}`:`Estado ${ownerStateFilter}`):'Brasil inteiro'}.`);
    }catch{
      setNotice('Não foi possível salvar este filtro neste navegador.');
    }
  }

  async function bootstrap(userId){
    setLoading(true); setNotice('');
    let {data:p,error}=await supabase.from('profiles').select('*').eq('id',userId).maybeSingle();
    if(error || !p){
      // Uma segunda tentativa evita falso erro em transições rápidas de autenticação/RLS.
      const retry=await supabase.from('profiles').select('*').eq('id',userId).maybeSingle();
      if(retry.data){p=retry.data;error=null;}
    }
    if(error || !p){
      if(isOwnerEmail(session?.user?.email)){
        // Modo seguro do DONO: não altera o cadastro no banco. Apenas mantém o painel e o portal utilizáveis.
        p={id:userId,full_name:'CIDARANK',username:'cidarank',role:'owner',verified:true,seal_color:'gold',city:'Redenção',state:'CE',avatar_url:session?.user?.user_metadata?.avatar_url||null};
        setNotice('Perfil do dono carregado em modo seguro. A cidade de cadastro não foi alterada.');
      }else{
        setNotice('Não foi possível carregar seu perfil.');setLoading(false);return;
      }
    }
    let current=p;
    const metadataGender=session?.user?.user_metadata?.gender||'';
    if(metadataGender && !current.gender){
      const {data:updated}=await supabase.from('profiles').update({gender:metadataGender}).eq('id',userId).select('*').maybeSingle();
      if(updated)current=updated;
    }
    setProfile(current);
    syncSettings(current);
    await Promise.all([
      loadCity(current.city,current.state),
      loadFollowing(userId),
      loadMessages(userId),
      loadTickets(userId),
      loadCompetitions(current.city,current.state),
      loadSiteSettings(),
      loadAnnouncements(),
      loadSupportMessages(userId),
      loadOwnerPublicFeed(),
      loadPersonalNotifications(userId)
    ]);
    if(isOwnerEmail(session?.user?.email) || ['owner','admin'].includes(String(current?.role||'').toLowerCase())){
      await loadOwnerData();
    }
    if(current?.is_suspended && !isOwnerEmail(session?.user?.email)){
      await supabase.auth.signOut();
      setAuthMessage('Esta conta está suspensa. Entre em contato com o suporte do CIDARANK.');
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  function syncSettings(p){
    setSettings({
      full_name:p?.full_name||'',username:p?.username||'',bio:p?.bio||'',activity:p?.activity||'',
      public_phone:p?.public_phone||'',website:p?.website||'',gender:p?.gender||'',avatar_url:p?.avatar_url||'',cover_url:p?.cover_url||''
    });
  }

  async function fetchAllCityProfiles(city,state){
    const all=[]; const pageSize=1000; let from=0;
    while(true){
      const {data,error}=await supabase.from('profiles').select('*')
        .eq('city_key',cityKey(city)).eq('state_key',stateKey(state))
        .order('followers_count',{ascending:false}).range(from,from+pageSize-1);
      if(error){console.error('Erro ao carregar perfis da cidade:',error);break}
      const batch=data||[]; all.push(...batch);
      if(batch.length<pageSize)break;
      from+=pageSize;
      if(from>=50000)break;
    }
    return all;
  }

  async function loadCity(city,state){
    if(!city||!state)return;
    const [peopleData,{data:businessData}]=await Promise.all([
      fetchAllCityProfiles(city,state),
      supabase.from('businesses').select('*').eq('city_key',cityKey(city)).eq('state_key',stateKey(state)).order('rating_average',{ascending:false}).order('reviews_count',{ascending:false}).limit(100)
    ]);
    const cleanPeople=(peopleData||[]).filter(x=>x.account_type!=='business');
    setPeople(cleanPeople);
    setBusinesses(businessData||[]);
    await loadPosts(city,state);
  }

  async function hydratePosts(rawPosts){
    const list=rawPosts||[];
    const authorIds=[...new Set(list.map(x=>x.author_id).filter(Boolean))];
    const businessIds=[...new Set(list.map(x=>x.business_id).filter(Boolean))];
    let authors={}; let biz={}; let likes=new Set(); let grouped={}; let cAuthors={}; let cLikes=new Set(); let cLikeCounts={};
    if(authorIds.length){
      const {data}=await supabase.from('profiles').select('*').in('id',authorIds);
      authors=Object.fromEntries((data||[]).map(x=>[x.id,x]));
    }
    if(businessIds.length){
      const {data}=await supabase.from('businesses').select('*').in('id',businessIds);
      biz=Object.fromEntries((data||[]).map(x=>[x.id,x]));
    }
    const ids=list.map(x=>x.id);
    if(ids.length && session?.user?.id){
      const [{data:likeData},{data:commentData}]=await Promise.all([
        supabase.from('daquitop_post_likes').select('post_id').eq('user_id',session.user.id).in('post_id',ids),
        supabase.from('daquitop_comments').select('*').in('post_id',ids).order('created_at',{ascending:true})
      ]);
      likes=new Set((likeData||[]).map(x=>x.post_id));
      const allComments=commentData||[];
      const caIds=[...new Set(allComments.map(x=>x.author_id).filter(Boolean))];
      if(caIds.length){
        const {data}=await supabase.from('profiles').select('id,full_name,username,avatar_url,verified,role,account_type,seal_color,city,state').in('id',caIds);
        cAuthors=Object.fromEntries((data||[]).map(x=>[x.id,x]));
      }
      const commentIds=allComments.map(c=>c.id).filter(Boolean);
      if(commentIds.length){
        const [{data:myCommentLikes},{data:allCommentLikes}]=await Promise.all([
          supabase.from('daquitop_comment_likes').select('comment_id').eq('user_id',session.user.id).in('comment_id',commentIds),
          supabase.from('daquitop_comment_likes').select('comment_id').in('comment_id',commentIds)
        ]);
        cLikes=new Set((myCommentLikes||[]).map(x=>x.comment_id));
        for(const row of (allCommentLikes||[])) cLikeCounts[row.comment_id]=(cLikeCounts[row.comment_id]||0)+1;
      }
      for(const c of allComments){(grouped[c.post_id] ||= []).push(c)}
    }
    return {list,authors,biz,likes,grouped,cAuthors,cLikes,cLikeCounts};
  }

  async function loadPosts(city,state){
    const {data}=await supabase.from('posts').select('*').eq('is_hidden',false).eq('city_key',cityKey(city)).eq('state_key',stateKey(state)).order('created_at',{ascending:false}).limit(50);
    const h=await hydratePosts(data||[]);
    setPosts(h.list); setPostAuthors(h.authors); setPostBusinesses(h.biz); setLikedPosts(h.likes); setComments(h.grouped); setCommentAuthors(h.cAuthors); setCommentLikes(h.cLikes||new Set()); setCommentLikeCounts(h.cLikeCounts||{});
  }

  async function loadFollowing(userId){
    const {data}=await supabase.from('daquitop_follows').select('following_id').eq('follower_id',userId);
    setFollowing(new Set((data||[]).map(x=>x.following_id)));
  }

  async function loadMessages(userId){
    const {data}=await supabase.from('daquitop_messages').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at',{ascending:true}).limit(500);
    const list=data||[]; setMessages(list);
    const ids=[...new Set(list.flatMap(x=>[x.sender_id,x.recipient_id]).filter(id=>id!==userId))];
    if(ids.length){
      const {data:p}=await supabase.from('profiles').select('*').in('id',ids);
      setMessagePeople(Object.fromEntries((p||[]).map(x=>[x.id,x])));
    }else setMessagePeople({});
  }

  async function loadTickets(userId){
    const {data}=await supabase.from('daquitop_support_tickets').select('*').eq('user_id',userId).order('created_at',{ascending:false});
    setTickets(data||[]);
  }

  async function loadSupportMessages(userId){
    const {data}=await supabase.from('cidarank_support_messages').select('*').eq('user_id',userId).order('created_at',{ascending:true});
    setSupportMessages(data||[]);
  }

  async function loadOwnerPublicFeed(){
    const {data:op}=await supabase.from('profiles').select('*').eq('username','cidarank').maybeSingle();
    if(!op){setOwnerPublicProfile(null);setOwnerPublicPosts([]);return}
    setOwnerPublicProfile(op);
    const {data:raw}=await supabase.from('posts').select('*').eq('is_hidden',false).eq('author_id',op.id).order('created_at',{ascending:false}).limit(50);
    const h=await hydratePosts(raw||[]);setOwnerPublicPosts(h.list);setOwnerPublicAuthors(h.authors);
  }

  async function loadAnnouncements(){
    const {data}=await supabase.from('cidarank_announcements').select('*').eq('active',true).order('created_at',{ascending:false}).limit(20);
    setAnnouncements(data||[]);
  }

  async function loadCompetitions(city,state){
    if(!city||!state)return;
    const all=[]; const pageSize=1000; let from=0;
    const startOfYear=new Date(new Date().getFullYear(),0,1).toISOString();
    while(true){
      const {data,error}=await supabase.from('daquitop_competition_votes').select('*')
        .eq('city_key',cityKey(city)).eq('state_key',stateKey(state))
        .gte('created_at',startOfYear).order('created_at',{ascending:true})
        .range(from,from+pageSize-1);
      if(error){console.error('Erro ao carregar ranking:',error);break}
      const batch=data||[]; all.push(...batch);
      if(batch.length<pageSize)break;
      from+=pageSize;
      if(from>=100000)break;
    }
    setCompetitionVotes(all);
  }

  async function loadScopePopular(scope){
    if(!profile)return;
    setScopeRankingBusy(true);
    const {data,error}=await supabase.rpc('cidarank_popular_scope',{
      p_scope:scope,
      p_state_key:scope==='state'?stateKey(profile.state):null,
      p_limit:2000
    });
    if(error){
      console.error('Erro ranking estadual/nacional:',error);
      setScopeRanking([]);
      setNotice('Não foi possível carregar este ranking agora.');
    }else{
      setScopeRanking(Array.isArray(data)?data:[]);
    }
    setScopeRankingBusy(false);
  }

  async function loadSiteSettings(){
    try{
      const visualKeys=['posting_paused','national_banner','national_podium_banner','podium_banner_city','podium_banner_week','podium_banner_month','podium_banner_year','podium_banner_state','podium_banner_brazil'];
      const {data,error}=await supabase.from('cidarank_site_settings').select('key,value').in('key',visualKeys);
      if(!error){
        const map=Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
        if(map.national_banner)setSiteBanner(map.national_banner);
        setPostingPaused(String(map.posting_paused||'false')==='true');
        const legacy=map.national_podium_banner||DEFAULT_PODIUM_BANNER;
        setSitePodiumBanner(legacy);
        setRankPodiumBanners({
          city:map.podium_banner_city||legacy,
          week:map.podium_banner_week||legacy,
          month:map.podium_banner_month||legacy,
          year:map.podium_banner_year||legacy,
          state:map.podium_banner_state||legacy,
          brazil:map.podium_banner_brazil||legacy
        });
      }
    }catch(e){
      console.warn('Configurações visuais ainda não disponíveis:',e?.message||e);
    }
  }

  async function loadExpansionData(){
    if(!isOwner)return;
    const {data,error}=await supabase.from('cidarank_city_expansion').select('*').order('state').order('city');
    if(!error)setExpansionRows(data||[]);
    const {count}=await supabase.from('cidarank_city_waitlist').select('*',{count:'exact',head:true});
    setWaitlistCount(count||0);
  }

  async function handleExpansionStateChange(e){
    const id=e.target.value; setExpansionStateId(id); setExpansionCities([]);
    const st=states.find(x=>String(x.id)===String(id)); setExpansionState(st?.sigla||'');
    if(!id)return; setExpansionBusy(true);
    try{const r=await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${id}/municipios?orderBy=nome`);setExpansionCities(await r.json())}catch{setExpansionCities([])}
    setExpansionBusy(false);
  }

  async function ownerSetCityOpen(city,open){
    if(!isOwner||!expansionState||!city)return;
    const payload={state:expansionState,state_key:stateKey(expansionState),city,city_key:cityKey(city),is_open:open,updated_by:session.user.id,updated_at:new Date().toISOString()};
    const {error}=await supabase.from('cidarank_city_expansion').upsert(payload,{onConflict:'state_key,city_key'});
    if(error){alert(error.message);return;}
    await logAdminAction(open?'city_opened':'city_closed','city',null,payload); await loadExpansionData();
  }

  async function ownerSetStateOpen(open){
    if(!isOwner||!expansionState||!expansionCities.length)return;
    if(!confirm(`${open?'ATIVAR':'PAUSAR'} todas as ${expansionCities.length} cidades de ${expansionState}?`))return;
    setExpansionBusy(true);
    const rows=expansionCities.map(c=>({state:expansionState,state_key:stateKey(expansionState),city:c.nome,city_key:cityKey(c.nome),is_open:open,updated_by:session.user.id,updated_at:new Date().toISOString()}));
    const {error}=await supabase.from('cidarank_city_expansion').upsert(rows,{onConflict:'state_key,city_key'});
    setExpansionBusy(false); if(error){alert(error.message);return;} await loadExpansionData();
  }

  async function ownerTogglePostingPause(){
    if(!isOwner)return; const next=!postingPaused;
    const {error}=await supabase.from('cidarank_site_settings').upsert({key:'posting_paused',value:String(next),updated_by:session.user.id,updated_at:new Date().toISOString()},{onConflict:'key'});
    if(error){alert(error.message);return;} setPostingPaused(next); await logAdminAction(next?'posting_paused':'posting_resumed');
  }

  async function ownerDeleteResolvedTickets(){
    if(!isAdmin||!confirm('Excluir TODOS os chamados resolvidos e o histórico de mensagens deles?'))return;
    const {data,error}=await supabase.rpc('cidarank_staff_clear_resolved_support');
    if(error){alert(`Não foi possível limpar os resolvidos: ${error.message}`);return;}
    setNotice(`${Number(data||0)} chamado(s) resolvido(s) removido(s).`);
    await loadOwnerData();
  }

  async function ownerDeleteTicket(ticket){
    if(!isAdmin||!ticket?.id)return;
    if(!confirm(`Excluir definitivamente o chamado "${ticket.subject||'sem título'}" e todo o histórico dele?`))return;
    const {error}=await supabase.rpc('cidarank_staff_delete_support_ticket',{p_ticket_id:ticket.id});
    if(error){alert(`Não foi possível excluir: ${error.message}`);return;}
    setNotice('Chamado e histórico excluídos com sucesso.');
    await loadOwnerData();
  }

  async function loadOwnerData(){
    const ownerNow=isOwnerEmail(session?.user?.email);
    const adminNow=ownerNow || ['owner','admin','moderator'].includes(String(profile?.role||'').toLowerCase());
    if(!adminNow)return;
    setOwnerBusy(true);
    try{
      const [u,t,b,pr,lg,rp,vt,sm]=await Promise.all([
        supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(5000),
        supabase.from('daquitop_support_tickets').select('*').order('created_at',{ascending:false}).limit(1000),
        supabase.from('businesses').select('*').order('created_at',{ascending:false}).limit(5000),
        supabase.from('cidarank_user_presence').select('*').order('last_seen',{ascending:false}).limit(5000),
        supabase.from('cidarank_admin_logs').select('*').order('created_at',{ascending:false}).limit(1000),
        supabase.from('cidarank_reports').select('*').order('created_at',{ascending:false}).limit(1000),
        supabase.from('daquitop_competition_votes').select('*').order('created_at',{ascending:false}).limit(10000),
        supabase.from('cidarank_support_messages').select('*').order('created_at',{ascending:true}).limit(5000)
      ]);
      setOwnerUsers(u.data||[]); setOwnerTickets(t.data||[]); setOwnerBusinesses(b.data||[]);
      setOwnerPresence(pr.data||[]); setOwnerLogs(lg.data||[]); setOwnerReports(rp.data||[]); setOwnerVotes(vt.data||[]); setOwnerSupportMessages(sm.data||[]);
      const userIds=[...new Set([...(t.data||[]).map(x=>x.user_id),...(lg.data||[]).flatMap(x=>[x.actor_id,x.target_user_id])].filter(Boolean))];
      if(userIds.length){
        const {data:ticketPeople}=await supabase.from('profiles').select('id,full_name,username,avatar_url,city,state,city_key,state_key,role,verified,seal_color').in('id',userIds);
        setMessagePeople(v=>({...v,...Object.fromEntries((ticketPeople||[]).map(x=>[x.id,x]))}));
      }
      if(ownerNow)await loadExpansionData();
      setOwnerHealth({database:'ok',auth:session?.user?'ok':'error',realtime:ownerRealtimeConnected?'ok':'waiting',lastCheck:new Date().toISOString()});
    }catch(e){
      console.error(e);
      setOwnerHealth(v=>({...v,database:'error',lastCheck:new Date().toISOString()}));
      setNotice('Alguns dados administrativos não puderam ser carregados. Execute o SQL da V6 no Supabase.');
    }
    setOwnerBusy(false);
  }

  async function logAdminAction(action,targetType='system',targetId=null,details={}){
    if(!isAdmin||!session?.user?.id)return;
    try{await supabase.from('cidarank_admin_logs').insert({actor_id:session.user.id,action,target_type:targetType,target_id:targetId,details});}catch{}
  }

  async function ownerToggleBusiness(b,field){
    if(!isAdmin||!b?.id)return;
    const payload={updated_at:new Date().toISOString()};
    if(field==='verified')payload.verified=!Boolean(b.verified);
    if(field==='is_suspended')payload.is_suspended=!Boolean(b.is_suspended);
    const {error}=await supabase.from('businesses').update(payload).eq('id',b.id);
    if(error){alert(error.message);return}
    await logAdminAction(`business_${field}`, 'business', b.id, payload);
    await loadOwnerData();
  }

  async function ownerResolveReport(r,status='resolved'){
    if(!isAdmin||!r?.id)return;
    const {error}=await supabase.from('cidarank_reports').update({status,resolved_by:session.user.id,resolved_at:new Date().toISOString()}).eq('id',r.id);
    if(error){alert(error.message);return}
    await logAdminAction('report_status','report',r.id,{status});
    await loadOwnerData();
  }


  async function changeNationalBanner(file){
    if(!file || !isOwner)return;
    setOwnerBusy(true);
    try{
      const url=await uploadMedia(file,'national-banner');
      const {error}=await supabase.from('cidarank_site_settings').upsert({
        key:'national_banner',
        value:url,
        updated_by:session.user.id,
        updated_at:new Date().toISOString()
      },{onConflict:'key'});
      if(error)throw error;
      setSiteBanner(url);
      await logAdminAction('banner_updated','site','national_banner',{url});
      setNotice('Banner nacional do CIDARANK atualizado para todo o site.');
    }catch(e){
      alert(`Não foi possível trocar o banner: ${e.message}`);
    }
    setOwnerBusy(false);
  }

  async function changeRankPodiumBanner(file,rankKey){
    if(!file || !isOwner || !['city','week','month','year','state','brazil'].includes(rankKey))return;
    setOwnerBusy(true);
    try{
      const url=await uploadMedia(file,`podium-${rankKey}`);
      const settingKey=`podium_banner_${rankKey}`;
      const {error}=await supabase.from('cidarank_site_settings').upsert({
        key:settingKey,
        value:url,
        updated_by:session.user.id,
        updated_at:new Date().toISOString()
      },{onConflict:'key'});
      if(error)throw error;
      setRankPodiumBanners(v=>({...v,[rankKey]:url}));
      await logAdminAction('podium_banner_updated','site',settingKey,{rankKey,url});
      const labels={city:'Popular da Cidade',week:'Semanal',month:'Mensal',year:'Anual',state:'Estado',brazil:'Brasil'};
      setNotice(`Banner ${labels[rankKey]} atualizado para todas as cidades.`);
    }catch(e){
      alert(`Não foi possível trocar o banner deste ranking: ${e.message}`);
    }
    setOwnerBusy(false);
  }

  function bannerForRank(rankKey){
    return rankPodiumBanners?.[rankKey]||sitePodiumBanner||DEFAULT_PODIUM_BANNER;
  }

  async function ownerToggleUser(user,field){
    if(!isAdmin || !user?.id)return;
    if(user.id===session.user.id && (field==='is_suspended' || field==='role')){
      alert('Por segurança, você não pode suspender nem remover o próprio acesso de dono.');
      return;
    }
    const payload={updated_at:new Date().toISOString()};
    if(field==='verified')payload.verified=!Boolean(user.verified);
    if(field==='is_suspended')payload.is_suspended=!Boolean(user.is_suspended);
    if(field==='role')payload.role=String(user.role||'').toLowerCase()==='admin'?'user':'admin';
    const {error}=await supabase.from('profiles').update(payload).eq('id',user.id);
    if(error){alert(`Não foi possível atualizar o usuário: ${error.message}`);return}
    await logAdminAction(`user_${field}`,'user',user.id,payload);
    await loadOwnerData();
  }

  async function ownerSetSealColor(user,color){
    if(!isAdmin||!user?.id)return;
    const safe=SEAL_COLORS[color]?color:'blue';
    const {error}=await supabase.from('profiles').update({seal_color:safe,verified:true,updated_at:new Date().toISOString()}).eq('id',user.id);
    if(error){alert(`Não foi possível trocar a cor do selo: ${error.message}`);return;}
    await logAdminAction('user_seal_color_changed','user',user.id,{seal_color:safe});
    await loadOwnerData();
  }

  async function ownerGrantAdminByEmail(){
    if(!isOwner)return;
    const email=String(ownerInviteEmail||'').trim().toLowerCase();
    if(!email || !email.includes('@')){alert('Digite um e-mail válido.');return;}
    setOwnerBusy(true);
    const {data,error}=await supabase.rpc('cidarank_set_admin_by_email',{p_email:email});
    setOwnerBusy(false);
    if(error){alert(`Não foi possível adicionar o administrador: ${error.message}`);return;}
    setOwnerInviteEmail('');
    await logAdminAction('admin_granted_by_email','user',data||null,{email});
    await loadOwnerData();
    setNotice('Administrador adicionado com sucesso.');
  }

  function Seal({type='user',color='blue'}){
    const map={
      owner:{label:'Dono CIDARANK',symbol:'★'},
      admin:{label:'Administrador CIDARANK',symbol:'★'},
      verified:{label:'Perfil verificado pelo CIDARANK',symbol:'✓'},
      user:{label:'Usuário',symbol:''},
      business:{label:'Estabelecimento CIDARANK',symbol:'★'}
    };
    const item=map[type]||map.user;
    if(type==='user') return null;
    return <span className={`roleSeal sealMedal ${type}`} style={type==='verified'?sealColorStyle(color):undefined} title={item.label} aria-label={item.label}><span className="sealMedalCore">{item.symbol}</span><span className="sealRibbon left"/><span className="sealRibbon right"/></span>;
  }

  async function ownerDeletePost(post){
    if(!isAdmin||!post?.id)return;
    if(!confirm('Excluir esta publicação do CIDARANK?'))return;
    const {error}=await supabase.from('posts').delete().eq('id',post.id);
    if(error){alert(`Não foi possível excluir: ${error.message}`);return}
    await logAdminAction('post_deleted','post',post.id,{city:post.city,state:post.state,content:post.content||''});
    await Promise.all([loadOwnerData(),loadPosts(profile.city,profile.state)]);
    setNotice('Publicação removida pelo painel do dono.');
  }

  async function ownerAssignTicket(ticket){
    if(!isAdmin||!ticket?.id)return;
    const {error}=await supabase.from('daquitop_support_tickets').update({assigned_to:session.user.id,assigned_at:new Date().toISOString(),status:ticket.status==='resolvido'?'resolvido':'em_analise',updated_at:new Date().toISOString()}).eq('id',ticket.id);
    if(error){alert(`Não foi possível assumir o chamado: ${error.message}`);return}
    await logAdminAction('ticket_assigned','ticket',ticket.id,{assigned_to:session.user.id});
    await loadOwnerData();
    setNotice('Chamado atribuído a você.');
  }

  async function ownerHideReportedPost(report,hide=true){
    if(!isAdmin||report?.target_type!=='post'||!report?.target_id)return;
    const payload={is_hidden:hide,hidden_at:hide?new Date().toISOString():null,hidden_by:hide?session.user.id:null};
    const {error}=await supabase.from('posts').update(payload).eq('id',report.target_id);
    if(error){alert(error.message);return;} await logAdminAction(hide?'post_hidden':'post_restored','post',report.target_id,{report_id:report.id}); await loadOwnerData();
  }

  async function ownerAssignReport(report){
    if(!isAdmin||!report?.id)return;
    const {error}=await supabase.from('cidarank_reports').update({assigned_to:session.user.id,assigned_at:new Date().toISOString(),status:['resolved','dismissed'].includes(String(report.status||''))?report.status:'in_review'}).eq('id',report.id);
    if(error){alert(`Não foi possível assumir a denúncia: ${error.message}`);return}
    await logAdminAction('report_assigned','report',report.id,{assigned_to:session.user.id});
    await loadOwnerData();
    setNotice('Denúncia atribuída a você.');
  }

  async function ownerReplyTicket(ticket,status='em_analise'){
    if(!isAdmin||!ticket?.id)return;
    const response=String(ownerReply[ticket.id]||'').trim();
    if(response){
      const {error:msgError}=await supabase.from('cidarank_support_messages').insert({ticket_id:ticket.id,user_id:ticket.user_id,sender_id:session.user.id,sender_role:isOwner?'owner':'admin',message:response});
      if(msgError){alert(`Não foi possível enviar a mensagem: ${msgError.message}`);return}
    }
    const {error}=await supabase.from('daquitop_support_tickets').update({status,admin_response:response||ticket.admin_response||null,assigned_to:ticket.assigned_to||session.user.id,assigned_at:ticket.assigned_at||new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',ticket.id);
    if(error){alert(`Não foi possível atualizar o chamado: ${error.message}`);return}
    setOwnerReply(v=>({...v,[ticket.id]:''}));
    await logAdminAction(status==='resolvido'?'ticket_resolved':'ticket_message_sent','ticket',ticket.id,{status,message:response||null});
    await loadOwnerData();
    setNotice(status==='resolvido'?'Chamado resolvido.':'Mensagem enviada ao usuário.');
  }

  async function userSendSupportMessage(ticket){
    const response=String(ownerReply[`user-${ticket.id}`]||'').trim(); if(!response)return;
    const {error}=await supabase.from('cidarank_support_messages').insert({ticket_id:ticket.id,user_id:session.user.id,sender_id:session.user.id,sender_role:'user',message:response});
    if(error){alert(error.message);return}
    setOwnerReply(v=>({...v,[`user-${ticket.id}`]:''})); await loadSupportMessages(session.user.id);
  }

  async function ownerPublishAnnouncement(){
    if(!isAdmin)return; const a=ownerAnnouncement; if(!a.title.trim()||!a.message.trim()){alert('Digite título e mensagem.');return}
    const payload={title:a.title.trim(),message:a.message.trim(),kind:a.kind,scope:a.scope,state:a.scope==='estado'||a.scope==='cidade'?a.state:null,city:a.scope==='cidade'?a.city:null,show_popup:a.show_popup,active:a.active,created_by:session.user.id};
    const {error}=await supabase.from('cidarank_announcements').insert(payload); if(error){alert(error.message);return}
    await logAdminAction('announcement_published','announcement',null,payload); setOwnerAnnouncement({title:'',message:'',kind:'novidade',scope:'brasil',state:'',city:'',show_popup:true,active:true}); await loadAnnouncements(); setNotice('Comunicado publicado.');
  }

  async function handleAuth(e){
    e.preventDefault(); setAuthBusy(true); setAuthMessage('');
    if(authMode==='login'){
      const {error}=await supabase.auth.signInWithPassword({email:form.email.trim(),password:form.password});
      setAuthBusy(false); setAuthMessage(error?error.message:'Login realizado com sucesso.'); return;
    }
    if(!form.full_name.trim()||!form.username.trim()||!form.city||!form.state||!form.gender){setAuthBusy(false);setAuthMessage('Preencha todos os campos do cadastro.');return;}
    const {data:cityOpen,error:cityOpenError}=await supabase.rpc('cidarank_city_is_open',{p_state:form.state,p_city:form.city});
    if(!cityOpenError && cityOpen===false){setAuthBusy(false);setAuthMessage(`🚀 O CIDARANK ainda não abriu em ${form.city} - ${form.state}. Esta cidade está EM BREVE.`);return;}
    const {data,error}=await supabase.auth.signUp({email:form.email.trim(),password:form.password,options:{data:{
      full_name:form.full_name.trim(),username:cleanUsername(form.username),state:form.state,city:form.city,gender:form.gender
    }}});
    setAuthBusy(false);
    if(error){setAuthMessage(error.message);return;}
    if(data.session)setAuthMessage('Conta criada e login realizado.');
    else{setAuthMessage('Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre.');setAuthMode('login')}
  }

  async function logout(){await supabase.auth.signOut()}

  async function uploadMedia(file,folder){
    if(!file)return null;
    if(!file.type.startsWith('image/'))throw new Error('Envie somente uma imagem.');
    if(file.size>5*1024*1024)throw new Error('A imagem deve ter no máximo 5 MB.');
    const path=`${session.user.id}/${folder}-${Date.now()}-${safeName(file.name)}`;
    const {error}=await supabase.storage.from('daquitop-media').upload(path,file,{upsert:false,contentType:file.type});
    if(error)throw error;
    return supabase.storage.from('daquitop-media').getPublicUrl(path).data.publicUrl;
  }

  async function publishPost({text=postText,file=postFile,city=profile?.city,state=profile?.state,business=null,after}={}){
    const content=String(text||'').trim();
    if(!content && !file)return;
    if(postingPaused&&!isAdmin){alert('Novas publicações estão temporariamente pausadas pela Administração do CIDARANK.');return;}
    setBusy(true);
    try{
      const image_url=file?await uploadMedia(file,'post'):null;
      const {error}=await supabase.from('posts').insert({author_id:session.user.id,content,city,state,post_type:'user',business_id:business?.id||null,image_url});
      if(error)throw error;
      setPostText('');setPostFile(null);setPostPreview('');setExplorePostText('');setBusinessPostText('');setBusinessPostFile(null);setBusinessPostPreview('');
      if(after)await after(); else await loadPosts(city,state);
      setNotice('Publicação enviada com sucesso.');
    }catch(e){alert(`Não foi possível publicar: ${e.message}`)}
    setBusy(false);
  }

  function choosePostFile(file){
    if(!file)return;
    if(postPreview)URL.revokeObjectURL(postPreview);
    setPostFile(file); setPostPreview(URL.createObjectURL(file));
  }

  async function toggleLike(postId){
    if(likedPosts.has(postId))await supabase.from('daquitop_post_likes').delete().eq('post_id',postId).eq('user_id',session.user.id);
    else await supabase.from('daquitop_post_likes').insert({post_id:postId,user_id:session.user.id});
    await loadPosts(profile.city,profile.state);
  }

  async function addComment(postId,parentCommentId=null){
    const source=parentCommentId?commentReplyDraft:commentDraft;
    const key=parentCommentId||postId;
    const content=String(source[key]||'').trim(); if(!content)return;
    const payload={post_id:postId,author_id:session.user.id,content,parent_comment_id:parentCommentId||null};
    const {error}=await supabase.from('daquitop_comments').insert(payload);
    if(error){alert(error.message);return}
    if(parentCommentId){setCommentReplyDraft(v=>({...v,[parentCommentId]:''}));setReplyingTo(v=>({...v,[postId]:null}));}
    else setCommentDraft(v=>({...v,[postId]:''}));
    await loadPosts(profile.city,profile.state);
  }

  async function toggleCommentLike(commentId){
    if(commentLikes.has(commentId)) await supabase.from('daquitop_comment_likes').delete().eq('comment_id',commentId).eq('user_id',session.user.id);
    else { const {error}=await supabase.from('daquitop_comment_likes').insert({comment_id:commentId,user_id:session.user.id}); if(error){alert(error.message);return;} }
    await loadPosts(profile.city,profile.state);
  }

  async function deletePost(post){
    if(post.author_id!==session.user.id && !isAdmin)return;
    if(!confirm('Excluir esta publicação?'))return;
    const {error}=await supabase.from('posts').delete().eq('id',post.id);
    if(error){alert(error.message);return}
    await Promise.all([loadPosts(profile.city,profile.state),loadOwnerPublicFeed()]);
  }

  async function deleteAllOwnerPosts(){
    if(!isOwner)return;
    if(!confirm('Limpar TODAS as publicações oficiais do CIDARANK? Esta ação não pode ser desfeita.'))return;
    setBusy(true);
    try{
      const {error}=await supabase.from('posts').delete().eq('author_id',session.user.id);
      if(error)throw error;
      await Promise.all([loadPosts(profile.city,profile.state),loadOwnerPublicFeed()]);
      setNotice('Publicações oficiais do CIDARANK limpas com sucesso.');
    }catch(e){alert(e.message)}finally{setBusy(false)}
  }

  async function toggleFollow(person){
    if(!isInstitutionalOwner(person)&&!sameCity(profile,person)){alert('Você só pode seguir pessoas da sua cidade. O perfil oficial do CIDARANK pode ser seguido de qualquer cidade.');return}
    if(person.id===session.user.id)return;
    if(following.has(person.id))await supabase.from('daquitop_follows').delete().eq('follower_id',session.user.id).eq('following_id',person.id);
    else{const {error}=await supabase.from('daquitop_follows').insert({follower_id:session.user.id,following_id:person.id});if(error){alert(error.message);return}}
    await Promise.all([loadFollowing(session.user.id),loadCity(profile.city,profile.state)]);
    if(selectedProfile?.id===person.id){const {data}=await supabase.from('profiles').select('*').eq('id',person.id).single();setSelectedProfile(data)}
  }

  async function loadProfileAwards(person){
    if(!person?.id||!person?.city||!person?.state){setProfileAwards([]);return}
    const ckey=cityKey(person.city), skey=stateKey(person.state);
    const [{data:cityPeople},{data:votes}]=await Promise.all([
      supabase.from('profiles').select('id,followers_count,role,username').eq('city_key',ckey).eq('state_key',skey).gt('followers_count',0).order('followers_count',{ascending:false}).limit(100),
      supabase.from('daquitop_competition_votes').select('*').eq('city_key',ckey).eq('state_key',skey)
    ]);
    const awards=[];
    const ranked=(cityPeople||[]).filter(x=>!isInstitutionalOwner(x)&&(x.followers_count||0)>0).sort((a,b)=>(b.followers_count||0)-(a.followers_count||0));
    const pos=ranked.findIndex(x=>x.id===person.id);
    if(pos===0&&ranked.length)awards.push({icon:'🥇',title:'TOP 1 Popular',text:'1º lugar em seguidores na cidade'});
    else if(pos===1)awards.push({icon:'🥈',title:'TOP 2 Popular',text:'2º lugar em seguidores na cidade'});
    else if(pos===2)awards.push({icon:'🥉',title:'TOP 3 Popular',text:'3º lugar em seguidores na cidade'});
    const awardPeople=(cityPeople||[]).filter(x=>!isInstitutionalOwner(x));
    const positions={popular:pos>=0?pos+1:null,week:null,month:null,year:null};
    for(const type of ['week','month','year']){
      const r=rankFromData(type,awardPeople,votes||[]);
      const rp=r.findIndex(x=>x.id===person.id); positions[type]=rp>=0?rp+1:null;
      if(r[0]?.id===person.id){const meta=type==='week'?['🥇','Líder da Semana']:type==='month'?['🏆','Melhor do Mês']:['👑','Melhor do Ano'];const val=type==='week'?`${r[0].votes} voto(s)`:`${r[0].points} ponto(s)`;awards.push({icon:meta[0],title:meta[1],text:`1º lugar atual • ${val}`});}
    }
    if((person.followers_count||0)>=10)awards.push({icon:'⭐',title:'Destaque Local',text:'10 ou mais seguidores locais'});
    setProfileRankPositions(positions); setProfileAwards(awards);
  }

  async function loadProfilePosts(person){
    if(!person?.id){setProfilePosts([]);setProfilePostAuthors({});return}
    const {data}=await supabase.from('posts').select('*').eq('is_hidden',false).eq('author_id',person.id).order('created_at',{ascending:false}).limit(30);
    const h=await hydratePosts(data||[]);setProfilePosts(h.list);setProfilePostAuthors(h.authors);
  }

  async function openProfile(personOrId){
    const id=typeof personOrId==='string'?personOrId:personOrId.id;
    const {data}=await supabase.from('profiles').select('*').eq('id',id).maybeSingle();
    const target=data||profile; setSelectedProfile(target); await Promise.all([loadProfileAwards(target),loadProfilePosts(target)]); setActive('Perfil');
  }

  async function openOwnProfile(){setSelectedProfile(profile);await Promise.all([loadProfileAwards(profile),loadProfilePosts(profile),loadPersonalNotifications(session?.user?.id)]);setActive('Perfil')}

  async function openFollowList(person,mode){
    if(!person?.id)return; setFollowModal(mode); setFollowSearch('');
    if(mode==='followers'){
      const {data:rels}=await supabase.from('daquitop_follows').select('follower_id').eq('following_id',person.id).limit(1000);
      const ids=(rels||[]).map(x=>x.follower_id); if(!ids.length){setFollowList([]);return}
      const {data}=await supabase.from('profiles').select('*').in('id',ids); setFollowList(data||[]);
    }else{
      const {data:rels}=await supabase.from('daquitop_follows').select('following_id').eq('follower_id',person.id).limit(1000);
      const ids=(rels||[]).map(x=>x.following_id); if(!ids.length){setFollowList([]);return}
      const {data}=await supabase.from('profiles').select('*').in('id',ids); setFollowList(data||[]);
    }
  }

  async function saveSettings(e){
    e.preventDefault(); setBusy(true); setNotice('');
    const payload={
      full_name:settings.full_name.trim(),username:cleanUsername(settings.username),bio:settings.bio.trim(),activity:settings.activity.trim(),
      public_phone:settings.public_phone.trim(),website:settings.website.trim(),gender:settings.gender||null,avatar_url:settings.avatar_url||null,cover_url:settings.cover_url||null,updated_at:new Date().toISOString()
    };
    const {data,error}=await supabase.from('profiles').update(payload).eq('id',session.user.id).select('*').maybeSingle();
    if(error)alert(error.message); else{setProfile(data);syncSettings(data);setSelectedProfile(data);setNotice('Perfil atualizado com sucesso.')}
    setBusy(false);
  }

  async function uploadProfileImage(field,file){
    if(!file)return;
    field==='avatar_url'?setAvatarUploading(true):setCoverUploading(true);
    try{
      const url=await uploadMedia(file,field==='avatar_url'?'avatar':'cover');
      setSettings(v=>({...v,[field]:url}));
    }catch(e){alert(e.message)}
    field==='avatar_url'?setAvatarUploading(false):setCoverUploading(false);
  }

  async function loadBusiness(id){
    const {data:b}=await supabase.from('businesses').select('*').eq('id',id).maybeSingle();
    if(!b)return;
    setSelectedBusiness(b); setBusinessEdit({...b}); setActive('Estabelecimentos');
    const [{data:r},{data:bp}]=await Promise.all([
      supabase.from('daquitop_business_reviews').select('*').eq('business_id',id).order('created_at',{ascending:false}),
      supabase.from('posts').select('*').eq('is_hidden',false).eq('business_id',id).order('created_at',{ascending:false}).limit(30)
    ]);
    setBusinessReviews(r||[]);
    const bh=await hydratePosts(bp||[]); setBusinessPosts(bh.list); setBusinessPostAuthors(bh.authors);
    const ids=[...new Set((r||[]).map(x=>x.author_id))];
    if(ids.length){const {data:p}=await supabase.from('profiles').select('id,full_name,username,avatar_url').in('id',ids);setReviewAuthors(Object.fromEntries((p||[]).map(x=>[x.id,x])))}else setReviewAuthors({});
  }

  async function saveBusiness(e){
    e.preventDefault(); setBusy(true);
    const payload={...businessForm,username:cleanUsername(businessForm.username),owner_id:session.user.id,city:profile.city,state:profile.state};
    const {data,error}=await supabase.from('businesses').insert(payload).select('*').single();
    if(error)alert(error.message); else{setBusinessForm({name:'',username:'',category:'',description:'',address:'',whatsapp:'',website:''});await loadCity(profile.city,profile.state);await loadBusiness(data.id);setNotice('Estabelecimento cadastrado com sucesso.')}
    setBusy(false);
  }

  async function updateBusiness(e){
    e.preventDefault(); if(!selectedBusiness||selectedBusiness.owner_id!==session.user.id)return;
    setBusy(true);
    const allowed={name:businessEdit.name,username:cleanUsername(businessEdit.username),category:businessEdit.category,description:businessEdit.description,address:businessEdit.address,whatsapp:businessEdit.whatsapp,website:businessEdit.website,logo_url:businessEdit.logo_url,cover_url:businessEdit.cover_url,updated_at:new Date().toISOString()};
    const {data,error}=await supabase.from('businesses').update(allowed).eq('id',selectedBusiness.id).select('*').single();
    if(error)alert(error.message);else{setSelectedBusiness(data);setBusinessEdit({...data});await loadCity(profile.city,profile.state);setNotice('Estabelecimento atualizado.')}
    setBusy(false);
  }

  async function uploadBusinessImage(field,file){
    if(!file)return;
    try{const url=await uploadMedia(file,field==='logo_url'?'business-logo':'business-cover');setBusinessEdit(v=>({...v,[field]:url}))}catch(e){alert(e.message)}
  }

  function chooseBusinessPostFile(file){
    if(!file)return;
    if(businessPostPreview)URL.revokeObjectURL(businessPostPreview);
    setBusinessPostFile(file); setBusinessPostPreview(URL.createObjectURL(file));
  }

  async function submitReview(e){
    e.preventDefault(); if(!selectedBusiness)return;
    const payload={business_id:selectedBusiness.id,author_id:session.user.id,rating:Number(reviewForm.rating),comment:reviewForm.comment.trim()};
    const {error}=await supabase.from('daquitop_business_reviews').upsert(payload,{onConflict:'business_id,author_id'});
    if(error)alert(error.message);else{setReviewForm({rating:5,comment:''});await loadBusiness(selectedBusiness.id);await loadCity(profile.city,profile.state);setNotice('Avaliação registrada.')}
  }

  async function explore(cityOverride=exploreCity,stateOverride=exploreState){
    const targetCity=String(cityOverride||'').trim();
    const targetState=String(stateOverride||'').trim();
    if(!targetCity||!targetState)return;
    setExploreBusy(true);
    try{
      // Cidades fechadas continuam EM BREVE para usuários comuns. O Dono pode inspecionar qualquer cidade.
      if(!isOwner){
        const {data:isOpen,error:openError}=await supabase.rpc('cidarank_city_is_open',{p_state:targetState,p_city:targetCity});
        if(!openError && isOpen===false){
          setExploreData({posts:[],authors:{},postBusinesses:{},businesses:[],people:[],votes:[]});
          setNotice(`${targetCity} - ${targetState} ainda está EM BREVE no CIDARANK.`);
          return;
        }
      }
      const [{data:p},{data:b},{data:raw},{data:votes}]=await Promise.all([
        supabase.from('profiles').select('*').eq('city_key',cityKey(targetCity)).eq('state_key',stateKey(targetState)).order('followers_count',{ascending:false}).limit(100),
        supabase.from('businesses').select('*').eq('city_key',cityKey(targetCity)).eq('state_key',stateKey(targetState)).order('rating_average',{ascending:false}).limit(50),
        supabase.from('posts').select('*').eq('is_hidden',false).eq('city_key',cityKey(targetCity)).eq('state_key',stateKey(targetState)).order('created_at',{ascending:false}).limit(30),
        supabase.from('daquitop_competition_votes').select('*').eq('city_key',cityKey(targetCity)).eq('state_key',stateKey(targetState)).limit(10000)
      ]);
      const h=await hydratePosts(raw||[]);
      setExploreData({posts:h.list,authors:h.authors,postBusinesses:h.biz,businesses:b||[],votes:votes||[],people:(p||[]).filter(x=>x.account_type!=='business'&&!isInstitutionalOwner(x))});
    }finally{setExploreBusy(false)}
  }

  async function loadPersonalNotifications(userId){
    if(!userId)return;
    const {data,error}=await supabase.from('cidarank_notifications').select('*').eq('recipient_id',userId).order('created_at',{ascending:false}).limit(80);
    if(error){console.error('Notificações pessoais:',error);return;}
    const list=data||[];
    setPersonalNotifications(list);
    const ids=[...new Set(list.map(n=>n.actor_id).filter(Boolean))];
    if(ids.length){
      const {data:actors}=await supabase.from('profiles').select('id,full_name,username,avatar_url,city,state,role,verified,seal_color,account_type').in('id',ids);
      setNotificationActors(Object.fromEntries((actors||[]).map(x=>[x.id,x])));
    }else setNotificationActors({});
  }

  async function markNotificationRead(notification){
    if(!notification?.id)return;
    await supabase.from('cidarank_notifications').update({read_at:new Date().toISOString()}).eq('id',notification.id).eq('recipient_id',session.user.id);
    setPersonalNotifications(v=>v.map(n=>n.id===notification.id?{...n,read_at:new Date().toISOString()}:n));
    const actor=notificationActors[notification.actor_id];
    if(notification.type==='message'&&actor){await openChat(actor);return;}
    setActive('Início');
  }

  async function markAllNotificationsRead(){
    await supabase.from('cidarank_notifications').update({read_at:new Date().toISOString()}).eq('recipient_id',session.user.id).is('read_at',null);
    await loadPersonalNotifications(session.user.id);
  }

  async function searchMentionPeople(value){
    const q=String(value||'').trim().replace(/^@/,'');
    setMentionSearch(value);
    if(q.length<2){setMentionResults([]);return;}
    setMentionBusy(true);
    const safe=q.replace(/[%,()]/g,'');
    const {data,error}=await supabase.from('profiles')
      .select('id,full_name,username,avatar_url,city,state,role,verified,seal_color,account_type')
      .eq('city_key',cityKey(profile?.city)).eq('state_key',stateKey(profile?.state))
      .or(`username.ilike.%${safe}%,full_name.ilike.%${safe}%`).limit(8);
    if(!error)setMentionResults((data||[]).filter(x=>x.id!==session.user.id));
    setMentionBusy(false);
  }

  function addMentionToText(person,setText){
    const username=cleanUsername(person?.username||'');
    if(!username)return;
    setText(v=>{
      const base=String(v||'').trimEnd();
      const tag=`@${username}`;
      if(base.toLowerCase().includes(tag.toLowerCase()))return v;
      return `${base}${base?' ':''}${tag} `;
    });
    setMentionSearch('');setMentionResults([]);setMentionPickerOpen(false);
  }

  async function openChat(person){
    if(!person||person.id===session.user.id)return;
    setSelectedChat(person); setActive('Mensagens');
    await supabase.from('daquitop_messages').update({read_at:new Date().toISOString()}).eq('sender_id',person.id).eq('recipient_id',session.user.id).is('read_at',null);
    await loadMessages(session.user.id);
  }

  async function sendMessage(e){
    e.preventDefault(); const content=messageText.trim(); if(!content||!selectedChat)return;
    const {error}=await supabase.from('daquitop_messages').insert({sender_id:session.user.id,recipient_id:selectedChat.id,content});
    if(error)alert(error.message);else{setMessageText('');await loadMessages(session.user.id)}
  }

  async function sendSupport(e){
    e.preventDefault(); setBusy(true);
    try{
      const image_url=supportForm.image?await uploadMedia(supportForm.image,'support'):null;
      const {error}=await supabase.from('daquitop_support_tickets').insert({user_id:session.user.id,category:supportForm.category,subject:supportForm.subject.trim(),message:supportForm.message.trim(),image_url,requester_email:session.user.email||null,requester_username:profile?.username||null,requester_city:profile?.city||null,requester_state:profile?.state||null});
      if(error)throw error;
      setSupportForm({category:'duvida',subject:'',message:'',image:null});await loadTickets(session.user.id);setNotice('Chamado enviado ao suporte.')
    }catch(e2){alert(e2.message)}
    setBusy(false);
  }

  async function voteCompetition(person,type){
    const {error}=await supabase.rpc('cast_daquitop_competition_vote',{p_candidate_id:person.id,p_period_type:type});
    if(error)alert(error.message); else{await loadCompetitions(profile.city,profile.state);setNotice('Seu voto foi registrado. Você pode trocar o voto enquanto a competição estiver aberta.')}
  }

  const topPeople=useMemo(()=>people.filter(p=>!isInstitutionalOwner(p)&&(p.followers_count||0)>0).sort((a,b)=>(b.followers_count||0)-(a.followers_count||0)).slice(0,3),[people]);
  const topBusinesses=useMemo(()=>[...businesses].sort((a,b)=>(Number(b.rating_average||0)-Number(a.rating_average||0)) || ((b.reviews_count||0)-(a.reviews_count||0))).slice(0,3),[businesses]);

  const unreadMessageCount=useMemo(()=>daquitop_messages.filter(m=>m.recipient_id===session?.user?.id&&!m.read_at).length,[daquitop_messages,session?.user?.id]);
  const unreadPersonalNotificationCount=useMemo(()=>personalNotifications.filter(n=>!n.read_at).length,[personalNotifications]);
  const cityFeedNotificationCount=useMemo(()=>{
    const seen=lastSeenCityFeed?new Date(lastSeenCityFeed).getTime():0;
    return posts.filter(p=>new Date(p.created_at).getTime()>seen&&p.author_id!==session?.user?.id).length;
  },[posts,lastSeenCityFeed,session?.user?.id]);

  function markCityFeedSeen(){
    const now=new Date().toISOString();
    try{localStorage.setItem('cidarank_last_seen_city_feed',now)}catch{}
    setLastSeenCityFeed(now);
  }

  const searchResults=useMemo(()=>{
    const q=search.trim().toLowerCase(); if(!q)return [];
    const p=people.filter(x=>`${x.full_name||''} ${x.username||''}`.toLowerCase().includes(q)).slice(0,4).map(x=>({kind:'person',item:x,label:x.full_name||x.username}));
    const b=businesses.filter(x=>`${x.name||''} ${x.username||''} ${x.category||''}`.toLowerCase().includes(q)).slice(0,4).map(x=>({kind:'business',item:x,label:x.name}));
    return [...p,...b].slice(0,7);
  },[search,people,businesses]);

  function isoWeekKey(date=new Date()){
    const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
    const day=d.getUTCDay()||7;
    d.setUTCDate(d.getUTCDate()+4-day);
    const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const week=Math.ceil((((d-yearStart)/86400000)+1)/7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2,'0')}`;
  }
  function periodKey(type){if(type==='week')return isoWeekKey();if(type==='month')return new Date().toISOString().slice(0,7);return String(new Date().getFullYear())}
  function periodCountdown(type){
    const now=new Date(clockNow);
    let end;
    if(type==='week'){
      const day=now.getDay();
      const daysUntilMonday=(8-day)%7 || 7;
      end=new Date(now); end.setDate(now.getDate()+daysUntilMonday); end.setHours(0,0,0,0);
    }else if(type==='month'){ end=new Date(now.getFullYear(),now.getMonth()+1,1,0,0,0,0); }
    else { end=new Date(now.getFullYear()+1,0,1,0,0,0,0); }
    const diff=Math.max(0,end-now);
    const days=Math.floor(diff/86400000), hours=Math.floor((diff%86400000)/3600000), mins=Math.floor((diff%3600000)/60000);
    return `${days}d ${hours}h ${mins}min`;
  }
  function rankStatus(type){
    if(type==='week')return {label:'VOTAÇÃO ABERTA',countdown:periodCountdown('week'),icon:'🗳️'};
    if(type==='month')return {label:'AUTOMÁTICO PELAS SEMANAS',countdown:periodCountdown('month'),icon:'🏆'};
    return {label:'AUTOMÁTICO PELOS MESES',countdown:periodCountdown('year'),icon:'👑'};
  }

  function rankFromData(type, sourcePeople=people, sourceVotes=competitionVotes){
    const eligible=(sourcePeople||[]).filter(p=>!isInstitutionalOwner(p));
    const scale=[100,80,65,50,40,30,20,15,10,5];
    const weekScores=(votes)=>{
      const groups={};
      for(const v of votes){
        const k=v.period_key||isoWeekKey(new Date(v.created_at));
        groups[k]??={}; groups[k][v.candidate_id]=(groups[k][v.candidate_id]||0)+1;
      }
      const points={};
      Object.values(groups).forEach(g=>Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([id],i)=>points[id]=(points[id]||0)+scale[i]));
      return points;
    };
    if(type==='week'){
      const key=periodKey('week'),counts={};
      (sourceVotes||[]).filter(v=>v.period_type==='week'&&v.period_key===key).forEach(v=>counts[v.candidate_id]=(counts[v.candidate_id]||0)+1);
      return eligible.map(p=>({...p,votes:counts[p.id]||0,points:counts[p.id]||0})).filter(p=>p.votes>0).sort((a,b)=>b.votes-a.votes||(b.followers_count||0)-(a.followers_count||0)||String(a.full_name||a.username||'').localeCompare(String(b.full_name||b.username||''),'pt-BR'));
    }
    const now=new Date(), year=now.getFullYear(), month=now.getMonth();
    const validWeeks=(sourceVotes||[]).filter(v=>v.period_type==='week'&&v.created_at&&new Date(v.created_at).getFullYear()===year);
    if(type==='month'){
      const monthVotes=validWeeks.filter(v=>new Date(v.created_at).getMonth()===month);
      const points=weekScores(monthVotes);
      return eligible.map(p=>({...p,points:points[p.id]||0,votes:points[p.id]||0})).filter(p=>p.points>0).sort((a,b)=>b.points-a.points||(b.followers_count||0)-(a.followers_count||0)||String(a.full_name||a.username||'').localeCompare(String(b.full_name||b.username||''),'pt-BR'));
    }
    // ANO: cada mês é fechado a partir das semanas; a colocação mensal gera pontos anuais.
    const annual={};
    for(let m=0;m<12;m++){
      const monthVotes=validWeeks.filter(v=>new Date(v.created_at).getMonth()===m);
      if(!monthVotes.length) continue;
      const monthlyPoints=weekScores(monthVotes);
      Object.entries(monthlyPoints).filter(([,pts])=>pts>0).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([id],i)=>annual[id]=(annual[id]||0)+scale[i]);
    }
    return eligible.map(p=>({...p,points:annual[p.id]||0,votes:annual[p.id]||0})).filter(p=>p.points>0).sort((a,b)=>b.points-a.points||(b.followers_count||0)-(a.followers_count||0)||String(a.full_name||a.username||'').localeCompare(String(b.full_name||b.username||''),'pt-BR'));
  }
  function competitionRanking(type){ return rankFromData(type,people,competitionVotes); }
  function myVote(type){
    const key=periodKey(type); return competitionVotes.find(v=>v.voter_id===session?.user?.id&&v.period_type===type&&v.period_key===key)?.candidate_id||null;
  }

  if(loading&&session)return <div className="screenCenter"><div className="loader"></div><p>Carregando CIDARANK...</p></div>;

  if(!session){
    return <main className="authPage">
      <section className="authShowcase cidarankShowcase" aria-label="CIDARANK - rankings e destaques da cidade">
        <img src="/cidarank-auth-showcase.png" alt="CIDARANK com ranking da semana, ranking do mês, ranking anual e destaque de estabelecimentos" className="cidarankShowcaseImage"/>
      </section>
      <section className="authPanel"><div className="authCard">
        <div className="authTabs"><button className={authMode==='login'?'active':''} onClick={()=>{setAuthMode('login');setAuthMessage('')}}>ENTRAR</button><button className={authMode==='signup'?'active':''} onClick={()=>{setAuthMode('signup');setAuthMessage('')}}>CRIAR CONTA</button></div>
        <h2>{authMode==='login'?'Bem-vindo ao CIDARANK':'Faça parte do CIDARANK'}</h2><p className="authSubtitle">{authMode==='login'?'Acesse sua conta e continue de onde parou.':'Crie seu perfil local em poucos passos.'}</p>
        <form onSubmit={handleAuth}>
          {authMode==='signup'&&<>
            <label>Nome completo<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Seu nome"/></label>
            <label>@Usuário<input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="seuusuario"/></label>
            <div className="authGrid locationGrid"><label>Estado<select required value={form.state_id} onChange={handleStateChange}><option value="">Selecione</option>{states.map(x=><option key={x.id} value={x.id}>{x.nome} ({x.sigla})</option>)}</select></label><label>Cidade<select required disabled={!form.state_id||locationsBusy} value={form.city} onChange={e=>setForm({...form,city:e.target.value})}><option value="">{locationsBusy?'Carregando...':'Selecione'}</option>{cities.map(x=><option key={x.id} value={x.nome}>{x.nome}</option>)}</select></label></div>
            <label>Gênero<select required value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="">Selecione</option><option value="homem">Homem</option><option value="mulher">Mulher</option><option value="outros">Outros</option></select></label>
            {locationsError&&<div className="authMessage authError">{locationsError}</div>}
          </>}
          <label>E-mail<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="voce@email.com"/></label>
          <label>Senha<input type="password" minLength={6} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Mínimo 6 caracteres"/></label>
          {authMessage&&<div className="authMessage">{authMessage}</div>}
          <button className="authSubmit" disabled={authBusy}>{authBusy?'AGUARDE...':authMode==='login'?'ENTRAR NO CIDARANK':'CRIAR MINHA CONTA'}</button>
        </form>
      </div></section>
    </main>
  }

  function PageHeader({title,subtitle,actions}){return <div className="pageHeader"><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{actions&&<div>{actions}</div>}</div>}

  function PostCard({post,authors=postAuthors,bizMap=postBusinesses,interactive=true,officialFeed=false}){
    const author=authors[post.author_id]||{}; const business=post.business_id?bizMap[post.business_id]:null; const name=business?.name||author.full_name||author.username||'Usuário';
    const authorIsVisitor=!business&&author?.city&&author?.state&&(cityKey(author.city)!==cityKey(post.city)||stateKey(author.state)!==stateKey(post.state));
    const postMeta=authorIsVisitor?`Visitante de ${author.city} - ${author.state} • ${fmtDate(post.created_at)}`:fmtDate(post.created_at);
    const comments=daquitop_comments[post.id]||[];
    const roots=comments.filter(c=>!c.parent_comment_id);
    const repliesFor=id=>comments.filter(c=>c.parent_comment_id===id);
    const renderComment=(c,isReply=false)=>{const ca=commentAuthors[c.author_id]||{};const replies=repliesFor(c.id);const commentVisitor=ca?.city&&ca?.state&&(cityKey(ca.city)!==cityKey(post.city)||stateKey(ca.state)!==stateKey(post.state));return <div className={`commentThread ${isReply?'replyThread':''}`} key={c.id}><div className="comment"><Avatar profile={ca} name={ca.full_name||ca.username} size="xs"/><div className="commentBubble"><div className="commentName"><b>{ca.full_name||ca.username||'Usuário'}</b><Seal type={sealTypeFor(ca)} color={ca.seal_color}/><button className={commentLikes.has(c.id)?'commentLike active':'commentLike'} onClick={()=>toggleCommentLike(c.id)}>♥ <span>{commentLikeCounts[c.id]||0}</span></button></div><p>{c.content}</p><div className="commentMeta"><small>{commentVisitor?`Visitante de ${ca.city} - ${ca.state} • ${fmtDate(c.created_at)}`:fmtDate(c.created_at)}</small>{!isReply&&<button onClick={()=>setReplyingTo(v=>({...v,[post.id]:v[post.id]===c.id?null:c.id}))}>Responder</button>}</div></div></div>{replyingTo[post.id]===c.id&&!isReply&&<div className="replyComposer"><span>↳ Respondendo a <b>@{ca.username||'usuario'}</b></span><div className="commentComposeRow"><input value={commentReplyDraft[c.id]||''} onChange={e=>setCommentReplyDraft(v=>({...v,[c.id]:e.target.value}))} placeholder={`Responder a @${ca.username||'usuario'}...`}/><div className="emojiQuick">{QUICK_EMOJIS.slice(0,4).map(e=><button type="button" key={e} onClick={()=>setCommentReplyDraft(v=>({...v,[c.id]:`${v[c.id]||''}${e}`}))}>{e}</button>)}</div><button className="sendCommentBtn" onClick={()=>addComment(post.id,c.id)}>Responder</button></div></div>}{replies.map(r=>renderComment(r,true))}</div>};
    return <article className="post socialPost" key={post.id}>
      <div className="postHead"><button className="plainBtn" onClick={()=>author.id&&openProfile(author)}><Avatar profile={business?{avatar_url:business.logo_url}:author} name={name}/></button><div><div className="nameWithSeal"><button className="linkName" onClick={()=>business?loadBusiness(business.id):author.id&&openProfile(author)}>{name}</button><Seal type={business?'business':sealTypeFor(author)}/></div><small>{postMeta} {business&&'• Estabelecimento'}</small></div>{interactive&&post.author_id===session.user.id&&<button className="ghostIcon" onClick={()=>deletePost(post)}>🗑</button>}</div>
      {post.content&&<p>{post.content}</p>}{post.image_url&&<img className="postImage" src={post.image_url} alt="Publicação"/>}
      {(interactive||officialFeed)&&<><div className="stats"><button className={likedPosts.has(post.id)?'liked':''} onClick={()=>toggleLike(post.id)}>{likedPosts.has(post.id)?'♥':'♡'} {post.likes_count||0} Curtidas</button>{!officialFeed&&<span>💬 {post.comments_count||comments.length} Comentários</span>}</div>
      {officialFeed&&!isOwner?<div className="officialReactionOnly"><span>Reaja ao comunicado:</span><div className="emojiQuick">{QUICK_EMOJIS.map(e=><button type="button" key={e} onClick={()=>toggleLike(post.id)}>{e}</button>)}</div><small>O Feed CIDARANK é um canal oficial. Comentários de texto ficam desativados.</small></div>:<div className="daquitop_comments">{roots.map(c=>renderComment(c))}<div className="commentInput socialCommentInput"><Avatar profile={profile} size="xs"/><div className="commentInputMain"><input value={commentDraft[post.id]||''} onChange={e=>setCommentDraft(v=>({...v,[post.id]:e.target.value}))} placeholder="Escreva um comentário..."/><div className="emojiQuick">{QUICK_EMOJIS.map(e=><button type="button" key={e} onClick={()=>setCommentDraft(v=>({...v,[post.id]:`${v[post.id]||''}${e}`}))}>{e}</button>)}</div></div><button className="sendCommentBtn" onClick={()=>addComment(post.id)}>Enviar</button></div></div>}</>}
    </article>
  }

  function Composer({text,setText,onPublish,allowPhoto=true,preview=postPreview}){
    return <section className="composer"><div className="row"><Avatar profile={profile} name={displayName} size="sm"/><textarea rows={2} value={text} onChange={e=>setText(e.target.value)} placeholder={`No que você está pensando, ${displayName}?`}/></div>{preview&&<div className="previewWrap"><img src={preview} alt="Prévia"/><button onClick={()=>{setPostFile(null);setPostPreview('')}}>×</button></div>}<div className="composerTools"><div className="mentionTool"><button type="button" className="mentionToggle" onClick={()=>setMentionPickerOpen(v=>!v)}>👤 Marcar pessoa</button>{mentionPickerOpen&&<div className="mentionPicker"><div className="mentionSearchRow">🔎<input autoFocus value={mentionSearch} onChange={e=>searchMentionPeople(e.target.value)} placeholder="Nome ou @usuário"/></div>{mentionBusy&&<small>Pesquisando...</small>}{mentionResults.map(person=><button type="button" key={person.id} onClick={()=>addMentionToText(person,setText)}><Avatar profile={person} size="xs"/><span><b>{person.full_name||person.username}</b><small>@{person.username} • {person.city||'Cidade'} - {person.state||''}</small></span></button>)}{mentionSearch.trim().length>=2&&!mentionBusy&&!mentionResults.length&&<small>Nenhuma pessoa encontrada.</small>}</div>}</div></div><div className="actions">{allowPhoto&&<><input ref={postFileRef} type="file" accept="image/*" hidden onChange={e=>choosePostFile(e.target.files?.[0])}/><button onClick={()=>postFileRef.current?.click()}>▧ Foto</button></>}<button className="publish" disabled={busy||(!String(text).trim()&&!postFile)} onClick={onPublish}>{busy?'Publicando...':'➤ Publicar'}</button></div></section>
  }

  function NationalBanner({compact=false}){
    return <section className={`nationalBanner ${compact?'compact':''}`}>
      <img src={siteBanner||'/cidarank-national-banner.png'} alt="CIDARANK - pessoas, rankings e estabelecimentos de todo o Brasil"/>
      {isOwner&&<label className="ownerBannerEdit">♛ {ownerBusy?'Enviando...':'Trocar banner nacional'}<input type="file" hidden accept="image/*" disabled={ownerBusy} onChange={e=>changeNationalBanner(e.target.files?.[0])}/></label>}
    </section>
  }

  function CityHighlights(){
    const weekly=competitionRanking('week').slice(0,3), monthly=competitionRanking('month').slice(0,3), yearly=competitionRanking('year').slice(0,3), popular=topPeople.slice(0,3);
    const views={week:{title:'PESSOAS POPULARES DA SEMANA',list:weekly,metric:'votes',icon:'🏆'},month:{title:'PESSOAS POPULARES DO MÊS',list:monthly,metric:'points',icon:'🥇'},year:{title:'PESSOAS POPULARES DO ANO',list:yearly,metric:'points',icon:'👑'},city:{title:'MAIS POPULAR DA CIDADE',list:popular,metric:'followers',icon:'⭐'}};
    const current=views[homeRankView]||views.week, list=current.list;
    const order=[list[1],list[0],list[2]].filter(Boolean);
    return <section className="cityHighlights premiumRankingSection">
      <div className="cityHighlightsHead compactRankHead"><div><b>{current.icon} {current.title} • {cityLabel}</b></div><span className="autoRankBadge">● AO VIVO</span></div>
      <div className="floatingPodiumGrid singleRankGrid"><div className="floatingPodiumCard premiumPodiumCard" style={{'--podium-bg':`url(${bannerForRank(homeRankView)})`}}><div className="floatingPodiumTitle"><h3>{current.icon} {current.title}</h3><small>{cityLabel}</small></div><div className="floatingPodium premiumPodium">{order.map(p=>{const pos=list.findIndex(x=>x.id===p.id)+1;const value=current.metric==='followers'?`${p.followers_count||0} seguidores`:current.metric==='votes'?`${p.votes||0} votos`:`${p.points||0} pontos`;return <button className={`floatingWinner place${pos} animatedRankPerson`} key={p.id} onClick={()=>openProfile(p)}><span className="floatingPlace">{pos}º</span><span className="floatingCrown">{pos===1?'👑':pos===2?'🥈':'🥉'}</span><span className="rankPhotoSquare"><Avatar profile={p} name={p.full_name} size={pos===1?'lg':'md'}/></span><div className="winnerIdentity"><b>{p.full_name||p.username}</b><Seal type={sealTypeFor(p)} color={p.seal_color}/></div><small>@{p.username}</small><strong>{value}</strong><span className="podiumBase"><em>{pos}</em><small>{pos===1?'CAMPEÃO':pos===2?'2º LUGAR':'3º LUGAR'}</small></span></button>})}</div>{!list.length&&<p className="muted podiumEmpty">Ainda não há classificados neste ranking.</p>}</div></div>
    </section>
  }

  function HomeScreen(){return <>
    <NationalBanner/>
    <CityHighlights/>
    {Composer({text:postText,setText:setPostText,onPublish:()=>publishPost()})}
    <div className="sectionTitle"><h2>Publicações da sua cidade</h2></div>
    {posts.length?<div className="feed">{posts.slice(0,8).map(p=>PostCard({post:p}))}</div>:<Empty title="As publicações da sua cidade estão começando.">Seja a primeira pessoa a publicar no CIDARANK.</Empty>}
  </>}


  function RankingCityScreen(){
    const rankType=popularView==='week'?'week':popularView==='month'?'month':popularView==='year'?'year':null;
    const popularRank=[...people].filter(p=>!isInstitutionalOwner(p)&&(p.followers_count||0)>0).sort((a,b)=>(b.followers_count||0)-(a.followers_count||0));
    const isScope=false;
    const rank=rankType?competitionRanking(rankType):popularView==='city'?popularRank:[];
    const currentVote=rankType==='week'?myVote('week'):null;
    const weeklyCandidates=rankType==='week'?[...people].filter(p=>!isInstitutionalOwner(p)&&p.account_type!=='business').sort((a,b)=>(b.followers_count||0)-(a.followers_count||0)||String(a.full_name||a.username||'').localeCompare(String(b.full_name||b.username||''),'pt-BR')):[];
    const top3=rank.slice(0,3), order=top3.length===3?[top3[1],top3[0],top3[2]]:top3;
    const myPos=rank.findIndex(p=>p.id===session.user.id);
    const metric=p=>popularView==='city'?`${p.followers_count||0} seguidores`:rankType==='week'?`${p.votes||0} voto(s)`:`${p.points||0} pontos`;
    const status=rankType?rankStatus(rankType):{label:'POPULARIDADE PERMANENTE',countdown:'Não reinicia',icon:'👑'};
    const title=popularView==='city'?'Mais Popular da Cidade':rankType==='week'?'Ranking Semanal':rankType==='month'?'Ranking Mensal':'Ranking Anual';
    const scopeLabel=cityLabel;
    return <><PageHeader title="Ranking" subtitle={`Acompanhe posições locais, estaduais e nacionais do CIDARANK.`}/>
      <div className="panel rankingChooser"><div className="segmented wrap">
        <button className={popularView==='city'?'active':''} onClick={()=>setPopularView('city')}>Popular da cidade</button><button className={popularView==='week'?'active':''} onClick={()=>setPopularView('week')}>Semanal</button><button className={popularView==='month'?'active':''} onClick={()=>setPopularView('month')}>Mensal</button><button className={popularView==='year'?'active':''} onClick={()=>setPopularView('year')}>Anual</button><button className="lockedFuture" disabled>Estado • EM BREVE</button><button className="lockedFuture" disabled>Brasil • EM BREVE</button><button className={popularView==='business'?'active':''} onClick={()=>setPopularView('business')}>Estabelecimentos</button>
      </div></div>
      <div className="panel rankHow"><h2>Como funciona?</h2><p><b>Semanal:</b> é o único ranking com votação direta. <b>Mensal:</b> nasce automaticamente dos resultados das semanas do mês. <b>Anual:</b> nasce automaticamente dos resultados mensais. <b>Estado e Brasil:</b> ficam fechados como EM BREVE até a próxima etapa nacional.</p><div className="rankFlow"><span>🗳️ SEMANAL</span><b>→</b><span>🏆 MENSAL</span><b>→</b><span>👑 ANUAL</span><b>•</b><span className="futureMini">🗺️ ESTADO EM BREVE</span><b>•</b><span className="futureMini">🇧🇷 BRASIL EM BREVE</span></div></div>
      {popularView!=='business'&&<><section className="panel mainRankStage"><div className="panelTitle"><div><span className="eyebrow">AO VIVO • {scopeLabel}</span><h2>{title}</h2><p>TOP 3 em destaque e classificação numerada logo abaixo.</p></div><span className="livePill">● ATUALIZAÇÃO AUTOMÁTICA</span></div><div className="rankStatusBar"><span>{status.icon}</span><div><b>{status.label}</b><small>{rankType?'Fecha em':'Status'}: <strong>{status.countdown}</strong></small></div></div><div className="floatingPodium rankPagePodium podiumWithNationalBg" style={{'--podium-bg':`url(${bannerForRank(popularView)})`}}>{scopeRankingBusy&&isScope?<div className="rankEmptyState podiumEmptyOnBanner"><span>⏳</span><b>Carregando ranking...</b></div>:top3.length?order.map(p=>{const pos=rank.findIndex(x=>x.id===p.id)+1;return <button className={`floatingWinner place${pos} animatedRankPerson`} key={p.id} onClick={()=>openProfile(p)}><span className="floatingPlace">#{pos}</span><span className="floatingCrown">{pos===1?'♛':pos===2?'◆':'▲'}</span><span className="rankPhotoSquare"><Avatar profile={p} name={p.full_name} size={pos===1?'lg':'md'}/></span><div className="winnerIdentity"><b>{p.full_name||p.username}</b><Seal type={sealTypeFor(p)} color={p.seal_color}/></div><small>@{p.username}</small><strong>{metric(p)}</strong><span className="podiumBase">{pos}º</span></button>}):<div className="rankEmptyState podiumEmptyOnBanner"><span>🏆</span><b>Ainda não há classificados</b><small>O banner deste ranking já está ativo. Assim que houver votos, pontos ou seguidores válidos, o TOP 3 aparece automaticamente.</small></div>}</div>{myPos>=0&&<div className="myRankSpot"><span>📍 SUA POSIÇÃO</span><b>#{myPos+1}</b><small>de {rank.length} classificados • {metric(rank[myPos])}</small></div>}{myPos<0&&!scopeRankingBusy&&<div className="myRankSpot"><span>📍 SUA POSIÇÃO</span><b>—</b><small>Ainda não classificado neste ranking.</small></div>}</section>
      <div className="panel fullRanking"><div className="panelTitle"><div><h2>Classificação completa</h2><p>Posições numeradas do #1 em diante.</p></div><b>{rank.length} classificados</b></div><div className="listTable">{rank.map((p,i)=><div className={`listRow ${p.id===session.user.id?'myRankRow':''}`} key={p.id}><b className="rankNum">#{i+1}</b><button className="plainBtn" onClick={()=>openProfile(p)}><Avatar profile={p}/></button><div className="grow"><div className="nameWithSeal"><button className="linkName" onClick={()=>openProfile(p)}>{p.full_name||p.username}</button><Seal type={sealTypeFor(p)} color={p.seal_color}/>{p.id===session.user.id&&<span className="youPill">VOCÊ</span>}</div><small>@{p.username}{isScope&&p.city&&<> • {p.city} - {p.state}</>}</small></div><strong>{metric(p)}</strong></div>)}{!rank.length&&!scopeRankingBusy&&<p className="muted">Ainda não há classificados neste ranking.</p>}</div>{isScope&&rank.length>=2000&&<p className="muted">Mostrando os primeiros 2.000 colocados. A paginação nacional será ampliada conforme a base crescer.</p>}</div>
      {rankType==='week'&&<div className="panel weeklyVotePanel"><div className="panelTitle"><div><h2>🗳️ Votação semanal</h2><p>Todos os perfis válidos da sua cidade podem receber o primeiro voto. O voto é local e a estrutura vale para todas as cidades do Brasil.</p></div><b>{weeklyCandidates.length} participantes</b></div><div className="listTable">{weeklyCandidates.map(p=>{const ranked=rank.find(x=>x.id===p.id);return <div className={`listRow ${p.id===session.user.id?'myRankRow':''}`} key={`candidate-${p.id}`}><span className="rankNum">{ranked?`#${rank.findIndex(x=>x.id===p.id)+1}`:'—'}</span><button className="plainBtn" onClick={()=>openProfile(p)}><Avatar profile={p}/></button><div className="grow"><div className="nameWithSeal"><button className="linkName" onClick={()=>openProfile(p)}>{p.full_name||p.username}</button><Seal type={sealTypeFor(p)} color={p.seal_color}/>{p.id===session.user.id&&<span className="youPill">VOCÊ</span>}</div><small>@{p.username} • {ranked?`${ranked.votes||0} voto(s)`:'ainda sem votos'}</small></div>{p.id!==session.user.id?<button className={currentVote===p.id?'smallBtn chosen':'smallBtn'} onClick={()=>voteCompetition(p,'week')}>{currentVote===p.id?'✓ Meu voto':'Votar'}</button>:<span className="youPill">SEU PERFIL</span>}</div>})}{!weeklyCandidates.length&&<p className="muted">Nenhum participante disponível nesta cidade.</p>}</div></div>}</>}
      {popularView==='business'&&<div className="panel"><div className="panelTitle"><div><h2>Estabelecimentos em destaque</h2><p>Os estabelecimentos aparecem conforme avaliações e atividade local.</p></div></div><div className="ownerUserList">{topBusinesses.map(b=><button className="ownerUserRow clickable" key={b.id} onClick={()=>loadBusiness(b.id)}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name} <Seal type="business"/></b><small>{b.category||'Estabelecimento local'} • {b.city||''} - {b.state||''}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></button>)}{!topBusinesses.length&&<p className="muted">Nenhum estabelecimento em destaque nesta cidade ainda.</p>}</div></div>}
    </>
  }

  function BusinessScreen(){
    if(selectedBusiness){
      const mine=selectedBusiness.owner_id===session.user.id;
      return <><button className="backBtn" onClick={()=>setSelectedBusiness(null)}>← Voltar para estabelecimentos</button>
        <div className="businessHero" style={selectedBusiness.cover_url?{backgroundImage:`linear-gradient(90deg,rgba(8,15,30,.85),rgba(8,15,30,.25)),url(${selectedBusiness.cover_url})`}:{}}><Avatar profile={{avatar_url:selectedBusiness.logo_url}} name={selectedBusiness.name} size="xl"/><div><h1>{selectedBusiness.name}</h1><p>@{selectedBusiness.username||'comercio'} • {selectedBusiness.category||'Estabelecimento local'}</p><span>★ {Number(selectedBusiness.rating_average||0).toFixed(1)} ({selectedBusiness.reviews_count||0} avaliações)</span></div>{selectedBusiness.owner_id&&selectedBusiness.owner_id!==session.user.id&&<button className="primaryBtn" onClick={async()=>{const {data}=await supabase.from('profiles').select('*').eq('id',selectedBusiness.owner_id).maybeSingle();if(data)openChat(data)}}>Mensagem</button>}</div>
        <div className="twoCol"><div>
          <div className="panel"><h2>Sobre</h2><p>{selectedBusiness.description||'Este estabelecimento ainda não adicionou uma descrição.'}</p><div className="infoGrid"><span>📍 {selectedBusiness.address||`${selectedBusiness.city} - ${selectedBusiness.state}`}</span>{selectedBusiness.whatsapp&&<span>📱 {selectedBusiness.whatsapp}</span>}{selectedBusiness.website&&<span>🌐 {selectedBusiness.website}</span>}</div></div>
          {mine&&<div className="panel"><h2>Publicar como estabelecimento</h2><section className="composer businessComposer"><div className="row"><Avatar profile={{avatar_url:selectedBusiness.logo_url}} name={selectedBusiness.name} size="sm"/><textarea rows={2} value={businessPostText} onChange={e=>setBusinessPostText(e.target.value)} placeholder={`Divulgue novidades, produtos ou serviços de ${selectedBusiness.name}`}/></div>{businessPostPreview&&<div className="previewWrap"><img src={businessPostPreview} alt="Prévia do estabelecimento"/><button onClick={()=>{setBusinessPostFile(null);setBusinessPostPreview('')}}>×</button></div>}<div className="actions"><input ref={businessPostFileRef} type="file" accept="image/*" hidden onChange={e=>chooseBusinessPostFile(e.target.files?.[0])}/><button onClick={()=>businessPostFileRef.current?.click()}>▧ Foto do produto/serviço</button><button className="publish" disabled={busy||(!businessPostText.trim()&&!businessPostFile)} onClick={()=>publishPost({text:businessPostText,file:businessPostFile,city:selectedBusiness.city,state:selectedBusiness.state,business:selectedBusiness,after:()=>loadBusiness(selectedBusiness.id)})}>{busy?'Publicando...':'➤ Publicar'}</button></div></section></div>}
          <div className="panel"><h2>Publicações do estabelecimento</h2>{businessPosts.length?<div className="feed">{businessPosts.map(p=>PostCard({post:p,authors:businessPostAuthors,bizMap:{[selectedBusiness.id]:selectedBusiness},interactive:false}))}</div>:<p className="muted">Este estabelecimento ainda não publicou nada.</p>}</div>
          <div className="panel"><h2>Avaliações</h2>{selectedBusiness.owner_id!==session.user.id&&<form className="stackForm" onSubmit={submitReview}><label>Nota<select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:e.target.value})}><option value="5">5 - Excelente</option><option value="4">4 - Muito bom</option><option value="3">3 - Bom</option><option value="2">2 - Regular</option><option value="1">1 - Ruim</option></select></label><label>Comentário<textarea value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Conte sua experiência"/></label><button className="primaryBtn">Salvar avaliação</button></form>}{businessReviews.length?businessReviews.map(r=>{const a=reviewAuthors[r.author_id]||{};return <div className="review" key={r.id}><Avatar profile={a} size="xs"/><div><b>{a.full_name||a.username||'Usuário'} • {'★'.repeat(r.rating)}</b><p>{r.comment||'Sem comentário.'}</p><small>{fmtDate(r.created_at)}</small></div></div>}):<p className="muted">Ainda não há avaliações.</p>}</div>
        </div><div>{mine&&<form className="panel stackForm" onSubmit={updateBusiness}><h2>Editar estabelecimento</h2><label>Nome<input value={businessEdit?.name||''} onChange={e=>setBusinessEdit(v=>({...v,name:e.target.value}))}/></label><label>@Usuário<input value={businessEdit?.username||''} onChange={e=>setBusinessEdit(v=>({...v,username:e.target.value}))}/></label><label>Categoria<select value={businessEdit?.category||''} onChange={e=>setBusinessEdit(v=>({...v,category:e.target.value}))}><option value="">Selecione</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Descrição<textarea value={businessEdit?.description||''} onChange={e=>setBusinessEdit(v=>({...v,description:e.target.value}))}/></label><label>Endereço<input value={businessEdit?.address||''} onChange={e=>setBusinessEdit(v=>({...v,address:e.target.value}))}/></label><label>WhatsApp<input value={businessEdit?.whatsapp||''} onChange={e=>setBusinessEdit(v=>({...v,whatsapp:e.target.value}))}/></label><label>Site<input value={businessEdit?.website||''} onChange={e=>setBusinessEdit(v=>({...v,website:e.target.value}))}/></label><label>Logo<input type="file" accept="image/*" onChange={e=>uploadBusinessImage('logo_url',e.target.files?.[0])}/></label><label>Capa<input type="file" accept="image/*" onChange={e=>uploadBusinessImage('cover_url',e.target.files?.[0])}/></label><button className="primaryBtn" disabled={busy}>Salvar estabelecimento</button></form>}</div></div>
      </>
    }
    return <><PageHeader title="Estabelecimentos" subtitle={`Descubra e avalie os melhores estabelecimentos de ${cityLabel}.`}/><div className="businessGrid">{businesses.map(b=><button className="businessCard" key={b.id} onClick={()=>loadBusiness(b.id)}><div className="businessCover" style={b.cover_url?{backgroundImage:`url(${b.cover_url})`}:{}}></div><Avatar profile={{avatar_url:b.logo_url}} name={b.name} size="lg"/><h3>{b.name}</h3><p>{b.category||'Estabelecimento local'}</p><strong>★ {Number(b.rating_average||0).toFixed(1)} • {b.reviews_count||0} avaliações</strong></button>)}</div>{!businesses.length&&<Empty title="Ainda não há estabelecimentos cadastrados.">Cadastre o primeiro estabelecimento da cidade.</Empty>}
      <form className="panel stackForm" onSubmit={saveBusiness}><h2>Cadastre seu estabelecimento</h2><p className="muted">O estabelecimento fica vinculado à sua conta e à sua cidade.</p><div className="formGrid"><label>Nome<input required value={businessForm.name} onChange={e=>setBusinessForm({...businessForm,name:e.target.value})}/></label><label>@Usuário<input required value={businessForm.username} onChange={e=>setBusinessForm({...businessForm,username:e.target.value})}/></label><label>Categoria<select required value={businessForm.category} onChange={e=>setBusinessForm({...businessForm,category:e.target.value})}><option value="">Selecione</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Endereço<input value={businessForm.address} onChange={e=>setBusinessForm({...businessForm,address:e.target.value})}/></label><label>WhatsApp<input value={businessForm.whatsapp} onChange={e=>setBusinessForm({...businessForm,whatsapp:e.target.value})}/></label><label>Site<input value={businessForm.website} onChange={e=>setBusinessForm({...businessForm,website:e.target.value})}/></label></div><label>Descrição<textarea value={businessForm.description} onChange={e=>setBusinessForm({...businessForm,description:e.target.value})}/></label><button className="primaryBtn" disabled={busy}>Cadastrar estabelecimento</button></form>
    </>
  }

  function PersonalNotificationsPanel(){
    const label={post_like:'curtiu sua publicação',comment:'comentou na sua publicação',reply:'respondeu seu comentário',comment_like:'curtiu seu comentário',post_mention:'marcou você em uma publicação',comment_mention:'marcou você em um comentário',message:'enviou uma mensagem'};
    return <div className="panel personalNotificationsPanel"><div className="panelTitle"><div><h2>🔔 Notificações</h2><p>Curtidas, comentários, marcações e mensagens para você.</p></div>{unreadPersonalNotificationCount>0&&<button className="secondaryBtn" onClick={markAllNotificationsRead}>Marcar tudo como lido</button>}</div><div className="personalNotificationList">{personalNotifications.slice(0,30).map(n=>{const actor=notificationActors[n.actor_id]||{};return <button key={n.id} className={`personalNotificationRow ${n.read_at?'':'unread'}`} onClick={()=>markNotificationRead(n)}><Avatar profile={actor} size="xs"/><div><b>{actor.full_name||actor.username||'Alguém'} {label[n.type]||'interagiu com você'}</b><small>{fmtDate(n.created_at)}</small></div>{!n.read_at&&<span className="notificationDot"/>}</button>})}{!personalNotifications.length&&<p className="muted">Nenhuma notificação pessoal ainda.</p>}</div></div>
  }

  function ProfileScreen(){
    const p=selectedProfile||profile; const own=p?.id===session.user.id; const ownerProfile=isInstitutionalOwner(p); const canFollow=!own&&(ownerProfile||sameCity(profile,p));
    const visiblePosts=profilePosts||[];
    return <><button className="backBtn" onClick={()=>{setSelectedProfile(profile);setActive(exploreCity?'Explorar Cidade':'Início')}}>← Voltar</button><section className="profileHero"><div className="profileCover">{p?.cover_url?<img src={p.cover_url} alt={`Capa de ${p?.full_name||p?.username||'perfil'}`}/>:<div className="profileCoverEmpty"/>}</div><div className="profileMain profileMainNoOverlap"><div className="profileAvatarFrame"><Avatar profile={p} name={p?.full_name} size="xxl"/></div><div className="grow"><div className="profileNameLine"><h1>{p?.full_name||p?.username}</h1><Seal type={sealTypeFor(p)} color={p.seal_color}/>{ownerProfile&&<span className="ownerTextTag big">Dono</span>}</div><p>@{p?.username||'usuario'} {!ownerProfile&&<>• 📍 {p?.city} - {p?.state}</>}</p>{p?.activity&&<span className="chip">{p.activity}</span>}</div><div className="profileActions">{own?<button className="primaryBtn" onClick={()=>setActive('Configurações')}>Editar perfil</button>:<>{canFollow&&<button className="primaryBtn" onClick={()=>toggleFollow(p)}>{following.has(p.id)?'Deixar de seguir':'Seguir'}</button>}<button className="secondaryBtn" onClick={()=>openChat(p)}>Mensagem</button></>}</div></div></section><div className={`profileStats ${ownerProfile?'ownerProfileStats':''}`}><button onClick={()=>openFollowList(p,'followers')}><b>{p?.followers_count||0}</b><span>Seguidores</span></button><button onClick={()=>openFollowList(p,'following')}><b>{p?.following_count||0}</b><span>Seguindo</span></button>{!ownerProfile&&<div><b>{p?.city||'-'}</b><span>Cidade</span></div>}</div>{own&&<PersonalNotificationsPanel/>}<div className="panel"><h2>Sobre</h2><p>{p?.bio||'Este perfil ainda não escreveu uma bio.'}</p>{p?.public_phone&&<p>📱 {p.public_phone}</p>}{p?.website&&<p>🌐 {p.website}</p>}</div>{!ownerProfile&&<><div className="panel profileRankingPanel"><div className="panelTitle"><div><h2>🏆 Posição nos Rankings</h2><p>A posição atual deste perfil na cidade.</p></div></div><div className="profileRankGrid"><div><span>👑 Popular</span><b>{profileRankPositions.popular?`#${profileRankPositions.popular}`:'—'}</b><small>{profileRankPositions.popular?'Classificado':'Ainda não classificado'}</small></div><div><span>🗳️ Semanal</span><b>{profileRankPositions.week?`#${profileRankPositions.week}`:'—'}</b><small>{profileRankPositions.week?'Classificado':'Ainda não classificado'}</small></div><div><span>🏆 Mensal</span><b>{profileRankPositions.month?`#${profileRankPositions.month}`:'—'}</b><small>{profileRankPositions.month?'Classificado':'Ainda não classificado'}</small></div><div><span>♛ Anual</span><b>{profileRankPositions.year?`#${profileRankPositions.year}`:'—'}</b><small>{profileRankPositions.year?'Classificado':'Ainda não classificado'}</small></div></div><div className="profileFutureRanks"><span>🗺️ Estado <b>EM BREVE</b></span><span>🇧🇷 Brasil <b>EM BREVE</b></span></div></div><div className="panel"><h2>Medalhas e Troféus</h2>{profileAwards.length?<div className="awardsGrid">{profileAwards.map((a,i)=><div className={`awardCard ${a.title.includes('Ano')?'awardYear':a.title.includes('Mês')?'awardMonth':a.title.includes('Semana')?'awardWeek':a.title.includes('Popular')?'awardPopular':'awardLocal'}`} key={`${a.title}-${i}`}><span className="awardIcon">{a.icon}</span><div><b>{a.title}</b><small>{a.text}</small></div></div>)}</div>:<p className="muted">Este perfil ainda não conquistou medalhas.</p>}</div></>}<div className="panel profileFeedPanel"><div className="panelTitle"><div><h2>{ownerProfile?'📣 Publicações CIDARANK':'📰 Publicações do perfil'}</h2><p>{ownerProfile?'Anúncios, novidades e atualizações oficiais.':'Postagens públicas deste perfil.'}</p></div>{ownerProfile&&own&&visiblePosts.length>0&&<button className="dangerBtn" onClick={deleteAllOwnerPosts}>🗑 Limpar tudo</button>}</div><div className="feed">{visiblePosts.length?visiblePosts.map(post=>PostCard({post,authors:profilePostAuthors,interactive:ownerProfile&&own,officialFeed:ownerProfile})):<p className="muted">Ainda não há publicações neste perfil.</p>}</div></div>{!canFollow&&!own&&!ownerProfile&&<div className="infoBanner">Você está visitando um perfil de outra cidade. O ranking por seguidores considera conexões locais.</div>}{followModal&&<div className="followModalOverlay" onClick={()=>setFollowModal(null)}><div className="followModal" onClick={e=>e.stopPropagation()}><div className="followModalHead"><h3>{followModal==='followers'?'Seguidores':'Seguindo'}</h3><button onClick={()=>setFollowModal(null)}>×</button></div><div className="directorySearchBox">🔎<input value={followSearch} onChange={e=>setFollowSearch(e.target.value)} placeholder="Pesquisar pessoa..."/></div><div className="followList">{followList.filter(x=>`${x.full_name||''} ${x.username||''}`.toLowerCase().includes(followSearch.toLowerCase())).map(x=><button key={x.id} onClick={()=>{setFollowModal(null);openProfile(x)}}><Avatar profile={x} size="sm"/><div><b>{x.full_name||x.username}</b><small>@{x.username}</small></div></button>)}</div></div></div>}</>
  }


  function SettingsScreen(){return <><button className="backBtn" onClick={openOwnProfile}>← Voltar ao perfil</button><PageHeader title="Configurações" subtitle="Edite seu perfil. Sua cidade permanece vinculada ao cadastro."/><form className="panel stackForm settingsForm" onSubmit={saveSettings}><div className="mediaSettings"><div><Avatar profile={{avatar_url:settings.avatar_url}} name={settings.full_name} size="xl"/><label className="uploadBtn">{avatarUploading?'Enviando...':'Trocar foto'}<input type="file" hidden accept="image/*" onChange={e=>uploadProfileImage('avatar_url',e.target.files?.[0])}/></label></div><div className="coverPreview" style={settings.cover_url?{backgroundImage:`url(${settings.cover_url})`}:{}}><small className="coverSizeNote">Tamanho recomendado: 1920 × 700 px • JPG/PNG/WEBP</small><label className="uploadBtn">{coverUploading?'Enviando...':'Trocar capa'}<input type="file" hidden accept="image/*" onChange={e=>uploadProfileImage('cover_url',e.target.files?.[0])}/></label></div></div><div className="formGrid"><label>Nome completo<input required value={settings.full_name} onChange={e=>setSettings({...settings,full_name:e.target.value})}/></label><label>@Usuário<input required value={settings.username} onChange={e=>setSettings({...settings,username:e.target.value})}/></label><label>Atividade / profissão<input value={settings.activity} onChange={e=>setSettings({...settings,activity:e.target.value})} placeholder="Ex.: Comerciante, Estudante"/></label><label>Gênero<select value={settings.gender} onChange={e=>setSettings({...settings,gender:e.target.value})}><option value="">Não informar</option><option value="homem">Homem</option><option value="mulher">Mulher</option><option value="outros">Outros</option></select></label><label>Telefone público<input value={settings.public_phone} onChange={e=>setSettings({...settings,public_phone:e.target.value})}/></label><label>Site<input value={settings.website} onChange={e=>setSettings({...settings,website:e.target.value})}/></label><label>Cidade<input value={profile.city||''} disabled/></label><label>Estado<input value={profile.state||''} disabled/></label></div><label>Bio<textarea rows={4} value={settings.bio} onChange={e=>setSettings({...settings,bio:e.target.value})} placeholder="Conte um pouco sobre você"/></label><button className="primaryBtn" disabled={busy}>Salvar alterações</button></form></>}

  function ExploreRankings(){
    const ep=(exploreData.people||[]).filter(p=>!isInstitutionalOwner(p)), ev=exploreData.votes||[];
    const popular=[...ep].filter(p=>(p.followers_count||0)>0).sort((a,b)=>(b.followers_count||0)-(a.followers_count||0));
    const weekly=rankFromData('week',ep,ev), monthly=rankFromData('month',ep,ev), yearly=rankFromData('year',ep,ev);
    const views={week:{label:'Semanal',title:'🗳️ Ranking Semanal',list:weekly,metric:'votes'},month:{label:'Mensal',title:'🏆 Melhor do Mês',list:monthly,metric:'points'},year:{label:'Anual',title:'👑 Melhor do Ano',list:yearly,metric:'points'},city:{label:'Popular',title:'❤️ Mais Popular da Cidade',list:popular,metric:'followers'}};
    const current=views[exploreRankView]||views.week; const list=current.list.slice(0,3); const order=[list[1],list[0],list[2]].filter(Boolean);
    const metric=p=>current.metric==='followers'?`${p.followers_count||0} seguidores`:current.metric==='votes'?`${p.votes||0} votos`:`${p.points||0} pontos`;
    return <section className="panel exploreRankings modernExploreRank"><div className="panelTitle"><div><span className="eyebrow">EXPLORANDO A CIDADE</span><h2>🏆 Ranking de {exploreCity}</h2><p>Veja quem está em destaque em {exploreCity} - {exploreState}.</p></div><span className="livePill">● AO VIVO</span></div><div className="rankSwitcher">{Object.entries(views).map(([k,v])=><button key={k} className={exploreRankView===k?'active':''} onClick={()=>setExploreRankView(k)}>{v.label}</button>)}<button className="locked" disabled>Estado <small>EM BREVE</small></button><button className="locked" disabled>Brasil <small>EM BREVE</small></button></div><div className="explorePodiumStage podiumWithNationalBg explorePodiumWithBanner" style={{'--podium-bg':`url(${bannerForRank(exploreRankView)})`}}><div className="floatingPodiumTitle"><h3>{current.title}</h3><small>TOP 3 de {exploreCity}</small></div>{list.length?<div className="floatingPodium exploreFloatingPodium">{order.map(p=>{const pos=list.findIndex(x=>x.id===p.id)+1;return <button className={`floatingWinner place${pos} animatedRankPerson`} key={p.id} onClick={()=>openProfile(p)}><span className="floatingPlace">{pos}</span><span className="floatingCrown">{pos===1?'♛':pos===2?'◆':'▲'}</span><span className="rankPhotoSquare"><Avatar profile={p} name={p.full_name} size={pos===1?'lg':'md'}/></span><div className="winnerIdentity"><b>{p.full_name||p.username}</b><Seal type={sealTypeFor(p)} color={p.seal_color}/></div><small>@{p.username}</small><strong>{metric(p)}</strong><span className="podiumBase">{pos}º</span></button>})}</div>:<div className="rankEmptyState"><span>✨</span><b>Ainda não há classificados</b><small>Assim que houver votos, pontos ou seguidores válidos, o pódio aparece automaticamente.</small></div>}</div><div className="nationalRoadmap"><div><b>🏙️ Cidade</b><small>Ativo agora</small></div><div className="locked"><b>🗺️ Estado</b><small>EM BREVE</small></div><div className="locked"><b>🇧🇷 Brasil</b><small>EM BREVE</small></div></div></section>;
  }

  function ExploreScreen(){return <><PageHeader title="Explorar Cidade" subtitle="Visite qualquer cidade do Brasil sem alterar sua cidade de cadastro."/><div className="panel"><div className="exploreControls"><select value={exploreStateId} onChange={handleExploreState}><option value="">Escolha o estado</option>{states.map(s=><option key={s.id} value={s.id}>{s.nome} ({s.sigla})</option>)}</select><select value={exploreCity} disabled={!exploreStateId||exploreBusy} onChange={e=>{const city=e.target.value;setExploreCity(city);if(city)explore(city,exploreState)}}><option value="">Escolha a cidade</option>{exploreCities.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}</select><span className="autoExploreStatus">{exploreBusy?'⏳ Carregando...':exploreCity?'✓ Cidade carregada automaticamente':'Escolha Estado e Cidade'}</span></div></div>{exploreCity&&exploreData.posts.length+exploreData.people.length+exploreData.businesses.length>=0&&<><div className="cityVisitHero"><span>VISITANDO</span><h1>{exploreCity} - {exploreState}</h1><p>Seu cadastro continua em {cityLabel}.</p></div><ExploreRankings/><div className="panel"><h2>Publicar nesta cidade</h2>{Composer({text:explorePostText,setText:setExplorePostText,onPublish:()=>publishPost({text:explorePostText,file:postFile,city:exploreCity,state:exploreState,after:explore})})}</div><div className="twoCol"><div className="panel"><h2>Pessoas em destaque</h2>{!exploreData.people.length&&<p className="muted">Nenhuma pessoa cadastrada nesta cidade ainda.</p>}{exploreData.people.slice(0,10).map((p,i)=><div className="listRow" key={p.id}><b>#{i+1}</b><Avatar profile={p}/><div className="grow"><button className="linkName" onClick={()=>openProfile(p)}>{p.full_name||p.username}</button><small>@{p.username}</small></div><strong>{p.followers_count||0}</strong></div>)}</div><div className="panel"><h2>Estabelecimentos</h2>{!exploreData.businesses.length&&<p className="muted">Nenhum estabelecimento cadastrado nesta cidade ainda.</p>}{exploreData.businesses.slice(0,10).map(b=><button className="listRow clickable" key={b.id} onClick={()=>loadBusiness(b.id)}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name}</b><small>{b.category||'Estabelecimento local'}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></button>)}</div></div><h2 className="sectionHeading">Publicações de {exploreCity}</h2>{exploreData.posts.length?exploreData.posts.map(p=>PostCard({post:p,authors:exploreData.authors,bizMap:exploreData.postBusinesses,interactive:false})):<Empty title="Ainda não há publicações nesta cidade."/>}</>}</>}

  function MessagesScreen(){
    const conversations={};
    for(const m of daquitop_messages){const other=m.sender_id===session.user.id?m.recipient_id:m.sender_id;const prev=conversations[other];if(!prev||new Date(m.created_at)>new Date(prev.created_at))conversations[other]=m}
    const convoIds=Object.keys(conversations).sort((a,b)=>new Date(conversations[b].created_at)-new Date(conversations[a].created_at));
    const chatMessages=selectedChat?daquitop_messages.filter(m=>(m.sender_id===session.user.id&&m.recipient_id===selectedChat.id)||(m.sender_id===selectedChat.id&&m.recipient_id===session.user.id)):[];
    return <>{exploreCity&&<div className="visitChatReturn"><button onClick={()=>setActive('Explorar Cidade')}>← Voltar para {exploreCity}</button><span>Você está visitando {exploreCity} - {exploreState}</span></div>}<div className="messageBackRow"><button className="backBtn" onClick={()=>setActive(exploreCity?'Explorar Cidade':'Início')}>← Voltar</button></div><PageHeader title="Mensagens" subtitle="Conversas privadas entre pessoas do CIDARANK."/><div className="daquitop_messagesLayout"><div className="conversationList"><h3>Conversas</h3>{convoIds.map(id=>{const p=messagePeople[id]||{};const last=conversations[id];const unread=last.recipient_id===session.user.id&&!last.read_at;return <button className={`conversation ${selectedChat?.id===id?'active':''}`} key={id} onClick={()=>openChat(p)}><Avatar profile={p}/><div><b>{p.full_name||p.username||'Usuário'} {isInstitutionalOwner(p)&&<span className="ownerTextTag">Dono</span>}</b><small>{last.content.slice(0,50)}</small></div>{unread&&<i/>}</button>})}{!convoIds.length&&<p className="muted">Nenhuma conversa ainda.</p>}<h3>Começar conversa</h3>{people.filter(p=>p.id!==session.user.id).slice(0,12).map(p=><button className="conversation" key={p.id} onClick={()=>openChat(p)}><Avatar profile={p}/><div><b>{p.full_name||p.username}</b><small>@{p.username}</small></div></button>)}</div><div className="chatPanel">{selectedChat?<><div className="chatHead"><Avatar profile={selectedChat}/><div><b>{selectedChat.full_name||selectedChat.username} {isInstitutionalOwner(selectedChat)&&<span className="ownerTextTag">Dono</span>}</b><small>@{selectedChat.username}</small></div></div><div className="chatMessages">{chatMessages.map(m=><div className={`messageLine ${m.sender_id===session.user.id?'mine':''}`} key={m.id}><Avatar profile={m.sender_id===session.user.id?profile:selectedChat} size="xs"/><div className={`bubble ${m.sender_id===session.user.id?'mine':''}`}><div className="bubbleAuthor">{m.sender_id===session.user.id?(isOwner?<span className="ownerTextTag">Dono</span>:displayName):(isInstitutionalOwner(selectedChat)?<span className="ownerTextTag">Dono</span>:selectedChat.full_name||selectedChat.username)}</div>{m.content}<small>{fmtDate(m.created_at)}</small></div></div>)}</div><form className="chatInput" onSubmit={sendMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Digite uma mensagem..."/><button>Enviar</button></form></>:<Empty title="Selecione uma conversa.">Você também pode abrir o perfil de alguém e clicar em Mensagem.</Empty>}</div></div></>
  }


  function DirectoryScreen({kind}){
    const isPeople=kind==='people';
    const q=directorySearch.trim().toLowerCase();
    const list=isPeople?people.filter(p=>p.account_type!=='business'&&!isInstitutionalOwner(p)&&`${p.full_name||''} ${p.username||''} ${p.activity||''}`.toLowerCase().includes(q)):businesses.filter(b=>`${b.name||''} ${b.username||''} ${b.category||''}`.toLowerCase().includes(q));
    return <><PageHeader title={isPeople?'Buscar Pessoas':'Buscar Estabelecimentos'} subtitle={`Pesquisa local em ${cityLabel}.`}/><div className="panel directorySearchPanel"><div className="directorySearchBox">🔎<input autoFocus value={directorySearch} onChange={e=>setDirectorySearch(e.target.value)} placeholder={isPeople?'Nome, @usuário ou profissão':'Nome, categoria ou @usuário'}/></div><p className="muted">Resultados somente da cidade ativa. A estrutura funciona da mesma forma em todas as cidades do Brasil.</p></div><div className="panel"><div className="listTable">{list.slice(0,100).map(item=>isPeople?<button className="listRow clickable" key={item.id} onClick={()=>openProfile(item)}><Avatar profile={item}/><div className="grow"><b>{item.full_name||item.username}</b><small>@{item.username}{item.activity?` • ${item.activity}`:''}</small></div></button>:<button className="listRow clickable" key={item.id} onClick={()=>loadBusiness(item.id)}><Avatar profile={{avatar_url:item.logo_url}} name={item.name}/><div className="grow"><b>{item.name}</b><small>{item.category||'Estabelecimento local'}</small></div><strong>★ {Number(item.rating_average||0).toFixed(1)}</strong></button>)}</div>{!list.length&&<p className="muted">Nenhum resultado encontrado.</p>}</div></>
  }

  function NotificationsScreen(){
    const unreadMessages=daquitop_messages.filter(m=>m.recipient_id===session.user.id&&!m.read_at);
    return <><PageHeader title="Notificações" subtitle={`Novidades de ${cityLabel}.`}/><div className="panel notificationList"><button className="primaryBtn markSeenBtn" onClick={()=>{const now=new Date().toISOString();try{localStorage.setItem('cidarank_last_seen_city_feed',now)}catch{}setLastSeenCityFeed(now)}}>Marcar mural como visto</button>{unreadMessages.map(m=>{const p=messagePeople[m.sender_id]||{};return <button className="notificationRow" key={`msg-${m.id}`} onClick={()=>openChat(p)}><span>💬</span><div><b>Nova mensagem de {p.full_name||p.username||'usuário'}</b><small>{fmtDate(m.created_at)}</small></div></button>})}{posts.slice(0,20).map(p=><button className="notificationRow" key={`post-${p.id}`} onClick={()=>{setActive('Início');try{const now=new Date().toISOString();localStorage.setItem('cidarank_last_seen_city_feed',now);setLastSeenCityFeed(now)}catch{}}}><span>📰</span><div><b>Publicação nova no mural</b><small>{fmtDate(p.created_at)}</small></div></button>)}{!unreadMessages.length&&!posts.length&&<p className="muted">Nenhuma novidade no momento.</p>}</div></>
  }

  function OwnerFeedScreen(){
    const actions=<div className="ownerFeedActions">{ownerPublicProfile&&<button className="secondaryBtn" onClick={()=>openProfile(ownerPublicProfile)}>Ver perfil CIDARANK</button>}{isOwner&&ownerPublicPosts.length>0&&<button className="dangerBtn" onClick={deleteAllOwnerPosts}>🗑 Limpar tudo</button>}</div>;
    return <><PageHeader title="Feed CIDARANK" subtitle="Anúncios, atualizações e publicações oficiais do CIDARANK." actions={actions}/>{isOwner&&Composer({text:postText,setText:setPostText,onPublish:async()=>{await publishPost();await loadOwnerPublicFeed()}})}<div className="feed">{ownerPublicPosts.length?ownerPublicPosts.map(p=>PostCard({post:p,authors:ownerPublicAuthors,interactive:isOwner,officialFeed:true})):<Empty title="Ainda não há publicações oficiais.">O CIDARANK pode publicar novidades aqui.</Empty>}</div></>
  }

  function OwnerPanelScreen(){
    if(!isAdmin)return <Empty title="Acesso restrito.">Somente o dono e administradores autorizados podem acessar esta área.</Empty>;
    const now=Date.now();
    const today=new Date(); today.setHours(0,0,0,0);
    const todayCount=list=>list.filter(x=>new Date(x.created_at||0)>=today).length;
    const locationMatch=row=>(!ownerStateFilter||String(row?.state||'').toUpperCase()===String(ownerStateFilter).toUpperCase())&&(!ownerCityFilter||locationKey(row?.city)===locationKey(ownerCityFilter));
    const monitoredUsers=ownerUsers.filter(locationMatch);
    const monitoredBusinesses=ownerBusinesses.filter(locationMatch);
    const monitoredPresence=ownerPresence.filter(locationMatch);
    const monitoredReports=ownerReports.filter(r=>{
      if(!ownerStateFilter&&!ownerCityFilter)return true;
      if(locationMatch(r))return true;
      const linkedId=r.target_user_id||r.reported_user_id||r.user_id||r.reporter_id||((r.target_type==='profile'||r.target_type==='user')?r.target_id:null);
      const linkedUser=ownerUsers.find(x=>x.id===linkedId);
      return linkedUser?locationMatch(linkedUser):false;
    });
    const monitoredTickets=ownerTickets.filter(t=>{
      if(!ownerStateFilter&&!ownerCityFilter)return true;
      if(t.requester_state||t.requester_city)return locationMatch({state:t.requester_state,city:t.requester_city});
      const u=ownerUsers.find(x=>x.id===t.user_id);
      return locationMatch(u||{});
    });
    const onlineIds=new Set(monitoredPresence.filter(x=>now-new Date(x.last_seen).getTime()<5*60*1000).map(x=>x.user_id));
    const filteredUsers=monitoredUsers.filter(u=>{
      const q=ownerSearch.trim().toLowerCase();
      const text=`${u.full_name||''} ${u.username||''} ${u.email||''} ${u.city||''} ${u.state||''}`.toLowerCase();
      return !q||text.includes(q);
    });
    const filteredBusinesses=monitoredBusinesses.filter(b=>{
      const q=ownerSearch.trim().toLowerCase();
      const text=`${b.name||''} ${b.username||''} ${b.category||''} ${b.city||''} ${b.state||''}`.toLowerCase();
      return !q||text.includes(q);
    });
    const scopeLabel=ownerStateFilter?(ownerCityFilter?`${ownerCityFilter} - ${ownerStateFilter}`:`Estado ${ownerStateFilter}`):'Brasil inteiro';
    const openReports=monitoredReports.filter(x=>!['resolved','dismissed'].includes(String(x.status||'')));
    const openTickets=monitoredTickets.filter(x=>x.status!=='resolvido');
    const supportStatusTickets=monitoredTickets.filter(t=>ownerSupportStatus==='all'||String(t.status||'aberto')===ownerSupportStatus);
    const reportStatusItems=monitoredReports.filter(r=>ownerReportStatus==='all'||String(r.status||'pending')===ownerReportStatus);
    const globalQ=ownerGlobalSearch.trim().toLowerCase();
    const globalUsers=globalQ?ownerUsers.filter(u=>`${u.full_name||''} ${u.username||''} ${u.city||''} ${u.state||''} ${u.activity||''}`.toLowerCase().includes(globalQ)).slice(0,8):[];
    const globalBusinesses=globalQ?ownerBusinesses.filter(b=>`${b.name||''} ${b.category||''} ${b.city||''} ${b.state||''}`.toLowerCase().includes(globalQ)).slice(0,8):[];
    const globalTickets=globalQ?ownerTickets.filter(t=>`${t.subject||''} ${t.requester_email||''} ${t.requester_username||''} ${t.requester_city||''} ${t.requester_state||''}`.toLowerCase().includes(globalQ)).slice(0,8):[];
    const admins=ownerUsers.filter(x=>['admin','moderator'].includes(String(x.role||'').toLowerCase()));
    const stats=[['Online agora',onlineIds.size],['Usuários',monitoredUsers.length],['Cadastros hoje',todayCount(monitoredUsers)],['Estabelecimentos',monitoredBusinesses.length],['Chamados abertos',openTickets.length],['Denúncias',openReports.length],['Admins',admins.length]];

    const nowRank=new Date();
    const rankVotes=ownerVotes.filter(v=>{
      if(ownerRankingPeriod==='city'||ownerRankingPeriod==='business')return false;
      if(ownerRankingPeriod==='week'&&(v.period_type!=='week'||v.period_key!==periodKey('week')))return false;
      if(['month','year'].includes(ownerRankingPeriod)){
        if(v.period_type!=='week'||!v.created_at)return false; const d=new Date(v.created_at); if(d.getFullYear()!==nowRank.getFullYear())return false; if(ownerRankingPeriod==='month'&&d.getMonth()!==nowRank.getMonth())return false;
      }
      if(ownerStateFilter&&stateKey(v.state_key||v.state)!==stateKey(ownerStateFilter))return false;
      if(ownerCityFilter&&cityKey(v.city_key||v.city)!==cityKey(ownerCityFilter))return false;
      return true;
    });
    const rankMap={};
    if(ownerRankingPeriod==='week'){for(const v of rankVotes){const k=v.candidate_id||v.user_id||v.profile_id;if(k)rankMap[k]=(rankMap[k]||0)+1}}
    else if(['month','year'].includes(ownerRankingPeriod)){const groups={};for(const v of rankVotes){const wk=v.period_key;groups[wk]??={};groups[wk][v.candidate_id]=(groups[wk][v.candidate_id]||0)+1}const scale=[100,80,65,50,40,30,20,15,10,5];Object.values(groups).forEach(g=>Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([id],i)=>rankMap[id]=(rankMap[id]||0)+scale[i]))}
    const topRank=Object.entries(rankMap).map(([id,count])=>({user:ownerUsers.find(x=>x.id===id),count})).filter(x=>x.user&&String(x.user.role||'').toLowerCase()!=='owner'&&locationMatch(x.user)).sort((a,b)=>b.count-a.count||(b.user?.followers_count||0)-(a.user?.followers_count||0)).slice(0,50);
    const monitoredLive=ownerLiveEvents.filter(e=>locationMatch(e.row||{}));

    const locationFilters=<div className="nationalMonitorBar ownerNationalSearchBar"><div><b>🗺️ Monitoramento nacional</b><small>{scopeLabel}</small></div><select value={ownerStateId} onChange={handleOwnerStateChange}><option value="">Todos os estados do Brasil</option>{states.map(s=><option key={s.id} value={s.id}>{s.nome} ({s.sigla})</option>)}</select><select value={ownerCityFilter} disabled={!ownerStateId||ownerLocationBusy} onChange={e=>setOwnerCityFilter(e.target.value)}><option value="">{ownerLocationBusy?'Carregando cidades...':'Todas as cidades'}</option>{ownerCities.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}</select><button className="primaryBtn ownerSearchScopeBtn" onClick={ownerSearchNationalUsers} disabled={ownerBusy||ownerLocationBusy}>🔎 {ownerBusy?'Pesquisando...':'Pesquisar'}</button><button className="secondaryBtn" onClick={ownerSaveNationalScope}>💾 Salvar</button><button className="secondaryBtn" onClick={()=>{setOwnerStateId('');setOwnerStateFilter('');setOwnerCityFilter('');setOwnerCities([]);setTimeout(ownerSearchNationalUsers,0)}}>Brasil inteiro</button></div>;

    return <>
      <PageHeader title={isOwner?"Central do Dono":"Administração CIDARANK"} subtitle={isOwner?"Controle máximo, expansão e monitoramento nacional do CIDARANK.":"Suporte, moderação e monitoramento operacional nacional."} actions={<button className="primaryBtn" onClick={loadOwnerData}>{ownerBusy?'Atualizando...':'Atualizar agora'}</button>}/>
      <div className="ownerRealtimeBar"><span className={ownerRealtimeConnected?'liveDot on':'liveDot'}></span><b>{ownerRealtimeConnected?'TEMPO REAL CONECTADO':'TEMPO REAL AGUARDANDO'}</b><small>Última leitura: {ownerHealth.lastCheck?fmtDate(ownerHealth.lastCheck):'—'}</small></div>
      <div className="ownerTabs">{(isOwner?[
        ['dashboard','📊 Visão geral'],['tempo','⚡ Tempo real'],['usuarios','👥 Usuários'],['moderacao','🛡️ Moderação'],['comercios','🏪 Estabelecimentos'],['rankings','🏆 Rankings'],['suporte','🎫 Suporte'],['equipe','👑 Equipe'],['expansao','🌎 Expansão'],['comunicados','📢 Comunicados'],['banner','🖼️ Banner'],['auditoria','📜 Auditoria'],['sistema','⚙️ Sistema']
      ]:[['dashboard','📊 Visão geral'],['tempo','⚡ Tempo real'],['usuarios','👥 Usuários'],['moderacao','🛡️ Moderação'],['comercios','🏪 Estabelecimentos'],['rankings','🏆 Rankings'],['suporte','🎫 Suporte'],['sistema','⚙️ Monitoramento']]).map(([id,label])=><button key={id} className={ownerTab===id?'active':''} onClick={()=>setOwnerTab(id)}>{label}</button>)}</div>
      {['dashboard','tempo','usuarios','moderacao','comercios','rankings','suporte'].includes(ownerTab)&&locationFilters}

      {ownerTab==='dashboard'&&<><div className="scopeTitle"><span>VISÃO ATUAL</span><b>{scopeLabel}</b></div><div className="ownerStats deep">{stats.map(([label,value])=><div className="ownerStat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="adminGrid"><div className="panel"><h2>Conta proprietária</h2><div className="ownerIdentity"><Avatar profile={profile} name={displayName} size="lg"/><div><b>{displayName}</b><small>{session?.user?.email}</small><Seal type={isOwner?'owner':'admin'}/></div></div><p className="muted">O dono principal não pode ser removido por administradores.</p></div><div className="panel"><h2>Alertas principais</h2><div className="healthLine"><span>Contas suspensas</span><b>{monitoredUsers.filter(x=>x.is_suspended).length}</b></div><div className="healthLine"><span>Estabelecimentos suspensos</span><b>{monitoredBusinesses.filter(x=>x.is_suspended).length}</b></div><div className="healthLine"><span>Chamados pendentes</span><b>{openTickets.length}</b></div><div className="healthLine"><span>Denúncias pendentes</span><b>{openReports.length}</b></div></div></div><div className="panel"><h2>🔎 Busca administrativa global</h2><p className="muted">Pesquise pessoas, @usuário, cidade, estado, estabelecimento, chamado ou e-mail registrado no suporte.</p><input placeholder="Pesquisar em toda a administração..." value={ownerGlobalSearch} onChange={e=>setOwnerGlobalSearch(e.target.value)}/>{globalQ&&<div className="ownerUserList">{globalUsers.map(u=><div className="listRow" key={`gu-${u.id}`}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username}</b><small>@{u.username||''} • {u.city||''} - {u.state||''}</small></div><Seal type={String(u.role||'').toLowerCase()==='owner'?'owner':String(u.role||'').toLowerCase()==='admin'?'admin':'user'}/></div>)}{globalBusinesses.map(b=><div className="listRow" key={`gb-${b.id}`}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name}</b><small>{b.category||'Estabelecimento'} • {b.city||''} - {b.state||''}</small></div><Seal type="business"/></div>)}{globalTickets.map(t=><div className="listRow" key={`gt-${t.id}`}><div className="grow"><b>🎫 {t.subject}</b><small>{t.requester_email||t.requester_username||'Usuário'} • {t.requester_city||''} - {t.requester_state||''}</small></div><span className={`status ${t.status}`}>{String(t.status||'aberto').replace('_',' ')}</span></div>)}{!globalUsers.length&&!globalBusinesses.length&&!globalTickets.length&&<p className="muted">Nenhum resultado encontrado.</p>}</div>}</div></>}

      {ownerTab==='tempo'&&<div className="adminGrid"><div className="panel"><h2>Usuários online agora — {scopeLabel}</h2>{monitoredPresence.filter(x=>onlineIds.has(x.user_id)).slice(0,100).map(x=>{const u=ownerUsers.find(y=>y.id===x.user_id)||{};return <div className="listRow" key={x.user_id}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username||'Usuário'}</b><small>{x.page||'CIDARANK'} • {x.city||''} {x.state||''}</small></div><span className="onlineBadge">ONLINE</span></div>})}{!onlineIds.size&&<p className="muted">Nenhum usuário ativo neste recorte nos últimos 5 minutos.</p>}</div><div className="panel"><h2>Eventos importantes ao vivo</h2><p className="muted">Para não lotar a administração, publicações comuns não entram aqui.</p>{monitoredLive.slice(0,40).map(e=><div className="liveEvent" key={e.id}><b>{e.type}</b><small>{fmtDate(e.at)}</small><span>{e.row?.city||''} {e.row?.state||''}</span></div>)}{!monitoredLive.length&&<p className="muted">Aguardando novos cadastros, estabelecimentos ou chamados.</p>}</div></div>}

      {ownerTab==='usuarios'&&<div className="panel"><div className="adminSearchOnly ownerUserSearchLine"><input placeholder="Pesquisar nome, @usuário, e-mail ou cidade" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')ownerSearchNationalUsers()}}/><button className="primaryBtn" onClick={ownerSearchNationalUsers} disabled={ownerBusy}>🔎 Pesquisar</button></div><div className="sealLegend"><span><Seal type="owner"/> Dono</span><span><Seal type="admin"/> ADM</span><span><Seal type="verified" color="blue"/> Verificado</span><span><Seal type="business"/> Estabelecimento</span></div><p className="muted">{filteredUsers.length} usuário(s) em {scopeLabel}.</p><div className="ownerUserList">{filteredUsers.map(u=><div className="ownerUserRow" key={u.id}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username||'Usuário'} {u.verified&&<Seal type="verified" color={u.seal_color}/>} {onlineIds.has(u.id)&&<span className="onlineBadge">ONLINE</span>}</b><small>@{u.username||'semusuario'} • {u.city||'Sem cidade'} - {u.state||''}</small><small><Seal type={String(u.role||'').toLowerCase()==='owner'?'owner':String(u.role||'').toLowerCase()==='admin'?'admin':'user'}/> {u.is_suspended?'• SUSPENSO':''}</small></div><div className="ownerActions"><select value={String(u.role||'user').toLowerCase()} disabled={!isOwner||(u.id===session.user.id&&isOwner)} onChange={async e=>{const role=e.target.value;const {error}=await supabase.from('profiles').update({role,verified:role!=='user'||u.verified,updated_at:new Date().toISOString()}).eq('id',u.id);if(error)alert(error.message);else{await logAdminAction('user_seal_changed','user',u.id,{role});loadOwnerData()}}}><option value="user">● Usuário</option><option value="admin">🛡 Admin</option>{isOwner&&<option value="owner">♛ Dono</option>}</select>{isOwner&&<button onClick={()=>ownerToggleUser(u,'verified')}>{u.verified?'Remover selo':'Dar selo'}</button>}{isOwner&&u.verified&&<label className="sealColorPicker"><span>Cor do selo</span><select value={u.seal_color||'blue'} onChange={e=>ownerSetSealColor(u,e.target.value)}><option value="blue">🔵 Azul</option><option value="green">🟢 Verde</option><option value="gold">🟡 Dourado</option><option value="purple">🟣 Roxo</option><option value="pink">🌸 Rosa</option><option value="red">🔴 Vermelho</option><option value="cyan">💠 Ciano</option></select></label>}{isOwner&&u.id!==session.user.id&&<button onClick={()=>ownerToggleUser(u,'role')}>{String(u.role||'').toLowerCase()==='admin'?'Remover admin':'Tornar admin'}</button>}<button className={u.is_suspended?'safeBtn':'dangerBtn'} disabled={u.id===session.user.id||isOwnerEmail(u.email)} onClick={()=>ownerToggleUser(u,'is_suspended')}>{u.is_suspended?'Reativar':'Suspender'}</button></div></div>)}</div></div>}

      {ownerTab==='moderacao'&&<div className="panel"><div className="ownerTicketHead"><div><h2>Fila de moderação</h2><p className="muted">Denúncias organizadas por status, Estado e Cidade.</p></div><select value={ownerReportStatus} onChange={e=>setOwnerReportStatus(e.target.value)}><option value="all">Todos os status</option><option value="pending">Pendentes</option><option value="in_review">Em análise</option><option value="resolved">Resolvidos</option><option value="dismissed">Arquivados</option></select></div>{reportStatusItems.map(r=>{const assigned=ownerUsers.find(x=>x.id===r.assigned_to);return <div className="reportRow" key={r.id}><b>{r.reason||r.category||'Denúncia'}</b><small>{r.target_type} • {fmtDate(r.created_at)} • Status: {r.status||'pending'}</small><small>Responsável: {assigned?(assigned.full_name||assigned.username):'Ainda não atribuído'}</small><p>{r.details||'Sem detalhes.'}</p><div className="ownerActions">{!['resolved','dismissed'].includes(String(r.status||''))&&<button onClick={()=>ownerAssignReport(r)}>Assumir análise</button>}{r.target_type==='post'&&<><button className="dangerBtn" onClick={()=>ownerHideReportedPost(r,true)}>👁 Ocultar publicação</button><button onClick={()=>ownerHideReportedPost(r,false)}>↩ Restaurar</button></>}<button className="safeBtn" onClick={()=>ownerResolveReport(r,'resolved')}>Resolver</button><button onClick={()=>ownerResolveReport(r,'dismissed')}>Arquivar</button></div></div>})}{!reportStatusItems.length&&<p className="muted">Nenhuma denúncia neste filtro.</p>}</div>}

      {ownerTab==='comercios'&&<div className="panel"><div className="adminSearchOnly"><input placeholder="Pesquisar estabelecimento ou categoria" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)}/></div><p className="muted">{filteredBusinesses.length} estabelecimento(s) em {scopeLabel}.</p><div className="ownerUserList">{filteredBusinesses.map(b=><div className="ownerUserRow" key={b.id}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name} {b.verified&&<span className="verifiedBadge">✓ VERIFICADO</span>}</b><small>{b.category||'Estabelecimento'} • {b.city||''} - {b.state||''}</small><small>★ {Number(b.rating_average||0).toFixed(1)} • {b.reviews_count||0} avaliações {b.is_suspended?'• SUSPENSO':''}</small></div><div className="ownerActions"><button onClick={()=>ownerToggleBusiness(b,'verified')}>{b.verified?'Remover selo':'Verificar'}</button><button className={b.is_suspended?'safeBtn':'dangerBtn'} onClick={()=>ownerToggleBusiness(b,'is_suspended')}>{b.is_suspended?'Reativar':'Suspender'}</button></div></div>)}</div></div>}

      {ownerTab==='rankings'&&<><div className="rankingAdminHead"><div><h2>Monitoramento dos destaques e rankings</h2><p>{scopeLabel} • acompanhamento local por cidade, estado ou Brasil</p></div><div className="segmented wrap"><button className={ownerRankingPeriod==='city'?'active':''} onClick={()=>setOwnerRankingPeriod('city')}>Mais popular da cidade</button><button className={ownerRankingPeriod==='week'?'active':''} onClick={()=>setOwnerRankingPeriod('week')}>Ranking semanal</button><button className={ownerRankingPeriod==='month'?'active':''} onClick={()=>setOwnerRankingPeriod('month')}>Ranking mensal</button><button className={ownerRankingPeriod==='year'?'active':''} onClick={()=>setOwnerRankingPeriod('year')}>Ranking do ano</button><button className={ownerRankingPeriod==='business'?'active':''} onClick={()=>setOwnerRankingPeriod('business')}>Estabelecimentos em destaque</button></div></div>
      {ownerRankingPeriod==='city'&&<div className="adminGrid"><div className="panel"><h2>Mais populares — {scopeLabel}</h2>{[...monitoredUsers].filter(x=>x.account_type!=='business').sort((a,b)=>(b.followers_count||0)-(a.followers_count||0)).slice(0,50).map((u,i)=><div className="listRow" key={u.id}><b>#{i+1}</b><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username}</b><small>@{u.username||''} • {u.city||''} - {u.state||''}</small></div><strong>{u.followers_count||0} seguidores</strong></div>)}</div><div className="panel"><h2>Resumo</h2><div className="healthLine"><span>Pessoas neste recorte</span><b>{monitoredUsers.filter(x=>x.account_type!=='business').length}</b></div><div className="healthLine"><span>Online agora</span><b>{monitoredPresence.filter(x=>onlineIds.has(x.user_id)).length}</b></div></div></div>}
      {['week','month','year'].includes(ownerRankingPeriod)&&<div className="adminGrid"><div className="panel"><h2>{ownerRankingPeriod==='week'?'Ranking semanal':ownerRankingPeriod==='month'?'Ranking mensal':'Ranking do ano'} — {scopeLabel}</h2>{topRank.map((r,i)=><div className="listRow" key={r.user?.id||i}><b>#{i+1}</b><Avatar profile={r.user||{}}/><div className="grow"><b>{r.user?.full_name||r.user?.username||'Usuário'}</b><small>{r.user?.city||''} - {r.user?.state||''}</small></div><strong>{r.count} voto(s)</strong></div>)}{!topRank.length&&<p className="muted">Ainda não há votos neste período para {scopeLabel}.</p>}</div><div className="panel"><h2>Antifraude básico</h2><div className="healthLine"><span>Votos neste período/local</span><b>{rankVotes.length}</b></div><div className="healthLine"><span>Cadastros hoje</span><b>{todayCount(monitoredUsers)}</b></div><div className="healthLine"><span>Contas suspensas</span><b>{monitoredUsers.filter(x=>x.is_suspended).length}</b></div><p className="muted">O dono monitora, mas não altera manualmente a posição do ranking.</p></div></div>}
      {ownerRankingPeriod==='business'&&<div className="panel"><h2>Estabelecimentos em destaque — {scopeLabel}</h2><p className="muted">Não existe ranking de estabelecimento. Esta área mostra estabelecimentos em destaque por avaliações e atividade.</p>{[...monitoredBusinesses].sort((a,b)=>(Number(b.rating_average||0)-Number(a.rating_average||0))||((b.reviews_count||0)-(a.reviews_count||0))).slice(0,50).map(b=><div className="listRow" key={b.id}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name} <Seal type="business"/></b><small>{b.category||'Estabelecimento'} • {b.city||''} - {b.state||''}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></div>)}{!monitoredBusinesses.length&&<p className="muted">Nenhum estabelecimento neste recorte.</p>}</div>}</>}

      {ownerTab==='suporte'&&<div className="panel"><div className="ownerTicketHead"><div><h2>🇧🇷 Central de suporte nacional</h2><p className="muted">Abre no Brasil inteiro para nenhum chamado ficar escondido. Filtre Estado/Cidade somente quando precisar.</p></div><div className="supportHeadActions"><button className="dangerBtn" onClick={ownerDeleteResolvedTickets}>🗑 Limpar resolvidos</button><select value={ownerSupportStatus} onChange={e=>setOwnerSupportStatus(e.target.value)}><option value="all">Todos os status</option><option value="aberto">Abertos</option><option value="em_analise">Em atendimento</option><option value="resolvido">Resolvidos</option></select></div></div>{supportStatusTickets.map(t=>{const person=messagePeople[t.user_id]||ownerUsers.find(x=>x.id===t.user_id)||{};const ticketCity=t.requester_city||person.city||'Cidade não informada';const ticketState=t.requester_state||person.state||'UF não informada';const assigned=ownerUsers.find(x=>x.id===t.assigned_to);const msgs=ownerSupportMessages.filter(m=>m.ticket_id===t.id);return <div className="ownerTicket" key={t.id}><div className="ownerTicketHead"><div><b>🎫 {t.subject}</b><small>👤 {person.full_name||person.username||'Usuário'} {person.username?`(@${person.username})`:''} • 📍 {ticketCity} - {ticketState}</small><small>✉ {t.requester_email||'E-mail não registrado'} • {t.category} • {fmtDate(t.created_at)}</small><small>🛡 Responsável: {assigned?(assigned.full_name||assigned.username):'Ainda não atribuído'}</small></div><div className="ticketStatusActions"><span className={`status ${t.status}`}>{String(t.status||'aberto').replace('_',' ')}</span>{t.status==='resolvido'&&<button className="dangerBtn compactDanger" onClick={()=>ownerDeleteTicket(t)}>🗑 Excluir</button>}</div></div><div className="supportChat"><div className="supportBubble user"><b>Usuário</b><p>{t.message}</p></div>{msgs.map(m=><div className={`supportBubble ${m.sender_role==='user'?'user':'admin'}`} key={m.id}><b>{m.sender_role==='user'?'Usuário':m.sender_role==='owner'?'Dono CIDARANK':'Administrador'}</b><p>{m.message}</p><small>{fmtDate(m.created_at)}</small></div>)}</div>{t.status!=='resolvido'&&<><textarea rows={3} value={ownerReply[t.id]||''} onChange={e=>setOwnerReply(v=>({...v,[t.id]:e.target.value}))} placeholder="Digite uma mensagem para o usuário..."/><div className="ownerActions">{!t.assigned_to&&<button onClick={()=>ownerAssignTicket(t)}>Assumir atendimento</button>}<button className="primaryBtn" onClick={()=>ownerReplyTicket(t,'em_analise')}>Enviar mensagem</button><button className="safeBtn" onClick={()=>ownerReplyTicket(t,'resolvido')}>Resolver chamado</button></div></>}</div>})}{!supportStatusTickets.length&&<p className="muted">Nenhum chamado neste filtro.</p>}</div>}

      {ownerTab==='equipe'&&<div className="panel"><h2>Equipe administrativa</h2><p className="muted">Somente o dono principal pode conceder ou remover acesso. Para adicionar alguém, a pessoa precisa já ter uma conta CIDARANK.</p>{isOwner&&<div className="adminInviteBox"><input type="email" placeholder="Gmail/e-mail da pessoa que vai administrar" value={ownerInviteEmail} onChange={e=>setOwnerInviteEmail(e.target.value)}/><button className="primaryBtn" disabled={ownerBusy||!ownerInviteEmail.trim()} onClick={ownerGrantAdminByEmail}>{ownerBusy?'Adicionando...':'Adicionar administrador'}</button></div>}<div className="ownerUserList">{ownerUsers.filter(x=>['owner','admin','moderator'].includes(String(x.role||'').toLowerCase())||x.id===session.user.id).map(u=><div className="ownerUserRow" key={u.id}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username}</b><small>@{u.username||''}</small><Seal type={u.id===session.user.id&&isOwner?'owner':String(u.role||'').toLowerCase()==='owner'?'owner':'admin'}/></div>{isOwner&&u.id!==session.user.id&&String(u.role||'').toLowerCase()!=='owner'&&<button className="dangerBtn" onClick={()=>ownerToggleUser(u,'role')}>Remover admin</button>}</div>)}</div></div>}

      {ownerTab==='expansao'&&isOwner&&<div className="panel expansionPanel"><div className="ownerTicketHead"><div><span className="eyebrow">CONTROLE EXCLUSIVO DO DONO</span><h2>🌎 Expansão do CIDARANK</h2><p className="muted">Abra cidades aos poucos. Cidades não liberadas ficam EM BREVE. ADMs não podem alterar esta área.</p></div><div className="expansionStats"><b>{expansionRows.filter(x=>x.is_open).length}</b><small>cidades ativas</small><b>{waitlistCount}</b><small>aguardando liberação</small></div></div><div className="expansionControls"><select value={expansionStateId} onChange={handleExpansionStateChange}><option value="">Escolha um estado</option>{states.map(st=><option key={st.id} value={st.id}>{st.nome} ({st.sigla})</option>)}</select><button className="safeBtn" disabled={!expansionStateId||expansionBusy} onClick={()=>ownerSetStateOpen(true)}>🟢 Liberar estado inteiro</button><button className="dangerBtn" disabled={!expansionStateId||expansionBusy} onClick={()=>ownerSetStateOpen(false)}>🔒 Pausar estado inteiro</button></div>{expansionStateId&&<div className="expansionCityGrid">{expansionCities.map(c=>{const row=expansionRows.find(x=>stateKey(x.state)===stateKey(expansionState)&&cityKey(x.city)===cityKey(c.nome));const open=Boolean(row?.is_open);return <div className={`expansionCity ${open?'open':'closed'}`} key={c.id}><div><b>{c.nome}</b><small>{expansionState} • {open?'ATIVA':'EM BREVE'}</small></div><button className={open?'dangerBtn':'safeBtn'} onClick={()=>ownerSetCityOpen(c.nome,!open)}>{open?'Pausar':'Ativar'}</button></div>})}</div>}<div className="emergencyBox"><div><b>🛡️ Chave de emergência das publicações</b><small>Use somente em emergência. O conteúdo existente continua visível.</small></div><button className={postingPaused?'safeBtn':'dangerBtn'} onClick={ownerTogglePostingPause}>{postingPaused?'▶ Reativar novas publicações':'⏸ Pausar novas publicações'}</button></div></div>}

      {ownerTab==='comunicados'&&<div className="panel"><div className="announcementStudioHead"><div><span className="eyebrow">CENTRAL NACIONAL</span><h2>📣 Avisos & Atualizações</h2><p className="muted">Publique novidades, manutenção e alertas com alcance por Brasil, estado ou cidade.</p></div><span className="studioBadge">CIDARANK LIVE</span></div><div className="announcementStudio"><div className="formGrid"><label>Tipo<select value={ownerAnnouncement.kind} onChange={e=>setOwnerAnnouncement(v=>({...v,kind:e.target.value}))}><option value="novidade">Novidade</option><option value="manutencao">Manutenção</option><option value="atualizacao">Atualização</option><option value="importante">Aviso importante</option></select></label><label>Alcance<select value={ownerAnnouncement.scope} onChange={e=>setOwnerAnnouncement(v=>({...v,scope:e.target.value}))}><option value="brasil">Brasil inteiro</option><option value="estado">Estado</option><option value="cidade">Cidade</option></select></label><label>UF<input disabled={ownerAnnouncement.scope==='brasil'} value={ownerAnnouncement.state} onChange={e=>setOwnerAnnouncement(v=>({...v,state:e.target.value.toUpperCase()}))} placeholder="CE"/></label><label>Cidade<input disabled={ownerAnnouncement.scope!=='cidade'} value={ownerAnnouncement.city} onChange={e=>setOwnerAnnouncement(v=>({...v,city:e.target.value}))}/></label></div><label>Título<input value={ownerAnnouncement.title} onChange={e=>setOwnerAnnouncement(v=>({...v,title:e.target.value}))}/></label><label>Mensagem<textarea rows={4} value={ownerAnnouncement.message} onChange={e=>setOwnerAnnouncement(v=>({...v,message:e.target.value}))}/></label><label className="checkLine"><input type="checkbox" checked={ownerAnnouncement.show_popup} onChange={e=>setOwnerAnnouncement(v=>({...v,show_popup:e.target.checked}))}/> Mostrar na frente quando a pessoa abrir o site</label><button className="primaryBtn announcementSend" onClick={ownerPublishAnnouncement}>🚀 Publicar aviso</button></div><h3 className="activeAnnouncementTitle">Avisos ativos</h3>{announcements.map(a=><div className="announcementCard" key={a.id}><b>{a.title}</b><p>{a.message}</p><small>{a.scope==='brasil'?'Brasil inteiro':`${a.city||''} ${a.state||''}`} • {fmtDate(a.created_at)}</small></div>)}</div>}

      {ownerTab==='banner'&&<><div className="panel"><h2>Banner nacional do CIDARANK</h2><p className="muted">A imagem é nacional e somente o dono principal pode trocar.</p><div className="ownerBannerPreview"><img src={siteBanner||'/cidarank-national-banner.png'} alt="Banner nacional atual"/></div>{isOwner?<label className="primaryBtn ownerUpload">Trocar imagem nacional<input type="file" hidden accept="image/*" disabled={ownerBusy} onChange={e=>changeNationalBanner(e.target.files?.[0])}/></label>:<div className="infoBanner">Apenas o dono pode trocar o banner.</div>}</div><div className="panel podiumBannerAdmin"><h2>🏆 Banners dos Rankings</h2><p className="muted">Cada ranking tem seu próprio banner nacional. A imagem vale para todas as cidades; somente as pessoas e resultados mudam conforme a cidade. Recomendado: 1600 × 600 px, WebP/JPG otimizado.</p><div className="rankBannerAdminGrid">{[
        ['week','1. Banner Semanal'],
        ['month','2. Banner Mensal'],
        ['year','3. Banner Anual'],
        ['city','4. Banner Popular da Cidade'],
        ['state','5. Banner Estado — EM BREVE'],
        ['brazil','6. Banner Brasil — EM BREVE']
      ].map(([key,label])=><div className="rankBannerAdminCard" key={key}><div className="rankBannerAdminTitle"><b>{label}</b>{['state','brazil'].includes(key)&&<small>Preparado, ainda fechado ao público</small>}</div><div className="ownerBannerPreview podiumPreview"><img src={bannerForRank(key)} alt={label}/></div>{isOwner&&<label className="primaryBtn ownerUpload">Trocar {label.replace(/^\d+\. /,'')}<input type="file" hidden accept="image/*" disabled={ownerBusy} onChange={e=>changeRankPodiumBanner(e.target.files?.[0],key)}/></label>}</div>)}</div></div></>}

      {ownerTab==='auditoria'&&<div className="panel"><h2>Histórico administrativo</h2><p className="muted">Registro de ações importantes feitas pelo dono e administradores.</p>{ownerLogs.map(l=>{const actor=messagePeople[l.actor_id]||ownerUsers.find(x=>x.id===l.actor_id)||{};const names={ticket_assigned:'Chamado assumido',ticket_message_sent:'Mensagem enviada no suporte',ticket_resolved:'Chamado resolvido',user_verified:'Usuário verificado',user_seal_changed:'Selo alterado',admin_granted_by_email:'Administrador adicionado',announcement_published:'Comunicado publicado',banner_updated:'Banner atualizado',podium_banner_updated:'Fundo do pódio atualizado',post_deleted:'Publicação removida'};return <button className="auditRow auditButton" key={l.id} onClick={()=>setAuditOpen(auditOpen===l.id?null:l.id)}><div><b>{names[l.action]||l.action}</b><span>{actor.full_name||actor.username||'Administrador'}</span></div><small>{fmtDate(l.created_at)} • clique para detalhes</small>{auditOpen===l.id&&<pre>{JSON.stringify(l.details||{},null,2)}</pre>}</button>})}{!ownerLogs.length&&<p className="muted">Nenhum registro ainda.</p>}</div>}

      {ownerTab==='sistema'&&<div className="adminGrid"><div className="panel"><h2>Saúde do sistema</h2><div className="healthLine"><span>Banco de dados</span><b className={ownerHealth.database==='ok'?'healthOk':'healthWarn'}>{ownerHealth.database==='ok'?'OPERACIONAL':'VERIFICAR'}</b></div><div className="healthLine"><span>Autenticação</span><b className={ownerHealth.auth==='ok'?'healthOk':'healthWarn'}>{ownerHealth.auth==='ok'?'OPERACIONAL':'VERIFICAR'}</b></div><div className="healthLine"><span>Tempo real</span><b className={ownerRealtimeConnected?'healthOk':'healthWarn'}>{ownerRealtimeConnected?'CONECTADO':'AGUARDANDO'}</b></div><div className="healthLine"><span>Última checagem</span><b>{ownerHealth.lastCheck?fmtDate(ownerHealth.lastCheck):'—'}</b></div></div><div className="panel"><h2>Cobertura nacional</h2><p className="muted">✓ 27 unidades federativas carregadas pela API oficial do IBGE</p><p className="muted">✓ Municípios carregados por estado, incluindo todas as cidades disponíveis no IBGE</p><p className="muted">✓ Filtros nacionais em usuários, tempo real, estabelecimentos, suporte e rankings</p><p className="muted">✓ Dono principal protegido e auditoria administrativa</p><p className="muted">✓ Suporte com responsável por atendimento e fila por status</p><p className="muted">✓ Moderação com responsável por análise e histórico de resolução</p><p className="muted"><b>Versão administrativa: V6.15.0 EXPANSÃO + ADMINISTRAÇÃO + SEGURANÇA</b></p></div></div>}
    </>
  }

  function SupportScreen(){return <><PageHeader title="Suporte & Contato" subtitle="Fale com a equipe do CIDARANK pelo e-mail oficial ou Instagram."/><div className="officialContact"><div className="contactIcon">✉</div><div><span>CONTATO OFICIAL CIDARANK</span><b>cidarankk@gmail.com</b><small>Dúvidas, parcerias, assuntos comerciais e contato com a plataforma.</small><div className="contactSocials"><a href="mailto:cidarankk@gmail.com">✉ cidarankk@gmail.com</a><a href="https://instagram.com/cidarank" target="_blank" rel="noreferrer">📸 {INSTAGRAM_HANDLE}</a></div></div><a href="mailto:cidarankk@gmail.com?subject=Contato%20CIDARANK">ENVIAR E-MAIL →</a></div><div className="twoCol"><form className="panel stackForm" onSubmit={sendSupport}><h2>Novo chamado</h2><label>Categoria<select value={supportForm.category} onChange={e=>setSupportForm({...supportForm,category:e.target.value})}><option value="duvida">Dúvida</option><option value="problema">Problema técnico</option><option value="denuncia">Denúncia</option><option value="comercio">Estabelecimento</option><option value="outros">Outros</option></select></label><label>Assunto<input required value={supportForm.subject} onChange={e=>setSupportForm({...supportForm,subject:e.target.value})}/></label><label>Descrição<textarea required rows={7} value={supportForm.message} onChange={e=>setSupportForm({...supportForm,message:e.target.value})}/></label><label>Imagem opcional<input type="file" accept="image/*" onChange={e=>setSupportForm({...supportForm,image:e.target.files?.[0]||null})}/></label><button className="primaryBtn" disabled={busy}>Enviar chamado</button></form><div className="panel"><h2>Meus chamados</h2>{tickets.length?tickets.map(t=>{const msgs=supportMessages.filter(m=>m.ticket_id===t.id);return <div className="ticket" key={t.id}><div><b>{t.subject}</b><span className={`status ${t.status}`}>{t.status.replace('_',' ')}</span></div><div className="supportChat"><div className="supportBubble user"><b>Você</b><p>{t.message}</p></div>{msgs.map(m=><div className={`supportBubble ${m.sender_role==='user'?'user':'admin'}`} key={m.id}><b>{m.sender_role==='user'?'Você':'Suporte CIDARANK'}</b><p>{m.message}</p><small>{fmtDate(m.created_at)}</small></div>)}</div>{t.status!=='resolvido'&&<div className="chatInput"><input value={ownerReply[`user-${t.id}`]||''} onChange={e=>setOwnerReply(v=>({...v,[`user-${t.id}`]:e.target.value}))} placeholder="Responder ao suporte..."/><button onClick={()=>userSendSupportMessage(t)}>Enviar</button></div>}<small>{fmtDate(t.created_at)}</small></div>}):<p className="muted">Você ainda não abriu nenhum chamado.</p>}</div></div></>}

  function renderScreen(){
    switch(active){
      case 'Ranking da Cidade': return RankingCityScreen();
      case 'Estabelecimentos': return BusinessScreen();
      case 'Buscar Pessoas': return DirectoryScreen({kind:'people'});
      case 'Buscar Estabelecimentos': return DirectoryScreen({kind:'business'});
      case 'Explorar Cidade': return ExploreScreen();
      case 'Mensagens': return MessagesScreen();
      case 'Perfil': return ProfileScreen();
      case 'Configurações': return SettingsScreen();
      case 'Suporte': return SupportScreen();
      case 'Feed CIDARANK': return OwnerFeedScreen();
      case 'Painel do Dono': return OwnerPanelScreen();
      case 'Administração': return OwnerPanelScreen();
      default:return HomeScreen();
    }
  }

  return <main className="shell">
    <aside className="sidebar"><div className="brand"><div className="brandMark">◆</div><div><b>CIDA<span>RANK</span></b><small>CIDADES QUE CONECTAM</small></div></div><nav>{menuItems.map(([ic,label])=><div className={label==='Ranking da Cidade'?'navRankGroup':''} key={label}><button onClick={()=>{if(label==='Ranking da Cidade'){setActive(label);setRankMenuOpen(v=>!v)}else{setActive(label);setRankMenuOpen(false)}if(label==='Início')markCityFeedSeen();if(label==='Perfil')setSelectedProfile(profile);if(label==='Estabelecimentos')setSelectedBusiness(null)}} className={active===label?'active':''}><i>{ic}</i><span>{label}</span>{label==='Início'&&cityFeedNotificationCount>0&&<b className="navNotificationBadge homeBellBadge">🔔 {cityFeedNotificationCount>99?'99+':cityFeedNotificationCount}</b>}{label==='Mensagens'&&unreadMessageCount>0&&<b className="navNotificationBadge">{unreadMessageCount>99?'99+':unreadMessageCount}</b>}{label==='Perfil'&&unreadPersonalNotificationCount>0&&<b className="navNotificationBadge profileNotificationBadge">🔔 {unreadPersonalNotificationCount>99?'99+':unreadPersonalNotificationCount}</b>}{label==='Ranking da Cidade'&&<em className="rankMenuChevron">{rankMenuOpen?'⌃':'⌄'}</em>}</button>{label==='Ranking da Cidade'&&rankMenuOpen&&<div className="rankSideSubmenu"><button className={popularView==='week'?'selected':''} onClick={()=>{setActive('Ranking da Cidade');setPopularView('week')}}>📋 Semanal</button><button className={popularView==='month'?'selected':''} onClick={()=>{setActive('Ranking da Cidade');setPopularView('month')}}>🏆 Mensal</button><button className={popularView==='year'?'selected':''} onClick={()=>{setActive('Ranking da Cidade');setPopularView('year')}}>👑 Anual</button><button className={popularView==='city'?'selected':''} onClick={()=>{setActive('Ranking da Cidade');setPopularView('city')}}>⭐ Popular da Cidade</button><button className="future" disabled>🗺️ Estado <small>EM BREVE</small></button><button className="future" disabled>🇧🇷 Brasil <small>EM BREVE</small></button></div>}</div>)}</nav><div className="miniCity">⌂ <div><b>CIDARANK</b><small>Mais que uma rede, uma cidade viva.</small><a className="miniContact" href="mailto:cidarankk@gmail.com">✉ cidarankk@gmail.com</a><a className="miniContact instagramContact" href="https://instagram.com/cidarank" target="_blank" rel="noreferrer">📸 @cidarank</a></div></div></aside>
    <section className="mainCol"><header className="topbar"><div className="search">⌕ <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar pessoas, estabelecimentos..."/>{searchResults.length>0&&<div className="searchDrop">{searchResults.map((r,i)=><button key={`${r.kind}-${r.item.id}-${i}`} onClick={()=>{setSearch('');r.kind==='person'?openProfile(r.item):loadBusiness(r.item.id)}}><Avatar profile={r.kind==='person'?r.item:{avatar_url:r.item.logo_url}} name={r.label} size="xs"/><div><b>{r.label}</b><small>{r.kind==='person'?`@${r.item.username}`:r.item.category||'Estabelecimento'}</small></div></button>)}</div>}</div><div className="city">⌖ {cityLabel}</div><div className="icons"><button title="Mensagens" onClick={()=>setActive('Mensagens')}>💬</button><button title="Perfil" className="topProfileBtn" onClick={openOwnProfile}><Avatar profile={profile} name={displayName} size="sm"/>{unreadPersonalNotificationCount>0&&<span>{unreadPersonalNotificationCount>9?'9+':unreadPersonalNotificationCount}</span>}</button><b>{displayName}</b><button className="logout" onClick={logout}>Sair</button></div></header>{notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}>×</button></div>}{announcements.filter(a=>a.show_popup&&(a.scope==='brasil'||(a.scope==='estado'&&stateKey(a.state)===stateKey(profile?.state))||(a.scope==='cidade'&&stateKey(a.state)===stateKey(profile?.state)&&cityKey(a.city)===cityKey(profile?.city)))).slice(0,1).map(a=><div className={`globalAnnouncement ${a.kind}`} key={a.id}><span className="announcementIcon">{a.kind==='manutencao'?'🛠️':a.kind==='atualizacao'?'✨':a.kind==='importante'?'⚠️':'🚀'}</span><div><small className="announcementKicker">{a.kind==='manutencao'?'MANUTENÇÃO PROGRAMADA':a.kind==='atualizacao'?'NOVIDADE NO CIDARANK':a.kind==='importante'?'AVISO IMPORTANTE':'CIDARANK NOVIDADE'}</small><b>{a.title}</b><p>{a.message}</p></div><button onClick={()=>setAnnouncements(v=>v.filter(x=>x.id!==a.id))}>Entendi ✓</button></div>)}<div className="screenContent">{renderScreen()}</div></section>
    <aside className="rightCol commerceOnlyCol"><div className="rankCard commerceSpotlight"><div className="rankTitle"><h3>🏪 ESTABELECIMENTOS EM DESTAQUE</h3><button onClick={()=>setActive('Estabelecimentos')}>Ver todos →</button></div><p className="rightCommerceSubtitle">Destaques somente de {cityLabel}.</p>{topBusinesses.length?topBusinesses.slice(0,6).map((b)=><button className="rankRow commerceRankRow" key={b.id} onClick={()=>loadBusiness(b.id)}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div><b>{b.name}</b><small>{b.category||'Estabelecimento local'}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></button>):<div className="rankEmpty">Nenhum estabelecimento em destaque ainda.</div>}</div><div className="rankCard localAdCarousel"><div className="rankTitle"><h3>📣 PROPAGANDAS DA CIDADE</h3><small>Estabelecimento local</small></div><div className="adCarouselTrack">{topBusinesses.filter(b=>b.cover_url||b.logo_url).slice(0,8).map(b=><button className="localAdCard" key={`ad-${b.id}`} onClick={()=>loadBusiness(b.id)} style={b.cover_url?{backgroundImage:`linear-gradient(180deg,rgba(3,7,12,.05),rgba(3,7,12,.86)),url(${b.cover_url})`}:{}}><span>DESTAQUE LOCAL</span><b>{b.name}</b><small>{b.category||'Estabelecimento'} • ★ {Number(b.rating_average||0).toFixed(1)}</small></button>)}{!topBusinesses.some(b=>b.cover_url||b.logo_url)&&<div className="rankEmpty">As propagandas locais aparecerão aqui.</div>}</div></div><button className="supportLocal" onClick={()=>{setSelectedBusiness(null);setActive('Estabelecimentos')}}>🛍️ <div><b>APOIE O COMÉRCIO LOCAL</b><small>Descubra estabelecimentos de {cityLabel}</small></div><span>→</span></button><div className="rightContact"><b>CONTATO CIDARANK</b><a href="mailto:cidarankk@gmail.com">✉ cidarankk@gmail.com</a><a href="https://instagram.com/cidarank" target="_blank" rel="noreferrer">📸 @cidarank</a></div></aside>
  </main>
}
