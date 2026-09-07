'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const menu = [
  ['⌂','Início'],['▣','Mural'],['🏆','Populares'],['▰','Comércios'],['⌖','Explorar Cidade'],['✈','Mensagens'],['●','Perfil'],['⚙','Configurações'],['?','Suporte']
];

function initials(name = 'U') {
  return (name || 'U').trim().slice(0, 1).toUpperCase();
}

export default function Home(){
  const [active,setActive]=useState('Início');
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [authMode,setAuthMode]=useState('login');
  const [authMessage,setAuthMessage]=useState('');
  const [authBusy,setAuthBusy]=useState(false);
  const [form,setForm]=useState({email:'',password:'',full_name:'',username:'',state:'',state_id:'',city:'',gender:''});
  const [states,setStates]=useState([]);
  const [cities,setCities]=useState([]);
  const [locationsBusy,setLocationsBusy]=useState(false);
  const [locationsError,setLocationsError]=useState('');
  const [posts,setPosts]=useState([]);
  const [people,setPeople]=useState([]);
  const [businesses,setBusinesses]=useState([]);
  const [postText,setPostText]=useState('');
  const [postBusy,setPostBusy]=useState(false);

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Usuário';
  const cityLabel = profile?.city && profile?.state ? `${profile.city} - ${profile.state}` : 'Sua cidade';
  const avatarLetter = initials(displayName);

  useEffect(()=>{
    let alive=true;
    async function loadStates(){
      try{
        setLocationsError('');
        const response=await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        if(!response.ok) throw new Error('Falha ao carregar estados');
        const data=await response.json();
        if(alive) setStates(data || []);
      }catch(_error){
        if(alive) setLocationsError('Não foi possível carregar os estados. Tente novamente.');
      }
    }
    loadStates();
    return ()=>{alive=false};
  },[]);

  async function handleStateChange(e){
    const stateId=e.target.value;
    const selected=states.find(item=>String(item.id)===String(stateId));
    setForm(current=>({...current,state_id:stateId,state:selected?.sigla || '',city:''}));
    setCities([]);
    setLocationsError('');
    if(!stateId) return;
    setLocationsBusy(true);
    try{
      const response=await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios?orderBy=nome`);
      if(!response.ok) throw new Error('Falha ao carregar cidades');
      const data=await response.json();
      setCities(data || []);
    }catch(_error){
      setLocationsError('Não foi possível carregar as cidades desse estado. Tente novamente.');
    }finally{
      setLocationsBusy(false);
    }
  }

  useEffect(()=>{
    let mounted = true;
    supabase.auth.getSession().then(({data})=>{
      if(!mounted) return;
      setSession(data.session || null);
      if(!data.session) setLoading(false);
    });

    const {data:listener}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      setSession(nextSession || null);
      if(!nextSession){
        setProfile(null);
        setPosts([]);
        setPeople([]);
        setBusinesses([]);
        setLoading(false);
      }
    });

    return ()=>{
      mounted=false;
      listener.subscription.unsubscribe();
    };
  },[]);

  useEffect(()=>{
    if(!session?.user?.id) return;
    loadApp(session.user.id);
  },[session?.user?.id]);

  async function loadApp(userId){
    setLoading(true);
    const {data:ownProfile}=await supabase.from('profiles').select('*').eq('id',userId).maybeSingle();
    let effectiveProfile=ownProfile || null;
    const metadataGender=session?.user?.user_metadata?.gender || '';
    if(effectiveProfile && metadataGender && !effectiveProfile.gender){
      const {data:updatedProfile}=await supabase.from('profiles').update({gender:metadataGender}).eq('id',userId).select('*').maybeSingle();
      if(updatedProfile) effectiveProfile=updatedProfile;
    }
    setProfile(effectiveProfile);

    const city = effectiveProfile?.city;
    const state = effectiveProfile?.state;

    let postsQuery = supabase
      .from('posts')
      .select('id,content,image_url,video_url,city,state,created_at,author_id,profiles!posts_author_id_fkey(full_name,username,avatar_url)')
      .order('created_at',{ascending:false})
      .limit(20);
    if(city) postsQuery=postsQuery.eq('city',city);
    if(state) postsQuery=postsQuery.eq('state',state);

    let peopleQuery = supabase
      .from('profiles')
      .select('id,full_name,username,followers_count,avatar_url,city,state')
      .eq('account_type','user')
      .order('followers_count',{ascending:false})
      .limit(3);
    if(city) peopleQuery=peopleQuery.eq('city',city);
    if(state) peopleQuery=peopleQuery.eq('state',state);

    let businessQuery = supabase
      .from('businesses')
      .select('id,name,username,rating_average,reviews_count,logo_url,city,state')
      .order('rating_average',{ascending:false})
      .order('reviews_count',{ascending:false})
      .limit(3);
    if(city) businessQuery=businessQuery.eq('city',city);
    if(state) businessQuery=businessQuery.eq('state',state);

    const [{data:postData},{data:peopleData},{data:businessData}] = await Promise.all([
      postsQuery, peopleQuery, businessQuery
    ]);

    setPosts(postData || []);
    setPeople(peopleData || []);
    setBusinesses(businessData || []);
    setLoading(false);
  }

  async function handleAuth(e){
    e.preventDefault();
    setAuthBusy(true);
    setAuthMessage('');

    if(authMode==='login'){
      const {error}=await supabase.auth.signInWithPassword({email:form.email.trim(),password:form.password});
      setAuthBusy(false);
      if(error){setAuthMessage(error.message);return;}
      setAuthMessage('Login realizado com sucesso.');
      return;
    }

    if(!form.full_name.trim() || !form.username.trim() || !form.city.trim() || !form.state.trim() || !form.gender){
      setAuthBusy(false);
      setAuthMessage('Preencha nome, @usuário, estado, cidade e gênero.');
      return;
    }

    const cleanUsername=form.username.trim().replace(/^@/,'').toLowerCase();
    const {data,error}=await supabase.auth.signUp({
      email:form.email.trim(),
      password:form.password,
      options:{
        data:{
          full_name:form.full_name.trim(),
          username:cleanUsername,
          state:form.state.trim().toUpperCase(),
          city:form.city.trim(),
          gender:form.gender
        }
      }
    });
    setAuthBusy(false);
    if(error){setAuthMessage(error.message);return;}
    if(data.session){
      setAuthMessage('Conta criada e login realizado.');
    }else{
      setAuthMessage('Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.');
      setAuthMode('login');
    }
  }

  async function publishPost(){
    const content=postText.trim();
    if(!content || !profile || !session?.user?.id) return;
    setPostBusy(true);
    const {error}=await supabase.from('posts').insert({
      author_id:session.user.id,
      content,
      state:profile.state || '',
      city:profile.city || '',
      post_type:'user'
    });
    setPostBusy(false);
    if(error){alert(`Não foi possível publicar: ${error.message}`);return;}
    setPostText('');
    await loadApp(session.user.id);
  }

  async function logout(){
    await supabase.auth.signOut();
  }

  const heroTitle=useMemo(()=>cityLabel.toUpperCase(),[cityLabel]);

  if(loading && session){
    return <div className="screenCenter"><div className="loader"></div><p>Carregando DAQUITOP...</p></div>;
  }

  if(!session){
    return <main className="authPage">
      <section className="authShowcase">
        <div className="brand authBrand"><div className="brandMark">◆</div><div><b>DAQUI<span>TOP</span></b><small>CIDADES QUE CONECTAM</small></div></div>
        <div className="authHeroText">
          <span>BEM-VINDO AO</span>
          <h1>DAQUI<i>TOP</i></h1>
          <h2>Sua cidade. Sua gente. Seu destaque.</h2>
          <p>Entre para acompanhar o mural da sua cidade, participar dos rankings locais e descobrir os melhores comércios perto de você.</p>
        </div>
      </section>

      <section className="authPanel">
        <div className="authCard">
          <div className="authTabs">
            <button className={authMode==='login'?'active':''} onClick={()=>{setAuthMode('login');setAuthMessage('')}}>ENTRAR</button>
            <button className={authMode==='signup'?'active':''} onClick={()=>{setAuthMode('signup');setAuthMessage('')}}>CRIAR CONTA</button>
          </div>
          <h2>{authMode==='login'?'Bem-vindo de volta':'Faça parte do DAQUITOP'}</h2>
          <p className="authSubtitle">{authMode==='login'?'Acesse sua cidade e continue de onde parou.':'Crie seu perfil local em poucos passos.'}</p>
          <form onSubmit={handleAuth}>
            {authMode==='signup' && <>
              <label>Nome completo<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Seu nome"/></label>
              <label>@Usuário<input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="seuusuario"/></label>
              <div className="authGrid locationGrid">
                <label>Estado
                  <select required value={form.state_id} onChange={handleStateChange}>
                    <option value="">Selecione</option>
                    {states.map(item=><option key={item.id} value={item.id}>{item.nome} ({item.sigla})</option>)}
                  </select>
                </label>
                <label>Cidade
                  <select required value={form.city} disabled={!form.state_id || locationsBusy} onChange={e=>setForm({...form,city:e.target.value})}>
                    <option value="">{locationsBusy?'Carregando cidades...':form.state_id?'Selecione a cidade':'Escolha o estado primeiro'}</option>
                    {cities.map(item=><option key={item.id} value={item.nome}>{item.nome}</option>)}
                  </select>
                </label>
              </div>
              <label>Gênero
                <select required value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                  <option value="">Selecione</option>
                  <option value="homem">Homem</option>
                  <option value="mulher">Mulher</option>
                  <option value="outros">Outros</option>
                </select>
              </label>
              {locationsError && <div className="authMessage authError">{locationsError}</div>}
            </>}
            <label>E-mail<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="voce@email.com"/></label>
            <label>Senha<input type="password" minLength={6} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Mínimo 6 caracteres"/></label>
            {authMessage && <div className="authMessage">{authMessage}</div>}
            <button className="authSubmit" disabled={authBusy}>{authBusy?'AGUARDE...':authMode==='login'?'ENTRAR NO DAQUITOP':'CRIAR MINHA CONTA'}</button>
          </form>
        </div>
      </section>
    </main>;
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">◆</div><div><b>DAQUI<span>TOP</span></b><small>CIDADES QUE CONECTAM</small></div></div>
      <nav>{menu.map(([ic,label])=><button key={label} onClick={()=>setActive(label)} className={active===label?'active':''}><i>{ic}</i><span>{label}</span></button>)}</nav>
      <div className="elite"><div className="crown">♛</div><b>FAÇA PARTE<br/><span>DA ELITE</span></b><p>Conquiste seu espaço e seja destaque na sua cidade.</p><a href="#ranking">SAIBA MAIS →</a></div>
      <div className="miniCity">⌂ <div><b>DAQUITOP</b><small>Mais que uma rede, uma cidade viva.</small></div></div>
    </aside>

    <section className="mainCol">
      <header className="topbar">
        <div className="search">⌕ <input placeholder="Pesquisar pessoas, comércios, lugares..."/></div>
        <div className="city">⌖ {cityLabel}</div>
        <div className="icons">☀︎ ◔ 🔔 💬 <span className="avatar">{avatarLetter}</span> <b>{displayName}</b><button className="logout" onClick={logout}>Sair</button></div>
      </header>

      <section className="hero">
        <div className="heroGlow"></div>
        <div className="heroTop">BEM-VINDO AO</div>
        <h1>DAQUI<span>TOP</span></h1>
        <h2>{heroTitle}</h2>
        <div className="heroMeta">PESSOAS • COMÉRCIOS • OPORTUNIDADES • UMA CIDADE MAIS UNIDA</div>
        <div className="script">Aqui<br/>tem gente real,<br/>tem história!</div>
      </section>

      <section className="composer">
        <div className="row"><div className="avatar sm">{avatarLetter}</div><input value={postText} onChange={e=>setPostText(e.target.value)} placeholder={`No que você está pensando, ${displayName}?`} onKeyDown={e=>{if(e.key==='Enter')publishPost()}}/></div>
        <div className="actions"><button disabled>▧ Foto</button><button disabled>▣ Vídeo</button><button disabled>⌖ Marcar local</button><button disabled>☺ Sentimento</button><button className="publish" onClick={publishPost} disabled={postBusy || !postText.trim()}>{postBusy?'Publicando...':'➤ Publicar'}</button></div>
      </section>

      <div className="tabs"><button className="active">Todas</button><button>Pessoas</button><button>Comércios</button><button>Minha cidade</button></div>

      {posts.length===0 ? <div className="emptyCard"><b>O mural da sua cidade está começando.</b><span>Seja a primeira pessoa a publicar no DAQUITOP.</span></div> : posts.map(post=>{
        const author=post.profiles || {};
        const authorName=author.full_name || author.username || 'Usuário';
        return <article className="post" key={post.id}>
          <div className="postHead"><div className="avatar">{initials(authorName)}</div><div><b>{authorName}</b><small>⌖ {post.city} - {post.state} • {new Date(post.created_at).toLocaleString('pt-BR')}</small></div><span>⋮</span></div>
          <p>{post.content}</p>
          {post.image_url && <img className="postImage" src={post.image_url} alt="Publicação do mural"/>}
          <div className="stats"><span>♡ Curtir</span><span>💬 Comentar</span></div>
        </article>
      })}
    </section>

    <aside className="rightCol" id="ranking">
      <div className="rankCard"><div className="rankTitle"><h3>TOP 3 PESSOAS</h3><a>Ver ranking →</a></div>{people.length===0?<div className="rankEmpty">Ainda não há ranking nesta cidade.</div>:people.map((person,i)=><div className="rankRow" key={person.id}><b className={'medal m'+(i+1)}>{i+1}</b><div className="avatar">{initials(person.full_name || person.username)}</div><div><b>{person.full_name || person.username}</b><small>@{person.username || 'usuario'}</small></div><strong>{person.followers_count || 0}</strong></div>)}</div>
      <div className="rankCard"><div className="rankTitle"><h3>TOP 3 COMÉRCIOS</h3><a>Ver ranking →</a></div>{businesses.length===0?<div className="rankEmpty">Nenhum comércio ranqueado ainda.</div>:businesses.map((business,i)=><div className="rankRow" key={business.id}><b className={'medal m'+(i+1)}>{i+1}</b><div className="avatar shop">{initials(business.name)}</div><div><b>{business.name}</b><small>@{business.username || 'comercio'}</small></div><strong>★ {Number(business.rating_average || 0).toFixed(1)}</strong></div>)}</div>
      <div className="supportLocal">🛍️ <div><b>APOIE O COMÉRCIO LOCAL</b><small>COMPRE NA SUA CIDADE<br/>FORTALEÇA O COMÉRCIO LOCAL!</small></div><span>→</span></div>
      <div className="weather"><div>📍 <b>{profile?.city || 'Sua cidade'}</b><small>{profile?.state || 'Brasil'}</small></div><div>👤 <b>{displayName}</b><small>@{profile?.username || 'usuario'}</small></div></div>
      <blockquote>“Cidades fortes são feitas por pessoas que acreditam no seu lugar.”</blockquote>
    </aside>
  </main>
}
