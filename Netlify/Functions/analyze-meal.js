import OpenAI from "openai";
import { ProxyAgent, setGlobalDispatcher } from "undici";

if (process.env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const defaultBaseUrl = "https://token-plan-cn.xiaomimimo.com/v1";

const client = new OpenAI({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL || defaultBaseUrl,
});

function getModelName() {
  return (process.env.MIMO_MODEL || "mimo-v2-omni").trim().toLowerCase();
}

function extractJson(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
}

function getMessageText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.text || "";
      })
      .join("");
  }
  return "";
}

function validateResult(data) {
  if (!data || !Array.isArray(data.foods)) {
    throw new Error("AI 返回结果格式不正确：缺少 foods 数组");
  }

  const foods = data.foods.map((food) => ({
    name: String(food.name || "未知食物"),
    estimated_grams: Number(food.estimated_grams || 0),
    calories: Number(food.calories || 0),
    protein: Number(food.protein || 0),
    fat: Number(food.fat || 0),
    carbs: Number(food.carbs || 0),
  }));

  const total = foods.reduce(
    (sum, food) => ({
      calories: sum.calories + food.calories,
      protein: sum.protein + food.protein,
      fat: sum.fat + food.fat,
      carbs: sum.carbs + food.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  return {
    foods,
    total,
    note:
      data.note ||
      "结果由 AI 根据图片估算，仅供饮食记录参考，实际热量会受到食材重量、烹饪方式和调味影响。",
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  if (!process.env.MIMO_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ error: "Netlify 缺少 MIMO_API_KEY 环境变量" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "缺少图片数据" }),
      };
    }

    const response = await client.chat.completions.create({
      model: getModelName(),
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
text: `
识别图片中的主要食物，并估算一餐总热量和营养素。

只返回 JSON：
{
  "foods": [
    {
      "name": "食物名称",
      "estimated_grams": 100,
      "calories": 100,
      "protein": 10,
      "fat": 5,
      "carbs": 20
    }
  ],
  "note": "估算值，仅供参考"
}
`.trim(),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });

    const text = getMessageText(response.choices?.[0]?.message?.content);
    const parsed = extractJson(text);
    const result = validateResult(parsed);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("analyze-meal error:", error);

    const upstreamMessage = error.error?.message || error.message;
    const upstreamParam = error.error?.param;
    const message = upstreamParam
      ? `${upstreamMessage}：${upstreamParam}`
      : upstreamMessage || "AI 分析失败，请检查 Netlify 环境变量和 AI 服务状态";

    return {
      statusCode: error.status || 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        error: message,
        model: getModelName(),
        baseUrlConfigured: Boolean(process.env.MIMO_BASE_URL),
      }),
    };
  }
}
