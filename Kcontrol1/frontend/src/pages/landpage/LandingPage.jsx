import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./LandingPage.css";
import logoKControl from "../../assets/landing/logokcontrol.png";
import fotoRoger from "../../assets/landing/roger.png";
import fotoCaio from "../../assets/landing/caio.jpeg";
import productPreview from "../../assets/landing/image 1.png";

import featureRegistros from "../../assets/landing/image 4.png";
import featureSalas from "../../assets/landing/image 5.png";
import featureMembros from "../../assets/landing/image 7.png";
import featureAuditoria from "../../assets/landing/image 8.png";

import ScrollProgress from "../../components/ScrollProgress/ScrollProgress";
import BeamsBackground from "../../components/BeamsBackground/BeamsBackground";
import { GlowCard } from "../../components/ui/spotlight-card"

gsap.registerPlugin(ScrollTrigger);

const recursos = [
  {
    numero: "01",
    titulo: "Registros em tempo real",
    descricao:
      "Saiba quem retirou, quando retirou e quando a sala foi liberada. Tudo em um fluxo simples e rastreável.",
    tag: "MOVIMENTAÇÕES",
    imagem: featureRegistros,
    alt: "Tela de registros de movimentações do KControl",
  },
  {
    numero: "02",
    titulo: "Salas e disponibilidade",
    descricao:
      "Visualize a situação de cada ambiente e evite conflitos de uso entre equipes e turnos.",
    tag: "INFRAESTRUTURA",
    imagem: featureSalas,
    alt: "Tela de gerenciamento de salas do KControl",
  },
  {
    numero: "03",
    titulo: "Pessoas e permissões",
    descricao:
      "Organize os membros da empresa e defina níveis de acesso de acordo com cada responsabilidade.",
    tag: "EQUIPE",
    imagem: featureMembros,
    alt: "Tela de gerenciamento de membros do KControl",
  },
  {
    numero: "04",
    titulo: "Auditoria e histórico", 
    descricao:
      "Consulte o histórico de movimentações e tenha mais clareza sobre o que acontece na operação.",
    tag: "RASTREABILIDADE",
    imagem: featureAuditoria,
    alt: "Tela de histórico e auditoria do KControl",
  },
];

function Brand() {
  return (
    <span className="brand-lockup" aria-label="KControl">
      <img src={logoKControl} alt="KControl" />
    </span>
  );
}

function ProductPreview({ rotateX, scale, y }) {
  return (
    <motion.div
      className="product-preview product-preview-image"
      aria-label="Interface real do dashboard KControl"
      style={{
        rotateX,
        scale,
        y,
        transformPerspective: 1200,
        transformOrigin: "center top",
      }}
    >
      <img
        src={productPreview}
        alt="Dashboard da plataforma KControl"
        loading="eager"
        fetchPriority="high"
      />

      <div className="preview-floating-note">
        <span className="floating-check">
          <i className="bi bi-check2" />
        </span>

        <span>
          <b>Operação atualizada</b>
          <small>Movimentações sincronizadas</small>
        </span>

        <i className="bi bi-arrow-up-right" />
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const rootRef = useRef(null);
  const horizontalRef = useRef(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const heroRef = useRef(null);

// Progresso da rolagem da seção inicial
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ["start start", "end start"],
});

// Transformações 3D do dashboard
const previewRotateX = useTransform(
  scrollYProgress,
  [0, 0.65, 1],
  [22, 0, 0]
);

const previewScale = useTransform(
  scrollYProgress,
  [0, 0.65, 1],
  [0.78, 1, 1]
);

const previewY = useTransform(
  scrollYProgress,
  [0, 0.65, 1],
  [65, 0, 0]
);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!reduceMotion) {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(".nav-inner", { y: -24, opacity: 0, duration: 0.8 })
          .from(
            ".hero-kicker, .hero-title-line, .hero-copy, .hero-actions, .hero-meta",
            { y: 30, opacity: 0, stagger: 0.12, duration: 0.85 },
            "-=.35",
          )

        gsap.to(".hero-orbit", {
          rotate: 360,
          duration: 48,
          repeat: -1,
          ease: "none",
        });
        gsap.to(".hero-glow", {
          y: -35,
          x: 22,
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      gsap.utils.toArray("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 84%", once: true },
        });
      });

const track = horizontalRef.current;
const horizontalSection = track?.closest(".features-horizontal");

if (
  track &&
  horizontalSection &&
  window.matchMedia("(min-width: 900px)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const getDistance = () =>
    Math.max(0, track.scrollWidth - window.innerWidth);


  gsap.to(track, {
    x: () => -getDistance(),
    ease: "none",

    scrollTrigger: {
      trigger: horizontalSection,
      start: "top top",
      end: () => `+=${getDistance()}`,
      scrub: 1,
      pin: horizontalSection,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

// Animação de escrita do título da introdução
const typingLines = gsap.utils.toArray(
  ".intro-typing-title .typing-line"
);

const typingTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".intro-section",
    start: "top 65%",
    once: true,
  },
});

typingLines.forEach((line, index) => {
  const text = line.dataset.text;
  const textElement = line.querySelector(".typing-text");
  const cursor = line.querySelector(".typing-cursor");

  const progress = { value: 0 };

  // Esconde o texto inicialmente
  textElement.textContent = "";

  // Anima a escrita
  typingTimeline.to(progress, {
    value: text.length,
    duration: index === 0 ? 1.2 : 1.8,
    ease: "none",
    snap: { value: 1 },

    onUpdate: () => {
      textElement.textContent = text.slice(
        0,
        progress.value
      );
    },

    onComplete: () => {
      cursor?.remove();
    },
  });
});
// Efeito de sobreposição entre seções
const managementSection = rootRef.current?.querySelector(
  ".management-section"
);

const principlesSection = rootRef.current?.querySelector(
  ".principles-section"
);

if (
  managementSection &&
  principlesSection &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  window.matchMedia("(min-width: 900px)").matches
) {
  ScrollTrigger.create({
    trigger: managementSection,
    start: "top top",

    end: () => `+=${managementSection.offsetHeight}`,

    pin: managementSection,
    pinSpacing: false,

    anticipatePin: 1,
    invalidateOnRefresh: true,
  });
}

      gsap.fromTo(
  ".closing-cta-inner",
  {
    y: 35,
    opacity: 0,
  },
  {
    y: 0,
    opacity: 1,
    duration: 0.9,
    ease: "power3.out",
    clearProps: "transform",
    scrollTrigger: {
      trigger: ".closing-cta",
      start: "top 80%",
      once: true,
    },
  }

  
);
// Efeito 3D ao movimentar o mouse no dashboard
//const preview = rootRef.current?.querySelector(".product-preview");


    }, rootRef);
    const refreshScrollTriggers = () => {
  ScrollTrigger.refresh();
};

window.addEventListener("load", refreshScrollTriggers);

const images = document.querySelectorAll(".landing-page img");

images.forEach((img) => {
  if (!img.complete) {
    img.addEventListener("load", refreshScrollTriggers, { once: true });
    img.addEventListener("error", refreshScrollTriggers, { once: true });
  }
});

ScrollTrigger.refresh();

    return () => {
  rootRef.current
    ?.querySelector(".product-preview")
    ?._tiltCleanup?.();

  window.removeEventListener("load", refreshScrollTriggers);
  ctx.revert();
};
  }, []);

  const fecharMenu = () => setMenuAberto(false);

  return (
    <main className="landing-page" ref={rootRef}>
        <ScrollProgress/>
      <header className="landing-nav">
        <div className="nav-inner">
          <Link to="/" className="nav-brand" onClick={fecharMenu}>
            <Brand />
          </Link>
          <nav className={menuAberto ? "nav-links is-open" : "nav-links"}>
            <a href="#produto" onClick={fecharMenu}>
              O produto
            </a>
            <a href="#funcionalidades" onClick={fecharMenu}>
              Funcionalidades
            </a>
            <a href="#gestao" onClick={fecharMenu}>
              Gestão
            </a>
            <a href="#equipe" onClick={fecharMenu}>
              Equipe
            </a>
            <a href="#contato" onClick={fecharMenu}>
              Contato
            </a>
          </nav>
          <div className="nav-actions">
            <Link to="/login" className="nav-login">
              Entrar <i className="bi bi-arrow-up-right" />
            </Link>
            <Link
              to="/solicitar-acesso"
              className="button button-primary nav-cta"
            >
              Solicitar acesso <i className="bi bi-arrow-up-right" />
            </Link>
          </div>
          <button
            className="nav-mobile-toggle"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
          >
            <i className={`bi ${menuAberto ? "bi-x-lg" : "bi-list"}`} />
          </button>
        </div>
      </header>

      <section className="hero-section" id="inicio" ref={heroRef}>
        <BeamsBackground/>
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-orbit">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-content">
          <div className="hero-kicker">
            <span className="status-pulse" /> GESTÃO INTELIGENTE DE ACESSOS{" "}
            <span className="kicker-line" />
          </div>
          <h1>
            <span className="hero-title-line">Sua operação.</span>
            <span className="hero-title-line hero-title-accent">
              Sob <i>controle.</i>
            </span>
          </h1>
          <p className="hero-copy">
            Mais clareza para gerenciar salas, pessoas e movimentações. Uma
            plataforma feita para simplificar o dia a dia da sua empresa.
          </p>
          <div className="hero-actions">
            <Link
              to="/solicitar-acesso"
              className="button button-primary button-large"
            >
              Solicitar acesso <i className="bi bi-arrow-up-right" />
            </Link>
            <a href="#produto" className="button button-ghost button-large">
              <span className="play-icon">
                <i className="bi bi-arrow-down" />
              </span>{" "}
              Conheça a plataforma
            </a>
          </div>
          <div className="hero-meta">
            <span>
              <i className="bi bi-shield-check" /> Gestão centralizada
            </span>
            <span>
              <i className="bi bi-lightning-charge" /> Atualização em tempo real
            </span>
          </div>
        </div>
        <div className="hero-preview-wrap">

          <ProductPreview
  rotateX={previewRotateX}
  scale={previewScale}
  y={previewY}
/>
        </div>
        <div className="hero-bottom">
          <span>01 / 04 — UMA NOVA FORMA DE GERIR</span>
          <a href="#produto">
            ROLE PARA EXPLORAR <i className="bi bi-arrow-down" />
          </a>
        </div>
      </section>

      <section className="intro-section section-shell" id="produto">
        <div className="section-index" data-reveal>
          <span>01</span>
          <i /> O SISTEMA
        </div>
        <div className="intro-grid">
          <h2 className="intro-typing-title" aria-label="Menos improviso. Mais visão da operação.">
  <span className="typing-line" data-text="Menos improviso." aria-hidden="true">
    <span className="typing-text">Menos improviso.</span>
    <span className="typing-cursor" />
  </span>

  <br />

  <span
    className="typing-line intro-typing-highlight"
    data-text="Mais visão da operação."
    aria-hidden="true"
  >
    <span className="typing-text">Mais visão da operação.</span>
    <span className="typing-cursor" />
  </span>
</h2>
          <div className="intro-copy" data-reveal>
            <p>
              Quando o controle depende de planilhas, mensagens e anotações, a
              informação se perde. O KControl reúne tudo em um só lugar para sua
              equipe trabalhar com mais organização e segurança.
            </p>
            <a href="#funcionalidades" className="text-link">
              Explore as funcionalidades{" "}
              <i className="bi bi-arrow-down-right" />
            </a>
          </div>
        </div>
        <div className="intro-statement" data-reveal>
          <span>UMA PLATAFORMA.</span>
          <b>
            UMA OPERAÇÃO MAIS ORGANIZADA<span>.</span>
          </b>
          <span>DO PRIMEIRO REGISTRO À AUDITORIA.</span>
        </div>
      </section>

      <section className="features-section" id="funcionalidades">
        {/* Tipografia decorativa de fundo */}
  <div className="features-backdrop" aria-hidden="true">
  <span>KCONTROL</span>
  <span>KCONTROL</span>
  <span>KCONTROL</span>
  <span>KCONTROL</span>
</div>
        <div className="section-shell features-heading">
          <div className="section-index" data-reveal>
            <span>02</span>
            <i /> DENTRO DA PLATAFORMA
          </div>
          <div className="features-heading-row">
            <h2 data-reveal>
              O que sua equipe
              <br />
              <span>precisa. Em um só lugar.</span>
            </h2>
            <p data-reveal>
              Ferramentas conectadas para acompanhar cada etapa da rotina, sem
              complicar o trabalho.
            </p>
          </div>
        </div>
        <div className="features-horizontal">
            
          <div className="features-track" ref={horizontalRef}>
            {recursos.map((item, index) => (
              <article
                className={`feature-panel feature-panel-${index + 1}`}
                key={item.numero}
              >
                <div className="feature-copy">
                  <span className="feature-number">{item.numero} / 04</span>
                  <span className="feature-tag">{item.tag}</span>
                  <h3>{item.titulo}</h3>
                  <p>{item.descricao}</p>
                  <a href="#gestao" className="feature-more">
                    VER COMO FUNCIONA <i className="bi bi-arrow-up-right" />
                  </a>
                </div>
                <div className="feature-visual">
  <div className="feature-visual-top">
    <span>KCONTROL / {item.tag}</span>

    <i className="bi bi-three-dots" />
  </div>

  <div className="feature-image-container">
    <img
      src={item.imagem}
      alt={item.alt}
      loading="lazy"
    />
  </div>
</div>
              </article>
            ))}
          </div>
        </div>
        <div className="features-mobile-hint">
          <i className="bi bi-arrow-left-right" /> Deslize para explorar as
          funcionalidades
        </div>
      </section>

      <section className="management-section section-shell" id="gestao">
        <div className="section-index" data-reveal>
          <span>03</span>
          <i /> VISIBILIDADE E DECISÃO
        </div>
        <div className="management-grid">
          <div className="management-copy" data-reveal>
            <h2>
              Informação que
              <br />
              <span>vira decisão.</span>
            </h2>
            <p>
              Entenda o ritmo da sua operação com indicadores visuais, histórico
              de atividades e dados organizados para facilitar a gestão.
            </p>
            <ul>
              <li>
                <i className="bi bi-check2" /> Indicadores de movimentação
              </li>
              <li>
                <i className="bi bi-check2" /> Ranking de salas mais utilizadas
              </li>
              <li>
                <i className="bi bi-check2" /> Histórico por pessoa e período
              </li>
            </ul>
            <Link to="/solicitar-acesso" className="text-link">
              Quero conhecer o KControl <i className="bi bi-arrow-up-right" />
            </Link>
          </div>
          <div className="analytics-card" data-reveal>
            <div className="analytics-top">
              <div>
                <small>VISÃO DA OPERAÇÃO</small>
                <h3>Movimentações</h3>
              </div>
              <span>
                ÚLTIMOS 7 DIAS <i className="bi bi-chevron-down" />
              </span>
            </div>
            <div className="analytics-total">
              <b>842</b>
              <span>
                <i className="bi bi-arrow-up-right" /> atividade registrada
              </span>
            </div>
            <div className="analytics-chart">
              <div className="analytics-y">
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              <div className="analytics-plot">
                <div className="analytics-gridlines">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <svg
                  viewBox="0 0 620 190"
                  preserveAspectRatio="none"
                  aria-label="Gráfico ilustrativo de movimentações"
                >
                  <defs>
                    <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#c6f36b" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#c6f36b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 145 C40 130 55 138 90 112 S145 130 180 96 S230 112 270 82 S320 98 360 65 S420 92 450 55 S510 75 540 34 S590 54 620 20 V190 H0Z"
                    fill="url(#areaFill)"
                  />
                  <path
                    d="M0 145 C40 130 55 138 90 112 S145 130 180 96 S230 112 270 82 S320 98 360 65 S420 92 450 55 S510 75 540 34 S590 54 620 20"
                    fill="none"
                    stroke="#c6f36b"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="analytics-x">
                  <span>SEG</span>
                  <span>TER</span>
                  <span>QUA</span>
                  <span>QUI</span>
                  <span>SEX</span>
                  <span>SÁB</span>
                  <span>DOM</span>
                </div>
              </div>
            </div>
            <div className="analytics-foot">
              <span>
                <i /> RETIRADAS
              </span>
              <span>
                <i /> DEVOLUÇÕES
              </span>
              <small>Dados demonstrativos</small>
            </div>
          </div>
        </div>
      </section>

      <section className="principles-section">
        <div className="section-shell">
          <div className="section-index" data-reveal>
            <span>04</span>
            <i /> FEITO PARA SUA EMPRESA
          </div>
          <div className="principles-heading" data-reveal>
            <h2>Organização em cada detalhe.</h2>
            <p>Uma base sólida para manter sua operação fluindo.</p>
          </div>
          <div className="principles-grid">
  <GlowCard className="principle-glow-card">
    <article className="principle-card">
      <span>01</span>
      <i className="bi bi-building-check" />
      <h3>Multiempresa</h3>
      <p>
        Ambientes separados para cada organização, com estrutura
        preparada para crescer.
      </p>
    </article>
  </GlowCard>

  <GlowCard className="principle-glow-card">
    <article className="principle-card">
      <span>02</span>
      <i className="bi bi-person-lock" />
      <h3>Acesso por perfil</h3>
      <p>
        Permissões definidas por responsabilidade, com mais controle
        sobre cada área.
      </p>
    </article>
  </GlowCard>

  <GlowCard className="principle-glow-card">
    <article className="principle-card">
      <span>03</span>
      <i className="bi bi-clock-history" />
      <h3>Histórico centralizado</h3>
      <p>
        Registros organizados para consultar movimentações e acompanhar
        a rotina.
      </p>
    </article>
  </GlowCard>
</div>
        </div>
      </section>

      <section className="team-section section-shell" id="equipe">
        <div className="section-index" data-reveal>
          <span>05</span>
          <i /> QUEM CONSTRÓI
        </div>
        <div className="team-heading" data-reveal>
          <div>
            <span className="team-eyebrow">TECNOLOGIA COM INTENÇÃO.</span>
            <h2>
              Feito por pessoas.
              <br />
              <span>Para facilitar outras.</span>
            </h2>
          </div>
          <p>
            O KControl nasceu da vontade de transformar uma rotina operacional
            em uma experiência mais clara, organizada e confiável.
          </p>
        </div>
        <div className="team-grid">
          <article className="team-card" data-reveal>
            <div className="team-photo-wrap">
              <img
                src={fotoRoger}
                alt="Retrato de Roger, desenvolvedor do KControl"
                loading="lazy"
              />
              <span className="team-photo-index">01 / DESENVOLVIMENTO</span>
            </div>
            <div className="team-card-info">
              <div>
                <h3>Roger</h3>
                <p>Desenvolvimento & produto</p>
              </div>
              <i className="bi bi-arrow-up-right" />
            </div>
          </article>
          <article className="team-card" data-reveal>
            <div className="team-photo-wrap">
              <img
                src={fotoCaio}
                alt="Retrato de Caio, desenvolvedor do KControl"
                loading="lazy"
              />
              <span className="team-photo-index">02 / DESENVOLVIMENTO</span>
            </div>
            <div className="team-card-info">
              <div>
                <h3>Caio</h3>
                <p>Desenvolvimento & produto</p>
              </div>
              <i className="bi bi-arrow-up-right" />
            </div>
          </article>
          <div className="team-note">
            <span className="team-note-mark">“</span>
            <p>
              Uma ferramenta melhor começa entendendo o trabalho real de quem
              usa.
            </p>
            <span>KCONTROL / NOSSA VISÃO</span>
          </div>
        </div>
      </section>

      <section className="faq-section section-shell" id="duvidas">
        <div className="section-index" data-reveal>
          <span>06</span>
          <i /> DÚVIDAS FREQUENTES
        </div>
        <div className="faq-layout">
          <h2 data-reveal>
            O essencial,
            <br />
            <span>sem complicação.</span>
          </h2>
          <div className="faq-list" data-reveal>
            <details>
              <summary>
                O KControl é indicado para quais empresas?
                <i className="bi bi-plus-lg" />
              </summary>
              <p>
                Para organizações que precisam organizar a utilização de salas,
                ambientes e o fluxo de retirada e devolução de chaves.
              </p>
            </details>
            <details>
              <summary>
                É possível separar os dados de cada empresa?
                <i className="bi bi-plus-lg" />
              </summary>
              <p>
                Sim. A plataforma está sendo estruturada como um SaaS
                multiempresa, com ambientes e usuários vinculados à sua
                organização.
              </p>
            </details>
            <details>
              <summary>
                Posso definir permissões para os membros?
                <i className="bi bi-plus-lg" />
              </summary>
              <p>
                Sim. O acesso é organizado por perfil, para que cada pessoa
                tenha as permissões adequadas à sua responsabilidade.
              </p>
            </details>
            <details>
              <summary>
                Como faço para conhecer a plataforma?
                <i className="bi bi-plus-lg" />
              </summary>
              <p>
                Solicite acesso pelo formulário. A equipe poderá orientar os
                próximos passos para conhecer o KControl.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="closing-cta" id="contato">
        <div className="closing-cta-grid" />
        <div className="closing-cta-inner">
          <span className="closing-kicker">
            <i /> KCONTROL / GESTÃO INTELIGENTE
          </span>
          <h2>
            Pronto para uma
            <br />
            <span>nova rotina?</span>
          </h2>
          <p>
            Conheça uma forma mais simples de organizar o acesso aos espaços da
            sua empresa.
          </p>
          <div className="closing-actions">
            <Link
              to="/solicitar-acesso"
              className="button button-primary button-large"
            >
              Solicitar acesso <i className="bi bi-arrow-up-right" />
            </Link>
            <Link to="/login" className="button button-outline button-large">
              Já tenho uma conta <i className="bi bi-arrow-right" />
            </Link>
          </div>
        </div>
        <div className="closing-orbit" />
      </section>

      <footer className="landing-footer">
        <div className="footer-main">
          <div>
            <Link to="/" className="footer-brand">
              <Brand />
            </Link>
            <p>
              Organização, visibilidade e clareza
              <br />
              para a sua operação.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <small>PLATAFORMA</small>
              <a href="#produto">O produto</a>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#gestao">Gestão</a>
            </div>
            <div>
              <small>ACESSO</small>
              <Link to="/login">Entrar</Link>
              <Link to="/solicitar-acesso">Solicitar acesso</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} KControl. Todos os direitos reservados.
          </span>
          <span>DESENVOLVIDO PARA SIMPLIFICAR.</span>
          <a href="#inicio">VOLTAR AO TOPO ↑</a>
        </div>
      </footer>
    </main>
  );
}
