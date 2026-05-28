import OpenAI from "openai";
import { ProxyAgent, setGlobalDispatcher } from "undici";

if (process.env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const defaultBaseUrl = "https://token-plan-cn.xiaomimimo.com/v1";

const client = new OpenAI({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL || defaultBaseUrl,
  timeout: getRequestTimeoutMs(),
});

function getRequestTimeoutMs() {
  return process.env.NETLIFY_DEV ? 28000 : 55000;
}

function getModelName() {
  return (process.env.MIMO_MODEL || "mimo-v2-omni").trim().toLowerCase();
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("AI 服务响应超时，请稍后重试或换一张更清晰的照片"));
      }, timeoutMs);
    }),
  ]);
}

function extractJson(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json|```/g, "")
      .replace(/<\/?think>/g, "")
      .trim();
    const candidates = [];

    for (const [open, close] of [
      ["{", "}"],
      ["[", "]"],
    ]) {
      let depth = 0;
      let start = -1;
      let inString = false;
      let escaped = false;

      for (let index = 0; index < cleaned.length; index += 1) {
        const char = cleaned[index];

        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (char === "\\") {
            escaped = true;
          } else if (char === "\"") {
            inString = false;
          }
          continue;
        }

        if (char === "\"") {
          inString = true;
          continue;
        }

        if (char === open) {
          if (depth === 0) start = index;
          depth += 1;
        } else if (char === close && depth > 0) {
          depth -= 1;
          if (depth === 0 && start >= 0) {
            candidates.push(cleaned.slice(start, index + 1));
            start = -1;
          }
        }
      }
    }

    const parsedCandidates = candidates
      .map((candidate) => {
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return parsedCandidates.find((candidate) => Array.isArray(pickFoods(candidate))) || parsedCandidates[0] || null;
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

function parseAssistantJson(message) {
  const contentText = getMessageText(message?.content);
  const reasoningText = getMessageText(message?.reasoning_content);
  const contentJson = extractJson(contentText);

  if (contentJson) {
    return {
      data: contentJson,
      rawText: contentText,
    };
  }

  return {
    data: extractJson(reasoningText),
    rawText: reasoningText,
  };
}

function pickFoods(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data.foods)) return data.foods;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.food_items)) return data.food_items;
  if (Array.isArray(data.dishes)) return data.dishes;
  if (Array.isArray(data.result?.foods)) return data.result.foods;
  if (Array.isArray(data.data?.foods)) return data.data.foods;
  if (Array.isArray(data.meal?.foods)) return data.meal.foods;

  if (data.name || data.food || data.food_name || data.calories || data.kcal) {
    return [data];
  }

  return null;
}

function numberFrom(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const match = value.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function validateResult(data) {
  const resultFoods = pickFoods(data);

  if (!Array.isArray(resultFoods)) {
    const keys = data && typeof data === "object" ? Object.keys(data).join(", ") : "none";
    throw new Error(`AI 返回结果格式不正确：缺少 foods 数组，实际字段：${keys}`);
  }

  const foods = resultFoods.map((food) => ({
    name: String(food.name || food.food || food.food_name || food.dish || "未知食物"),
    estimated_grams: numberFrom(food.estimated_grams ?? food.grams ?? food.weight_grams ?? food.weight),
    calories: numberFrom(food.calories ?? food.kcal ?? food.energy),
    protein: numberFrom(food.protein ?? food.protein_g),
    fat: numberFrom(food.fat ?? food.fat_g),
    carbs: numberFrom(food.carbs ?? food.carbohydrates ?? food.carbs_g),
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
      data.summary ||
      data.result?.note ||
      data.data?.note ||
      data.meal?.note ||
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

    const response = await withTimeout(
      client.chat.completions.create({
        model: getModelName(),
        temperature: 0,
        max_completion_tokens: 900,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "你是营养识别 API。只输出 JSON 对象，必须包含 foods 数组和 note 字符串。不要输出 Markdown、解释、response、clarification_question 或模板。",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
快速识别图片中的主要食物并估算营养。
返回 JSON 对象，顶层必须包含 foods 和 note。
foods 是数组，每项包含 name、estimated_grams、calories、protein、fat、carbs。
所有数值用数字。无法识别食物时 foods 返回空数组。
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
      }),
      getRequestTimeoutMs()
    );

    const parsed = parseAssistantJson(response.choices?.[0]?.message);

    if (!parsed.data) {
      console.error("AI raw response snippet:", parsed.rawText?.slice(0, 800));
      const result = validateResult({
        foods: [],
        note: "AI 没有返回可解析的结构化结果，请换一张更清晰的照片后重试。",
      });

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(result),
      };
    }

    try {
      const result = validateResult(parsed.data);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(result),
      };
    } catch (formatError) {
      console.error("AI raw response snippet:", parsed.rawText?.slice(0, 800));
      console.error("AI parsed response:", parsed.data);
      throw formatError;
    }
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
