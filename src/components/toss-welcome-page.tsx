"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/brand-logo";
import { RecoveryKeyRedeemer } from "@/components/auth/recovery-key-dialog";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

/**
 * Welcome screen for the Apps in Toss bundle.
 *
 * The Toss webview cannot run an OAuth popup or redirect, so there is no
 * "Google로 계속하기" here — the account starts anonymously and a recovery key
 * is what carries it between devices.
 */
export default function TossWelcomePage() {
  const [restoring, setRestoring] = useState(false);

  return (
    <div className="login-shell login-shell-toss">
      <main className="login-main login-main-toss">
        <section className="login-panel">
          <div className="login-card">
            <BrandMark />
            <span className="login-kicker">반가워요</span>
            <h2>내 앱 페이지 만들기</h2>
            <p>
              가입도, 비밀번호도 없어요.
              <br />
              3분이면 첫 앱을 올릴 수 있어요.
            </p>

            <Link className="button button-primary" href="/start">
              바로 시작하기
              <ArrowRightIcon />
            </Link>

            {restoring ? (
              <RecoveryKeyRedeemer />
            ) : (
              <button
                className="button button-quiet"
                type="button"
                onClick={() => setRestoring(true)}
              >
                이미 만든 페이지가 있어요
              </button>
            )}

            <ul className="login-benefits">
              <li>
                <CheckIcon /> 무료로 시작
              </li>
              <li>
                <CheckIcon /> 가입 절차 없음
              </li>
              <li>
                <CheckIcon /> 언제든 앱 숨기기
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
