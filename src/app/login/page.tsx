import type { Metadata } from "next";
import LoginPage from "@/components/login-page";

export const metadata: Metadata = {
  title: "Google로 시작하기",
};

export default function LoginRoute() {
  return <LoginPage />;
}
