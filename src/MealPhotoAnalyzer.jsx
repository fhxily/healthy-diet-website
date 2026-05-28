import { useMemo, useState } from "react";
import { Camera, ImagePlus, Loader2, Save, Sparkles, Utensils } from "lucide-react";

function sumFoods(foods) {
  return foods.reduce(
    (total, food) => ({
      calories: total.calories + food.calories,
      protein: total.protein + food.protein,
      fat: total.fat + food.fat,
      carbs: total.carbs + food.carbs,
    }),
    {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    }
  );
}

function round(value) {
  return Math.round(value);
}

function fileToBase64(file, maxWidth = 288, quality = 0.45) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = compressedDataUrl.split(",")[1];

        resolve({
          base64,
          mimeType: "image/jpeg",
        });
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MealPhotoAnalyzer({ session, onNeedLogin }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const total = useMemo(() => {
    if (!result) return null;
    return sumFoods(result.foods);
  }, [result]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("请上传图片文件，例如 jpg、png、webp。");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setImagePreview(previewUrl);
    setFileName(file.name);
    setResult(null);
    setMessage("");
  }


  async function handleAnalyze() {
    if (!selectedFile) {
      setMessage("请先上传一张饭菜照片。");
      return;
    }

    setAnalyzing(true);
    setMessage("正在压缩图片并调用 AI 分析...");

    try {
      const { base64, mimeType } = await fileToBase64(selectedFile);

      const response = await fetch("/.netlify/functions/analyze-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      const rawText = await response.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || "后端没有返回合法 JSON");
      }

      if (!response.ok) {
        const detail = data.param ? `${data.error}：${data.param}` : data.error;
        throw new Error(detail || "AI 分析失败");
      }

      setResult(data);
      setMessage("AI 分析完成。结果为估算值，可根据实际份量手动判断。");
    } catch (error) {
      setMessage(`分析失败：${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSaveResult() {
    if (!session?.user?.id) {
      onNeedLogin();
      return;
    }

    if (!result) {
      setMessage("请先完成照片分析，再保存结果。");
      return;
    }

    setMessage("已登录。下一步可以把图片和分析结果保存到 Supabase 数据库。当前先完成交互流程。");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Camera size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-600">Meal Photo</p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              上传一餐照片
            </h3>
          </div>
        </div>

        <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="饭菜预览"
              className="max-h-[280px] w-full rounded-[1.2rem] object-cover"
            />
          ) : (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <ImagePlus size={26} />
              </div>
              <p className="text-lg font-semibold text-slate-900">点击上传饭菜照片</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                支持 jpg、png、webp。第一阶段只做预览和模拟分析。
              </p>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        {fileName && (
          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            已选择图片：{fileName}
          </p>
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {analyzing ? "分析中..." : "开始分析"}
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
            <Utensils size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Analysis Result</p>
            <h3 className="text-2xl font-semibold tracking-tight">一餐热量估算</h3>
          </div>
        </div>

        {!result ? (
          <div className="rounded-[1.5rem] bg-white/10 p-5 text-sm leading-7 text-slate-300">
            上传照片并点击“开始分析”后，这里会展示识别出的食物、估计重量、热量和三大营养素。
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[1.5rem] bg-emerald-500/20 p-5 ring-1 ring-emerald-400/30 md:col-span-2">
                <p className="text-sm text-emerald-200">总热量</p>
                <p className="mt-2 text-4xl font-semibold">{round(total.calories)}</p>
                <p className="mt-1 text-sm text-emerald-200">kcal</p>
              </div>

              <div className="rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-sm text-slate-300">蛋白质</p>
                <p className="mt-2 text-2xl font-semibold">{round(total.protein)} g</p>
              </div>

              <div className="rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-sm text-slate-300">碳水</p>
                <p className="mt-2 text-2xl font-semibold">{round(total.carbs)} g</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-white p-5 text-slate-950">
              <p className="font-semibold">识别食物明细</p>

              <div className="mt-4 space-y-3">
                {result.foods.map((food) => (
                  <div key={food.name} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">{food.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          估计重量：{food.estimated_grams} g
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-slate-950">
                        {food.calories} kcal
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-slate-600">
                      <p>蛋白质 {food.protein}g</p>
                      <p>脂肪 {food.fat}g</p>
                      <p>碳水 {food.carbs}g</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 rounded-[1.5rem] bg-white/10 p-5 text-sm leading-7 text-slate-300">
              {result.note}
            </p>

            <button
              onClick={handleSaveResult}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              <Save size={18} />
              保存分析结果
            </button>
          </>
        )}
      </div>
    </div>
  );
}
