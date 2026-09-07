'use client';

import { useState } from 'react';

const menu = [
  ['⌂','Início'],['▣','Mural'],['🏆','Populares'],['▰','Comércios'],['⌖','Explorar Cidade'],['✈','Mensagens'],['●','Perfil'],['⚙','Configurações'],['?','Suporte']
];

export default function Home(){
  const [active,setActive]=useState('Início');
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
        <div className="city">⌖ Redenção - CE⌄</div>
        <div className="icons">☀︎ ◔ 🔔 💬 <span className="avatar">D</span> <b>DaromDR⌄</b></div>
      </header>

      <section className="hero">
        <div className="heroGlow"></div>
        <div className="heroTop">BEM-VINDO AO</div>
        <h1>DAQUI<span>TOP</span></h1>
        <h2>REDENÇÃO - CE</h2>
        <div className="heroMeta">PESSOAS • COMÉRCIOS • OPORTUNIDADES • UMA CIDADE MAIS UNIDA</div>
        <div className="script">Aqui<br/>tem gente real,<br/>tem história!</div>
      </section>

      <section className="composer">
        <div className="row"><div className="avatar sm">D</div><input placeholder="No que você está pensando, DaromDR?"/></div>
        <div className="actions"><button>▧ Foto</button><button>▣ Vídeo</button><button>⌖ Marcar local</button><button>☺ Sentimento</button><button className="publish">➤ Publicar</button></div>
      </section>

      <div className="tabs"><button className="active">Todas</button><button>Pessoas</button><button>Comércios</button><button>Minha cidade</button></div>

      <article className="post">
        <div className="postHead"><div className="avatar">M</div><div><b>Mariana Souza ✓</b><small>⌖ Redenção - CE • Há 2 horas</small></div><span>⋮</span></div>
        <p>Que lugar incrível! ❤️<br/>Nossa cidade tem um pôr do sol que não se compara! 🌅</p>
        <div className="photo" aria-label="Imagem de exemplo do mural"></div>
        <div className="stats"><span>❤ 256</span><span>💬 32</span><span>➤ 18</span><span>🔖 Salvar</span></div>
      </article>
    </section>

    <aside className="rightCol" id="ranking">
      <div className="rankCard"><div className="rankTitle"><h3>TOP 3 PESSOAS</h3><a>Ver ranking →</a></div>{['1','2','3'].map((n,i)=><div className="rankRow" key={n}><b className={'medal m'+n}>{n}</b><div className="avatar">{['M','A','C'][i]}</div><div><b>{['Marcos Alves','Ana Paula Souza','Carlos Lima'][i]}</b><small>@usuario</small></div><strong>{['12.4K','9.8K','7.6K'][i]} pts</strong></div>)}</div>
      <div className="rankCard"><div className="rankTitle"><h3>TOP 3 COMÉRCIOS</h3><a>Ver ranking →</a></div>{['1','2','3'].map((n,i)=><div className="rankRow" key={n}><b className={'medal m'+n}>{n}</b><div className="avatar shop">{['M','F','R'][i]}</div><div><b>{['Mercadinho do João','Farmácia Saúde+','Restaurante Sabor'][i]}</b><small>@comercio</small></div><strong>{['15.2K','12.1K','7.9K'][i]} pts</strong></div>)}</div>
      <div className="supportLocal">🛍️ <div><b>APOIE O COMÉRCIO LOCAL</b><small>COMPRE EM REDENÇÃO - CE<br/>FORTALEÇA NOSSA CIDADE!</small></div><span>→</span></div>
      <div className="weather"><div>☀️ <b>28°C</b><small>Tempo limpo</small></div><div>📅 <b>Dom, 07 de Setembro</b><small>Redenção - CE</small></div></div>
      <blockquote>“Cidades fortes são feitas por pessoas que acreditam no seu lugar.”</blockquote>
    </aside>
  </main>
}
