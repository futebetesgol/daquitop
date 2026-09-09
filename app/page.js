'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const MENU = [
  ['⌂','Início'],['🏆','Populares'],['▰','Comércios'],['⌖','Explorar Cidade'],['✈','Mensagens'],['●','Perfil'],['⚙','Configurações'],['?','Suporte']
];

const OWNER_EMAIL = 'cidarankk@gmail.com';

function isOwnerEmail(email=''){
  return String(email || '').trim().toLowerCase() === OWNER_EMAIL;
}

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
  const [postText,setPostText]=useState('');
  const [postFile,setPostFile]=useState(null);
  const [postPreview,setPostPreview]=useState('');
  const postFileRef=useRef(null);

  const [people,setPeople]=useState([]);
  const [following,setFollowing]=useState(new Set());
  const [selectedProfile,setSelectedProfile]=useState(null);

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

  const [settings,setSettings]=useState({full_name:'',username:'',bio:'',activity:'',public_phone:'',website:'',gender:'',avatar_url:'',cover_url:''});
  const [avatarUploading,setAvatarUploading]=useState(false);
  const [coverUploading,setCoverUploading]=useState(false);

  const [exploreStateId,setExploreStateId]=useState('');
  const [exploreState,setExploreState]=useState('');
  const [exploreCities,setExploreCities]=useState([]);
  const [exploreCity,setExploreCity]=useState('');
  const [exploreData,setExploreData]=useState({posts:[],authors:{},postBusinesses:{},businesses:[],people:[]});
  const [exploreBusy,setExploreBusy]=useState(false);
  const [explorePostText,setExplorePostText]=useState('');

  const [daquitop_messages,setMessages]=useState([]);
  const [messagePeople,setMessagePeople]=useState({});
  const [selectedChat,setSelectedChat]=useState(null);
  const [messageText,setMessageText]=useState('');

  const [tickets,setTickets]=useState([]);
  const [supportForm,setSupportForm]=useState({category:'duvida',subject:'',message:'',image:null});

  const [siteBanner,setSiteBanner]=useState('/cidarank-national-banner.png');
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
  const [ownerLiveEvents,setOwnerLiveEvents]=useState([]);
  const [ownerRealtimeConnected,setOwnerRealtimeConnected]=useState(false);
  const [ownerHealth,setOwnerHealth]=useState({database:'checking',auth:'ok',realtime:'checking',lastCheck:null});

  const [competitionType,setCompetitionType]=useState('week');
  const [competitionVotes,setCompetitionVotes]=useState([]);

  const [search,setSearch]=useState('');

  const displayName=profile?.full_name || session?.user?.email?.split('@')[0] || 'Usuário';
  const cityLabel=profile?.city && profile?.state ? `${profile.city} - ${profile.state}` : 'Sua cidade';
  const heroTitle=cityLabel.toUpperCase();
  const isOwner=isOwnerEmail(session?.user?.email);
  const isAdmin=isOwner || ['owner','admin','moderator'].includes(String(profile?.role||'').toLowerCase());
  const menuItems=isAdmin?[...MENU,['♛','Painel do Dono']]:MENU;

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
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'businesses'},payload=>pushOwnerLive('Novo comércio',payload.new))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'daquitop_support_tickets'},payload=>pushOwnerLive('Novo chamado',payload.new))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'profiles'},payload=>pushOwnerLive('Novo usuário',payload.new))
      .subscribe(status=>setOwnerRealtimeConnected(status==='SUBSCRIBED'));
    return()=>{supabase.removeChannel(channel);setOwnerRealtimeConnected(false)};
  },[isAdmin]);

  function pushOwnerLive(type,row){
    setOwnerLiveEvents(v=>[{id:`${Date.now()}-${Math.random()}`,type,row,at:new Date().toISOString()},...v].slice(0,60));
  }

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

  async function bootstrap(userId){
    setLoading(true); setNotice('');
    const {data:p,error}=await supabase.from('profiles').select('*').eq('id',userId).maybeSingle();
    if(error || !p){setNotice('Não foi possível carregar seu perfil.');setLoading(false);return;}
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
      loadSiteSettings()
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

  async function loadCity(city,state){
    if(!city||!state)return;
    const [{data:peopleData},{data:businessData}]=await Promise.all([
      supabase.from('profiles').select('*').eq('city_key',cityKey(city)).eq('state_key',stateKey(state)).order('followers_count',{ascending:false}).limit(100),
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
    let authors={}; let biz={}; let likes=new Set(); let grouped={}; let cAuthors={};
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
        const {data}=await supabase.from('profiles').select('id,full_name,username,avatar_url').in('id',caIds);
        cAuthors=Object.fromEntries((data||[]).map(x=>[x.id,x]));
      }
      for(const c of allComments){(grouped[c.post_id] ||= []).push(c)}
    }
    return {list,authors,biz,likes,grouped,cAuthors};
  }

  async function loadPosts(city,state){
    const {data}=await supabase.from('posts').select('*').eq('city_key',cityKey(city)).eq('state_key',stateKey(state)).order('created_at',{ascending:false}).limit(50);
    const h=await hydratePosts(data||[]);
    setPosts(h.list); setPostAuthors(h.authors); setPostBusinesses(h.biz); setLikedPosts(h.likes); setComments(h.grouped); setCommentAuthors(h.cAuthors);
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

  async function loadCompetitions(city,state){
    if(!city||!state)return;
    const {data}=await supabase.from('daquitop_competition_votes').select('*').eq('city_key',cityKey(city)).eq('state_key',stateKey(state));
    setCompetitionVotes(data||[]);
  }

  async function loadSiteSettings(){
    try{
      const {data,error}=await supabase.from('cidarank_site_settings').select('value').eq('key','national_banner').maybeSingle();
      if(!error && data?.value)setSiteBanner(data.value);
    }catch(e){
      console.warn('Configuração de banner ainda não disponível:',e?.message||e);
    }
  }

  async function loadOwnerData(){
    const ownerNow=isOwnerEmail(session?.user?.email);
    const adminNow=ownerNow || ['owner','admin','moderator'].includes(String(profile?.role||'').toLowerCase());
    if(!adminNow)return;
    setOwnerBusy(true);
    try{
      const [u,t,b,pr,lg,rp,vt]=await Promise.all([
        supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(5000),
        supabase.from('daquitop_support_tickets').select('*').order('created_at',{ascending:false}).limit(1000),
        supabase.from('businesses').select('*').order('created_at',{ascending:false}).limit(5000),
        supabase.from('cidarank_user_presence').select('*').order('last_seen',{ascending:false}).limit(5000),
        supabase.from('cidarank_admin_logs').select('*').order('created_at',{ascending:false}).limit(1000),
        supabase.from('cidarank_reports').select('*').order('created_at',{ascending:false}).limit(1000),
        supabase.from('daquitop_competition_votes').select('*').order('created_at',{ascending:false}).limit(10000)
      ]);
      setOwnerUsers(u.data||[]); setOwnerTickets(t.data||[]); setOwnerBusinesses(b.data||[]);
      setOwnerPresence(pr.data||[]); setOwnerLogs(lg.data||[]); setOwnerReports(rp.data||[]); setOwnerVotes(vt.data||[]);
      const userIds=[...new Set([...(t.data||[]).map(x=>x.user_id),...(lg.data||[]).flatMap(x=>[x.actor_id,x.target_user_id])].filter(Boolean))];
      if(userIds.length){
        const {data:ticketPeople}=await supabase.from('profiles').select('id,full_name,username,avatar_url,city,state,city_key,state_key,role,verified').in('id',userIds);
        setMessagePeople(v=>({...v,...Object.fromEntries((ticketPeople||[]).map(x=>[x.id,x]))}));
      }
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

  function Seal({type='user'}){
    const map={
      owner:['♛','DONO'],
      admin:['🛡','ADMIN'],
      user:['●','USUÁRIO'],
      business:['🏪','ESTABELECIMENTO']
    };
    const [icon,label]=map[type]||map.user;
    return <span className={`roleSeal ${type}`}>{icon} {label}</span>;
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
    const response=String(ownerReply[ticket.id]??ticket.admin_response??'').trim();
    const {error}=await supabase.from('daquitop_support_tickets').update({
      status,
      admin_response:response||null,
      updated_at:new Date().toISOString()
    }).eq('id',ticket.id);
    if(error){alert(`Não foi possível atualizar o chamado: ${error.message}`);return}
    await logAdminAction('ticket_updated','ticket',ticket.id,{status});
    await loadOwnerData();
    setNotice('Chamado atualizado.');
  }

  async function handleAuth(e){
    e.preventDefault(); setAuthBusy(true); setAuthMessage('');
    if(authMode==='login'){
      const {error}=await supabase.auth.signInWithPassword({email:form.email.trim(),password:form.password});
      setAuthBusy(false); setAuthMessage(error?error.message:'Login realizado com sucesso.'); return;
    }
    if(!form.full_name.trim()||!form.username.trim()||!form.city||!form.state||!form.gender){setAuthBusy(false);setAuthMessage('Preencha todos os campos do cadastro.');return;}
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

  async function addComment(postId){
    const content=String(commentDraft[postId]||'').trim(); if(!content)return;
    const {error}=await supabase.from('daquitop_comments').insert({post_id:postId,author_id:session.user.id,content});
    if(error){alert(error.message);return}
    setCommentDraft(v=>({...v,[postId]:''})); await loadPosts(profile.city,profile.state);
  }

  async function deletePost(post){
    if(post.author_id!==session.user.id && !isAdmin)return;
    if(!confirm('Excluir esta publicação?'))return;
    await supabase.from('posts').delete().eq('id',post.id); await loadPosts(profile.city,profile.state);
  }

  async function toggleFollow(person){
    if(!sameCity(profile,person)){alert('Você só pode seguir pessoas da sua cidade.');return}
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
      supabase.from('profiles').select('id,followers_count').eq('city_key',ckey).eq('state_key',skey).order('followers_count',{ascending:false}).limit(100),
      supabase.from('daquitop_competition_votes').select('*').eq('city_key',ckey).eq('state_key',skey)
    ]);
    const awards=[]; const ranked=cityPeople||[]; const pos=ranked.findIndex(x=>x.id===person.id);
    if(pos===0&&ranked.length)awards.push({icon:'🥇',title:'TOP 1 Popular',text:'1º lugar em seguidores na cidade'});
    else if(pos===1)awards.push({icon:'🥈',title:'TOP 2 Popular',text:'2º lugar em seguidores na cidade'});
    else if(pos===2)awards.push({icon:'🥉',title:'TOP 3 Popular',text:'3º lugar em seguidores na cidade'});
    for(const type of ['week','month','year']){
      const key=periodKey(type); const counts={};
      (votes||[]).filter(v=>v.period_type===type&&v.period_key===key).forEach(v=>counts[v.candidate_id]=(counts[v.candidate_id]||0)+1);
      const max=Math.max(0,...Object.values(counts));
      if(max>0&&counts[person.id]===max){const meta=type==='week'?['🥇','Popular da Semana']:type==='month'?['🏆','Popular do Mês']:['👑','Popular do Ano'];awards.push({icon:meta[0],title:meta[1],text:`${counts[person.id]} voto(s) no período atual`});}
    }
    if((person.followers_count||0)>=10)awards.push({icon:'⭐',title:'Destaque Local',text:'10 ou mais seguidores locais'});
    setProfileAwards(awards);
  }

  async function openProfile(personOrId){
    const id=typeof personOrId==='string'?personOrId:personOrId.id;
    const {data}=await supabase.from('profiles').select('*').eq('id',id).maybeSingle();
    const target=data||profile; setSelectedProfile(target); await loadProfileAwards(target); setActive('Perfil');
  }

  async function openOwnProfile(){setSelectedProfile(profile);await loadProfileAwards(profile);setActive('Perfil')}

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
    setSelectedBusiness(b); setBusinessEdit({...b}); setActive('Comércios');
    const [{data:r},{data:bp}]=await Promise.all([
      supabase.from('daquitop_business_reviews').select('*').eq('business_id',id).order('created_at',{ascending:false}),
      supabase.from('posts').select('*').eq('business_id',id).order('created_at',{ascending:false}).limit(30)
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
    if(error)alert(error.message); else{setBusinessForm({name:'',username:'',category:'',description:'',address:'',whatsapp:'',website:''});await loadCity(profile.city,profile.state);await loadBusiness(data.id);setNotice('Comércio cadastrado com sucesso.')}
    setBusy(false);
  }

  async function updateBusiness(e){
    e.preventDefault(); if(!selectedBusiness||selectedBusiness.owner_id!==session.user.id)return;
    setBusy(true);
    const allowed={name:businessEdit.name,username:cleanUsername(businessEdit.username),category:businessEdit.category,description:businessEdit.description,address:businessEdit.address,whatsapp:businessEdit.whatsapp,website:businessEdit.website,logo_url:businessEdit.logo_url,cover_url:businessEdit.cover_url,updated_at:new Date().toISOString()};
    const {data,error}=await supabase.from('businesses').update(allowed).eq('id',selectedBusiness.id).select('*').single();
    if(error)alert(error.message);else{setSelectedBusiness(data);setBusinessEdit({...data});await loadCity(profile.city,profile.state);setNotice('Comércio atualizado.')}
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

  async function explore(){
    if(!exploreCity||!exploreState)return;
    setExploreBusy(true);
    const [{data:p},{data:b},{data:raw}]=await Promise.all([
      supabase.from('profiles').select('*').eq('city_key',cityKey(exploreCity)).eq('state_key',stateKey(exploreState)).order('followers_count',{ascending:false}).limit(50),
      supabase.from('businesses').select('*').eq('city_key',cityKey(exploreCity)).eq('state_key',stateKey(exploreState)).order('rating_average',{ascending:false}).limit(50),
      supabase.from('posts').select('*').eq('city_key',cityKey(exploreCity)).eq('state_key',stateKey(exploreState)).order('created_at',{ascending:false}).limit(30)
    ]);
    const h=await hydratePosts(raw||[]);
    setExploreData({posts:h.list,authors:h.authors,postBusinesses:h.biz,businesses:b||[],people:(p||[]).filter(x=>x.account_type!=='business')});
    setExploreBusy(false);
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

  const topPeople=useMemo(()=>[...people].sort((a,b)=>(b.followers_count||0)-(a.followers_count||0)).slice(0,3),[people]);
  const topBusinesses=useMemo(()=>[...businesses].sort((a,b)=>(Number(b.rating_average||0)-Number(a.rating_average||0)) || ((b.reviews_count||0)-(a.reviews_count||0))).slice(0,3),[businesses]);

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
  function competitionRanking(type){
    const key=periodKey(type); const counts={};
    competitionVotes.filter(v=>v.period_type===type&&v.period_key===key).forEach(v=>counts[v.candidate_id]=(counts[v.candidate_id]||0)+1);
    return people.map(p=>({...p,votes:counts[p.id]||0})).sort((a,b)=>b.votes-a.votes || (b.followers_count||0)-(a.followers_count||0));
  }
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

  function PostCard({post,authors=postAuthors,bizMap=postBusinesses,interactive=true}){
    const author=authors[post.author_id]||{}; const business=post.business_id?bizMap[post.business_id]:null; const name=business?.name||author.full_name||author.username||'Usuário';
    return <article className="post" key={post.id}>
      <div className="postHead"><button className="plainBtn" onClick={()=>author.id&&openProfile(author)}><Avatar profile={business?{avatar_url:business.logo_url}:author} name={name}/></button><div><button className="linkName" onClick={()=>business?loadBusiness(business.id):author.id&&openProfile(author)}>{name}</button><small>⌖ {post.city} - {post.state} • {fmtDate(post.created_at)} {business&&'• Comércio'}</small></div>{interactive&&post.author_id===session.user.id&&<button className="ghostIcon" onClick={()=>deletePost(post)}>🗑</button>}</div>
      {post.content&&<p>{post.content}</p>}{post.image_url&&<img className="postImage" src={post.image_url} alt="Publicação"/>}
      {interactive&&<><div className="stats"><button className={likedPosts.has(post.id)?'liked':''} onClick={()=>toggleLike(post.id)}>{likedPosts.has(post.id)?'♥':'♡'} {post.likes_count||0} Curtidas</button><span>💬 {post.comments_count||0} Comentários</span></div>
      <div className="daquitop_comments">{(daquitop_comments[post.id]||[]).map(c=>{const ca=commentAuthors[c.author_id]||{};return <div className="comment" key={c.id}><Avatar profile={ca} name={ca.full_name||ca.username} size="xs"/><div><b>{ca.full_name||ca.username||'Usuário'}</b><p>{c.content}</p></div></div>})}<div className="commentInput"><input value={commentDraft[post.id]||''} onChange={e=>setCommentDraft(v=>({...v,[post.id]:e.target.value}))} placeholder="Escreva um comentário..."/><button onClick={()=>addComment(post.id)}>Enviar</button></div></div></>}
    </article>
  }

  function Composer({text,setText,onPublish,allowPhoto=true,preview=postPreview}){
    return <section className="composer"><div className="row"><Avatar profile={profile} name={displayName} size="sm"/><textarea rows={2} value={text} onChange={e=>setText(e.target.value)} placeholder={`No que você está pensando, ${displayName}?`}/></div>{preview&&<div className="previewWrap"><img src={preview} alt="Prévia"/><button onClick={()=>{setPostFile(null);setPostPreview('')}}>×</button></div>}<div className="actions">{allowPhoto&&<><input ref={postFileRef} type="file" accept="image/*" hidden onChange={e=>choosePostFile(e.target.files?.[0])}/><button onClick={()=>postFileRef.current?.click()}>▧ Foto</button></>}<button className="publish" disabled={busy||(!String(text).trim()&&!postFile)} onClick={onPublish}>{busy?'Publicando...':'➤ Publicar'}</button></div></section>
  }

  function NationalBanner({compact=false}){
    return <section className={`nationalBanner ${compact?'compact':''}`}>
      <img src={siteBanner||'/cidarank-national-banner.png'} alt="CIDARANK - pessoas, rankings e estabelecimentos de todo o Brasil"/>
      {isOwner&&<label className="ownerBannerEdit">♛ {ownerBusy?'Enviando...':'Trocar banner nacional'}<input type="file" hidden accept="image/*" disabled={ownerBusy} onChange={e=>changeNationalBanner(e.target.files?.[0])}/></label>}
    </section>
  }

  function HomeScreen(){return <>
    <NationalBanner/>
    {Composer({text:postText,setText:setPostText,onPublish:()=>publishPost()})}
    <div className="sectionTitle"><h2>Publicações da sua cidade</h2></div>
    {posts.length?<div className="feed">{posts.slice(0,8).map(p=>PostCard({post:p}))}</div>:<Empty title="As publicações da sua cidade estão começando.">Seja a primeira pessoa a publicar no CIDARANK.</Empty>}
  </>}


  function PopularScreen(){
    const rankType=popularView==='week'?'week':popularView==='month'?'month':popularView==='year'?'year':null;
    const rank=rankType?competitionRanking(rankType):[];
    const currentVote=rankType?myVote(rankType):null;
    return <><PageHeader title="Destaques da cidade" subtitle={`Pessoas e estabelecimentos em destaque de ${cityLabel}.`}/>
      <div className="panel rankingChooser"><div className="segmented wrap">
        <button className={popularView==='city'?'active':''} onClick={()=>setPopularView('city')}>Mais popular da cidade</button>
        <button className={popularView==='week'?'active':''} onClick={()=>setPopularView('week')}>Ranking semanal</button>
        <button className={popularView==='month'?'active':''} onClick={()=>setPopularView('month')}>Ranking mensal</button>
        <button className={popularView==='year'?'active':''} onClick={()=>setPopularView('year')}>Ranking do ano</button>
        <button className={popularView==='business'?'active':''} onClick={()=>setPopularView('business')}>Estabelecimentos em destaque</button>
      </div></div>
      {popularView==='city'&&<><div className="podiumGrid">{topPeople.map((p,i)=><div className="podium" key={p.id}><span className={`medal m${i+1}`}>{i+1}</span><Avatar profile={p} name={p.full_name}/><b>{p.full_name||p.username}</b><small>@{p.username}</small><Seal type={String(p.role||'').toLowerCase()==='owner'?'owner':String(p.role||'').toLowerCase()==='admin'?'admin':'user'}/><strong>{p.followers_count||0} seguidores</strong>{p.id!==session.user.id&&<button onClick={()=>toggleFollow(p)}>{following.has(p.id)?'Deixar de seguir':'Seguir'}</button>}</div>)}</div><div className="panel"><div className="panelTitle"><div><h2>Mais populares da cidade</h2><p>Popularidade local por seguidores válidos.</p></div></div><div className="listTable">{people.map((p,i)=><div className="listRow" key={p.id}><b className="rankNum">#{i+1}</b><button className="plainBtn" onClick={()=>openProfile(p)}><Avatar profile={p} name={p.full_name}/></button><div className="grow"><button className="linkName" onClick={()=>openProfile(p)}>{p.full_name||p.username}</button><small>@{p.username} {p.activity?`• ${p.activity}`:''}</small></div><strong>{p.followers_count||0}</strong>{p.id!==session.user.id&&<button className="smallBtn" onClick={()=>toggleFollow(p)}>{following.has(p.id)?'Seguindo':'Seguir'}</button>}</div>)}</div></div></>}
      {rankType&&<div className="panel"><div className="panelTitle"><div><h2>{rankType==='week'?'Ranking semanal':rankType==='month'?'Ranking mensal':'Ranking do ano'}</h2><p>1 voto por conta. Você pode trocar o voto enquanto o período estiver aberto.</p></div></div><div className="listTable">{rank.map((p,i)=><div className="listRow" key={p.id}><b className="rankNum">#{i+1}</b><Avatar profile={p}/><div className="grow"><b>{p.full_name||p.username}</b><small>{p.votes} voto(s)</small></div>{p.id!==session.user.id&&<button className={currentVote===p.id?'smallBtn chosen':'smallBtn'} onClick={()=>voteCompetition(p,rankType)}>{currentVote===p.id?'Meu voto':'Votar'}</button>}</div>)}{!rank.length&&<p className="muted">Ainda não há votos neste período.</p>}</div></div>}
      {popularView==='business'&&<div className="panel"><div className="panelTitle"><div><h2>Estabelecimentos em destaque</h2><p>Aqui não existe ranking de comércio. Os estabelecimentos aparecem em destaque conforme avaliações e atividade local.</p></div></div><div className="ownerUserList">{topBusinesses.map(b=><button className="ownerUserRow clickable" key={b.id} onClick={()=>loadBusiness(b.id)}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name} <Seal type="business"/></b><small>{b.category||'Estabelecimento local'} • {b.city||''} - {b.state||''}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></button>)}{!topBusinesses.length&&<p className="muted">Nenhum estabelecimento em destaque nesta cidade ainda.</p>}</div></div>}
    </>
  }

  function BusinessScreen(){
    if(selectedBusiness){
      const mine=selectedBusiness.owner_id===session.user.id;
      return <><button className="backBtn" onClick={()=>setSelectedBusiness(null)}>← Voltar para comércios</button>
        <div className="businessHero" style={selectedBusiness.cover_url?{backgroundImage:`linear-gradient(90deg,rgba(8,15,30,.85),rgba(8,15,30,.25)),url(${selectedBusiness.cover_url})`}:{}}><Avatar profile={{avatar_url:selectedBusiness.logo_url}} name={selectedBusiness.name} size="xl"/><div><h1>{selectedBusiness.name}</h1><p>@{selectedBusiness.username||'comercio'} • {selectedBusiness.category||'Comércio local'}</p><span>★ {Number(selectedBusiness.rating_average||0).toFixed(1)} ({selectedBusiness.reviews_count||0} avaliações)</span></div>{selectedBusiness.owner_id&&selectedBusiness.owner_id!==session.user.id&&<button className="primaryBtn" onClick={async()=>{const {data}=await supabase.from('profiles').select('*').eq('id',selectedBusiness.owner_id).maybeSingle();if(data)openChat(data)}}>Mensagem</button>}</div>
        <div className="twoCol"><div>
          <div className="panel"><h2>Sobre</h2><p>{selectedBusiness.description||'Este comércio ainda não adicionou uma descrição.'}</p><div className="infoGrid"><span>📍 {selectedBusiness.address||`${selectedBusiness.city} - ${selectedBusiness.state}`}</span>{selectedBusiness.whatsapp&&<span>📱 {selectedBusiness.whatsapp}</span>}{selectedBusiness.website&&<span>🌐 {selectedBusiness.website}</span>}</div></div>
          {mine&&<div className="panel"><h2>Publicar como comércio</h2><section className="composer businessComposer"><div className="row"><Avatar profile={{avatar_url:selectedBusiness.logo_url}} name={selectedBusiness.name} size="sm"/><textarea rows={2} value={businessPostText} onChange={e=>setBusinessPostText(e.target.value)} placeholder={`Divulgue novidades, produtos ou serviços de ${selectedBusiness.name}`}/></div>{businessPostPreview&&<div className="previewWrap"><img src={businessPostPreview} alt="Prévia do comércio"/><button onClick={()=>{setBusinessPostFile(null);setBusinessPostPreview('')}}>×</button></div>}<div className="actions"><input ref={businessPostFileRef} type="file" accept="image/*" hidden onChange={e=>chooseBusinessPostFile(e.target.files?.[0])}/><button onClick={()=>businessPostFileRef.current?.click()}>▧ Foto do produto/serviço</button><button className="publish" disabled={busy||(!businessPostText.trim()&&!businessPostFile)} onClick={()=>publishPost({text:businessPostText,file:businessPostFile,city:selectedBusiness.city,state:selectedBusiness.state,business:selectedBusiness,after:()=>loadBusiness(selectedBusiness.id)})}>{busy?'Publicando...':'➤ Publicar'}</button></div></section></div>}
          <div className="panel"><h2>Publicações do comércio</h2>{businessPosts.length?<div className="feed">{businessPosts.map(p=>PostCard({post:p,authors:businessPostAuthors,bizMap:{[selectedBusiness.id]:selectedBusiness},interactive:false}))}</div>:<p className="muted">Este comércio ainda não publicou nada.</p>}</div>
          <div className="panel"><h2>Avaliações</h2>{selectedBusiness.owner_id!==session.user.id&&<form className="stackForm" onSubmit={submitReview}><label>Nota<select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:e.target.value})}><option value="5">5 - Excelente</option><option value="4">4 - Muito bom</option><option value="3">3 - Bom</option><option value="2">2 - Regular</option><option value="1">1 - Ruim</option></select></label><label>Comentário<textarea value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Conte sua experiência"/></label><button className="primaryBtn">Salvar avaliação</button></form>}{businessReviews.length?businessReviews.map(r=>{const a=reviewAuthors[r.author_id]||{};return <div className="review" key={r.id}><Avatar profile={a} size="xs"/><div><b>{a.full_name||a.username||'Usuário'} • {'★'.repeat(r.rating)}</b><p>{r.comment||'Sem comentário.'}</p><small>{fmtDate(r.created_at)}</small></div></div>}):<p className="muted">Ainda não há avaliações.</p>}</div>
        </div><div>{mine&&<form className="panel stackForm" onSubmit={updateBusiness}><h2>Editar comércio</h2><label>Nome<input value={businessEdit?.name||''} onChange={e=>setBusinessEdit(v=>({...v,name:e.target.value}))}/></label><label>@Usuário<input value={businessEdit?.username||''} onChange={e=>setBusinessEdit(v=>({...v,username:e.target.value}))}/></label><label>Categoria<select value={businessEdit?.category||''} onChange={e=>setBusinessEdit(v=>({...v,category:e.target.value}))}><option value="">Selecione</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Descrição<textarea value={businessEdit?.description||''} onChange={e=>setBusinessEdit(v=>({...v,description:e.target.value}))}/></label><label>Endereço<input value={businessEdit?.address||''} onChange={e=>setBusinessEdit(v=>({...v,address:e.target.value}))}/></label><label>WhatsApp<input value={businessEdit?.whatsapp||''} onChange={e=>setBusinessEdit(v=>({...v,whatsapp:e.target.value}))}/></label><label>Site<input value={businessEdit?.website||''} onChange={e=>setBusinessEdit(v=>({...v,website:e.target.value}))}/></label><label>Logo<input type="file" accept="image/*" onChange={e=>uploadBusinessImage('logo_url',e.target.files?.[0])}/></label><label>Capa<input type="file" accept="image/*" onChange={e=>uploadBusinessImage('cover_url',e.target.files?.[0])}/></label><button className="primaryBtn" disabled={busy}>Salvar comércio</button></form>}</div></div>
      </>
    }
    return <><PageHeader title="Comércios" subtitle={`Descubra e avalie os melhores negócios de ${cityLabel}.`}/><div className="businessGrid">{businesses.map(b=><button className="businessCard" key={b.id} onClick={()=>loadBusiness(b.id)}><div className="businessCover" style={b.cover_url?{backgroundImage:`url(${b.cover_url})`}:{}}></div><Avatar profile={{avatar_url:b.logo_url}} name={b.name} size="lg"/><h3>{b.name}</h3><p>{b.category||'Estabelecimento local'}</p><strong>★ {Number(b.rating_average||0).toFixed(1)} • {b.reviews_count||0} avaliações</strong></button>)}</div>{!businesses.length&&<Empty title="Ainda não há comércios cadastrados.">Cadastre o primeiro comércio da cidade.</Empty>}
      <form className="panel stackForm" onSubmit={saveBusiness}><h2>Cadastre seu comércio</h2><p className="muted">O comércio fica vinculado à sua conta e à sua cidade.</p><div className="formGrid"><label>Nome<input required value={businessForm.name} onChange={e=>setBusinessForm({...businessForm,name:e.target.value})}/></label><label>@Usuário<input required value={businessForm.username} onChange={e=>setBusinessForm({...businessForm,username:e.target.value})}/></label><label>Categoria<select required value={businessForm.category} onChange={e=>setBusinessForm({...businessForm,category:e.target.value})}><option value="">Selecione</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Endereço<input value={businessForm.address} onChange={e=>setBusinessForm({...businessForm,address:e.target.value})}/></label><label>WhatsApp<input value={businessForm.whatsapp} onChange={e=>setBusinessForm({...businessForm,whatsapp:e.target.value})}/></label><label>Site<input value={businessForm.website} onChange={e=>setBusinessForm({...businessForm,website:e.target.value})}/></label></div><label>Descrição<textarea value={businessForm.description} onChange={e=>setBusinessForm({...businessForm,description:e.target.value})}/></label><button className="primaryBtn" disabled={busy}>Cadastrar comércio</button></form>
    </>
  }

  function ProfileScreen(){
    const p=selectedProfile||profile; const own=p?.id===session.user.id; const canFollow=!own&&sameCity(profile,p);
    return <><button className="backBtn" onClick={()=>{setSelectedProfile(profile);setActive('Início')}}>← Voltar</button><section className="profileHero"><div className="profileCover" style={p?.cover_url?{backgroundImage:`url(${p.cover_url})`}:{}}></div><div className="profileMain"><Avatar profile={p} name={p?.full_name} size="xxl"/><div className="grow"><h1>{p?.full_name||p?.username}</h1><Seal type={String(p?.role||'').toLowerCase()==='owner'?'owner':String(p?.role||'').toLowerCase()==='admin'?'admin':'user'}/><p>@{p?.username||'usuario'} • 📍 {p?.city} - {p?.state}</p>{p?.activity&&<span className="chip">{p.activity}</span>}</div><div className="profileActions">{own?<button className="primaryBtn" onClick={()=>setActive('Configurações')}>Editar perfil</button>:<>{canFollow&&<button className="primaryBtn" onClick={()=>toggleFollow(p)}>{following.has(p.id)?'Deixar de seguir':'Seguir'}</button>}<button className="secondaryBtn" onClick={()=>openChat(p)}>Mensagem</button></>}</div></div></section><div className="profileStats"><div><b>{p?.followers_count||0}</b><span>Seguidores</span></div><div><b>{p?.following_count||0}</b><span>Seguindo</span></div><div><b>{p?.city||'-'}</b><span>Cidade</span></div></div><div className="panel"><h2>Sobre</h2><p>{p?.bio||'Este perfil ainda não escreveu uma bio.'}</p>{p?.public_phone&&<p>📱 {p.public_phone}</p>}{p?.website&&<p>🌐 {p.website}</p>}</div><div className="panel"><h2>Medalhas e Troféus</h2>{profileAwards.length?<div className="awardsGrid">{profileAwards.map((a,i)=><div className="awardCard" key={`${a.title}-${i}`}><span>{a.icon}</span><div><b>{a.title}</b><small>{a.text}</small></div></div>)}</div>:<p className="muted">Este perfil ainda não conquistou medalhas. Participe dos rankings e competições da cidade.</p>}</div>{!canFollow&&!own&&<div className="infoBanner">Você está visitando um perfil de outra cidade. O ranking por seguidores considera conexões locais.</div>}</>
  }

  function SettingsScreen(){return <><PageHeader title="Configurações" subtitle="Edite seu perfil. Sua cidade permanece vinculada ao cadastro."/><form className="panel stackForm settingsForm" onSubmit={saveSettings}><div className="mediaSettings"><div><Avatar profile={{avatar_url:settings.avatar_url}} name={settings.full_name} size="xl"/><label className="uploadBtn">{avatarUploading?'Enviando...':'Trocar foto'}<input type="file" hidden accept="image/*" onChange={e=>uploadProfileImage('avatar_url',e.target.files?.[0])}/></label></div><div className="coverPreview" style={settings.cover_url?{backgroundImage:`url(${settings.cover_url})`}:{}}><label className="uploadBtn">{coverUploading?'Enviando...':'Trocar capa'}<input type="file" hidden accept="image/*" onChange={e=>uploadProfileImage('cover_url',e.target.files?.[0])}/></label></div></div><div className="formGrid"><label>Nome completo<input required value={settings.full_name} onChange={e=>setSettings({...settings,full_name:e.target.value})}/></label><label>@Usuário<input required value={settings.username} onChange={e=>setSettings({...settings,username:e.target.value})}/></label><label>Atividade / profissão<input value={settings.activity} onChange={e=>setSettings({...settings,activity:e.target.value})} placeholder="Ex.: Comerciante, Estudante"/></label><label>Gênero<select value={settings.gender} onChange={e=>setSettings({...settings,gender:e.target.value})}><option value="">Não informar</option><option value="homem">Homem</option><option value="mulher">Mulher</option><option value="outros">Outros</option></select></label><label>Telefone público<input value={settings.public_phone} onChange={e=>setSettings({...settings,public_phone:e.target.value})}/></label><label>Site<input value={settings.website} onChange={e=>setSettings({...settings,website:e.target.value})}/></label><label>Cidade<input value={profile.city||''} disabled/></label><label>Estado<input value={profile.state||''} disabled/></label></div><label>Bio<textarea rows={4} value={settings.bio} onChange={e=>setSettings({...settings,bio:e.target.value})} placeholder="Conte um pouco sobre você"/></label><button className="primaryBtn" disabled={busy}>Salvar alterações</button></form></>}

  function ExploreScreen(){return <><PageHeader title="Explorar Cidade" subtitle="Visite qualquer cidade do Brasil sem alterar sua cidade de cadastro."/><div className="panel"><div className="exploreControls"><select value={exploreStateId} onChange={handleExploreState}><option value="">Escolha o estado</option>{states.map(s=><option key={s.id} value={s.id}>{s.nome} ({s.sigla})</option>)}</select><select value={exploreCity} disabled={!exploreStateId||exploreBusy} onChange={e=>setExploreCity(e.target.value)}><option value="">Escolha a cidade</option>{exploreCities.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}</select><button className="primaryBtn" disabled={!exploreCity||exploreBusy} onClick={explore}>{exploreBusy?'Carregando...':'Explorar'}</button></div></div>{exploreCity&&exploreData.posts.length+exploreData.people.length+exploreData.businesses.length>=0&&<><div className="cityVisitHero"><span>VISITANDO</span><h1>{exploreCity} - {exploreState}</h1><p>Seu cadastro continua em {cityLabel}.</p></div><div className="panel"><h2>Publicar nesta cidade</h2>{Composer({text:explorePostText,setText:setExplorePostText,allowPhoto:false,onPublish:()=>publishPost({text:explorePostText,file:null,city:exploreCity,state:exploreState,after:explore})})}</div><div className="twoCol"><div className="panel"><h2>Pessoas em destaque</h2>{!exploreData.people.length&&<p className="muted">Nenhuma pessoa cadastrada nesta cidade ainda.</p>}{exploreData.people.slice(0,10).map((p,i)=><div className="listRow" key={p.id}><b>#{i+1}</b><Avatar profile={p}/><div className="grow"><button className="linkName" onClick={()=>openProfile(p)}>{p.full_name||p.username}</button><small>@{p.username}</small></div><strong>{p.followers_count||0}</strong></div>)}</div><div className="panel"><h2>Comércios</h2>{!exploreData.businesses.length&&<p className="muted">Nenhum comércio cadastrado nesta cidade ainda.</p>}{exploreData.businesses.slice(0,10).map(b=><button className="listRow clickable" key={b.id} onClick={()=>loadBusiness(b.id)}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name}</b><small>{b.category||'Estabelecimento local'}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></button>)}</div></div><h2 className="sectionHeading">Publicações de {exploreCity}</h2>{exploreData.posts.length?exploreData.posts.map(p=>PostCard({post:p,authors:exploreData.authors,bizMap:exploreData.postBusinesses,interactive:false})):<Empty title="Ainda não há publicações nesta cidade."/>}</>}</>}

  function MessagesScreen(){
    const conversations={};
    for(const m of daquitop_messages){const other=m.sender_id===session.user.id?m.recipient_id:m.sender_id;const prev=conversations[other];if(!prev||new Date(m.created_at)>new Date(prev.created_at))conversations[other]=m}
    const convoIds=Object.keys(conversations).sort((a,b)=>new Date(conversations[b].created_at)-new Date(conversations[a].created_at));
    const chatMessages=selectedChat?daquitop_messages.filter(m=>(m.sender_id===session.user.id&&m.recipient_id===selectedChat.id)||(m.sender_id===selectedChat.id&&m.recipient_id===session.user.id)):[];
    return <><PageHeader title="Mensagens" subtitle="Conversas privadas entre pessoas do CIDARANK."/><div className="daquitop_messagesLayout"><div className="conversationList"><h3>Conversas</h3>{convoIds.map(id=>{const p=messagePeople[id]||{};const last=conversations[id];const unread=last.recipient_id===session.user.id&&!last.read_at;return <button className={`conversation ${selectedChat?.id===id?'active':''}`} key={id} onClick={()=>openChat(p)}><Avatar profile={p}/><div><b>{p.full_name||p.username||'Usuário'}</b><small>{last.content.slice(0,50)}</small></div>{unread&&<i/>}</button>})}{!convoIds.length&&<p className="muted">Nenhuma conversa ainda.</p>}<h3>Começar conversa</h3>{people.filter(p=>p.id!==session.user.id).slice(0,12).map(p=><button className="conversation" key={p.id} onClick={()=>openChat(p)}><Avatar profile={p}/><div><b>{p.full_name||p.username}</b><small>@{p.username}</small></div></button>)}</div><div className="chatPanel">{selectedChat?<><div className="chatHead"><Avatar profile={selectedChat}/><div><b>{selectedChat.full_name||selectedChat.username}</b><small>@{selectedChat.username}</small></div></div><div className="chatMessages">{chatMessages.map(m=><div className={`bubble ${m.sender_id===session.user.id?'mine':''}`} key={m.id}>{m.content}<small>{fmtDate(m.created_at)}</small></div>)}</div><form className="chatInput" onSubmit={sendMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Digite uma mensagem..."/><button>Enviar</button></form></>:<Empty title="Selecione uma conversa.">Você também pode abrir o perfil de alguém e clicar em Mensagem.</Empty>}</div></div></>
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
    const stats=[['Online agora',onlineIds.size],['Usuários',monitoredUsers.length],['Cadastros hoje',todayCount(monitoredUsers)],['Comércios',monitoredBusinesses.length],['Chamados abertos',openTickets.length],['Denúncias',openReports.length],['Admins',admins.length]];

    const rankVotes=ownerVotes.filter(v=>{
      if(v.period_type!==ownerRankingPeriod||v.period_key!==periodKey(ownerRankingPeriod))return false;
      if(ownerStateFilter&&stateKey(v.state_key||v.state)!==stateKey(ownerStateFilter))return false;
      if(ownerCityFilter&&cityKey(v.city_key||v.city)!==cityKey(ownerCityFilter))return false;
      return true;
    });
    const rankMap={};
    for(const v of rankVotes){const k=v.candidate_id||v.user_id||v.profile_id;if(k)rankMap[k]=(rankMap[k]||0)+1}
    const topRank=Object.entries(rankMap).map(([id,count])=>({user:ownerUsers.find(x=>x.id===id),count})).filter(x=>x.user&&locationMatch(x.user)).sort((a,b)=>b.count-a.count||(b.user?.followers_count||0)-(a.user?.followers_count||0)).slice(0,50);
    const monitoredLive=ownerLiveEvents.filter(e=>locationMatch(e.row||{}));

    const locationFilters=<div className="nationalMonitorBar"><div><b>🗺️ Monitoramento nacional</b><small>{scopeLabel}</small></div><select value={ownerStateId} onChange={handleOwnerStateChange}><option value="">Todos os estados do Brasil</option>{states.map(s=><option key={s.id} value={s.id}>{s.nome} ({s.sigla})</option>)}</select><select value={ownerCityFilter} disabled={!ownerStateId||ownerLocationBusy} onChange={e=>setOwnerCityFilter(e.target.value)}><option value="">{ownerLocationBusy?'Carregando cidades...':'Todas as cidades'}</option>{ownerCities.map(c=><option key={c.id} value={c.nome}>{c.nome}</option>)}</select><button className="secondaryBtn" onClick={()=>{setOwnerStateId('');setOwnerStateFilter('');setOwnerCityFilter('');setOwnerCities([])}}>Brasil inteiro</button></div>;

    return <>
      <PageHeader title="Central do Dono" subtitle="Administração e monitoramento nacional do CIDARANK em tempo real." actions={<button className="primaryBtn" onClick={loadOwnerData}>{ownerBusy?'Atualizando...':'Atualizar agora'}</button>}/>
      <div className="ownerRealtimeBar"><span className={ownerRealtimeConnected?'liveDot on':'liveDot'}></span><b>{ownerRealtimeConnected?'TEMPO REAL CONECTADO':'TEMPO REAL AGUARDANDO'}</b><small>Última leitura: {ownerHealth.lastCheck?fmtDate(ownerHealth.lastCheck):'—'}</small></div>
      <div className="ownerTabs">{[
        ['dashboard','📊 Visão geral'],['tempo','⚡ Tempo real'],['usuarios','👥 Usuários'],['moderacao','🛡️ Moderação'],['comercios','🏪 Estabelecimentos'],['rankings','🏆 Rankings'],['suporte','🎫 Suporte'],['equipe','👑 Equipe'],['banner','🖼️ Banner'],['auditoria','📜 Auditoria'],['sistema','⚙️ Sistema']
      ].map(([id,label])=><button key={id} className={ownerTab===id?'active':''} onClick={()=>setOwnerTab(id)}>{label}</button>)}</div>
      {['dashboard','tempo','usuarios','moderacao','comercios','rankings','suporte'].includes(ownerTab)&&locationFilters}

      {ownerTab==='dashboard'&&<><div className="scopeTitle"><span>VISÃO ATUAL</span><b>{scopeLabel}</b></div><div className="ownerStats deep">{stats.map(([label,value])=><div className="ownerStat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="adminGrid"><div className="panel"><h2>Conta proprietária</h2><div className="ownerIdentity"><Avatar profile={profile} name={displayName} size="lg"/><div><b>{displayName}</b><small>{session?.user?.email}</small><Seal type={isOwner?'owner':'admin'}/></div></div><p className="muted">O dono principal não pode ser removido por administradores.</p></div><div className="panel"><h2>Alertas principais</h2><div className="healthLine"><span>Contas suspensas</span><b>{monitoredUsers.filter(x=>x.is_suspended).length}</b></div><div className="healthLine"><span>Comércios suspensos</span><b>{monitoredBusinesses.filter(x=>x.is_suspended).length}</b></div><div className="healthLine"><span>Chamados pendentes</span><b>{openTickets.length}</b></div><div className="healthLine"><span>Denúncias pendentes</span><b>{openReports.length}</b></div></div></div><div className="panel"><h2>🔎 Busca administrativa global</h2><p className="muted">Pesquise pessoas, @usuário, cidade, estado, estabelecimento, chamado ou e-mail registrado no suporte.</p><input placeholder="Pesquisar em toda a administração..." value={ownerGlobalSearch} onChange={e=>setOwnerGlobalSearch(e.target.value)}/>{globalQ&&<div className="ownerUserList">{globalUsers.map(u=><div className="listRow" key={`gu-${u.id}`}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username}</b><small>@{u.username||''} • {u.city||''} - {u.state||''}</small></div><Seal type={String(u.role||'').toLowerCase()==='owner'?'owner':String(u.role||'').toLowerCase()==='admin'?'admin':'user'}/></div>)}{globalBusinesses.map(b=><div className="listRow" key={`gb-${b.id}`}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name}</b><small>{b.category||'Estabelecimento'} • {b.city||''} - {b.state||''}</small></div><Seal type="business"/></div>)}{globalTickets.map(t=><div className="listRow" key={`gt-${t.id}`}><div className="grow"><b>🎫 {t.subject}</b><small>{t.requester_email||t.requester_username||'Usuário'} • {t.requester_city||''} - {t.requester_state||''}</small></div><span className={`status ${t.status}`}>{String(t.status||'aberto').replace('_',' ')}</span></div>)}{!globalUsers.length&&!globalBusinesses.length&&!globalTickets.length&&<p className="muted">Nenhum resultado encontrado.</p>}</div>}</div></>}

      {ownerTab==='tempo'&&<div className="adminGrid"><div className="panel"><h2>Usuários online agora — {scopeLabel}</h2>{monitoredPresence.filter(x=>onlineIds.has(x.user_id)).slice(0,100).map(x=>{const u=ownerUsers.find(y=>y.id===x.user_id)||{};return <div className="listRow" key={x.user_id}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username||'Usuário'}</b><small>{x.page||'CIDARANK'} • {x.city||''} {x.state||''}</small></div><span className="onlineBadge">ONLINE</span></div>})}{!onlineIds.size&&<p className="muted">Nenhum usuário ativo neste recorte nos últimos 5 minutos.</p>}</div><div className="panel"><h2>Eventos importantes ao vivo</h2><p className="muted">Para não lotar a administração, publicações comuns não entram aqui.</p>{monitoredLive.slice(0,40).map(e=><div className="liveEvent" key={e.id}><b>{e.type}</b><small>{fmtDate(e.at)}</small><span>{e.row?.city||''} {e.row?.state||''}</span></div>)}{!monitoredLive.length&&<p className="muted">Aguardando novos cadastros, comércios ou chamados.</p>}</div></div>}

      {ownerTab==='usuarios'&&<div className="panel"><div className="adminSearchOnly"><input placeholder="Pesquisar nome, @usuário, e-mail ou cidade" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)}/></div><p className="muted">{filteredUsers.length} usuário(s) em {scopeLabel}.</p><div className="ownerUserList">{filteredUsers.map(u=><div className="ownerUserRow" key={u.id}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username||'Usuário'} {u.verified&&<span className="verifiedBadge">✓ VERIFICADO</span>} {onlineIds.has(u.id)&&<span className="onlineBadge">ONLINE</span>}</b><small>@{u.username||'semusuario'} • {u.city||'Sem cidade'} - {u.state||''}</small><small><Seal type={String(u.role||'').toLowerCase()==='owner'?'owner':String(u.role||'').toLowerCase()==='admin'?'admin':'user'}/> {u.is_suspended?'• SUSPENSO':''}</small></div><div className="ownerActions"><button onClick={()=>ownerToggleUser(u,'verified')}>{u.verified?'Remover verificação':'Verificar'}</button>{isOwner&&u.id!==session.user.id&&<button onClick={()=>ownerToggleUser(u,'role')}>{String(u.role||'').toLowerCase()==='admin'?'Remover admin':'Tornar admin'}</button>}<button className={u.is_suspended?'safeBtn':'dangerBtn'} disabled={u.id===session.user.id||isOwnerEmail(u.email)} onClick={()=>ownerToggleUser(u,'is_suspended')}>{u.is_suspended?'Reativar':'Suspender'}</button></div></div>)}</div></div>}

      {ownerTab==='moderacao'&&<div className="panel"><div className="ownerTicketHead"><div><h2>Fila de moderação</h2><p className="muted">Denúncias organizadas por status, Estado e Cidade.</p></div><select value={ownerReportStatus} onChange={e=>setOwnerReportStatus(e.target.value)}><option value="all">Todos os status</option><option value="pending">Pendentes</option><option value="in_review">Em análise</option><option value="resolved">Resolvidos</option><option value="dismissed">Arquivados</option></select></div>{reportStatusItems.map(r=>{const assigned=ownerUsers.find(x=>x.id===r.assigned_to);return <div className="reportRow" key={r.id}><b>{r.reason||r.category||'Denúncia'}</b><small>{r.target_type} • {fmtDate(r.created_at)} • Status: {r.status||'pending'}</small><small>Responsável: {assigned?(assigned.full_name||assigned.username):'Ainda não atribuído'}</small><p>{r.details||'Sem detalhes.'}</p><div className="ownerActions">{!['resolved','dismissed'].includes(String(r.status||''))&&<button onClick={()=>ownerAssignReport(r)}>Assumir análise</button>}<button className="safeBtn" onClick={()=>ownerResolveReport(r,'resolved')}>Resolver</button><button onClick={()=>ownerResolveReport(r,'dismissed')}>Arquivar</button></div></div>})}{!reportStatusItems.length&&<p className="muted">Nenhuma denúncia neste filtro.</p>}</div>}

      {ownerTab==='comercios'&&<div className="panel"><div className="adminSearchOnly"><input placeholder="Pesquisar estabelecimento ou categoria" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)}/></div><p className="muted">{filteredBusinesses.length} estabelecimento(s) em {scopeLabel}.</p><div className="ownerUserList">{filteredBusinesses.map(b=><div className="ownerUserRow" key={b.id}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name} {b.verified&&<span className="verifiedBadge">✓ VERIFICADO</span>}</b><small>{b.category||'Estabelecimento'} • {b.city||''} - {b.state||''}</small><small>★ {Number(b.rating_average||0).toFixed(1)} • {b.reviews_count||0} avaliações {b.is_suspended?'• SUSPENSO':''}</small></div><div className="ownerActions"><button onClick={()=>ownerToggleBusiness(b,'verified')}>{b.verified?'Remover selo':'Verificar'}</button><button className={b.is_suspended?'safeBtn':'dangerBtn'} onClick={()=>ownerToggleBusiness(b,'is_suspended')}>{b.is_suspended?'Reativar':'Suspender'}</button></div></div>)}</div></div>}

      {ownerTab==='rankings'&&<><div className="rankingAdminHead"><div><h2>Monitoramento dos destaques e rankings</h2><p>{scopeLabel} • acompanhamento local por cidade, estado ou Brasil</p></div><div className="segmented wrap"><button className={ownerRankingPeriod==='city'?'active':''} onClick={()=>setOwnerRankingPeriod('city')}>Mais popular da cidade</button><button className={ownerRankingPeriod==='week'?'active':''} onClick={()=>setOwnerRankingPeriod('week')}>Ranking semanal</button><button className={ownerRankingPeriod==='month'?'active':''} onClick={()=>setOwnerRankingPeriod('month')}>Ranking mensal</button><button className={ownerRankingPeriod==='year'?'active':''} onClick={()=>setOwnerRankingPeriod('year')}>Ranking do ano</button><button className={ownerRankingPeriod==='business'?'active':''} onClick={()=>setOwnerRankingPeriod('business')}>Estabelecimentos em destaque</button></div></div>
      {ownerRankingPeriod==='city'&&<div className="adminGrid"><div className="panel"><h2>Mais populares — {scopeLabel}</h2>{[...monitoredUsers].filter(x=>x.account_type!=='business').sort((a,b)=>(b.followers_count||0)-(a.followers_count||0)).slice(0,50).map((u,i)=><div className="listRow" key={u.id}><b>#{i+1}</b><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username}</b><small>@{u.username||''} • {u.city||''} - {u.state||''}</small></div><strong>{u.followers_count||0} seguidores</strong></div>)}</div><div className="panel"><h2>Resumo</h2><div className="healthLine"><span>Pessoas neste recorte</span><b>{monitoredUsers.filter(x=>x.account_type!=='business').length}</b></div><div className="healthLine"><span>Online agora</span><b>{monitoredPresence.filter(x=>onlineIds.has(x.user_id)).length}</b></div></div></div>}
      {['week','month','year'].includes(ownerRankingPeriod)&&<div className="adminGrid"><div className="panel"><h2>{ownerRankingPeriod==='week'?'Ranking semanal':ownerRankingPeriod==='month'?'Ranking mensal':'Ranking do ano'} — {scopeLabel}</h2>{topRank.map((r,i)=><div className="listRow" key={r.user?.id||i}><b>#{i+1}</b><Avatar profile={r.user||{}}/><div className="grow"><b>{r.user?.full_name||r.user?.username||'Usuário'}</b><small>{r.user?.city||''} - {r.user?.state||''}</small></div><strong>{r.count} voto(s)</strong></div>)}{!topRank.length&&<p className="muted">Ainda não há votos neste período para {scopeLabel}.</p>}</div><div className="panel"><h2>Antifraude básico</h2><div className="healthLine"><span>Votos neste período/local</span><b>{rankVotes.length}</b></div><div className="healthLine"><span>Cadastros hoje</span><b>{todayCount(monitoredUsers)}</b></div><div className="healthLine"><span>Contas suspensas</span><b>{monitoredUsers.filter(x=>x.is_suspended).length}</b></div><p className="muted">O dono monitora, mas não altera manualmente a posição do ranking.</p></div></div>}
      {ownerRankingPeriod==='business'&&<div className="panel"><h2>Estabelecimentos em destaque — {scopeLabel}</h2><p className="muted">Não existe ranking de comércio. Esta área mostra estabelecimentos em destaque por avaliações e atividade.</p>{[...monitoredBusinesses].sort((a,b)=>(Number(b.rating_average||0)-Number(a.rating_average||0))||((b.reviews_count||0)-(a.reviews_count||0))).slice(0,50).map(b=><div className="listRow" key={b.id}><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div className="grow"><b>{b.name} <Seal type="business"/></b><small>{b.category||'Estabelecimento'} • {b.city||''} - {b.state||''}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></div>)}{!monitoredBusinesses.length&&<p className="muted">Nenhum estabelecimento neste recorte.</p>}</div>}</>}

      {ownerTab==='suporte'&&<div className="panel"><div className="ownerTicketHead"><div><h2>Central de suporte</h2><p className="muted">Identificação do solicitante, localização, status e administrador responsável.</p></div><select value={ownerSupportStatus} onChange={e=>setOwnerSupportStatus(e.target.value)}><option value="all">Todos os status</option><option value="aberto">Abertos</option><option value="em_analise">Em atendimento</option><option value="resolvido">Resolvidos</option></select></div>{supportStatusTickets.map(t=>{const person=messagePeople[t.user_id]||ownerUsers.find(x=>x.id===t.user_id)||{};const ticketCity=t.requester_city||person.city||'Cidade não informada';const ticketState=t.requester_state||person.state||'UF não informada';const assigned=ownerUsers.find(x=>x.id===t.assigned_to);return <div className="ownerTicket" key={t.id}><div className="ownerTicketHead"><div><b>{t.subject}</b><small>👤 {person.full_name||person.username||'Usuário'} {person.username?`(@${person.username})`:''} • 📍 {ticketCity} - {ticketState}</small><small>✉ {t.requester_email||'E-mail não registrado'} • {t.category} • {fmtDate(t.created_at)}</small><small>🛡 Responsável: {assigned?(assigned.full_name||assigned.username):'Ainda não atribuído'}</small></div><span className={`status ${t.status}`}>{String(t.status||'aberto').replace('_',' ')}</span></div><p>{t.message}</p>{t.image_url&&<img src={t.image_url} alt="Anexo do chamado"/>}<textarea rows={3} value={ownerReply[t.id]??t.admin_response??''} onChange={e=>setOwnerReply(v=>({...v,[t.id]:e.target.value}))} placeholder="Resposta do dono/admin..."/><div className="ownerActions">{t.status!=='resolvido'&&<button onClick={()=>ownerAssignTicket(t)}>Assumir atendimento</button>}<button onClick={()=>ownerReplyTicket(t,'em_analise')}>Salvar / Em atendimento</button><button className="safeBtn" onClick={()=>ownerReplyTicket(t,'resolvido')}>Responder e resolver</button></div></div>})}{!supportStatusTickets.length&&<p className="muted">Nenhum chamado neste filtro.</p>}</div>}

      {ownerTab==='equipe'&&<div className="panel"><h2>Equipe administrativa</h2><p className="muted">Somente o dono principal pode conceder ou remover acesso. Para adicionar alguém, a pessoa precisa já ter uma conta CIDARANK.</p>{isOwner&&<div className="adminInviteBox"><input type="email" placeholder="Gmail/e-mail da pessoa que vai administrar" value={ownerInviteEmail} onChange={e=>setOwnerInviteEmail(e.target.value)}/><button className="primaryBtn" disabled={ownerBusy||!ownerInviteEmail.trim()} onClick={ownerGrantAdminByEmail}>{ownerBusy?'Adicionando...':'Adicionar administrador'}</button></div>}<div className="ownerUserList">{ownerUsers.filter(x=>['owner','admin','moderator'].includes(String(x.role||'').toLowerCase())||x.id===session.user.id).map(u=><div className="ownerUserRow" key={u.id}><Avatar profile={u}/><div className="grow"><b>{u.full_name||u.username}</b><small>@{u.username||''}</small><Seal type={u.id===session.user.id&&isOwner?'owner':String(u.role||'').toLowerCase()==='owner'?'owner':'admin'}/></div>{isOwner&&u.id!==session.user.id&&String(u.role||'').toLowerCase()!=='owner'&&<button className="dangerBtn" onClick={()=>ownerToggleUser(u,'role')}>Remover admin</button>}</div>)}</div></div>}

      {ownerTab==='banner'&&<div className="panel"><h2>Banner nacional do CIDARANK</h2><p className="muted">A imagem é nacional e somente o dono principal pode trocar.</p><div className="ownerBannerPreview"><img src={siteBanner||'/cidarank-national-banner.png'} alt="Banner nacional atual"/></div>{isOwner?<label className="primaryBtn ownerUpload">Trocar imagem nacional<input type="file" hidden accept="image/*" disabled={ownerBusy} onChange={e=>changeNationalBanner(e.target.files?.[0])}/></label>:<div className="infoBanner">Apenas o dono pode trocar o banner.</div>}</div>}

      {ownerTab==='auditoria'&&<div className="panel"><h2>Histórico administrativo</h2><p className="muted">Registro de ações importantes feitas pelo dono e administradores.</p>{ownerLogs.map(l=>{const actor=messagePeople[l.actor_id]||ownerUsers.find(x=>x.id===l.actor_id)||{};return <div className="auditRow" key={l.id}><div><b>{l.action}</b><span>{actor.full_name||actor.username||'Administrador'}</span></div><small>{l.target_type}{l.target_id?` • ${l.target_id}`:''} • {fmtDate(l.created_at)}</small></div>})}{!ownerLogs.length&&<p className="muted">Nenhum registro ainda.</p>}</div>}

      {ownerTab==='sistema'&&<div className="adminGrid"><div className="panel"><h2>Saúde do sistema</h2><div className="healthLine"><span>Banco de dados</span><b className={ownerHealth.database==='ok'?'healthOk':'healthWarn'}>{ownerHealth.database==='ok'?'OPERACIONAL':'VERIFICAR'}</b></div><div className="healthLine"><span>Autenticação</span><b className={ownerHealth.auth==='ok'?'healthOk':'healthWarn'}>{ownerHealth.auth==='ok'?'OPERACIONAL':'VERIFICAR'}</b></div><div className="healthLine"><span>Tempo real</span><b className={ownerRealtimeConnected?'healthOk':'healthWarn'}>{ownerRealtimeConnected?'CONECTADO':'AGUARDANDO'}</b></div><div className="healthLine"><span>Última checagem</span><b>{ownerHealth.lastCheck?fmtDate(ownerHealth.lastCheck):'—'}</b></div></div><div className="panel"><h2>Cobertura nacional</h2><p className="muted">✓ 27 unidades federativas carregadas pela API oficial do IBGE</p><p className="muted">✓ Municípios carregados por estado, incluindo todas as cidades disponíveis no IBGE</p><p className="muted">✓ Filtros nacionais em usuários, tempo real, estabelecimentos, suporte e rankings</p><p className="muted">✓ Dono principal protegido e auditoria administrativa</p><p className="muted">✓ Suporte com responsável por atendimento e fila por status</p><p className="muted">✓ Moderação com responsável por análise e histórico de resolução</p><p className="muted"><b>Versão administrativa: V6.3 FINAL</b></p></div></div>}
    </>
  }

  function SupportScreen(){return <><PageHeader title="Suporte" subtitle="Envie sua dúvida, problema ou denúncia. Você acompanha o status por aqui."/><div className="twoCol"><form className="panel stackForm" onSubmit={sendSupport}><h2>Novo chamado</h2><label>Categoria<select value={supportForm.category} onChange={e=>setSupportForm({...supportForm,category:e.target.value})}><option value="duvida">Dúvida</option><option value="problema">Problema técnico</option><option value="denuncia">Denúncia</option><option value="comercio">Comércio</option><option value="outros">Outros</option></select></label><label>Assunto<input required value={supportForm.subject} onChange={e=>setSupportForm({...supportForm,subject:e.target.value})}/></label><label>Descrição<textarea required rows={7} value={supportForm.message} onChange={e=>setSupportForm({...supportForm,message:e.target.value})}/></label><label>Imagem opcional<input type="file" accept="image/*" onChange={e=>setSupportForm({...supportForm,image:e.target.files?.[0]||null})}/></label><button className="primaryBtn" disabled={busy}>Enviar chamado</button></form><div className="panel"><h2>Meus chamados</h2>{tickets.length?tickets.map(t=><div className="ticket" key={t.id}><div><b>{t.subject}</b><span className={`status ${t.status}`}>{t.status.replace('_',' ')}</span></div><p>{t.message}</p>{t.image_url&&<img src={t.image_url} alt="Anexo"/>}{t.admin_response&&<div className="adminReply"><b>Resposta do suporte:</b><p>{t.admin_response}</p></div>}<small>{fmtDate(t.created_at)}</small></div>):<p className="muted">Você ainda não abriu nenhum chamado.</p>}</div></div></>}

  function renderScreen(){
    switch(active){
      case 'Populares': return PopularScreen();
      case 'Comércios': return BusinessScreen();
      case 'Explorar Cidade': return ExploreScreen();
      case 'Mensagens': return MessagesScreen();
      case 'Perfil': return ProfileScreen();
      case 'Configurações': return SettingsScreen();
      case 'Suporte': return SupportScreen();
      case 'Painel do Dono': return OwnerPanelScreen();
      default:return HomeScreen();
    }
  }

  return <main className="shell">
    <aside className="sidebar"><div className="brand"><div className="brandMark">◆</div><div><b>CIDA<span>RANK</span></b><small>CIDADES QUE CONECTAM</small></div></div><nav>{menuItems.map(([ic,label])=><button key={label} onClick={()=>{setActive(label);if(label==='Perfil')setSelectedProfile(profile);if(label==='Comércios')setSelectedBusiness(null)}} className={active===label?'active':''}><i>{ic}</i><span>{label}</span></button>)}</nav><div className="elite"><div className="crown">♛</div><b>FAÇA PARTE<br/><span>DA ELITE</span></b><p>Conquiste seu espaço e seja destaque na sua cidade.</p><button onClick={()=>setActive('Populares')}>VER RANKINGS →</button></div><div className="miniCity">⌂ <div><b>CIDARANK</b><small>Mais que uma rede, uma cidade viva.</small></div></div></aside>
    <section className="mainCol"><header className="topbar"><div className="search">⌕ <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar pessoas, comércios..."/>{searchResults.length>0&&<div className="searchDrop">{searchResults.map((r,i)=><button key={`${r.kind}-${r.item.id}-${i}`} onClick={()=>{setSearch('');r.kind==='person'?openProfile(r.item):loadBusiness(r.item.id)}}><Avatar profile={r.kind==='person'?r.item:{avatar_url:r.item.logo_url}} name={r.label} size="xs"/><div><b>{r.label}</b><small>{r.kind==='person'?`@${r.item.username}`:r.item.category||'Comércio'}</small></div></button>)}</div>}</div><div className="city">⌖ {cityLabel}</div><div className="icons"><button title="Mensagens" onClick={()=>setActive('Mensagens')}>💬</button><button title="Perfil" onClick={openOwnProfile}><Avatar profile={profile} name={displayName} size="sm"/></button><b>{displayName}</b><button className="logout" onClick={logout}>Sair</button></div></header>{notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}>×</button></div>}<div className="screenContent">{renderScreen()}</div></section>
    <aside className="rightCol"><div className="rankCard"><div className="rankTitle"><h3>MAIS POPULARES DA CIDADE</h3><button onClick={()=>setActive('Populares')}>Ver ranking →</button></div>{topPeople.length?topPeople.map((p,i)=><button className="rankRow" key={p.id} onClick={()=>openProfile(p)}><b className={`medal m${i+1}`}>{i+1}</b><Avatar profile={p}/><div><b>{p.full_name||p.username}</b><small>@{p.username}</small></div><strong>{p.followers_count||0}</strong></button>):<div className="rankEmpty">Ainda não há ranking nesta cidade.</div>}</div><div className="rankCard"><div className="rankTitle"><h3>ESTABELECIMENTOS EM DESTAQUE</h3><button onClick={()=>setActive('Comércios')}>Ver destaques →</button></div>{topBusinesses.length?topBusinesses.map((b,i)=><button className="rankRow" key={b.id} onClick={()=>loadBusiness(b.id)}><b className={`medal m${i+1}`}>{i+1}</b><Avatar profile={{avatar_url:b.logo_url}} name={b.name}/><div><b>{b.name}</b><small>{b.category||'Estabelecimento local'}</small></div><strong>★ {Number(b.rating_average||0).toFixed(1)}</strong></button>):<div className="rankEmpty">Nenhum estabelecimento em destaque ainda.</div>}</div><div className="supportLocal">🛍️ <div><b>APOIE O COMÉRCIO LOCAL</b><small>COMPRE NA SUA CIDADE<br/>FORTALEÇA O COMÉRCIO LOCAL!</small></div><span>→</span></div><div className="weather"><div>📍 <b>{profile?.city}</b><small>{profile?.state}</small></div><button onClick={openOwnProfile}>👤 <b>{displayName}</b><small>@{profile?.username}</small></button></div><blockquote>“Cidades fortes são feitas por pessoas que acreditam no seu lugar.”</blockquote></aside>
  </main>
}
