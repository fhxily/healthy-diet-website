import { useEffect, useMemo, useState } from "react";
import { Calculator, Save, UserRound } from "lucide-react";
import { supabase } from "./supabaseClient";

const activityOptions = [
  { value: "sedentary", label: "久坐 / 很少运动", factor: 1.2 },
  { value: "light", label: "轻度运动 / 每周 1-3 次", factor: 1.375 },
  { value: "moderate", label: "中度运动 / 每周 3-5 次", factor: 1.55 },
  { value: "active", label: "高强度运动 / 每周 6-7 次", factor: 1.725 },
];

const goalOptions = [
  { value: "health", label: "保持健康" },
  { value: "fatloss", label: "减脂" },
  { value: "muscle", label: "增肌" },
];

const initialProfile = {
  nickname: "",
  gender: "male",
  age: "",
  height_cm: "",
  weight_kg: "",
  activity_level: "light",
  goal: "health",
};

function round(value) {
  return Math.round(value);
}

function calculateNutrition(profile) {
  const age = Number(profile.age);
  const height = Number(profile.height_cm);
  const weight = Number(profile.weight_kg);

  if (!age || !height || !weight) {
    return null;
  }

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  const bmr =
    profile.gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const activity = activityOptions.find((item) => item.value === profile.activity_level);
  const tdee = bmr * (activity?.factor ?? 1.2);

  let targetCalories = tdee;

  if (profile.goal === "fatloss") {
    targetCalories = tdee - 400;
  }

  if (profile.goal === "muscle") {
    targetCalories = tdee + 250;
  }

  const protein = weight * 1.6;
  const fat = (targetCalories * 0.25) / 9;
  const carbs = (targetCalories - protein * 4 - fat * 9) / 4;

  return {
    bmi: bmi.toFixed(1),
    bmr: round(bmr),
    tdee: round(tdee),
    targetCalories: round(targetCalories),
    protein: round(protein),
    fat: round(fat),
    carbs: round(carbs),
  };
}

function getBmiStatus(bmi) {
  const value = Number(bmi);

  if (value < 18.5) return "偏瘦";
  if (value < 24) return "正常范围";
  if (value < 28) return "超重";
  return "偏高";
}

export default function ProfilePlanner({ session, onNeedLogin }) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const result = useMemo(() => calculateNutrition(profile), [profile]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        setMessage(`读取资料失败：${error.message}`);
        return;
      }

      if (data) {
        setProfile({
          nickname: data.nickname ?? "",
          gender: data.gender ?? "male",
          age: data.age ?? "",
          height_cm: data.height_cm ?? "",
          weight_kg: data.weight_kg ?? "",
          activity_level: data.activity_level ?? "light",
          goal: data.goal ?? "health",
        });
      }
    }

    loadProfile();
  }, [session]);

  function updateField(field, value) {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSaveProfile() {
    if (!session?.user?.id) {
      onNeedLogin();
      return;
    }

    if (!profile.age || !profile.height_cm || !profile.weight_kg) {
      setMessage("请先填写年龄、身高和体重。");
      return;
    }

    setLoading(true);
    setMessage("正在保存...");

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: session.user.id,
        nickname: profile.nickname,
        gender: profile.gender,
        age: Number(profile.age),
        height_cm: Number(profile.height_cm),
        weight_kg: Number(profile.weight_kg),
        activity_level: profile.activity_level,
        goal: profile.goal,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    setLoading(false);

    if (error) {
      setMessage(`保存失败：${error.message}`);
      return;
    }

    setMessage("保存成功！你的个人资料已经写入 Supabase。");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <UserRound size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-600">Profile</p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              我的身体资料
            </h3>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">昵称，可选</span>
            <input
              value={profile.nickname}
              onChange={(e) => updateField("nickname", e.target.value)}
              placeholder="例如：小明"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">性别</span>
            <select
              value={profile.gender}
              onChange={(e) => updateField("gender", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">年龄</span>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="例如：22"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">身高 cm</span>
            <input
              type="number"
              value={profile.height_cm}
              onChange={(e) => updateField("height_cm", e.target.value)}
              placeholder="例如：175"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">体重 kg</span>
            <input
              type="number"
              value={profile.weight_kg}
              onChange={(e) => updateField("weight_kg", e.target.value)}
              placeholder="例如：70"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">运动频率</span>
            <select
              value={profile.activity_level}
              onChange={(e) => updateField("activity_level", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              {activityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">饮食目标</span>
            <select
              value={profile.goal}
              onChange={(e) => updateField("goal", e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              {goalOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {loading ? "保存中..." : "保存个人资料"}
        </button>

        {message && (
          <p className="mt-4 rounded-[1.2rem] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {message}
          </p>
        )}
      </div>

      <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
            <Calculator size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Personal Plan</p>
            <h3 className="text-2xl font-semibold tracking-tight">个性化计算结果</h3>
          </div>
        </div>

        {!result ? (
          <div className="rounded-[1.5rem] bg-white/10 p-5 text-sm leading-7 text-slate-300">
            填写年龄、身高、体重后，这里会自动计算 BMI、基础代谢、每日消耗和推荐营养摄入。
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-sm text-slate-300">BMI</p>
                <p className="mt-2 text-3xl font-semibold">{result.bmi}</p>
                <p className="mt-1 text-sm text-emerald-300">{getBmiStatus(result.bmi)}</p>
              </div>

              <div className="rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-sm text-slate-300">基础代谢 BMR</p>
                <p className="mt-2 text-3xl font-semibold">{result.bmr}</p>
                <p className="mt-1 text-sm text-slate-400">kcal / day</p>
              </div>

              <div className="rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-sm text-slate-300">每日总消耗 TDEE</p>
                <p className="mt-2 text-3xl font-semibold">{result.tdee}</p>
                <p className="mt-1 text-sm text-slate-400">kcal / day</p>
              </div>

              <div className="rounded-[1.5rem] bg-emerald-500/20 p-5 ring-1 ring-emerald-400/30">
                <p className="text-sm text-emerald-200">目标热量</p>
                <p className="mt-2 text-3xl font-semibold">{result.targetCalories}</p>
                <p className="mt-1 text-sm text-emerald-200">kcal / day</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-white p-5 text-slate-950">
              <p className="font-semibold">每日三大营养素建议</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">蛋白质</p>
                  <p className="mt-1 text-2xl font-semibold">{result.protein} g</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">脂肪</p>
                  <p className="mt-1 text-2xl font-semibold">{result.fat} g</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">碳水</p>
                  <p className="mt-1 text-2xl font-semibold">{result.carbs} g</p>
                </div>
              </div>
            </div>

            <p className="mt-5 rounded-[1.5rem] bg-white/10 p-5 text-sm leading-7 text-slate-300">
              该结果基于 Mifflin-St Jeor 公式和活动系数估算，仅用于健康饮食规划参考，不替代医生或注册营养师建议。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
