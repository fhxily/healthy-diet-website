import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("请输入邮箱和密码");
      return;
    }

    if (password.length < 6) {
      setMessage("密码至少需要 6 位");
      return;
    }

    let result;

    if (mode === "login") {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    }

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "register") {
      setMessage("注册成功。如果 Supabase 开启了邮箱验证，请先去邮箱确认。");
    } else {
      setMessage("登录成功");
      if (onLogin) onLogin(result.data.session);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
        {mode === "login" ? "登录账号" : "注册账号"}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        登录后可以保存个人资料、饮食记录，并生成个性化饮食建议。
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">密码</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          {mode === "login" ? "登录" : "注册"}
        </button>
      </form>

      {message && (
        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setMessage("");
        }}
        className="mt-5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
      </button>
    </div>
  );
}