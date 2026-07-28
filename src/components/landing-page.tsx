"use client";

import Link from "next/link";
import { useState } from "react";
import { AppCover } from "@/components/app-cover";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  GoogleIcon,
  HeartIcon,
  LinkIcon,
  MenuIcon,
  SparkleIcon,
} from "@/components/icons";
import { demoApps } from "@/lib/mock-data";

const firstApp = demoApps[0];
const secondApp = demoApps[1];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-shell">
      <header className="site-header">
        <nav className="site-nav" aria-label="주요 메뉴">
          <BrandLogo />
          <div className="desktop-nav-links">
            <a href="#why">왜 Baby Vibe?</a>
            <a href="#how">만드는 방법</a>
            <Link href="/people">메이커 둘러보기</Link>
            <Link href="/etime">예시 페이지</Link>
          </div>
          <div className="desktop-nav-actions">
            <Link className="text-link-button" href="/login">
              로그인
            </Link>
            <Link className="button button-dark button-nav" href="/login">
              내 페이지 만들기
              <ArrowRightIcon />
            </Link>
          </div>
          <button
            className="icon-button mobile-menu-button"
            type="button"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
        </nav>
        <div className={`mobile-nav-panel${menuOpen ? " is-open" : ""}`}>
          <a href="#why" onClick={() => setMenuOpen(false)}>
            왜 Baby Vibe?
          </a>
          <a href="#how" onClick={() => setMenuOpen(false)}>
            만드는 방법
          </a>
          <Link href="/people" onClick={() => setMenuOpen(false)}>
            메이커 둘러보기
          </Link>
          <Link href="/etime">예시 페이지</Link>
          <Link href="/login">로그인</Link>
          <Link className="button button-dark" href="/login">
            내 페이지 만들기
            <ArrowRightIcon />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-copy">
            <div className="eyebrow">
              <SparkleIcon />
              처음 만드는 사람들을 위한 앱 허브
            </div>
            <h1>
              바이브 코딩으로 만든 앱,
              <br />
              <span>여기 다 모아두세요.</span>
            </h1>
            <p className="hero-description">
              처음 만든 앱도, 주말에 만든 작은 실험도 괜찮아요.
              <br className="desktop-break" /> 주소만 붙여넣으면 나만의 앱 페이지가
              완성됩니다.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" href="/login">
                <GoogleIcon />
                Google로 내 앱 페이지 만들기
              </Link>
              <Link className="button button-quiet button-large" href="/etime">
                예시 페이지 보기
                <ArrowUpRightIcon />
              </Link>
            </div>
            <div className="hero-assurance">
              <span>
                <CheckIcon /> GitHub 없이
              </span>
              <span>
                <CheckIcon /> 무료로
              </span>
              <span>
                <CheckIcon /> 3분이면 완성
              </span>
            </div>
          </div>

          <div className="hero-demo" aria-label="완성된 앱 페이지 예시">
            <div className="demo-window">
              <div className="demo-window-bar">
                <div className="window-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="window-address">
                  <span className="address-lock">●</span>
                  baby-vibe.web.app/etime
                </div>
                <span className="window-more">•••</span>
              </div>
              <div className="demo-page">
                <div className="demo-profile">
                  <div className="demo-avatar">
                    <span>E</span>
                    <i />
                  </div>
                  <div>
                    <h2>E-time</h2>
                    <p>생활과 호기심을 작은 앱으로 만들고 있어요.</p>
                  </div>
                  <button className="demo-share" type="button" aria-label="공유하기">
                    <LinkIcon />
                  </button>
                </div>
                <div className="demo-app-grid">
                  <article className="demo-app-card">
                    <AppCover kind={firstApp.cover} compact showFallbackArtwork />
                    <div className="demo-app-content">
                      <div className="demo-app-badges">
                        <span className="first-app-badge">나의 첫 앱</span>
                        <span className="tool-badge tool-badge-blue">
                          <i>✦</i> {firstApp.tool}
                        </span>
                      </div>
                      <h3>{firstApp.name}</h3>
                      <p>{firstApp.description}</p>
                      <div className="demo-app-actions">
                        <span className="demo-open-button">
                          앱 열기 <ArrowUpRightIcon />
                        </span>
                        <span className="demo-cheer-button">
                          👏 {firstApp.cheers}
                        </span>
                      </div>
                    </div>
                  </article>
                  <article className="demo-app-card demo-app-card-secondary">
                    <AppCover kind={secondApp.cover} compact showFallbackArtwork />
                    <div className="demo-app-content">
                      <div className="demo-app-badges">
                        <span className="tool-badge tool-badge-pink">
                          <HeartIcon /> {secondApp.tool}
                        </span>
                      </div>
                      <h3>{secondApp.name}</h3>
                      <p>{secondApp.description}</p>
                      <div className="demo-app-actions">
                        <span className="demo-open-button">
                          앱 열기 <ArrowUpRightIcon />
                        </span>
                        <span className="demo-cheer-button">
                          👏 {secondApp.cheers}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
            <div className="hero-success-toast">
              <span className="success-icon">
                <CheckIcon />
              </span>
              <span>
                <strong>첫 앱이 등록됐어요!</strong>
                이제 당신의 페이지를 공유해보세요.
              </span>
            </div>
            <div className="hero-float-badge">
              <span>👏</span>
              <strong>첫 응원</strong>
              <small>방금 전</small>
            </div>
          </div>
        </section>

        <section className="belief-strip" aria-label="Baby Vibe의 제품 원칙">
          <p>
            GitHub가 없어도.
            <span />
            스타트업이 아니어도.
            <span />
            아직 완성되지 않아도.
          </p>
        </section>

        <section className="why-section section-wrap" id="why">
          <div className="section-heading centered-heading">
            <div className="section-kicker">당신은 이미 만드는 사람</div>
            <h2>
              작은 앱에도
              <br />
              <span className="soft-underline">자기만의 자리</span>가 필요하니까.
            </h2>
            <p>
              기술을 얼마나 아는지보다, 무언가를 만들었다는 사실이 더 중요해요.
              <br />
              Baby Vibe는 당신의 시작을 가장 보기 좋은 모습으로 담아줍니다.
            </p>
          </div>

          <div className="value-grid">
            <article className="value-card value-card-link">
              <div className="value-card-top">
                <span className="value-number">01</span>
                <span className="value-icon value-icon-blue">
                  <LinkIcon />
                </span>
              </div>
              <div className="url-stack" aria-hidden="true">
                <span className="url-pill url-pill-one">
                  <i className="url-favicon url-favicon-pink">L</i>
                  my-first-app.lovable.app
                </span>
                <span className="url-pill url-pill-two">
                  <i className="url-favicon url-favicon-dark">▲</i>
                  coin-collector.vercel.app
                </span>
                <span className="url-pill url-pill-three">
                  <i className="url-favicon url-favicon-orange">R</i>
                  quiet-minute.replit.app
                </span>
              </div>
              <div className="value-copy">
                <h3>주소만 붙여넣어요</h3>
                <p>
                  저장소나 기술 스택은 몰라도 괜찮아요. 앱 주소 하나면 시작할 수
                  있어요.
                </p>
              </div>
            </article>

            <article className="value-card value-card-collection">
              <div className="value-card-top">
                <span className="value-number">02</span>
                <span className="value-icon value-icon-mint">
                  <SparkleIcon />
                </span>
              </div>
              <div className="mini-collection" aria-hidden="true">
                <div className="mini-collection-card mini-collection-purple">
                  <span>👽</span>
                  <b>Alien Index</b>
                </div>
                <div className="mini-collection-card mini-collection-yellow">
                  <span>🪙</span>
                  <b>Coin Collector</b>
                </div>
                <div className="mini-collection-card mini-collection-green">
                  <span>🌤️</span>
                  <b>Quiet Minute</b>
                </div>
              </div>
              <div className="value-copy">
                <h3>만든 앱이 한곳에 모여요</h3>
                <p>
                  도구도, 완성도도 제각각인 앱을 하나의 근사한 컬렉션으로
                  보여주세요.
                </p>
              </div>
            </article>

            <article className="value-card value-card-share">
              <div className="value-card-top">
                <span className="value-number">03</span>
                <span className="value-icon value-icon-orange">
                  <ArrowUpRightIcon />
                </span>
              </div>
              <div className="share-visual" aria-hidden="true">
                <div className="share-message">
                  <span className="share-message-avatar">E</span>
                  <p>
                    바이브 코딩으로 만든
                    <br />
                    앱들을 한곳에 모아봤어요.
                  </p>
                </div>
                <div className="share-link-card">
                  <BrandMark small />
                  <span>
                    <b>E-time님의 앱들</b>
                    baby-vibe.web.app/etime
                  </span>
                  <CopyIcon />
                </div>
              </div>
              <div className="value-copy">
                <h3>링크 하나로 모두 보여줘요</h3>
                <p>
                  X, 카카오톡, 프로필 어디든 링크 하나만 공유하면 충분해요.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="how-section" id="how">
          <div className="how-inner section-wrap">
            <div className="section-heading how-heading">
              <div className="section-kicker section-kicker-light">아주 간단하게</div>
              <h2>
                앱 페이지 완성까지,
                <br />
                커피 한 잔보다 빨라요.
              </h2>
              <p>어려운 설정은 Baby Vibe가 대신할게요.</p>
            </div>
            <div className="steps-list">
              <article className="step-row">
                <span className="step-index">1</span>
                <div className="step-illustration step-illustration-url">
                  <span className="step-cursor">↖</span>
                  <span className="step-input">
                    https://alien-index.app
                    <CheckIcon />
                  </span>
                </div>
                <div className="step-copy">
                  <h3>앱 주소를 붙여넣어요</h3>
                  <p>앱 이름과 소개 이미지는 자동으로 찾아드려요.</p>
                </div>
              </article>
              <article className="step-row">
                <span className="step-index">2</span>
                <div className="step-illustration step-illustration-tools">
                  <span className="tool-choice tool-choice-active">✦ Claude Code</span>
                  <span className="tool-choice">♥ Lovable</span>
                  <span className="tool-choice">▲ v0</span>
                </div>
                <div className="step-copy">
                  <h3>만든 도구를 골라요</h3>
                  <p>가장 중심적으로 사용한 AI 도구 하나만 선택하면 돼요.</p>
                </div>
              </article>
              <article className="step-row">
                <span className="step-index">3</span>
                <div className="step-illustration step-illustration-done">
                  <span className="done-ring">
                    <CheckIcon />
                  </span>
                  <span className="done-spark done-spark-one">✦</span>
                  <span className="done-spark done-spark-two">✦</span>
                  <span className="done-spark done-spark-three">•</span>
                </div>
                <div className="step-copy">
                  <h3>나만의 페이지가 완성돼요</h3>
                  <p>이제 링크를 복사해서 친구들에게 자랑해보세요.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="achievement-section section-wrap">
          <div className="achievement-copy">
            <div className="section-kicker">숫자보다 기분 좋은 것</div>
            <h2>
              작은 반응이
              <br />
              다음 앱을 만들게 해요.
            </h2>
            <p>
              복잡한 분석표 대신, 누군가 내 앱을 열고 응원한 순간을 알려드려요.
              만드는 즐거움이 오래 이어질 수 있도록.
            </p>
            <Link className="inline-link" href="/home">
              제작자 홈 미리 보기
              <ArrowRightIcon />
            </Link>
          </div>
          <div className="achievement-cards" aria-label="성취 알림 예시">
            <article className="achievement-card achievement-card-blue">
              <span className="achievement-emoji">🎉</span>
              <span>
                <small>첫 번째 성취</small>
                <strong>첫 앱을 등록했어요</strong>
                <p>이제 당신도 만드는 사람이에요.</p>
              </span>
              <i>방금</i>
            </article>
            <article className="achievement-card achievement-card-white">
              <span className="achievement-emoji">👀</span>
              <span>
                <small>새로운 소식</small>
                <strong>누군가 앱을 처음 열었어요</strong>
                <p>Alien Index가 첫 방문을 받았어요.</p>
              </span>
              <i>2시간</i>
            </article>
            <article className="achievement-card achievement-card-white">
              <span className="achievement-emoji">👏</span>
              <span>
                <small>계속 만들어보세요</small>
                <strong>첫 응원을 받았어요</strong>
                <p>누군가 당신의 아이디어를 좋아해요.</p>
              </span>
              <i>어제</i>
            </article>
            <article className="achievement-card achievement-card-mint">
              <span className="achievement-emoji">✨</span>
              <span>
                <small>작은 컬렉션의 시작</small>
                <strong>벌써 앱이 3개예요!</strong>
                <p>작은 아이디어들이 모이고 있어요.</p>
              </span>
              <i>오늘</i>
            </article>
          </div>
        </section>

        <section className="final-cta-section">
          <div className="final-orbit final-orbit-one" />
          <div className="final-orbit final-orbit-two" />
          <span className="final-spark final-spark-one">✦</span>
          <span className="final-spark final-spark-two">✦</span>
          <div className="final-cta-content">
            <BrandMark />
            <h2>
              첫 앱을 만든 순간부터,
              <br />
              당신은 만드는 사람입니다.
            </h2>
            <p>오늘 만든 앱부터 모아보세요. 다음 앱을 위한 자리가 생길 거예요.</p>
            <Link className="button button-white button-large" href="/login">
              <GoogleIcon />
              Google로 내 페이지 만들기
            </Link>
            <small>무료로 시작 · 카드 정보 필요 없음</small>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <BrandLogo compact />
          <p>만든 앱을 모으는 가장 다정한 방법.</p>
          <div className="footer-links">
            <a href="#why">서비스 소개</a>
            <Link href="/people">메이커 둘러보기</Link>
            <Link href="/etime">예시 페이지</Link>
            <a href="mailto:hello@baby-vibe.web.app">문의하기</a>
          </div>
          <span>© 2026 Baby Vibe</span>
        </div>
      </footer>
    </div>
  );
}
