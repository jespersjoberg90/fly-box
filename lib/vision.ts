import * as FileSystem from 'expo-file-system';

export type DetectedFly = {
  name: string;
  category: string;
};

type OpenAIChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

/**
 * Takes a local camera image URI, sends it to gpt-4o-mini,
 * and returns a normalized JSON list of fly names/categories.
 */
export async function identifyFliesFromImage(
  imageUri: string,
): Promise<DetectedFly[]> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  }

  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const body = {
    model: 'gpt-4o-mini',
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'fly_box_detection',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            flies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                },
                required: ['name', 'category'],
                additionalProperties: false,
              },
            },
          },
          required: ['flies'],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: 'system',
        content:
          'You analyze fly-fishing fly box images. Return only valid JSON matching the schema. Keep category short, like Caddis, Mayfly, Nymph, Streamer, Terrestrial, Other.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Identify visible flies in this fly box image and classify each fly.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI request failed (${res.status}): ${errorText}`);
  }

  const payload = (await res.json()) as OpenAIChatCompletion;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI response was not valid JSON.');
  }

  const flies = (parsed as { flies?: unknown }).flies;
  if (!Array.isArray(flies)) {
    throw new Error('OpenAI JSON missing "flies" array.');
  }

  return flies
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const name = (item as { name?: unknown }).name;
      const category = (item as { category?: unknown }).category;
      if (typeof name !== 'string' || typeof category !== 'string') return null;
      return {
        name: name.trim(),
        category: category.trim(),
      };
    })
    .filter((item): item is DetectedFly => Boolean(item && item.name && item.category));
}
