import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Apple,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ChefHat,
  Clock3,
  Droplets,
  Dumbbell,
  HeartPulse,
  Leaf,
  Salad,
  Scale,
  Search,
  Sparkles,
  Utensils,
} from "lucide-react";

const goals = [
  {
    id: "health",
    title: "保持健康",
    subtitle: "适合日常改善饮食结构",
    icon: HeartPulse,
    color: "emerald",
    desc: "饮食多样化，主食、蛋白质、蔬菜、水果合理搭配，减少高油、高盐、高糖食品。",
    meals: {
      breakfast: "燕麦 / 全麦面包 + 鸡蛋 + 牛奶 / 无糖酸奶 + 一份水果",
      lunch: "米饭 / 杂粮饭 + 鱼肉 / 鸡肉 / 豆腐 + 两份蔬菜",
      dinner: "红薯 / 杂粮粥 + 瘦肉 / 豆制品 + 清炒或水煮蔬菜",
      snack: "水果、无糖酸奶、少量坚果，避免奶茶、甜点和油炸零食",
    },
  },
  {
    id: "fatloss",
    title: "减脂",
    subtitle: "控制热量，但不极端节食",
    icon: Scale,
    color: "lime",
    desc: "控制总热量，保证蛋白质摄入，增加蔬菜和膳食纤维，减少油炸、高糖和精加工食品。",
    meals: {
      breakfast: "鸡蛋 + 无糖豆浆 / 牛奶 + 燕麦 / 玉米 + 黄瓜或番茄",
      lunch: "半碗米饭 / 杂粮饭 + 鸡胸肉 / 鱼 / 虾 + 大量蔬菜",
      dinner: "豆腐 / 鸡蛋 / 瘦肉 + 蔬菜 + 少量主食，如红薯或玉米",
      snack: "优先选择低糖水果、无糖酸奶；避免夜宵和高热量零食",
    },
  },
  {
    id: "muscle",
    title: "增肌",
    subtitle: "训练人群的高蛋白方案",
    icon: Dumbbell,
    color: "orange",
    desc: "保证足量蛋白质，合理增加碳水摄入，训练前后补充能量，并保持规律作息。",
    meals: {
      breakfast: "燕麦 + 鸡蛋 2 个 + 牛奶 + 香蕉 / 苹果",
      lunch: "米饭 / 面 / 土豆 + 牛肉 / 鸡肉 / 鱼肉 + 蔬菜",
      dinner: "杂粮饭 + 鸡胸肉 / 牛肉 / 豆腐 + 两份蔬菜",
      snack: "训练后可选择牛奶、酸奶、鸡蛋、香蕉或高蛋白加餐",
    },
  },
];

const articles = [
  {
    title: "碳水不是敌人",
    tag: "营养基础",
    summary: "主食不是发胖的唯一原因，关键在于全天总摄入、食物类型和运动消耗。",
  },
  {
    title: "蛋白质为什么重要？",
    tag: "营养基础",
    summary: "蛋白质有助于组织修复、肌肉合成和饱腹感维持，减脂和增肌都需要关注。",
  },
  {
    title: "健康饮食不等于水煮菜",
    tag: "饮食误区",
    summary: "真正好的饮食方案应该能长期坚持，而不是短期靠意志力硬撑。",
  },
  {
    title: "怎么判断一餐是否均衡？",
    tag: "实用方法",
    summary: "看主食、蛋白质、蔬菜和水分是否齐全，比死记热量更适合新手入门。",
  },
];

const recipes = [
  {
    name: "鸡蛋燕麦牛奶早餐",
    type: "早餐",
    goal: "保持健康 / 减脂",
    time: "10 分钟",
    kcal: "约 350 kcal",
    ingredients: "燕麦、鸡蛋、牛奶、香蕉",
    reason: "制作简单，包含碳水、蛋白质和膳食纤维。",
  },
  {
    name: "鸡胸肉杂粮饭",
    type: "午餐",
    goal: "减脂 / 增肌",
    time: "25 分钟",
    kcal: "约 550 kcal",
    ingredients: "鸡胸肉、杂粮饭、西兰花、胡萝卜",
    reason: "蛋白质充足，主食和蔬菜搭配均衡。",
  },
  {
    name: "番茄豆腐蔬菜汤",
    type: "晚餐",
    goal: "保持健康 / 减脂",
    time: "15 分钟",
    kcal: "约 280 kcal",
    ingredients: "番茄、豆腐、青菜、鸡蛋",
    reason: "清淡易做，适合晚餐控制油脂摄入。",
  },
  {
    name: "牛肉土豆训练餐",
    type: "晚餐",
    goal: "增肌",
    time: "30 分钟",
    kcal: "约 650 kcal",
    ingredients: "牛肉、土豆、米饭、蔬菜",
    reason: "碳水和蛋白质更充足，适合训练日。",
  },
  {
    name: "酸奶水果坚果加餐",
    type: "加餐",
    goal: "保持健康 / 增肌",
    time: "5 分钟",
    kcal: "约 250 kcal",
    ingredients: "无糖酸奶、蓝莓、坚果",
    reason: "方便快捷，适合作为两餐之间的补充。",
  },
  {
    name: "虾仁蔬菜荞麦面",
    type: "午餐",
    goal: "减脂 / 保持健康",
    time: "20 分钟",
    kcal: "约 480 kcal",
    ingredients: "虾仁、荞麦面、青菜、香菇",
    reason: "口味清爽，蛋白质来源明确，主食不过量。",
  },
];

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-xl">
      <Sparkles size={15} />
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, desc }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="mb-3 text-sm font-semibold tracking-wide text-emerald-600">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{title}</h2>
      {desc && <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">{desc}</p>}
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl ${className}`}>
      {children}
    </div>
  );
}

function SolidCard({ children, className = "" }) {
  return (
    <div className={`rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)] ${className}`}>
      {children}
    </div>
  );
}

export default function HealthyDietPlannerWebsite() {
  const [selectedGoal, setSelectedGoal] = useState("health");
  const [activeRecipeType, setActiveRecipeType] = useState("全部");
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState({ vegetable: false, protein: false, water: false, sugar: false });

  const currentGoal = goals.find((goal) => goal.id === selectedGoal) ?? goals[0];

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchType = activeRecipeType === "全部" || recipe.type.includes(activeRecipeType);
      const matchQuery = !query || `${recipe.name}${recipe.goal}${recipe.ingredients}`.includes(query);
      return matchType && matchQuery;
    });
  }, [activeRecipeType, query]);

  const recordScore = Object.values(records).filter(Boolean).length;

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8f5] text-slate-950 selection:bg-emerald-200">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute right-[-12rem] top-[20rem] h-[28rem] w-[28rem] rounded-full bg-lime-200/40 blur-3xl" />
        <div className="absolute bottom-[-14rem] left-[-10rem] h-[32rem] w-[32rem] rounded-full bg-orange-100/60 blur-3xl" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:px-5">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">
              <Leaf size={18} />
            </span>
            <span className="hidden sm:inline">健康饮食规划助手</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#learn" className="hover:text-slate-950">营养科普</a>
            <a href="#planner" className="hover:text-slate-950">饮食规划</a>
            <a href="#recipes" className="hover:text-slate-950">食谱库</a>
            <a href="#tracker" className="hover:text-slate-950">记录</a>
          </nav>
          <a href="#planner" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            开始规划
          </a>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 pb-16 pt-32 md:grid-cols-[1.05fr_0.95fr] md:pt-28">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Badge>不极端、不说教，先从一日三餐开始</Badge>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 md:text-7xl lg:text-8xl">
              把健康饮食，做得更简单。
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              像产品说明书一样清晰，像日常建议一样亲切。选择目标后，获得一份容易执行的三餐模板和食谱建议。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#planner" className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-4 font-semibold text-white shadow-[0_18px_40px_rgba(5,150,105,0.24)] transition hover:bg-emerald-700">
                生成我的饮食建议
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </a>
              <a href="#learn" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-7 py-4 font-semibold text-slate-800 backdrop-blur-xl transition hover:border-slate-300 hover:bg-white">
                先看营养科普
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-center">
              {[
                ["3", "目标模式"],
                ["6", "基础食谱"],
                ["4", "每日检查项"],
              ].map(([num, label]) => (
                <div key={label} className="rounded-3xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
                  <p className="text-2xl font-semibold text-slate-950">{num}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative">
            <div className="absolute -left-8 top-16 hidden rounded-[1.5rem] bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">今日完成度</p>
                  <p className="text-xs text-slate-500">蔬菜、蛋白质、水分</p>
                </div>
              </div>
            </div>

            <GlassCard className="relative mx-auto max-w-md p-5">
              <div className="rounded-[1.7rem] bg-gradient-to-br from-slate-950 to-emerald-950 p-6 text-white shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-200">Daily Plate</p>
                    <h3 className="mt-1 text-2xl font-semibold">均衡餐盘</h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                    <Salad size={24} />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    ["主食", "杂粮饭 / 燕麦"],
                    ["蛋白质", "鸡蛋 / 鱼 / 豆腐"],
                    ["蔬菜", "深色蔬菜优先"],
                    ["水果", "每日适量"],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-[1.4rem] bg-white/10 p-4 backdrop-blur-xl">
                      <p className="font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-5 text-slate-300">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["少油", "更轻负担"],
                  ["高纤", "更强饱腹"],
                  ["规律", "更好坚持"],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-3xl bg-slate-50 p-4 text-center">
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-xs text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </section>

        <section id="learn" className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Nutrition Basics"
            title="先建立正确认知，再开始规划。"
            desc="用短卡片解释常见饮食问题，降低新手理解门槛。页面视觉保持克制，但文字更接近日常表达。"
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {articles.map((article, index) => (
              <SolidCard key={article.title} className={index === 0 ? "lg:col-span-2" : ""}>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <BookOpen size={22} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{article.tag}</span>
                <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{article.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{article.summary}</p>
              </SolidCard>
            ))}
          </div>
        </section>

        <section id="planner" className="bg-white/60 px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Diet Planner"
              title="选一个目标，得到一份可执行方案。"
              desc="第一版不做复杂医学判断，只根据目标给出基础三餐模板。这样更适合初学者，也更容易落地。"
            />

            <div className="grid gap-5 lg:grid-cols-3">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const active = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`group rounded-[2rem] border p-6 text-left transition duration-300 ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
                        : "border-slate-200 bg-white text-slate-950 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
                    }`}
                  >
                    <div className={`mb-7 flex h-12 w-12 items-center justify-center rounded-2xl ${active ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                      <Icon size={24} />
                    </div>
                    <p className={`text-sm font-medium ${active ? "text-emerald-200" : "text-emerald-700"}`}>{goal.subtitle}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">{goal.title}</h3>
                    <p className={`mt-4 text-sm leading-7 ${active ? "text-slate-300" : "text-slate-600"}`}>{goal.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <GlassCard>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CalendarCheck />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">当前目标</p>
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-950">{currentGoal.title}</h3>
                  </div>
                </div>
                <p className="mt-7 rounded-[1.5rem] bg-white p-5 text-base leading-8 text-slate-700 shadow-sm">{currentGoal.desc}</p>
                <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                  本网站内容仅用于一般健康饮食科普和生活方式参考，不能替代医生或注册营养师的个体化建议。
                </div>
              </GlassCard>

              <GlassCard>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">Meal Template</p>
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-950">推荐三餐模板</h3>
                  </div>
                  <Utensils className="text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {[
                    ["早餐", currentGoal.meals.breakfast],
                    ["午餐", currentGoal.meals.lunch],
                    ["晚餐", currentGoal.meals.dinner],
                    ["加餐", currentGoal.meals.snack],
                  ].map(([meal, text]) => (
                    <div key={meal} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                      <p className="font-semibold text-slate-950">{meal}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        <section id="recipes" className="mx-auto max-w-6xl px-5 py-20">
          <SectionHeading
            eyebrow="Recipe Library"
            title="食谱推荐要简单、清楚、可执行。"
            desc="保留高级留白和卡片感，但内容尽量像朋友给建议，而不是复杂营养论文。"
          />

          <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {["全部", "早餐", "午餐", "晚餐", "加餐"].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveRecipeType(type)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    activeRecipeType === type ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="relative min-w-0 md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索食材或食谱"
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <SolidCard key={recipe.name}>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <ChefHat size={22} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{recipe.type}</span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{recipe.name}</h3>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p><strong className="text-slate-900">适合目标：</strong>{recipe.goal}</p>
                  <p className="flex items-center gap-2"><Clock3 size={16} /><span>{recipe.time}</span></p>
                  <p><strong className="text-slate-900">大致热量：</strong>{recipe.kcal}</p>
                  <p><strong className="text-slate-900">主要食材：</strong>{recipe.ingredients}</p>
                </div>
                <p className="mt-5 rounded-[1.5rem] bg-emerald-50 p-4 text-sm leading-7 text-slate-700">{recipe.reason}</p>
              </SolidCard>
            ))}
          </div>
        </section>

        <section id="tracker" className="px-5 py-20">
          <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-[0_30px_100px_rgba(15,23,42,0.22)] md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Daily Tracker</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">用 4 个问题，检查今天吃得怎么样。</h2>
                <p className="mt-5 text-base leading-8 text-slate-300">
                  不需要一开始就计算所有热量。先用简单检查项建立习惯，后续再加入数据库保存历史记录。
                </p>
              </div>
              <div className="rounded-[2rem] bg-white p-5 text-slate-950">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">今日反馈</p>
                    <h3 className="text-3xl font-semibold">完成 {recordScore}/4 项</h3>
                  </div>
                  <Droplets className="text-emerald-600" />
                </div>
                <div className="grid gap-3">
                  {[
                    ["vegetable", "今天吃了蔬菜"],
                    ["protein", "今天摄入了蛋白质"],
                    ["water", "今天喝了足够的水"],
                    ["sugar", "今天少喝含糖饮料"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3 rounded-[1.3rem] bg-slate-50 p-4 transition hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={records[key]}
                        onChange={(e) => setRecords({ ...records, [key]: e.target.checked })}
                        className="h-5 w-5 accent-emerald-600"
                      />
                      <span className="font-medium text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-5 rounded-[1.5rem] bg-emerald-50 p-4 text-sm leading-7 text-slate-700">
                  {recordScore >= 3 ? "今天的饮食结构整体不错，可以继续保持。" : "今天还有可以改进的地方，建议优先补充蔬菜、蛋白质和水分。"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Apple />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">下一步：加入登录、数据库和个性化计算。</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              当前版本已经适合作为前端展示。后续可以加入 Flask 后端、SQLite 数据库、用户饮食记录保存、食谱收藏和基础热量估算。
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/70 px-5 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <p>© 2026 健康饮食规划助手</p>
          <p>内容仅用于健康饮食科普，不替代专业医疗建议。</p>
        </div>
      </footer>
    </div>
  );
}
